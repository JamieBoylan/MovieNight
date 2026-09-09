"use client";

import { useState, useTransition } from "react";
import { login } from "@/app/actions";

export default function LoginForm({ next }: { next?: string }) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        await login(formData);
      } catch (err: any) {
        if (err?.digest?.startsWith?.("NEXT_REDIRECT")) throw err;
        setError(err?.message || "Couldn't log you in.");
      }
    });
  }

  return (
    <form action={handleSubmit} className="card p-6 space-y-4">
      <input type="hidden" name="next" value={next || "/"} />
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
        <input id="password" name="password" type="password" className="input" required />
      </div>

      {error && <p className="alert-error">{error}</p>}

      <button type="submit" className="btn-primary w-full text-lg" disabled={isPending}>
        {isPending ? "Logging in…" : "🍿 Log in"}
      </button>
    </form>
  );
}
