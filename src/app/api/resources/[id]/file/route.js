import { NextResponse } from "next/server";
import { RESOURCE_BUCKET } from "@/lib/resources/constants";
import { requireAuthenticatedUser } from "@/lib/auth/guards";

export async function GET(request, { params }) {
    const { id } = await params;
    const fileError = new URL(`/resources/${encodeURIComponent(id)}?fileError=1`, request.url);
    const { supabase } = await requireAuthenticatedUser(`/resources/${id}`);
    const { data: rows, error } = await supabase.rpc("get_resource_details", { resource_id: id });
    const resource = rows?.[0];
    if (error || !resource?.storage_path) return NextResponse.redirect(fileError);

    const download = new URL(request.url).searchParams.get("download") === "1";
    const { data, error: storageError } = await supabase.storage
        .from(RESOURCE_BUCKET)
        .createSignedUrl(resource.storage_path, 60, { download });
    if (storageError || !data?.signedUrl) return NextResponse.redirect(fileError);

    return NextResponse.redirect(data.signedUrl, 302);
}