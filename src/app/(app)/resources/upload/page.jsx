import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/guards";
import { ResourceUploadForm } from "@/components/resources/resource-upload-form";

export const instant = false;

export default async function ResourceUploadPage({ searchParams }) {
    const result = await requireRole("admin", "/resources/upload");

    if (result.kind !== "ok") {
        redirect("/resources?error=profile");
    }

    const params = await searchParams;
    return <ResourceUploadForm demoMode={params?.demo === "1"} />;
}