import { Suspense } from "react";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { ArrowRight, Bell, BookOpen, CalendarDays, CircleHelp, MapPin, Search, Sparkles } from "lucide-react";
import { CityUniversityBrand } from "@/components/brand/city-university-brand";

async function RedirectIfSignedIn() {
    if (isSupabaseConfigured()) {
        const supabase = await createClient();
        const { data } = await supabase.auth.getClaims();
        if (data?.claims?.sub) redirect("/dashboard");
    }

    return null;
}

export default function HomePage() {
    return <>
        <Suspense fallback={null}>
            <RedirectIfSignedIn />
        </Suspense>

        <div className="min-h-screen overflow-hidden bg-[#f6f5f2] text-[#202a35]">
        <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8"><Link href="/" aria-label="CampusOS — City University home" className="inline-flex items-center"><CityUniversityBrand /></Link><div className="flex items-center gap-2"><Link href="/login" className="rounded-lg px-3 py-2.5 text-xs font-semibold text-[#4d5861] hover:bg-white">Sign in</Link><Link href="/signup" className="rounded-xl bg-[#c8102e] px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-[#a50e26]">Join CampusOS</Link></div></header>
        <main id="main-content">
        <section className="relative mx-auto grid max-w-7xl gap-10 px-5 pb-14 pt-8 sm:px-8 sm:pb-20 sm:pt-12 lg:grid-cols-[1.1fr_.9fr] lg:items-center lg:gap-16 lg:py-20"><div aria-hidden="true" className="pointer-events-none absolute -right-48 top-0 size-[34rem] rounded-full border border-[#c8102e]/[.07] lg:right-0"/><div className="relative"><span className="inline-flex items-center gap-2 rounded-full border border-[#f0d7db] bg-white/80 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[.12em] text-[#c8102e]"><MapPin size={13}/> Built for City University</span><h1 className="mt-6 max-w-3xl text-4xl font-semibold leading-[1.08] tracking-[-.04em] text-[#202a35] sm:text-5xl lg:text-6xl">One Campus.<br/><span className="text-[#c8102e]">Everything You Need.</span></h1><p className="mt-5 max-w-xl text-base leading-7 text-[#65717a] sm:text-lg sm:leading-8">Your City University day, in one place. Find campus events, course resources, official notices, and student support without chasing updates across groups.</p><div className="mt-7 flex flex-wrap gap-3"><Link href="/signup" className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-[#c8102e] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#a50e26]">Get started <ArrowRight size={16}/></Link><Link href="/login" className="inline-flex min-h-12 items-center rounded-xl border border-[#dedbd5] bg-white px-5 text-sm font-semibold text-[#45515a] transition-colors hover:border-[#dda8b0]">Student sign in</Link></div><p className="mt-4 text-[11px] text-[#5e6a74]">A connected student workspace for the City University community in Dhaka.</p></div><div className="relative mx-auto w-full max-w-lg"><div className="rounded-[2rem] border border-white bg-white p-4 shadow-[0_30px_80px_-45px_rgba(60,36,38,.35)] sm:p-6"><div className="flex items-center justify-between border-b border-[#efeee9] pb-4"><div><p className="text-[11px] font-bold uppercase tracking-[.15em] text-[#a13e4c]">Campus Pulse</p><p className="mt-1 text-sm font-semibold">Your university, connected</p></div><span className="grid size-10 place-items-center rounded-xl bg-[#fbecef] text-[#c8102e]"><Sparkles size={18}/></span></div><div className="mt-4 rounded-2xl bg-[#c8102e] p-5 text-white"><p className="text-[11px] font-semibold uppercase tracking-wider text-white">City University · Dhaka</p><p className="mt-2 text-xl font-semibold">A clearer campus day.</p><p className="mt-1 text-xs leading-5 text-white">Events, learning, and campus guidance come together here.</p></div><div className="mt-4 grid grid-cols-2 gap-3">{[[CalendarDays,"Campus events","Discover & RSVP"],[BookOpen,"Resource Hub","Find course materials"],[Bell,"Notices","Stay up to date"],[CircleHelp,"Student helpdesk","Find campus guidance"]].map(([Icon,title,detail])=><div key={title} className="rounded-xl border border-[#eeece7] bg-[#fdfcfb] p-3"><Icon size={16} className="text-[#c8102e]"/><p className="mt-3 text-xs font-semibold text-[#303a43]">{title}</p><p className="mt-1 text-[11px] text-[#5e6a74]">{detail}</p></div>)}</div><div className="mt-4 flex items-center gap-2 rounded-xl bg-[#f7f5f1] p-3"><Search size={15} className="text-[#c8102e]"/><span className="text-[11px] text-[#5e6a74]">Search your campus information</span></div></div></div></section>
        <section className="border-y border-[#e9e6e0] bg-white/70"><div className="mx-auto grid max-w-7xl gap-5 px-5 py-8 sm:grid-cols-3 sm:px-8 sm:py-10"><div><p className="text-xs font-semibold text-[#303a43]">Made for campus life</p><p className="mt-1 text-xs leading-5 text-[#5e6a74]">A home for the everyday information City University students need.</p></div><div><p className="text-xs font-semibold text-[#303a43]">Connected to your university</p><p className="mt-1 text-xs leading-5 text-[#5e6a74]">Sign in to access the campus workspace and its Supabase-backed modules.</p></div><div><p className="text-xs font-semibold text-[#303a43]">One campus. One place.</p><p className="mt-1 text-xs leading-5 text-[#5e6a74]">Move between events, academic resources, notices, and support.</p></div></div></section>
        </main>
        <footer className="mx-auto flex max-w-7xl flex-wrap justify-between gap-2 px-5 py-6 text-[11px] text-[#5e6a74] sm:px-8"><span>CampusOS · One Campus. Everything You Need.</span><span>City University · Dhaka, Bangladesh</span></footer>
        </div>
    </>;
}
