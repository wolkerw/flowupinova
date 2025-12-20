// This file is intentionally left empty as the logic was moved to the client-side.
import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json({ success: false, error: 'This endpoint is deprecated.' }, { status: 404 });
}
