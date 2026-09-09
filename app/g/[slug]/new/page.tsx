import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import LogMovieForm from "@/components/LogMovieForm";

export default async function NewMovieNightPage({ params }: { params: { slug: string } }) {
  const group = await prisma.group.findUnique({
    where: { slug: params.slug },
    include: {
      members: { include: { user: true }, orderBy: { joinedAt: "asc" } },
      customFields: { where: { scope: "MOVIE", archived: false }, orderBy: { order: "asc" } },
    },
  });

  if (!group) notFound();

  const members = group.members.map((m) => ({ id: m.id, name: m.user.name, emoji: m.emoji }));

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">Log a movie night</h1>
        <p className="text-ink/60">Add the movie now — everyone can rate it whenever they're ready.</p>
      </div>
      <LogMovieForm
        groupId={group.id}
        groupSlug={group.slug}
        members={members}
        movieFields={group.customFields as any}
      />
    </div>
  );
}
