
import { NextResponse } from "next/server";
import { bootstrapDatabase } from "@/lib/services/bootstrap-service";

export async function POST(request: Request) {
  // Simple security check: only allow in development environment.
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ success: false, error: "This endpoint is only available in development." }, { status: 403 });
  }

  try {
    await bootstrapDatabase();
    return NextResponse.json({ success: true, message: "Database bootstrapped successfully." });
  } catch (error: any) {
    console.error("Error during database bootstrap:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
