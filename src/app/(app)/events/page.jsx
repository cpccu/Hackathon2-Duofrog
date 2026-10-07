import { EventsFeed } from "@/components/events/events-feed";
import { EVENT_TYPES } from "@/lib/events/constants";
import { requireAuthenticatedUser } from "@/lib/auth/guards";

function param(value) { return Array.isArray(value) ? value[0] || "" : value || ""; }
function validDate(value) { return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : ""; }
function validUuid(value) { return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value) ? value : ""; }

export default async function EventsPage({ searchParams }) {
    const params = await searchParams;
    const filters = {
        search: String(param(params?.q)).trim().slice(0, 120),
        club: validUuid(String(param(params?.club))),
        type: EVENT_TYPES.includes(param(params?.type)) ? param(params?.type) : "",
        from: validDate(param(params?.from)),
        to: validDate(param(params?.to)),
    };
    const { supabase } = await requireAuthenticatedUser("/events");
    const [eventsResult, clubsResult, managerResult] = await Promise.all([
        supabase.rpc("search_events", {
            search_query: filters.search,
            club_filter: filters.club || null,
            type_filter: filters.type,
            date_from: filters.from || null,
            date_to: filters.to || null,
            result_limit: 50,
        }),
        supabase.from("club_profiles").select("id,name").order("name"),
        supabase.rpc("is_event_manager"),
    ]);
    return <EventsFeed events={eventsResult.data ?? []} clubs={clubsResult.data ?? []} filters={filters} error={eventsResult.error ? "Events could not be loaded. Apply the Club & Event Engine migration, then reload." : null} clubsError={clubsResult.error} isManager={managerResult.data === true} />;
}
