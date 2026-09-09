import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { computeGroupStats, MovieLite } from "@/lib/stats";
import { fmtRuntime, fmtScore } from "@/lib/utils";
import StatCard from "@/components/StatCard";

export default async function StatsPage({ params }: { params: { slug: string } }) {
  const group = await prisma.group.findUnique({
    where: { slug: params.slug },
    include: {
      members: { include: { user: true }, orderBy: { joinedAt: "asc" } },
      movies: {
        include: {
          pickedBy: { include: { user: true } },
          ratings: { include: { member: { include: { user: true } } } },
        },
      },
    },
  });
  if (!group) notFound();

  const movies: MovieLite[] = group.movies.map((m) => ({
    id: m.id,
    title: m.title,
    watchedOn: m.watchedOn.toISOString(),
    pickedById: m.pickedById,
    pickedByName: m.pickedBy?.user.name ?? null,
    imdbRating: m.imdbRating,
    runtimeMin: m.runtimeMin,
    ratings: m.ratings.map((r) => ({
      memberId: r.memberId,
      memberName: r.member.user.name,
      score: r.score,
      rewatch: r.rewatch,
      fellAsleep: r.fellAsleep,
    })),
  }));

  const members = group.members.map((m) => ({ id: m.id, name: m.user.name, emoji: m.emoji, color: m.color }));

  if (movies.length === 0) {
    return (
      <div className="card p-10 text-center">
        <div className="text-5xl mb-3">📊</div>
        <h1 className="text-xl font-extrabold mb-2">Nothing to crunch yet</h1>
        <p className="text-ink/60 mb-5">Log a movie night and rate it to start seeing stats.</p>
        <Link href={`/g/${group.slug}/new`} className="btn-primary">
          ➕ Log a movie night
        </Link>
      </div>
    );
  }

  const stats = computeGroupStats(movies, members);

  const sortedByAvgGiven = [...stats.members].sort((a, b) => (b.avgGiven ?? -1) - (a.avgGiven ?? -1));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold mb-4">Group stats</h1>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Movie nights" value={String(stats.totalMovies)} />
          <StatCard label="Total ratings" value={String(stats.totalRatings)} />
          <StatCard label="Group average" value={fmtScore(stats.avgGroupScore)} />
          <StatCard label="Avg runtime" value={fmtRuntime(stats.avgRuntime) || "—"} />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {stats.highestRatedMovie && (
          <Link href={`/g/${group.slug}/movie/${stats.highestRatedMovie.id}`} className="card p-4 block">
            <p className="text-xs font-bold uppercase tracking-wide text-ink/50">🏅 Highest rated</p>
            <p className="text-xl font-extrabold mt-1">{stats.highestRatedMovie.title}</p>
            <p className="text-ink/60">Averaged {fmtScore(stats.highestRatedMovie.avgScore)}</p>
          </Link>
        )}
        {stats.lowestRatedMovie && (
          <Link href={`/g/${group.slug}/movie/${stats.lowestRatedMovie.id}`} className="card p-4 block">
            <p className="text-xs font-bold uppercase tracking-wide text-ink/50">💀 Lowest rated</p>
            <p className="text-xl font-extrabold mt-1">{stats.lowestRatedMovie.title}</p>
            <p className="text-ink/60">Averaged {fmtScore(stats.lowestRatedMovie.avgScore)}</p>
          </Link>
        )}
      </div>

      {stats.superlatives.length > 0 && (
        <div>
          <h2 className="font-extrabold text-xl mb-3">Superlatives</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {stats.superlatives.map((s, i) => (
              <div key={i} className="card p-4 flex items-center gap-3">
                <div className="text-3xl shrink-0">{s.emoji}</div>
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-wide text-ink/50">{s.title}</p>
                  {s.member ? (
                    <p className="font-extrabold truncate">
                      {s.member.emoji} {s.member.name}
                    </p>
                  ) : s.movie ? (
                    <p className="font-extrabold truncate">{s.movie.title}</p>
                  ) : null}
                  <p className="text-sm text-ink/60">{s.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="font-extrabold text-xl mb-3">Leaderboard</h2>
        <div className="card overflow-x-auto">
          <table className="w-full text-sm min-w-[560px]">
            <thead>
              <tr className="border-b-[3px] border-ink text-left">
                <th className="p-3">Member</th>
                <th className="p-3">Avg given</th>
                <th className="p-3">Rated</th>
                <th className="p-3">😴 Asleep</th>
                <th className="p-3">🔁 Rewatch</th>
                <th className="p-3">Picks</th>
                <th className="p-3">Avg received</th>
              </tr>
            </thead>
            <tbody>
              {sortedByAvgGiven.map((m, i) => (
                <tr key={m.id} className={i % 2 === 1 ? "bg-cream/60" : ""}>
                  <td className="p-3 font-bold whitespace-nowrap">
                    {m.emoji} {m.name}
                  </td>
                  <td className="p-3">{fmtScore(m.avgGiven)}</td>
                  <td className="p-3">{m.moviesRated}</td>
                  <td className="p-3">{m.timesAsleep}</td>
                  <td className="p-3">{m.timesRewatch}</td>
                  <td className="p-3">{m.moviesPicked}</td>
                  <td className="p-3">{fmtScore(m.avgReceivedForPicks)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
