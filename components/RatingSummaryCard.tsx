import { fmtScore, scoreColor } from "@/lib/utils";

export interface RatingSummary {
  id: string;
  score: number;
  rewatch: boolean | null;
  fellAsleep: boolean | null;
  favoriteChar: string | null;
  leastFavChar: string | null;
  quote: string | null;
  member: { name: string; emoji: string; color: string };
  fieldValues: { label: string; emoji: string; value: string; type: string }[];
}

export default function RatingSummaryCard({ rating }: { rating: RatingSummary }) {
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className="w-9 h-9 rounded-full border-2 border-ink flex items-center justify-center text-lg"
            style={{ backgroundColor: rating.member.color }}
          >
            {rating.member.emoji}
          </span>
          <span className="font-extrabold">{rating.member.name}</span>
        </div>
        <div
          className="rounded-full border-2 border-ink w-10 h-10 flex items-center justify-center font-extrabold text-sm"
          style={{ backgroundColor: scoreColor(rating.score) }}
        >
          {fmtScore(rating.score)}
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 mt-3">
        {rating.rewatch && <span className="badge">🔁 Would rewatch</span>}
        {rating.fellAsleep && <span className="badge">😴 Fell asleep</span>}
        {rating.fieldValues.map((fv, i) => (
          <span key={i} className="badge">
            {fv.emoji} {fv.label}
            {fv.type !== "BOOLEAN" ? `: ${fv.value}` : ""}
          </span>
        ))}
      </div>

      {(rating.favoriteChar || rating.leastFavChar) && (
        <p className="text-sm text-ink/70 mt-2">
          {rating.favoriteChar && (
            <>
              💛 <span className="font-semibold">{rating.favoriteChar}</span>
            </>
          )}
          {rating.favoriteChar && rating.leastFavChar && "  ·  "}
          {rating.leastFavChar && (
            <>
              💢 <span className="font-semibold">{rating.leastFavChar}</span>
            </>
          )}
        </p>
      )}

      {rating.quote && (
        <p className="text-sm italic text-ink/70 mt-2 border-l-4 border-ink/20 pl-2">
          "{rating.quote}"
        </p>
      )}
    </div>
  );
}
