import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAuthenticatedUser } from "@/lib/auth/guards";
import { EventEditorForm } from "@/components/events/event-editor-form";

export default async function NewEventPage() {
    const { supabase } = await requireAuthenticatedUser("/manage/events/new");
    const { data: clubs, error } = await supabase.rpc("get_managed_clubs");
    if (error) return <main role="alert" className="mx-auto max-w-2xl px-5 py-12 text-sm text-red-800">Organizer clubs could not load. Apply the event migration and try again.</main>;
    if (!clubs?.length) redirect("/dashboard");
    return <EventEditorForm clubs={clubs} />;
}