import { redirect, notFound } from "next/navigation";
import { requireAuthenticatedUser } from "@/lib/auth/guards";
import { EventEditorForm } from "@/components/events/event-editor-form";

export default async function EditEventPage({ params }) {
    const { id } = await params;
    const { supabase } = await requireAuthenticatedUser(`/manage/events/${id}/edit`);
    const { data: authorized } = await supabase.rpc("can_manage_event", { target_event: id });
    if (!authorized) redirect("/dashboard");
    const [eventResult, clubsResult] = await Promise.all([
        supabase.from("events").select("*").eq("id", id).maybeSingle(),
        supabase.rpc("get_managed_clubs"),
    ]);
    if (eventResult.error || clubsResult.error) return <main role="alert" className="mx-auto max-w-2xl px-5 py-12 text-sm text-red-800">This event could not be loaded for editing.</main>;
    if (!eventResult.data) notFound();
    return <EventEditorForm clubs={clubsResult.data ?? []} event={eventResult.data} />;
}