import { NextResponse } from "next/server";

export async function GET() {
  return new NextResponse("tiktok-developers-site-verification=fbkzRjgCGWsQzsDzphrtPOpjg6PrYCO0", {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
