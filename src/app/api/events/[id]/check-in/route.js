import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export async function POST(request, { params }) {
    if (!isSupabaseConfigured()) {
        return NextResponse.json({ outcome: "configuration_error", message: "Supabase is not configured for this app." }, { status: 503 });
    }
    const { id: eventId } = await params;
    const supabase = await createClient();
    const { data: claims, error: claimsError } = await supabase.auth.getClaims();
    if (claimsError || !claims?.claims?.sub) {
        return NextResponse.json({ outcome: "unauthorized" }, { status: 401 });
    }

    let body;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ outcome: "invalid_request", message: "Send a valid QR token." }, { status: 400 });
    }
    const token = typeof body?.token === "string" ? body.token.trim() : "";
    if (!/^[0-9a-f]{64}$/.test(token)) {
        return NextResponse.json({ outcome: "invalid_qr" }, { status: 422 });
    }

    const { data, error } = await supabase.rpc("check_in_event_attendee", {
        target_event: eventId,
        scanned_token: token,
    });
    if (error) {
        if (error.code === "42501") return NextResponse.json({ outcome: "unauthorized" }, { status: 403 });
        return NextResponse.json({ outcome: "error", message: "Check-in could not be completed." }, { status: 500 });
    }

    const result = Array.isArray(data) ? data[0] : data;
    if (!result) return NextResponse.json({ outcome: "error" }, { status: 500 });
    if (result.checked_in_count !== null && result.checked_in_count !== undefined) {
        result.checked_in_count = Number(result.checked_in_count);
    }
    const status = result.outcome === "checked_in" ? 200
        : result.outcome === "unauthorized" ? 403
            : result.outcome === "invalid_qr" ? 422
                : 409;
    return NextResponse.json(result, { status });
}
