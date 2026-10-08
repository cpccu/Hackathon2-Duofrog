import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/auth-form";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
async function SignupContent() {
    if (isSupabaseConfigured()) {
        const supabase = await createClient();
        const { data } = await supabase.auth.getClaims();
        if (data?.claims?.sub)
            redirect("/dashboard");
    }
    return <AuthForm mode="signup" configured={isSupabaseConfigured()}/>;
}
export default function SignupPage() { return <Suspense fallback={<p className="text-sm text-[#5e6a74]">Loading sign-up...</p>}><SignupContent /></Suspense>; }
