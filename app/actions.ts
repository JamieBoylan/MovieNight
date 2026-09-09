"use server";

import { prisma } from "@/lib/db";
import { slugify, pickColor, pickEmoji } from "@/lib/utils";
import { redirect } from "next/navigation";
import {
  createSession,
  destroySession,
  getSessionUser,
  hashPassword,
  isValidEmail,
  normalizeEmail,
  verifyPassword,
} from "@/lib/auth";

function safeNext(next: FormDataEntryValue | null): string {
  const s = String(next || "").trim();
  // Only ever redirect to a relative in-app path — never off-site.
  return s.startsWith("/") && !s.startsWith("//") ? s : "/";
}

// ---- Auth -------------------------------------------------------------

export async function signup(formData: FormData): Promise<void> {
  const name = String(formData.get("name") || "").trim();
  const email = normalizeEmail(String(formData.get("email") || ""));
  const password = String(formData.get("password") || "");
  const next = safeNext(formData.get("next"));

  if (!name) throw new Error("Tell us what to call you.");
  if (!isValidEmail(email)) throw new Error("That doesn't look like a valid email address.");
  if (password.length < 8) throw new Error("Password needs to be at least 8 characters.");

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new Error("An account with that email already exists — log in instead.");

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({ data: { name, email, passwordHash } });

  await createSession(user.id);
  redirect(next);
}

export async function login(formData: FormData): Promise<void> {
  const email = normalizeEmail(String(formData.get("email") || ""));
  const password = String(formData.get("password") || "");
  const next = safeNext(formData.get("next"));

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error("No account with that email — sign up instead?");

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) throw new Error("Wrong password.");

  await createSession(user.id);
  redirect(next);
}

export async function logout(): Promise<void> {
  await destroySession();
  redirect("/");
}

// ---- Groups -------------------------------------------------------------

export async function createGroup(formData: FormData): Promise<void> {
  const user = await getSessionUser();
  if (!user) throw new Error("Please log in first.");

  const name = String(formData.get("name") || "").trim();
  const tagline = String(formData.get("tagline") || "").trim();
  if (!name) throw new Error("Give your group a name.");

  let group;
  let attempts = 0;
  // slugify() appends a short random suffix, so collisions are very rare —
  // retry a couple of times just in case.
  while (true) {
    const slug = slugify(name);
    try {
      group = await prisma.group.create({
        data: {
          name,
          slug,
          tagline: tagline || null,
          ownerId: user.id,
          members: {
            create: [{ userId: user.id, role: "OWNER", color: pickColor(0), emoji: pickEmoji(0) }],
          },
          customFields: {
            create: [
              {
                label: "Bechdel Test",
                emoji: "🎬",
                type: "BOOLEAN",
                scope: "MOVIE",
                order: 0,
              },
            ],
          },
        },
      });
      break;
    } catch (err: any) {
      attempts += 1;
      if (attempts >= 5) throw err;
    }
  }

  redirect(`/g/${group.slug}`);
}

export async function goToGroup(formData: FormData): Promise<void> {
  const raw = String(formData.get("code") || "").trim();
  if (!raw) return;
  // Accept a bare slug or a full pasted URL.
  const match = raw.match(/([a-z0-9-]+)\/?$/i);
  const slug = (match ? match[1] : raw).toLowerCase();
  redirect(`/g/${slug}`);
}
