// Optional: if OMDB_API_KEY is set (get a free one at
// https://www.omdbapi.com/apikey.aspx), the "Log a movie night" form gets a
// live search-as-you-type poster picker, and runtime/rating/poster still
// get silently filled in on submit as a fallback. Without a key all of this
// just quietly no-ops and everything still works — you fill fields by hand.

export type OmdbResult = {
  imdbRating: number | null;
  imdbId: string | null;
  posterUrl: string | null;
  runtimeMin: number | null;
  title?: string;
  year?: string | null;
};

export type OmdbSearchHit = {
  imdbId: string;
  title: string;
  year: string;
  posterUrl: string | null;
};

export function hasOmdbKey() {
  return Boolean(process.env.OMDB_API_KEY);
}

// Blind lookup by title — used as a fallback when a movie night is logged
// without going through the search picker (runtime/rating/poster left blank).
export async function lookupMovie(title: string, year?: string): Promise<OmdbResult | null> {
  const apiKey = process.env.OMDB_API_KEY;
  if (!apiKey || !title.trim()) return null;

  try {
    const params = new URLSearchParams({ apikey: apiKey, t: title });
    if (year) params.set("y", year);
    const res = await fetch(`https://www.omdbapi.com/?${params.toString()}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.Response === "False") return null;
    return shapeFullResult(data);
  } catch {
    return null;
  }
}

// Full lookup by IMDb id — used once the person picks a specific result
// from the search dropdown, so we get exact runtime/rating/poster for the
// title they actually meant (title search alone is ambiguous).
export async function lookupById(imdbId: string): Promise<OmdbResult | null> {
  const apiKey = process.env.OMDB_API_KEY;
  if (!apiKey || !imdbId.trim()) return null;

  try {
    const params = new URLSearchParams({ apikey: apiKey, i: imdbId });
    const res = await fetch(`https://www.omdbapi.com/?${params.toString()}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.Response === "False") return null;
    return shapeFullResult(data);
  } catch {
    return null;
  }
}

// Title search — OMDb's "s=" endpoint returns a lightweight list of matches
// (title/year/poster/id only, no runtime or rating), used to populate the
// live dropdown as someone types.
export async function searchMovies(query: string): Promise<OmdbSearchHit[]> {
  const apiKey = process.env.OMDB_API_KEY;
  if (!apiKey || query.trim().length < 2) return [];

  try {
    const params = new URLSearchParams({ apikey: apiKey, s: query, type: "movie" });
    const res = await fetch(`https://www.omdbapi.com/?${params.toString()}`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    const data = await res.json();
    if (data.Response === "False" || !Array.isArray(data.Search)) return [];

    return data.Search.slice(0, 8).map((r: any) => ({
      imdbId: r.imdbID,
      title: r.Title,
      year: r.Year,
      posterUrl: r.Poster && r.Poster !== "N/A" ? r.Poster : null,
    }));
  } catch {
    return [];
  }
}

function shapeFullResult(data: any): OmdbResult {
  const rating = parseFloat(data.imdbRating);
  const runtime = parseInt(String(data.Runtime).replace(/[^0-9]/g, ""), 10);

  return {
    imdbRating: Number.isNaN(rating) ? null : rating,
    imdbId: data.imdbID ?? null,
    posterUrl: data.Poster && data.Poster !== "N/A" ? data.Poster : null,
    runtimeMin: Number.isNaN(runtime) ? null : runtime,
    title: data.Title,
    year: data.Year,
  };
}
