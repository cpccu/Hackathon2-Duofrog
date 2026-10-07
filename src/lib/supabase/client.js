import { createBrowserClient } from "@supabase/ssr";
import { getSupabasePublicConfig } from "./config";
let client;
export function createClient() {
    if (!client) {
        const { url, key } = getSupabasePublicConfig();
        client = createBrowserClient(url, key);
    }
    return client;
}
