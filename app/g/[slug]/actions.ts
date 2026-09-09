"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSessionUser, requireMember, requireOwner } from "@/lib/auth";
import { pickColor, pickEmoji } from "@/lib/utils";
import { lookupMovie } from "@/lib/omdb";

const FIELD_TYPES = ["BOOLEAN", "TEXT", "NUMBER", "SELECT"] as const;
type FieldTypeStr = (typeof FIELD_TYPES)[number];
const FIELD_SCOPES = ["MOVIE", "RATING"] as const;
type FieldScopeStr = (typeof FIELD_SCOPES)[number];

function parseFieldType(v: FormDataEntryValue | null): FieldTypeStr {
  const s = String(v || "").toUpperCase();
  return (FIELD_TYPES as readonly string[]).includes(s) ? (s as FieldTypeStr) : "TEXT";
}

function parseFieldScope(v: FormDataEntryValue | null): FieldScopeStr {
  const s = String(v || "").toUpperCase();
  return (FIELD_SCOPES as readonly string[]).includes(s) ? (s as FieldScopeStr) : "MOVIE";
}

function normalizeFieldValue(type: string, raw: FormDataEntryValue | null): string | null {
  if (type === "BOOLEAN") {
    return raw === "on" || raw === "true" ? "true" : "false";
  }
  const s = String(raw ?? "").trim();
  return s ? s : null;
}

// ---- Membership -----------------------------------------------------------

// Anyone logged in can join a group they have the link to — that link is
// the invite. Silently no-ops if they're already a member.
export async function joinGroup(groupId: string, groupSlug: string): Promise<void> {
  const user = await getSessionUser();
  if (!user) throw new Error("Please log in first.");

  const existing = await prisma.member.findUnique({
    where: { groupId_userId: { groupId, userId: user.id } },
  });
  if (!existing) {
    const count = await prisma.member.count({ where: { groupId } });
    await prisma.member.create({
      data: { groupId, userId: user.id, color: pickColor(count), emoji: pickEmoji(count) },
    });
  }

  revalidatePath(`/g/${groupSlug}`, "layout");
}

export async function leaveGroup(groupId: string, groupSlug: string): Promise<void> {
  const { member } = await requireMember(groupId);
  if (member.role === "OWNER") {
    throw new Error("The owner can't leave — delete the group instead if you're done with it.");
  }
  await prisma.member.delete({ where: { id: member.id } });
  revalidatePath(`/g/${groupSlug}`, "layout");
  redirect("/");
}

export async function removeMember(memberId: string, groupId: string, groupSlug: string): Promise<void> {
  await requireOwner(groupId);
  const target = await prisma.member.findUnique({ where: { id: memberId } });
  if (!target || target.groupId !== groupId) return;
  if (target.role === "OWNER") throw new Error("The owner can't be removed.");
  await prisma.member.delete({ where: { id: memberId } });
  revalidatePath(`/g/${groupSlug}/settings`);
  revalidatePath(`/g/${groupSlug}`, "layout");
}

// ---- Group ------------------------------------------------------------------

export async function updateGroupDetails(groupId: string, groupSlug: string, formData: FormData): Promise<void> {
  await requireOwner(groupId);
  const name = String(formData.get("name") || "").trim();
  const tagline = String(formData.get("tagline") || "").trim();
  if (!name) return;
  await prisma.group.update({
    where: { id: groupId },
    data: { name, tagline: tagline || null },
  });
  revalidatePath(`/g/${groupSlug}`, "layout");
  revalidatePath(`/g/${groupSlug}/settings`);
}

export async function deleteGroup(groupId: string): Promise<void> {
  await requireOwner(groupId);
  await prisma.group.delete({ where: { id: groupId } }).catch(() => null);
  redirect("/");
}

// ---- Custom fields --------------------------------------------------------

export async function createCustomField(groupId: string, groupSlug: string, formData: FormData): Promise<void> {
  await requireMember(groupId);
  const label = String(formData.get("label") || "").trim();
  if (!label) return;
  const type = parseFieldType(formData.get("type"));
  const scope = parseFieldScope(formData.get("scope"));
  const emoji = String(formData.get("emoji") || "✨").trim() || "✨";
  const optionsRaw = String(formData.get("options") || "").trim();
  const options = type === "SELECT" && optionsRaw ? optionsRaw : null;

  const count = await prisma.customField.count({ where: { groupId } });
  await prisma.customField.create({
    data: { groupId, label, type, scope, emoji, options, order: count },
  });
  revalidatePath(`/g/${groupSlug}/settings`);
}

export async function archiveCustomField(fieldId: string, groupId: string, groupSlug: string): Promise<void> {
  await requireMember(groupId);
  await prisma.customField
    .updateMany({ where: { id: fieldId, groupId }, data: { archived: true } })
    .catch(() => null);
  revalidatePath(`/g/${groupSlug}/settings`);
}

