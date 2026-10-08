import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Mail, UsersRound } from "lucide-react";
import { EventCard } from "@/components/events/event-card";
import { requireAuthenticatedUser } from "@/lib/auth/guards";

export default async function ClubDetailsPage({ params }) {
    const { slug } = await params;
    const { supabase } = await requireAuthenticatedUser(`/clubs/${slug}`);
    const { data: club, error: clubError } = await supabase.from("club_profiles").select("id,name,slug,short_description,description,logo_url,contact_email,created_at").eq("slug", slug).maybeSingle();
    if (clubError) return <main role="alert" className="mx-auto max-w-3xl px-4 py-12"><div className="rounded-2xl border border-amber-200 bg-amber-50 p-6"><h1 className="font-semibold text-amber-950">Club details are unavailable</h1><p className="mt-2 text-sm text-amber-900">Check the Club & Event Engine migration and try again.</p><Link href="/clubs" className="mt-4 inline-flex text-sm font-semibold text-[#c8102e] underline">Club directory</Link></div></main>;
    if (!club) notFound();

    const { data: events, error: eventsError } = await supabase.rpc("search_events", {
        search_query: "", club_filter: club.id, type_filter: "", date_from: null, date_to: null, result_limit: 50,
    });
    return (
        <main className="mx-auto max-w-7xl px-4 pb-12 pt-7 sm:px-7 sm:pt-9 xl:px-10">
            <Link href="/clubs" className="inline-flex items-center gap-1.5 text-xs font-medium text-[#697681] hover:text-[#c8102e]"><ArrowLeft size={14} />Club directory</Link>
            <section className="mt-5 rounded-3xl bg-[#c8102e] p-6 text-white sm:p-9"><span className="grid size-12 place-items-center rounded-2xl bg-white/10"><UsersRound size={22} /></span><h1 className="mt-5 text-2xl font-semibold tracking-tight sm:text-3xl">{club.name}</h1>{club.short_description && <p className="mt-2 max-w-2xl text-sm leading-6 text-white/80">{club.short_description}</p>}{club.contact_email && <a href={`mailto:${club.contact_email}`} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-semibold text-[#c8102e]"><Mail size={14} />Contact the club</a>}</section>
            <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]"><section><h2 className="text-lg font-semibold text-[#202a35]">About the club</h2><p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[#66727c]">{club.description || club.short_description || "This club profile has not added a description yet."}</p></section><aside className="h-fit rounded-2xl border border-[#e9e9e5] bg-white p-5"><p className="text-[10px] font-bold uppercase tracking-wide text-[#8a9297]">Club contact</p>{club.contact_email ? <a className="mt-2 block break-all text-sm font-medium text-[#c8102e] underline underline-offset-4" href={`mailto:${club.contact_email}`}>{club.contact_email}</a> : <p className="mt-2 text-sm text-[#697681]">Contact details have not been published.</p>}</aside></div>
            <section className="mt-10"><div className="mb-4"><p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#a13e4c]">Get involved</p><h2 className="mt-1 text-lg font-semibold text-[#202a35]">Upcoming events</h2></div>{eventsError ? <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">Upcoming events could not load.</p> : events?.length ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{events.map((event) => <EventCard key={event.id} event={event} />)}</div> : <div className="rounded-2xl border border-dashed border-[#deded9] bg-white px-5 py-8 text-sm text-[#73808a]">This club has no published upcoming events.</div>}</section>
        </main>
    );
}