"use client";

import { useState, useTransition } from "react";
import { signup } from "@/app/actions";

export default function SignupForm({ next }: { next?: string }) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        await signup(formData);
      } catch (err: any) {
        if (err?.digest?.startsWith?.("NEXT_REDIRECT")) throw err;
        setError(err?.message || "Couldn't create your account.");
      }
    });
  }

  return (
    <form action={handleSubmit} className="card p-6 space-y-4">
      <input type="hidden" name="next" value={next || "/"} />
      <div>
        <label className="label" htmlFor="name">
          Your name
        </label>
        <input id="name" name="name" className="input" placeholder="Jamie" required maxLength={40} />
      </div>
      <div>
        <label className="label" htmlFor="email">
          Email
        </label>
        <input id="email" name="email" type="email" className="input" required maxLength={120} />
      </div>
      <div>
        <label className="label" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          className="input"
          required
          minLength={8}
          placeholder="At least 8 characters"
        />
      </div>

      {error && <p className="alert-error">{error}</p>}

      <button type="submit" className="btn-primary w-full text-lg" disabled={isPending}>
        {isPending ? "Creating your account…" : "🎬 Create account"}
      </button>
    </form>
  );
}
