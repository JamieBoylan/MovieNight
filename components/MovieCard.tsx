import Link from "next/link";
import { fmtDate, fmtRuntime, fmtScore, scoreColor } from "@/lib/utils";

export interface MovieCardData {
  id: string;
  title: string;
  watchedOn: string | Date;
  runtimeMin: number | null;
  posterUrl: string | null;
  imdbRating: number | null;
  avgScore: number | null;
  ratingCount: number;
  pickedBy?: { name: string; emoji: string; color: string } | null;
}

export default function MovieCard({ movie, groupSlug }: { movie: MovieCardData; groupSlug: string }) {
  return (
    <Link
      href={`/g/${groupSlug}/movie/${movie.id}`}
      className="card flex gap-4 p-4 hover:-translate-y-0.5 hover:shadow-[0_6px_0_rgba(26,21,35,0.9)] transition-all"
    >
      <div className="w-16 h-24 sm:w-20 sm:h-28 shrink-0 rounded-xl border-[3px] border-ink overflow-hidden bg-cream flex items-center justify-center text-3xl">
        {movie.posterUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={movie.posterUrl} alt={movie.title} className="w-full h-full object-cover" />
        ) : (
          "🎞️"
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-extrabold text-lg leading-tight truncate">{movie.title}</h3>
          <div
            className="shrink-0 rounded-full border-2 border-ink w-11 h-11 flex items-center justify-center font-extrabold text-sm"
            style={{ backgroundColor: scoreColor(movie.avgScore) }}
            title="Group average"
          >
            {fmtScore(movie.avgScore)}
          </div>
        </div>

        <p className="text-sm text-ink/60 mt-0.5">
          {fmtDate(movie.watchedOn)}
          {movie.runtimeMin ? ` · ${fmtRuntime(movie.runtimeMin)}` : ""}
          {movie.imdbRating ? ` · IMDb ${movie.imdbRating}` : ""}
        </p>

        <div className="flex items-center gap-2 mt-2 flex-wrap">
          {movie.pickedBy && (
            <span className="badge" style={{ borderColor: "#1a1523" }}>
              {movie.pickedBy.emoji} picked by {movie.pickedBy.name}
            </span>
          )}
          <span className="badge">
            {movie.ratingCount} rating{movie.ratingCount === 1 ? "" : "s"}
          </span>
        </div>
      </div>
    </Link>
  );
}
