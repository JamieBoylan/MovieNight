"use client";

import { useState, useTransition } from "react";
import { submitRating } from "@/app/g/[slug]/actions";
import CustomFieldInput, { CustomFieldLite } from "@/components/CustomFieldInput";

export interface ExistingRating {
  score: number;
  rewatch: boolean | null;
  favoriteChar: string | null;
  leastFavChar: string | null;
  fellAsleep: boolean | null;
  quote: string | null;
  fieldValues: Record<string, string>;
}

export default function RatingForm({
  groupSlug,
  groupId,
  movieId,
  memberName,
  ratingFields,
  existing,
}: {
  groupSlug: string;
  groupId: string;
  movieId: string;
  memberName: string;
  ratingFields: CustomFieldLite[];
  existing?: ExistingRating | null;
}) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      try {
        await submitRating(groupSlug, groupId, movieId, formData);
        setSuccess(true);
      } catch (err: any) {
        if (err?.digest?.startsWith?.("NEXT_REDIRECT")) throw err;
        setError(err?.message || "Couldn't save your rating.");
      }
    });
  }

  return (
    <form action={handleSubmit} className="card p-5 space-y-4">
      <h3 className="font-extrabold text-lg">
        {existing ? "Update" : "Add"} your rating, {memberName}
      </h3>

      <div>
        <label className="label" htmlFor="score">
          Your score (0–10)
        </label>
        <input
          id="score"
          name="score"
          type="number"
          step="0.1"
          min={0}
          max={10}
          required
          defaultValue={existing?.score ?? ""}
          className="input"
          placeholder="8.5"
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <label className="chip cursor-pointer select-none">
          <input
            type="checkbox"
            name="rewatch"
            defaultChecked={existing?.rewatch === true}
            className="w-4 h-4 accent-yellow-400"
          />
          <span>🔁 Would rewatch</span>
        </label>
        <label className="chip cursor-pointer select-none">
          <input
            type="checkbox"
            name="fellAsleep"
            defaultChecked={existing?.fellAsleep === true}
            className="w-4 h-4 accent-yellow-400"
          />
          <span>😴 Fell asleep</span>
        </label>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label" htmlFor="favoriteChar">
            Favorite character
          </label>
          <input
            id="favoriteChar"
            name="favoriteChar"
            defaultValue={existing?.favoriteChar || ""}
            className="input"
          />
        </div>
        <div>
          <label className="label" htmlFor="leastFavChar">
            Least favorite character
          </label>
          <input
            id="leastFavChar"
            name="leastFavChar"
            defaultValue={existing?.leastFavChar || ""}
            className="input"
          />
        </div>
      </div>

      <div>
        <label className="label" htmlFor="quote">
          Memorable quote
        </label>
        <input
          id="quote"
          name="quote"
          defaultValue={existing?.quote || ""}
          className="input"
          placeholder="Something someone said that night"
        />
      </div>

      {ratingFields.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {ratingFields.map((f) => (
            <CustomFieldInput key={f.id} field={f} defaultValue={existing?.fieldValues?.[f.id]} />
          ))}
        </div>
      )}

      {error && <p className="alert-error">{error}</p>}
      {success && !isPending && <p className="alert-success">Saved! 🎉</p>}

      <button type="submit" className="btn-primary w-full" disabled={isPending}>
        {isPending ? "Saving…" : existing ? "Update rating" : "Submit rating"}
      </button>
    </form>
  );
}
