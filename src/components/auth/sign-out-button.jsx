"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, LoaderCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
export function SignOutButton() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    async function signOut() {
        setLoading(true);
        setError("");
        const { error: authError } = await createClient().auth.signOut();
        if (authError) {
            setError("Sign out failed. Please try again.");
            setLoading(false);
            return;
        }
        router.replace("/login");
        router.refresh();
    }
    return <span className="inline-flex flex-col items-end"><button type="button" onClick={signOut} disabled={loading} className="inline-flex items-center gap-1.5 rounded-lg border border-[#e8e8e4] px-2.5 py-2 text-[11px] font-medium text-[#5b6570] hover:bg-[#f7f7f5] disabled:opacity-60">{loading ? <LoaderCircle size={14} className="animate-spin"/> : <LogOut size={14}/>}<span className="sr-only sm:not-sr-only">{loading ? "Signing out" : "Sign out"}</span></button>{error && <small role="alert" className="mt-1 max-w-40 text-right text-[10px] text-red-700">{error}</small>}</span>;
}
