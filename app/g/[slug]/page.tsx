import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { average, fmtScore } from "@/lib/utils";
import MovieCard from "@/components/MovieCard";

export default async function GroupFeedPage({ params }: { params: { slug: string } }) {
  const group = await prisma.group.findUnique({
    where: { slug: params.slug },
    include: {
      movies: {
        orderBy: { watchedOn: "desc" },
        include: {
          pickedBy: { include: { user: true } },
          ratings: { select: { score: true } },
        },
      },
    },
  });

  if (!group) notFound();

  const movies = group.movies.map((m) => ({
    ...m,
    avgScore: average(m.ratings.map((r) => r.score)),
    ratingCount: m.ratings.length,
    pickedBy: m.pickedBy
      ? { name: m.pickedBy.user.name, emoji: m.pickedBy.emoji, color: m.pickedBy.color }
      : null,
  }));

  const groupAvg = average(movies.map((m) => m.avgScore).filter((n): n is number => n !== null));

  return (
    <div className="space-y-6">
      <div className="card p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-ink/50">Movie nights logged</p>
          <p className="text-3xl font-extrabold">{movies.length}</p>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-ink/50">Group average</p>
          <p className="text-3xl font-extrabold">{fmtScore(groupAvg)}</p>
        </div>
        <Link href={`/g/${group.slug}/stats`} className="btn-secondary btn-sm">
          See full stats →
        </Link>
      </div>

      {movies.length === 0 ? (
        <div className="card p-10 text-center">
          <div className="text-5xl mb-3">🍿</div>
          <h2 className="text-xl font-extrabold mb-2">No movie nights yet</h2>
          <p className="text-ink/60 mb-5">Log your first one and get the ratings rolling.</p>
          <Link href={`/g/${group.slug}/new`} className="btn-primary">
            ➕ Log a movie night
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {movies.map((m) => (
            <MovieCard key={m.id} movie={m} groupSlug={group.slug} />
          ))}
        </div>
      )}
    </div>
  );
}
