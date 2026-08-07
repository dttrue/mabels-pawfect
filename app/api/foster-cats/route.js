// app/api/foster-cats/route.js

import { NextResponse } from "next/server";
import { getPublicFosterCats } from "@/lib/publicFosterCats";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const cats = await getPublicFosterCats();

    return NextResponse.json(
      { cats },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("[public foster cats] GET error:", error);

    return NextResponse.json(
      { error: "Failed to load foster cats" },
      { status: 500 }
    );
  }
}
