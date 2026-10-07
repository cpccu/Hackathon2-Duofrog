import { requireAuthenticatedUser } from "@/lib/auth/guards";

export async function getResourceById(id) {
    const { supabase } = await requireAuthenticatedUser(`/resources/${id}`);
    const { data, error } = await supabase.rpc("get_resource_details", { resource_id: id });
    return { resource: data?.[0] ?? null, error, supabase };
}
