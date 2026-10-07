import { redirect } from "next/navigation";
import { requireAuthenticatedUser } from "@/lib/auth/guards";
import { ManagedEvents } from "@/components/events/managed-events";

function first(value) { return Array.isArray(value) ? value[0] || "" : value || ""; }

export default async function ManageEventsPage({ searchParams }) {
    const params = await searchParams;
    const { supabase } = await requireAuthenticatedUser("/manage/events");
    const { data: manager, error: managerError } = await supabase.rpc("is_event_manager");
    if (!managerError && manager !== true) redirect("/dashboard");
    const { data, error } = await supabase.rpc("get_managed_events");
    return <ManagedEvents events={data ?? []} error={error ? "Managed events couldn't load. Check the database migration and your club permissions." : managerError ? "Your organizer permissions couldn't be checked." : null} success={first(params?.success)} />;
}