import { Suspense } from "react";
import { connection } from "next/server";
import { requireAuthenticatedUser } from "@/lib/auth/guards";
import { CampusAppShell } from "@/components/navigation/campus-app-shell";

// Authenticated routes depend on per-request Supabase session data and may block while it loads.
export const instant = false;

async function AuthenticatedContent({ children }) {
    // Authenticated pages and their Supabase requests run at request time.
    // This also keeps request-specific timestamps out of the prerendered shell.
    await connection();
    const { supabase, userId } = await requireAuthenticatedUser();
    const [{ data: profile }, { data: isEventManager }] = await Promise.all([
        supabase.from("profiles").select("id,full_name,student_id,department,role").eq("id", userId).maybeSingle(),
        supabase.rpc("is_event_manager"),
    ]);
    return <CampusAppShell profile={profile} isEventManager={isEventManager === true}>{children}</CampusAppShell>;
}
export default function ProtectedLayout({ children }) {
    return <Suspense fallback={<main id="main-content" className="grid min-h-screen place-items-center text-sm text-[#5e6a74]">Checking your session...</main>}><AuthenticatedContent>{children}</AuthenticatedContent></Suspense>;
}
