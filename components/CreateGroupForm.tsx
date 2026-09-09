"use client";

import { useState, useTransition } from "react";
import { createGroup } from "@/app/actions";

export default function CreateGroupForm() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        await createGroup(formData);
      } catch (err: any) {
        // Next.js throws a special error to perform redirect() — let it through.
        if (err?.digest?.startsWith?.("NEXT_REDIRECT")) throw err;
        setError(err?.message || "Something went wrong creating the group.");
      }
    });
  }

  return (
    <form action={handleSubmit} className="card p-6 space-y-5">
      <div>
        <label className="label" htmlFor="name">
          Group name
        </label>
        <input
          id="name"
          name="name"
          className="input"
          placeholder="e.g. Movie Night Trackers"
          required
          maxLength={60}
        />
      </div>

      <div>
        <label className="label" htmlFor="tagline">
          Tagline <span className="normal-case text-ink/40">(optional)</span>
        </label>
        <input
          id="tagline"
          name="tagline"
          className="input"
          placeholder="e.g. Est. one bad decision at a time"
          maxLength={80}
        />
      </div>

      <p className="text-sm text-ink/50">
        You'll be the owner. Once it's created, share the group's link and everyone else can sign
        up (or log in) and join themselves.
      </p>

      {error && (
        <p className="text-rose-600 font-semibold text-sm border-2 border-rose-400 bg-rose-50 rounded-xl px-3 py-2">
          {error}
        </p>
      )}

      <button type="submit" className="btn-primary w-full text-lg" disabled={isPending}>
        {isPending ? "Setting up your group…" : "🍿 Create group"}
      </button>
    </form>
  );
}
