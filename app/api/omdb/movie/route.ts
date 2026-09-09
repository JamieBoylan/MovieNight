import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { lookupById } from "@/lib/omdb";

// Fetches full details (runtime/rating/poster) for one search result once
// someone clicks it — the search list itself doesn't carry those fields.
export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const id = req.nextUrl.searchParams.get("id") || "";
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const result = await lookupById(id);
  if (!result) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ result });
}
