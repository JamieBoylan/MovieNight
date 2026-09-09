import { cookies } from "next/headers";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "./db";

export const SESSION_COOKIE = "mn_session";
const SESSION_DURATION_DAYS = 30;
const BCRYPT_ROUNDS = 10;

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

// Creates a DB-backed session and sets the cookie. Called from a Server
// Action (signup/login), which is the only place cookies() can be written.
export async function createSession(userId: string) {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000);

  await prisma.session.create({
    data: { tokenHash: hashToken(token), userId, expiresAt },
  });

  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } }).catch(() => null);
  }
  cookies().set(SESSION_COOKIE, "", { path: "/", expires: new Date(0) });
}

// Read-only helper safe to call from Server Components as well as
// Server Actions.
export async function getSessionUser() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true },
  });
  if (!session) return null;

  if (session.expiresAt < new Date()) {
    await prisma.session.delete({ where: { id: session.id } }).catch(() => null);
    return null;
  }

  return session.user;
}

// Throws a plain Error (safe to surface to the UI) if the caller isn't
// logged in or isn't a member of the given group. Use at the top of every
// group-mutating Server Action — never trust a client-supplied member id.
export async function requireMember(groupId: string) {
  const user = await getSessionUser();
  if (!user) throw new Error("Please log in first.");

  const member = await prisma.member.findUnique({
    where: { groupId_userId: { groupId, userId: user.id } },
  });
  if (!member) throw new Error("You're not a member of this group.");

  return { user, member };
}

export async function requireOwner(groupId: string) {
  const { user, member } = await requireMember(groupId);
  if (member.role !== "OWNER") throw new Error("Only the group owner can do that.");
  return { user, member };
}
