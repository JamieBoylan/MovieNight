import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { searchMovies } from "@/lib/omdb";

// Backs the live search dropdown in "Log a movie night". Gated behind a
// session so a stranger who finds the URL can't burn through the group's
// free OMDb quota — every real user of the app is logged in anyway.
export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const query = req.nextUrl.searchParams.get("q") || "";
  const results = await searchMovies(query);
  return NextResponse.json({ results });
}
