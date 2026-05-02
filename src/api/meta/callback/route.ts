// This file is intentionally left empty as the logic was moved to /api/instagram/callback.
import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { success: false, error: "This endpoint is deprecated." },
    { status: 404 }
  );
}
