import { redirect } from "next/navigation";
import { connection } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
export async function requireAuthenticatedUser(nextPath = "/dashboard") {
    // Session validation is request-specific and Supabase checks JWT expiry against the current time.
    await connection();
    if (!isSupabaseConfigured())
        redirect("/login?error=configuration");
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getClaims();
    if (error || !data?.claims?.sub)
        redirect("/login?next=" + encodeURIComponent(nextPath));
    return { supabase, userId: data.claims.sub };
}
export async function getOwnProfile() {
    const context = await requireAuthenticatedUser();
    const { data: profile, error } = await context.supabase.from("profiles").select("id,full_name,student_id,department,role,created_at").eq("id", context.userId).maybeSingle();
    return { profile, error };
}
export async function requireRole(role, nextPath = "/dashboard") {
    const context = await requireAuthenticatedUser(nextPath);
    const { data: profile, error } = await context.supabase.from("profiles").select("id,full_name,student_id,department,role,created_at").eq("id", context.userId).maybeSingle();
    if (error || !profile)
        return { kind: "profile-error" };
    if (profile.role !== role)
        redirect("/dashboard");
    return { kind: "ok", ...context, profile };
}
