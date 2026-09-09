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
      className="card group relative flex gap-4 p-4 overflow-hidden hover:-translate-y-0.5 hover:shadow-[0_6px_0_rgba(245,197,24,0.85)] transition-all"
    >
      <div className="relative w-20 h-28 sm:w-24 sm:h-36 shrink-0 rounded-xl border-[3px] border-ink/70 overflow-hidden bg-cream flex items-center justify-center text-3xl shadow-lg">
        {movie.posterUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={movie.posterUrl}
            alt={movie.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          "🎞️"
        )}
        {movie.imdbRating !== null && (
          <span className="absolute bottom-0 inset-x-0 bg-black/70 backdrop-blur-sm text-marquee text-[10px] font-extrabold text-center py-0.5">
            IMDb {movie.imdbRating}
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0 flex flex-col">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-extrabold text-lg leading-tight truncate">{movie.title}</h3>
          <div
            className="shrink-0 rounded-full border-2 border-ink/70 w-11 h-11 flex items-center justify-center font-extrabold text-sm text-[#14110a]"
            style={{ backgroundColor: scoreColor(movie.avgScore) }}
            title="Group average"
          >
            {fmtScore(movie.avgScore)}
          </div>
        </div>

        <p className="text-sm text-ink/60 mt-0.5">
          {fmtDate(movie.watchedOn)}
          {movie.runtimeMin ? ` · ${fmtRuntime(movie.runtimeMin)}` : ""}
        </p>

        <div className="flex items-center gap-2 mt-auto pt-2 flex-wrap">
          {movie.pickedBy && (
            <span className="badge">
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
