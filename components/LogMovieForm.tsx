"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { logMovieNight } from "@/app/g/[slug]/actions";
import CustomFieldInput, { CustomFieldLite } from "@/components/CustomFieldInput";

interface MemberLite {
  id: string;
  name: string;
  emoji: string;
}

interface SearchHit {
  imdbId: string;
  title: string;
  year: string;
  posterUrl: string | null;
}

interface SelectedMovie {
  imdbId: string;
  posterUrl: string | null;
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

  const [title, setTitle] = useState("");
  const [year, setYear] = useState("");
  const [runtimeMin, setRuntimeMin] = useState("");
  const [imdbRating, setImdbRating] = useState("");
  const [selected, setSelected] = useState<SelectedMovie | null>(null);

  const [results, setResults] = useState<SearchHit[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searching, setSearching] = useState(false);
  const [highlighted, setHighlighted] = useState(0);

  const boxRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  async function runSearch(q: string) {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setSearching(true);
    try {
      const res = await fetch(`/api/omdb/search?q=${encodeURIComponent(q)}`, {
        signal: controller.signal,
      });
      const data = await res.json();
      const hits: SearchHit[] = data.results || [];
      setResults(hits);
      setShowDropdown(hits.length > 0);
      setHighlighted(0);
    } catch {
      // aborted (a newer keystroke fired) or a network hiccup — safe to ignore
    } finally {
      setSearching(false);
    }
  }

  function handleTitleChange(value: string) {
    setTitle(value);
    if (selected) setSelected(null); // editing after a pick invalidates the match

    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.trim().length < 2) {
      setResults([]);
      setShowDropdown(false);
      return;
    }
    debounceRef.current = setTimeout(() => runSearch(value), 350);
  }

  async function pickResult(hit: SearchHit) {
    setTitle(hit.title);
    setYear(hit.year || "");
    setSelected({ imdbId: hit.imdbId, posterUrl: hit.posterUrl });
    setShowDropdown(false);
    setResults([]);

    try {
      const res = await fetch(`/api/omdb/movie?id=${encodeURIComponent(hit.imdbId)}`);
      const data = await res.json();
      if (data.result) {
        if (data.result.runtimeMin) setRuntimeMin(String(data.result.runtimeMin));
        if (data.result.imdbRating) setImdbRating(String(data.result.imdbRating));
        if (data.result.posterUrl) {
          setSelected((prev) => (prev && prev.imdbId === hit.imdbId ? { ...prev, posterUrl: data.result.posterUrl } : prev));
        }
      }
    } catch {
      // the basic title/year/poster from the search result is still applied
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!showDropdown || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted((h) => Math.min(h + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter" && results[highlighted]) {
      e.preventDefault();
      pickResult(results[highlighted]);
    } else if (e.key === "Escape") {
      setShowDropdown(false);
    }
  }

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
      <div ref={boxRef}>
        <label className="label" htmlFor="title">
          Movie title
        </label>
        <div className="flex gap-3 items-start">
          {selected?.posterUrl && (
            <div className="w-12 h-[4.5rem] shrink-0 rounded-lg border-2 border-marquee/60 overflow-hidden bg-cream animate-fade-in">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={selected.posterUrl} alt="" className="w-full h-full object-cover" />
            </div>
          )}
          <div className="flex-1 relative">
            <input
              id="title"
              name="title"
              className="input"
              placeholder="Start typing to search IMDb…"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              onFocus={() => results.length > 0 && setShowDropdown(true)}
              onKeyDown={handleKeyDown}
              autoComplete="off"
              required
            />
            {searching && (
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-ink/40">
                searching…
              </span>
            )}
            {showDropdown && results.length > 0 && (
              <div className="absolute z-20 mt-1.5 w-full card p-1.5 max-h-72 overflow-y-auto space-y-1 shadow-glow animate-fade-in">
                {results.map((r, i) => (
                  <button
                    type="button"
                    key={r.imdbId}
                    onClick={() => pickResult(r)}
                    onMouseEnter={() => setHighlighted(i)}
                    className={`w-full flex items-center gap-3 text-left rounded-xl px-2 py-1.5 transition-colors ${
                      i === highlighted ? "bg-cream" : "hover:bg-cream/60"
                    }`}
                  >
                    <div className="w-8 h-11 shrink-0 rounded border border-ink/30 overflow-hidden bg-surface flex items-center justify-center text-sm">
                      {r.posterUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={r.posterUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        "🎞️"
                      )}
                    </div>
                    <span className="min-w-0">
                      <span className="block font-bold truncate">{r.title}</span>
                      <span className="block text-xs text-ink/50">{r.year}</span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        {selected && (
          <button
            type="button"
            onClick={() => setSelected(null)}
            className="text-xs text-ink/50 hover:text-ink mt-1.5 underline underline-offset-2"
          >
            ✕ Not this one — clear match
          </button>
        )}
      </div>

      {/* Carries the picked OMDb match through to the server action */}
      <input type="hidden" name="posterUrl" value={selected?.posterUrl || ""} />
      <input type="hidden" name="imdbId" value={selected?.imdbId || ""} />

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
          <input
            id="year"
            name="year"
            className="input"
            placeholder="2026"
            maxLength={4}
            value={year}
            onChange={(e) => setYear(e.target.value)}
          />
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
          <input
            id="runtimeMin"
            name="runtimeMin"
            type="number"
            className="input"
            placeholder="118"
            value={runtimeMin}
            onChange={(e) => setRuntimeMin(e.target.value)}
          />
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
            value={imdbRating}
            onChange={(e) => setImdbRating(e.target.value)}
          />
        </div>
      </div>

      <p className="text-xs text-ink/50 -mt-3">
        {selected
          ? "Runtime, rating, and poster came from IMDb — feel free to edit them."
          : "Search above and pick a match to auto-fill runtime/rating/poster, or just type a title and fill these in yourself."}
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

      {error && <p className="alert-error">{error}</p>}

      <button type="submit" className="btn-primary w-full text-lg" disabled={isPending}>
        {isPending ? "Logging…" : "🎬 Log this movie night"}
      </button>
    </form>
  );
}
