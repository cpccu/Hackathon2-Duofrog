"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { CityUniversityBrand } from "@/components/brand/city-university-brand";
export function AuthForm({ mode, configured, initialError = "", initialSuccess = "" }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(initialError);
    const [success, setSuccess] = useState(initialSuccess);
    const signup = mode === "signup";
    async function submit(event) {
        event.preventDefault();
        setError("");
        setSuccess("");
        const values = new FormData(event.currentTarget);
        const email = String(values.get("email") || "").trim().toLowerCase();
        const password = String(values.get("password") || "");
        const fullName = String(values.get("full_name") || "").trim();
        const confirm = String(values.get("confirm_password") || "");
        const studentId = String(values.get("student_id") || "").trim();
        const department = String(values.get("department") || "").trim();
        if (!configured) {
            setError("Authentication is not configured yet. Add the Supabase project URL and publishable key.");
            return;
        }
        if (signup && (fullName.length < 2 || fullName.length > 120)) {
            setError("Enter your full name (2 to 120 characters).");
            return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setError("Enter a valid email address.");
            return;
        }
        if (password.length < 8) {
            setError("Your password must be at least 8 characters.");
            return;
        }
        if (signup && password !== confirm) {
            setError("The passwords do not match.");
            return;
        }
        setLoading(true);
        try {
            const supabase = createClient();
            if (signup) {
                const { data, error: authError } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: new URL("/auth/callback", window.location.origin).toString(), data: { full_name: fullName, student_id: studentId || null, department: department || null } } });
                if (authError)
                    throw authError;
                if (data.session) {
                    router.replace("/dashboard");
                    router.refresh();
                    return;
                }
                setSuccess("Your account was created. Check your email for a confirmation link, then sign in.");
            }
            else {
                const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
                if (authError)
                    throw authError;
                const requested = new URLSearchParams(window.location.search).get("next");
                const next = requested?.startsWith("/") && !requested.startsWith("//") ? requested : "/dashboard";
                router.replace(next);
                router.refresh();
                return;
            }
        }
        catch (caught) {
            setError(caught instanceof Error ? caught.message : "We could not complete your request. Please try again.");
        }
        finally {
            setLoading(false);
        }
    }
    return <section className="w-full max-w-md rounded-3xl border border-[#e8e6e1] bg-white p-6 shadow-[0_24px_70px_-42px_rgba(40,30,25,.35)] sm:p-9">
  <Link href="/" aria-label="CampusOS — City University home" className="inline-flex items-center"><CityUniversityBrand /></Link>
  <p className="mt-9 text-[10px] font-bold uppercase tracking-[.18em] text-[#a13e4c]">One Campus. Everything You Need.</p>
  <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#202a35]">{signup ? "Create your account" : "Welcome back"}</h1><p className="mt-2 text-sm leading-relaxed text-[#697681]">{signup ? "Join your City University workspace." : "Sign in to continue to your campus workspace."}</p>
  {!configured && <p className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-900">Connect Supabase to enable account access. Set the values in your local environment file, then restart the app.</p>}
  {error && <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-xs leading-relaxed text-red-800">{error}</p>}
  {success && <p role="status" className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs leading-relaxed text-emerald-900">{success}</p>}
  <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
   {signup && <><label className="block text-xs font-medium text-[#37414a]">Full name<input name="full_name" autoComplete="name" required minLength={2} maxLength={120} className="mt-1.5 w-full rounded-xl border border-[#deded9] px-3.5 py-3 text-sm outline-none focus:border-[#c8102e]"/></label>
   <div className="grid gap-4 sm:grid-cols-2"><label className="block text-xs font-medium text-[#37414a]">Student ID <span className="text-[#92999e]">(optional)</span><input name="student_id" maxLength={40} className="mt-1.5 w-full rounded-xl border border-[#deded9] px-3.5 py-3 text-sm outline-none focus:border-[#c8102e]"/></label>
   <label className="block text-xs font-medium text-[#37414a]">Department <span className="text-[#92999e]">(optional)</span><input name="department" maxLength={120} className="mt-1.5 w-full rounded-xl border border-[#deded9] px-3.5 py-3 text-sm outline-none focus:border-[#c8102e]"/></label></div></>}
   <label className="block text-xs font-medium text-[#37414a]">University email<input name="email" type="email" autoComplete="email" required maxLength={254} className="mt-1.5 w-full rounded-xl border border-[#deded9] px-3.5 py-3 text-sm outline-none focus:border-[#c8102e]"/></label>
   <label className="block text-xs font-medium text-[#37414a]">Password<input name="password" type="password" autoComplete={signup ? "new-password" : "current-password"} required minLength={8} className="mt-1.5 w-full rounded-xl border border-[#deded9] px-3.5 py-3 text-sm outline-none focus:border-[#c8102e]"/></label>
   {signup && <label className="block text-xs font-medium text-[#37414a]">Confirm password<input name="confirm_password" type="password" autoComplete="new-password" required minLength={8} className="mt-1.5 w-full rounded-xl border border-[#deded9] px-3.5 py-3 text-sm outline-none focus:border-[#c8102e]"/></label>}
   <button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#c8102e] px-4 py-3.5 text-sm font-semibold text-white hover:bg-[#a50e26] disabled:cursor-wait disabled:opacity-70">{loading ? <><LoaderCircle className="size-4 animate-spin"/>Please wait...</> : <>{signup ? "Create account" : "Sign in"}<ArrowRight size={16}/></>}</button>
  </form>
  <p className="mt-6 text-center text-xs text-[#697681]">{signup ? "Already have an account?" : "New to CampusOS?"} <Link className="font-semibold text-[#c8102e] underline-offset-4 hover:underline" href={signup ? "/login" : "/signup"}>{signup ? "Sign in" : "Create an account"}</Link></p>
  <p className="mt-7 border-t pt-5 text-center text-[10px] text-[#92999e]">Secure sign-in for the City University community</p>
 </section>;
}
