"use client";

import { useState, useTransition } from "react";
import { createCustomField } from "@/app/g/[slug]/actions";

export default function CustomFieldForm({ groupId, groupSlug }: { groupId: string; groupSlug: string }) {
  const [type, setType] = useState("BOOLEAN");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [key, setKey] = useState(0);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        await createCustomField(groupId, groupSlug, formData);
        setType("BOOLEAN");
        setKey((k) => k + 1); // reset uncontrolled inputs
      } catch (err: any) {
        setError(err?.message || "Couldn't add that field.");
      }
    });
  }

  return (
    <form key={key} action={handleSubmit} className="card p-4 space-y-3">
      <div className="grid grid-cols-[auto,1fr] gap-3">
        <div className="w-20">
          <label className="label">Emoji</label>
          <input name="emoji" className="input text-center" defaultValue="✨" maxLength={4} />
        </div>
        <div>
          <label className="label">Field name</label>
          <input name="label" className="input" placeholder="e.g. Corv Cameo" required maxLength={40} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Type</label>
          <select
            name="type"
            className="input"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="BOOLEAN">Yes / No</option>
            <option value="TEXT">Text</option>
            <option value="NUMBER">Number</option>
            <option value="SELECT">Pick one</option>
          </select>
        </div>
        <div>
          <label className="label">Applies to</label>
          <select name="scope" className="input" defaultValue="MOVIE">
            <option value="MOVIE">Whole movie night</option>
            <option value="RATING">Each person's rating</option>
          </select>
        </div>
      </div>

      {type === "SELECT" && (
        <div>
          <label className="label">Options (comma separated)</label>
          <input name="options" className="input" placeholder="Yuri, Yaoi, None" />
        </div>
      )}

      {error && <p className="alert-error">{error}</p>}

      <button type="submit" className="btn-secondary" disabled={isPending}>
        {isPending ? "Adding…" : "+ Add field"}
      </button>
    </form>
  );
}
