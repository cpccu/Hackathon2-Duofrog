import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
export async function GET(request) {
    const code = request.nextUrl.searchParams.get("code");
    const next = request.nextUrl.searchParams.get("next");
    const destination = next?.startsWith("/") && !next.startsWith("//") && !next.includes("\\")
        ? next
        : "/dashboard";
    const providerError = request.nextUrl.searchParams.has("error");
    if (!code)
        return NextResponse.redirect(new URL(providerError ? "/login?error=oauth" : "/login?error=confirmation", request.url));
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error)
        return NextResponse.redirect(new URL("/login?error=oauth", request.url));
    return NextResponse.redirect(new URL(destination, request.url));
}
