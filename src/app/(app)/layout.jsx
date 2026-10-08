import { Suspense } from "react";
import { requireAuthenticatedUser } from "@/lib/auth/guards";
import { CampusAppShell } from "@/components/navigation/campus-app-shell";
async function AuthenticatedContent({ children }) {
    const { supabase, userId } = await requireAuthenticatedUser();
    const [{ data: profile }, { data: isEventManager }] = await Promise.all([
        supabase.from("profiles").select("id,full_name,student_id,department,role").eq("id", userId).maybeSingle(),
        supabase.rpc("is_event_manager"),
    ]);
    return <CampusAppShell profile={profile} isEventManager={isEventManager === true}>{children}</CampusAppShell>;
}
export default function ProtectedLayout({ children }) {
    return <Suspense fallback={<main className="grid min-h-screen place-items-center text-sm text-[#697681]">Checking your session...</main>}><AuthenticatedContent>{children}</AuthenticatedContent></Suspense>;
}
