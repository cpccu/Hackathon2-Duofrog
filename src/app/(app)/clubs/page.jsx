import { ClubDirectory } from "@/components/clubs/club-directory";
import { requireAuthenticatedUser } from "@/lib/auth/guards";

function first(value) { return Array.isArray(value) ? value[0] || "" : value || ""; }

export default async function ClubsPage({ searchParams }) {
    const params = await searchParams;
    const search = String(first(params?.q)).trim().slice(0, 120);
    const { supabase } = await requireAuthenticatedUser("/clubs");
    const { data, error } = await supabase.rpc("search_clubs", { search_query: search });
    return <ClubDirectory clubs={data ?? []} search={search} error={error ? "Club directory couldn't load. Apply the Club & Event Engine migration and reload." : null} />;
}