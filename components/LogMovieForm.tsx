"use client";

import { useState, useTransition } from "react";
import { logMovieNight } from "@/app/g/[slug]/actions";
import CustomFieldInput, { CustomFieldLite } from "@/components/CustomFieldInput";

interface MemberLite {
  id: string;
  name: string;
  emoji: string;
}

export default function LogMovieForm({
  groupId,
  groupSlug,
  members,
  movieFields,
}: {
  groupId: string;
  groupSlug: string;
  members: MemberLite[];
  movieFields: CustomFieldLite[];
}) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const today = new Date().toISOString().slice(0, 10);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        await logMovieNight(groupId, groupSlug, formData);
      } catch (err: any) {
        if (err?.digest?.startsWith?.("NEXT_REDIRECT")) throw err;
        setError(err?.message || "Couldn't log that movie night.");
      }
    });
  }

  return (
    <form action={handleSubmit} className="card p-6 space-y-5">
      <div>
        <label className="label" htmlFor="title">
          Movie title
        </label>
        <input id="title" name="title" className="input" placeholder="e.g. Bugonia" required />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label" htmlFor="watchedOn">
            Date watched
          </label>
          <input id="watchedOn" name="watchedOn" type="date" defaultValue={today} className="input" />
        </div>
        <div>
          <label className="label" htmlFor="year">
            Release year <span className="normal-case text-ink/40">(optional)</span>
          </label>
          <input id="year" name="year" className="input" placeholder="2026" maxLength={4} />
        </div>
      </div>

      <div>
        <label className="label" htmlFor="pickedById">
          Who picked it?
        </label>
        <select id="pickedById" name="pickedById" className="input" defaultValue="">
          <option value="">— nobody in particular —</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.emoji} {m.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label" htmlFor="runtimeMin">
            Runtime (minutes) <span className="normal-case text-ink/40">(optional)</span>
          </label>
          <input id="runtimeMin" name="runtimeMin" type="number" className="input" placeholder="118" />
        </div>
        <div>
          <label className="label" htmlFor="imdbRating">
            IMDb rating <span className="normal-case text-ink/40">(optional)</span>
          </label>
          <input
            id="imdbRating"
            name="imdbRating"
            type="number"
            step="0.1"
            min={0}
            max={10}
            className="input"
            placeholder="Auto-filled if left blank"
          />
        </div>
      </div>

      <p className="text-xs text-ink/50 -mt-3">
        Leave runtime/IMDb rating blank and we'll try to look them up automatically (if an OMDb API
        key is configured).
      </p>

      <div>
        <label className="label" htmlFor="notes">
          Notes <span className="normal-case text-ink/40">(optional)</span>
        </label>
        <textarea id="notes" name="notes" className="input" rows={2} placeholder="Anything worth remembering about the night itself" />
      </div>

      {movieFields.length > 0 && (
        <div>
          <label className="label">Extra stats for this group</label>
          <div className="flex flex-wrap gap-3">
            {movieFields.map((f) => (
              <CustomFieldInput key={f.id} field={f} />
            ))}
          </div>
        </div>
      )}

      {error && (
        <p className="text-rose-600 font-semibold text-sm border-2 border-rose-400 bg-rose-50 rounded-xl px-3 py-2">
          {error}
        </p>
      )}

      <button type="submit" className="btn-primary w-full text-lg" disabled={isPending}>
        {isPending ? "Logging…" : "🎬 Log this movie night"}
      </button>
    </form>
  );
}