// ---- Movies -----------------------------------------------------------------

export async function logMovieNight(groupId: string, groupSlug: string, formData: FormData): Promise<void> {
  await requireMember(groupId);

  const title = String(formData.get("title") || "").trim();
  if (!title) throw new Error("Give the movie a title.");

  const watchedOnRaw = String(formData.get("watchedOn") || "");
  const watchedOn = watchedOnRaw ? new Date(watchedOnRaw) : new Date();
  const pickedByIdRaw = String(formData.get("pickedById") || "").trim() || null;
  const runtimeRaw = String(formData.get("runtimeMin") || "").trim();
  let runtimeMin: number | null = runtimeRaw ? parseInt(runtimeRaw, 10) : null;
  const imdbRaw = String(formData.get("imdbRating") || "").trim();
  let imdbRating: number | null = imdbRaw ? parseFloat(imdbRaw) : null;
  let posterUrl: string | null = String(formData.get("posterUrl") || "").trim() || null;
  let imdbId: string | null = null;

  // pickedById must actually be a member of this group.
  let pickedById: string | null = null;
  if (pickedByIdRaw) {
    const pickedMember = await prisma.member.findFirst({
      where: { id: pickedByIdRaw, groupId },
    });
    pickedById = pickedMember ? pickedMember.id : null;
  }

  if (!imdbRating || !posterUrl) {
    const year = String(formData.get("year") || "").trim() || undefined;
    const result = await lookupMovie(title, year);
    if (result) {
      imdbRating = imdbRating ?? result.imdbRating;
      posterUrl = posterUrl ?? result.posterUrl;
      runtimeMin = runtimeMin ?? result.runtimeMin;
      imdbId = result.imdbId;
    }
  }

  const movie = await prisma.movie.create({
    data: {
      groupId,
      title,
      watchedOn,
      runtimeMin,
      imdbRating,
      imdbId,
      posterUrl,
      pickedById,
      notes: String(formData.get("notes") || "").trim() || null,
    },
  });

  const movieFields = await prisma.customField.findMany({
    where: { groupId, scope: "MOVIE", archived: false },
  });
  for (const field of movieFields) {
    const raw = formData.get(`field_${field.id}`);
    const value = normalizeFieldValue(field.type, raw);
    if (value === null) continue;
    await prisma.customFieldValue.create({
      data: { fieldId: field.id, movieId: movie.id, value },
    });
  }

  revalidatePath(`/g/${groupSlug}`, "layout");
  redirect(`/g/${groupSlug}/movie/${movie.id}`);
}

// ---- Ratings ----------------------------------------------------------------

export async function submitRating(
  groupSlug: string,
  groupId: string,
  movieId: string,
  formData: FormData
): Promise<void> {
  const { member } = await requireMember(groupId);

  const scoreRaw = String(formData.get("score") || "").trim();
  const score = parseFloat(scoreRaw);
  if (Number.isNaN(score) || score < 0 || score > 10) {
    throw new Error("Give it a score from 0 to 10.");
  }
  const rewatch = formData.get("rewatch") === "on";
  const fellAsleep = formData.get("fellAsleep") === "on";
  const favoriteChar = String(formData.get("favoriteChar") || "").trim() || null;
  const leastFavChar = String(formData.get("leastFavChar") || "").trim() || null;
  const quote = String(formData.get("quote") || "").trim() || null;

  // Make sure the movie actually belongs to this group before rating it.
  const movie = await prisma.movie.findFirst({ where: { id: movieId, groupId } });
  if (!movie) throw new Error("That movie couldn't be found in this group.");

  const rating = await prisma.rating.upsert({
    where: { movieId_memberId: { movieId, memberId: member.id } },
    update: { score, rewatch, fellAsleep, favoriteChar, leastFavChar, quote },
    create: { movieId, memberId: member.id, score, rewatch, fellAsleep, favoriteChar, leastFavChar, quote },
  });

  const ratingFields = await prisma.customField.findMany({
    where: { groupId, scope: "RATING", archived: false },
  });
  for (const field of ratingFields) {
    const raw = formData.get(`field_${field.id}`);
    const value = normalizeFieldValue(field.type, raw);
    if (value === null) {
      await prisma.customFieldValue
        .deleteMany({ where: { fieldId: field.id, ratingId: rating.id } })
        .catch(() => null);
      continue;
    }
    await prisma.customFieldValue.upsert({
      where: { fieldId_ratingId: { fieldId: field.id, ratingId: rating.id } },
      update: { value },
      create: { fieldId: field.id, ratingId: rating.id, value },
    });
  }

  revalidatePath(`/g/${groupSlug}/movie/${movieId}`);
  revalidatePath(`/g/${groupSlug}`, "layout");
  revalidatePath(`/g/${groupSlug}/stats`);
}
