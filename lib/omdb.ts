// Optional: if OMDB_API_KEY is set (get a free one at
// https://www.omdbapi.com/apikey.aspx), we auto-fill the IMDb rating and
// poster art when a movie is logged. Without a key this just quietly
// returns null and everything still works — you'll just fill those fields
// in by hand.

export type OmdbResult = {
  imdbRating: number | null;
  imdbId: string | null;
  posterUrl: string | null;
  runtimeMin: number | null;
};

export async function lookupMovie(title: string, year?: string): Promise<OmdbResult | null> {
  const apiKey = process.env.OMDB_API_KEY;
  if (!apiKey) return null;

  try {
    const params = new URLSearchParams({ apikey: apiKey, t: title });
    if (year) params.set("y", year);
    const res = await fetch(`https://www.omdbapi.com/?${params.toString()}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.Response === "False") return null;

    const rating = parseFloat(data.imdbRating);
    const runtime = parseInt(String(data.Runtime).replace(/[^0-9]/g, ""), 10);

    return {
      imdbRating: Number.isNaN(rating) ? null : rating,
      imdbId: data.imdbID ?? null,
      posterUrl: data.Poster && data.Poster !== "N/A" ? data.Poster : null,
      runtimeMin: Number.isNaN(runtime) ? null : runtime,
    };
  } catch {
    return null;
  }
}
