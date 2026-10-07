import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import { getSupabasePublicConfig, isSupabaseConfigured } from "./config";
export async function updateSession(request) {
    let response = NextResponse.next({ request });
    if (!isSupabaseConfigured())
        return { response, authenticated: false };
    const { url, key } = getSupabasePublicConfig();
    const supabase = createServerClient(url, key, { cookies: {
            getAll() { return request.cookies.getAll(); },
            setAll(cookiesToSet) {
                cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
                response = NextResponse.next({ request });
                cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
            }
        } });
    const { data, error } = await supabase.auth.getClaims();
    return { response, authenticated: !error && Boolean(data?.claims?.sub) };
}
