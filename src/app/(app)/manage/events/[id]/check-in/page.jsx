import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, CalendarDays, Clock3, MapPin } from "lucide-react";
import { requireAuthenticatedUser } from "@/lib/auth/guards";
import { eventDateLabel, timeLabel } from "@/lib/events/constants";
import { EventCheckinScanner } from "@/components/events/event-checkin-scanner";

export default async function EventCheckinPage({ params }) {
    const { id } = await params;
    const { supabase } = await requireAuthenticatedUser(`/manage/events/${id}/check-in`);
    const { data: authorized, error: permissionError } = await supabase.rpc("can_manage_event", { target_event: id });
    if (permissionError || !authorized) redirect("/dashboard");
    const [eventResult, summaryResult] = await Promise.all([
        supabase.from("events").select("id,title,event_date,start_time,end_time,venue,status,club:club_profiles!events_club_id_fkey(name)").eq("id", id).maybeSingle(),
        supabase.rpc("get_event_checkin_summary", { target_event: id }),
    ]);
    if (eventResult.error || summaryResult.error) return <main role="alert" className="mx-auto max-w-3xl px-4 py-12"><div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950">Event check-in could not load. Apply the secure check-in migration and try again.</div></main>;
    if (!eventResult.data) notFound();
    const event = eventResult.data;
    const summary = Array.isArray(summaryResult.data) ? summaryResult.data[0] : summaryResult.data;

    return (
        <main className="mx-auto max-w-6xl px-4 pb-12 pt-7 sm:px-7 sm:pt-9">
            <Link href={`/manage/events/${id}/attendees`} className="inline-flex items-center gap-1.5 text-xs font-medium text-[#697681]"><ArrowLeft size={14}/>Attendee list</Link>
            <div className="mb-6 mt-5"><p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#a13e4c]">{event.club?.name} · Event check-in</p><h1 className="mt-1 text-2xl font-semibold tracking-tight text-[#202a35] sm:text-3xl">{event.title}</h1><div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-[#697681]"><span className="inline-flex items-center gap-1.5"><CalendarDays size={14}/>{eventDateLabel(event.event_date)}</span><span className="inline-flex items-center gap-1.5"><Clock3 size={14}/>{timeLabel(event.start_time)} - {timeLabel(event.end_time)}</span><span className="inline-flex items-center gap-1.5"><MapPin size={14}/>{event.venue}</span></div></div>
            {event.status !== "published" && <p role="status" className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">This event is {event.status}; check-in will be rejected until it is published.</p>}
            <EventCheckinScanner eventId={event.id} initialRegistered={Number(summary?.registered_count || 0)} initialCheckedIn={Number(summary?.checked_in_count || 0)} />
            <p className="mt-4 text-[10px] leading-relaxed text-[#92999e]">Check-in opens two hours before the published event and closes when it ends. Scan results and attendee identity are validated and recorded by Supabase.</p>
        </main>
    );
}
