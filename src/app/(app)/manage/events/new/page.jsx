import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAuthenticatedUser } from "@/lib/auth/guards";
import { EventEditorForm } from "@/components/events/event-editor-form";

export default async function NewEventPage() {
    const { supabase } = await requireAuthenticatedUser("/manage/events/new");
    const [{ data: canManageEvents, error: permissionError }, { data: clubs, error: clubsError }] = await Promise.all([
        supabase.rpc("is_event_manager"),
        supabase.rpc("get_managed_clubs"),
    ]);
    if (permissionError) return <main role="alert" className="mx-auto max-w-2xl px-5 py-12"><h1 className="text-lg font-semibold text-[#202a35]">Event permissions could not be checked</h1><p className="mt-2 text-sm leading-6 text-[#5e6a74]">Refresh the page. If this keeps happening, ask an administrator to confirm the Club &amp; Event Engine migration is installed.</p><Link href="/admin" className="mt-4 inline-flex text-sm font-semibold text-[#c8102e] underline">Return to Admin Dashboard</Link></main>;
    if (!canManageEvents) redirect("/dashboard");
    if (clubsError) return <main role="alert" className="mx-auto max-w-2xl px-5 py-12"><h1 className="text-lg font-semibold text-[#202a35]">Your clubs could not load</h1><p className="mt-2 text-sm leading-6 text-[#5e6a74]">Check that the Club &amp; Event Engine migration is installed, then try again.</p><Link href="/admin" className="mt-4 inline-flex text-sm font-semibold text-[#c8102e] underline">Return to Admin Dashboard</Link></main>;
    if (!clubs?.length) return <main className="mx-auto max-w-2xl px-5 py-12"><h1 className="text-lg font-semibold text-[#202a35]">Add a club before creating an event</h1><p className="mt-2 text-sm leading-6 text-[#5e6a74]">This account can manage events, but no clubs are available yet. Add a club from Admin Dashboard → Clubs, then return here.</p><Link href="/admin" className="mt-4 inline-flex min-h-10 items-center rounded-lg bg-[#c8102e] px-4 text-sm font-semibold text-white">Open Admin Dashboard</Link></main>;
    return <EventEditorForm clubs={clubs} />;
}
