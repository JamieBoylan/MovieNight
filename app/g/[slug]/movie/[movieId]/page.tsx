import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { average, fmtDate, fmtRuntime, fmtScore, fmtSigned, scoreColor } from "@/lib/utils";
import RatingSummaryCard from "@/components/RatingSummaryCard";
import RatingForm from "@/components/RatingForm";

export default async function MovieDetailPage({
  params,
}: {
  params: { slug: string; movieId: string };
}) {
  const group = await prisma.group.findUnique({
    where: { slug: params.slug },
    include: {
      members: { include: { user: true }, orderBy: { joinedAt: "asc" } },
      customFields: { where: { archived: false }, orderBy: { order: "asc" } },
    },
  });
  if (!group) notFound();

  const movie = await prisma.movie.findFirst({
    where: { id: params.movieId, groupId: group.id },
    include: {
      pickedBy: { include: { user: true } },
      ratings: {
        include: { member: { include: { user: true } }, fieldValues: { include: { field: true } } },
        orderBy: { createdAt: "asc" },
      },
      fieldValues: { include: { field: true } },
    },
  });
  if (!movie) notFound();

  const avgScore = average(movie.ratings.map((r) => r.score));
  const diffFromImdb = movie.imdbRating !== null && avgScore !== null ? avgScore - movie.imdbRating : null;

  const movieFieldValues = movie.fieldValues.filter((fv) => !fv.field.archived);
  const ratingFieldDefs = group.customFields.filter((f) => f.scope === "RATING");

  const user = await getSessionUser();
  const currentMember = user ? group.members.find((m) => m.userId === user.id) || null : null;
  const myExistingRating = currentMember
    ? movie.ratings.find((r) => r.memberId === currentMember.id) || null
    : null;

  const ratedMemberIds = new Set(movie.ratings.map((r) => r.memberId));
  const notYetRated = group.members.filter((m) => !ratedMemberIds.has(m.id));

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row gap-5">
          <div className="w-28 h-40 shrink-0 rounded-xl border-[3px] border-ink overflow-hidden bg-cream flex items-center justify-center text-5xl mx-auto sm:mx-0">
            {movie.posterUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={movie.posterUrl} alt={movie.title} className="w-full h-full object-cover" />
            ) : (
              "🎞️"
            )}
          </div>

          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-3xl font-extrabold">{movie.title}</h1>
            <p className="text-ink/60 mt-1">
              {fmtDate(movie.watchedOn)}
              {movie.runtimeMin ? ` · ${fmtRuntime(movie.runtimeMin)}` : ""}
              {movie.pickedBy ? ` · picked by ${movie.pickedBy.emoji} ${movie.pickedBy.user.name}` : ""}
            </p>

            <div className="flex flex-wrap items-center gap-4 mt-4 justify-center sm:justify-start">
              <div className="text-center">
                <div
                  className="w-16 h-16 rounded-full border-[3px] border-ink flex items-center justify-center text-2xl font-extrabold"
                  style={{ backgroundColor: scoreColor(avgScore) }}
                >
                  {fmtScore(avgScore)}
                </div>
                <p className="text-xs font-bold uppercase tracking-wide text-ink/50 mt-1">Group avg</p>
              </div>

              {movie.imdbRating !== null && (
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full border-[3px] border-ink flex items-center justify-center text-2xl font-extrabold bg-white">
                    {movie.imdbRating}
                  </div>
                  <p className="text-xs font-bold uppercase tracking-wide text-ink/50 mt-1">IMDb</p>
                </div>
              )}

              {diffFromImdb !== null && (
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full border-[3px] border-ink flex items-center justify-center text-2xl font-extrabold bg-white">
                    {fmtSigned(diffFromImdb)}
                  </div>
                  <p className="text-xs font-bold uppercase tracking-wide text-ink/50 mt-1">vs IMDb</p>
                </div>
              )}
            </div>

            {movieFieldValues.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-4 justify-center sm:justify-start">
                {movieFieldValues.map((fv) => (
                  <span key={fv.id} className="badge">
                    {fv.field.emoji} {fv.field.label}
                    {fv.field.type !== "BOOLEAN"
                      ? `: ${fv.value}`
                      : fv.value === "true"
                      ? ""
                      : ": no"}
                  </span>
                ))}
              </div>
            )}

            {movie.notes && <p className="text-sm text-ink/70 mt-3 italic">{movie.notes}</p>}
          </div>
        </div>
      </div>

      {notYetRated.length > 0 && (
        <p className="text-sm text-ink/50 text-center">
          Still waiting on: {notYetRated.map((m) => `${m.emoji} ${m.user.name}`).join(", ")}
        </p>
      )}

      <div>
        <h2 className="font-extrabold text-xl mb-3">Ratings</h2>
        {movie.ratings.length === 0 ? (
          <p className="text-ink/60">No one has rated this yet.</p>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {movie.ratings.map((r) => (
              <RatingSummaryCard
                key={r.id}
                rating={{
                  id: r.id,
                  score: r.score,
                  rewatch: r.rewatch,
                  fellAsleep: r.fellAsleep,
                  favoriteChar: r.favoriteChar,
                  leastFavChar: r.leastFavChar,
                  quote: r.quote,
                  member: {
                    name: r.member.user.name,
                    emoji: r.member.emoji,
                    color: r.member.color,
                  },
                  fieldValues: r.fieldValues.map((fv) => ({
                    label: fv.field.label,
                    emoji: fv.field.emoji,
                    value: fv.value,
                    type: fv.field.type,
                  })),
                }}
              />
            ))}
          </div>
        )}
      </div>

      <div>
        {currentMember ? (
          <RatingForm
            groupSlug={group.slug}
            groupId={group.id}
            movieId={movie.id}
            memberName={currentMember.user.name}
            ratingFields={ratingFieldDefs as any}
            existing={
              myExistingRating
                ? {
                    score: myExistingRating.score,
                    rewatch: myExistingRating.rewatch,
                    favoriteChar: myExistingRating.favoriteChar,
                    leastFavChar: myExistingRating.leastFavChar,
                    fellAsleep: myExistingRating.fellAsleep,
                    quote: myExistingRating.quote,
                    fieldValues: Object.fromEntries(
                      myExistingRating.fieldValues.map((fv) => [fv.fieldId, fv.value])
                    ),
                  }
                : null
            }
          />
        ) : (
          <div className="card p-5 text-center text-ink/60">
            You need to join this group before you can rate movies.
          </div>
        )}
      </div>
    </div>
  );
}
