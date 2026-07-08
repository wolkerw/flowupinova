import { NextResponse } from "next/server";

export const dynamic = "force-static";

export async function GET() {
  return new NextResponse(
    "tiktok-developers-site-verification=fbkzRjgCGWsQzsDzphrtPOpjg6PrYCO0",
    {
      headers: {
        "Content-Type": "text/plain; charset=UTF-8",
      },
    }
  );
}
