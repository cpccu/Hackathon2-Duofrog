import { requireAuthenticatedUser } from "@/lib/auth/guards";

const missingRelationCodes = new Set(["42P01", "PGRST205"]);

function resolveModule(result) {
    if (!result.error) {
        return { status: "ready", items: result.data ?? [] };
    }

    if (missingRelationCodes.has(result.error.code)) {
        return { status: "not-connected", items: [] };
    }

    return { status: "error", items: [] };
}

function campusDate() {
    return new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Dhaka",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(new Date());
}

export async function getCampusPulseData() {
    const { supabase, userId } = await requireAuthenticatedUser();
    const [profileResult, eventsResult, resourcesResult, noticesResult] = await Promise.all([
        supabase
            .from("profiles")
            .select("id,full_name,student_id,department,role,created_at")
            .eq("id", userId)
            .maybeSingle(),
        supabase.rpc("search_events", {
            search_query: "",
            club_filter: null,
            type_filter: "",
            date_from: campusDate(),
            date_to: null,
            result_limit: 6,
        }),
        supabase
            .from("resources")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(6),
        supabase
            .from("notices")
            .select("*")
            .order("published_date", { ascending: false })
            .limit(6),
    ]);

    return {
        profile: profileResult.data,
        profileError: profileResult.error,
        events: resolveModule(eventsResult),
        resources: resolveModule(resourcesResult),
        notices: resolveModule(noticesResult),
    };
}
