import Link from "next/link";
import { CalendarDays, MapPin } from "lucide-react";
import { requireAuthenticatedUser } from "@/lib/auth/guards";
import { eventDateLabel, timeLabel } from "@/lib/events/constants";
import { EventRegistrationButton } from "@/components/events/event-registration-button";

function canCancel(event) {
    const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Dhaka", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
    return event.event_date > today || (event.event_date === today && new Date(`${event.event_date}T${event.start_time}+06:00`) > new Date());
}

export default async function MyEventsPage() {
    const { supabase, userId } = await requireAuthenticatedUser("/my-events");
    const { data, error } = await supabase.from("event_registrations")
        .select("id,status,registered_at,event:events!event_registrations_event_id_fkey(id,title,event_type,short_description,description,event_date,start_time,end_time,venue,status,registration_enabled,max_attendees,cover_image_url,club:club_profiles!events_club_id_fkey(name))")
        .eq("user_id", userId).in("status", ["registered", "checked_in"]).order("registered_at", { ascending: false });

    return (
        <main className="mx-auto max-w-5xl px-4 pb-12 pt-7 sm:px-7 sm:pt-9">
            <div className="mb-7"><p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#8b6970]">Your campus calendar</p><h1 className="mt-1 text-3xl font-semibold tracking-tight text-[#202a35]">My Events</h1><p className="mt-2 text-sm text-[#697681]">Events you&apos;ve registered for. You can cancel until an event starts.</p></div>
            {error ? <section role="alert" className="rounded-2xl border border-amber-200 bg-amber-50 p-5"><h2 className="font-semibold text-amber-950">Your registrations couldn&apos;t load</h2><p className="mt-2 text-sm text-amber-900">Try again in a moment or check the event database migration.</p></section> : data?.length ? <ul className="space-y-3">{data.map((registration) => {
                const event = registration.event;
                if (!event) return null;
                return <li key={registration.id} className="grid gap-4 rounded-2xl border border-[#e9e9e5] bg-white p-5 sm:grid-cols-[1fr_220px] sm:items-center"><div><div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-[#f2e8e9] px-2.5 py-1 text-[10px] font-semibold text-[#762c3a]">{event.event_type}</span><span className={`text-[10px] font-medium ${registration.status === "checked_in" ? "text-emerald-800" : "text-[#697681]"}`}>{registration.status === "checked_in" ? "Checked in" : "Registration confirmed"}</span>{event.status === "cancelled" && <span className="text-[10px] font-semibold text-red-700">Event cancelled</span>}</div><h2 className="mt-2 text-base font-semibold text-[#202a35]"><Link href={`/events/${event.id}`} className="hover:text-[#762c3a]">{event.title}</Link></h2><p className="mt-1 text-xs text-[#8b6970]">{event.club?.name || "City University"}</p><div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-[10px] text-[#697681]"><span className="inline-flex items-center gap-1.5"><CalendarDays size={13} />{eventDateLabel(event.event_date)} · {timeLabel(event.start_time)}–{timeLabel(event.end_time)}</span><span className="inline-flex items-center gap-1.5"><MapPin size={13} />{event.venue}</span></div></div><div className="space-y-2"><Link href={`/my-events/${registration.id}/qr`} className="inline-flex min-h-10 w-full items-center justify-center rounded-xl bg-[#762c3a] px-4 text-xs font-semibold text-white">My QR</Link><EventRegistrationButton eventId={event.id} status={registration.status} canRegister={false} canCancel={registration.status === "registered" && canCancel(event)} /></div></li>;
            })}</ul> : <section className="rounded-2xl border border-dashed border-[#deded9] bg-white px-5 py-10 text-center"><span className="mx-auto grid size-12 place-items-center rounded-2xl bg-[#f6f2ee] text-[#762c3a]"><CalendarDays size={21} /></span><h2 className="mt-4 text-base font-semibold text-[#202a35]">No event registrations yet</h2><p className="mx-auto mt-2 max-w-md text-sm text-[#73808a]">Browse upcoming events and RSVP to see them here.</p><Link href="/events" className="mt-4 inline-flex min-h-10 items-center rounded-lg bg-[#762c3a] px-4 text-xs font-semibold text-white">Explore events</Link></section>}
        </main>
    );
}