import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/auth-form";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
async function LoginContent({ searchParams }) {
    const params = await searchParams;
    if (isSupabaseConfigured()) {
        const supabase = await createClient();
        const { data } = await supabase.auth.getClaims();
        if (data?.claims?.sub)
            redirect("/dashboard");
    }
    const initialError = params.error === "confirmation"
        ? "That confirmation link is invalid or expired. Request a new sign-up link."
        : params.error === "oauth"
            ? "Google sign-in was cancelled or could not be completed. Please try again."
            : "";
    return <AuthForm mode="login" configured={isSupabaseConfigured()} initialError={initialError} initialSuccess={params.confirmed === "1" ? "Your email is confirmed. You can now sign in." : ""}/>;
}
export default function LoginPage(props) { return <Suspense fallback={<p className="text-sm text-[#697681]">Loading sign-in...</p>}><LoginContent {...props}/></Suspense>; }
