
// src/app/api/meta/callback/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAndSaveUserDetails } from "@/lib/services/meta-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const code = searchParams.get("code");
  const encodedState = searchParams.get("state");

  // Default redirect in case of critical errors
  const defaultErrorUrl = new URL("/dashboard/conteudo", req.nextUrl.origin);
  defaultErrorUrl.searchParams.set("error", "invalid_state");

  if (!code || !encodedState) {
    const errorUrl = new URL("/dashboard/conteudo", req.nextUrl.origin);
    errorUrl.searchParams.set("error", "missing_code");
    return NextResponse.redirect(errorUrl);
  }

  // --- State Decoding ---
  let userId: string, origin: string;
  try {
    const stateString = decodeURIComponent(encodedState);
    if (!stateString.startsWith("flowup-auth-state:")) {
      throw new Error("Invalid state format");
    }
    const jsonString = stateString.replace("flowup-auth-state:", "");
    const stateObject = JSON.parse(jsonString);
    userId = stateObject.userId;
    origin = stateObject.origin;

    if (!userId || !origin) {
      throw new Error("Missing userId or origin in state");
    }
  } catch (error) {
    console.error("[META_CB] Critical state decoding error:", error);
    return NextResponse.redirect(defaultErrorUrl);
  }
  // --- End State Decoding ---

  const dashboardUrl = new URL("/dashboard/conteudo", origin);

  try {
    // The redirect URI for the token exchange must be EXACTLY the same as the one used to start the flow.
    const redirectUri = `${req.nextUrl.origin}/api/meta/callback`;
    
    // Pass the dynamic redirect URI to the service function.
    await getAndSaveUserDetails(userId, code, redirectUri);
    
    // If we get here, everything worked.
    console.log("[META_CB] Redirecting user to dashboard. Background task initiated.");
    dashboardUrl.searchParams.set("connected", "true");
    return NextResponse.redirect(dashboardUrl);

  } catch (err: any) {
    console.error("[META_CB][fatal]", err?.message || err);
    dashboardUrl.searchParams.set("error", err.message || "internal_callback_error");
    return NextResponse.redirect(dashboardUrl);
  }
}
