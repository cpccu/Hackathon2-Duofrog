import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, MapPin, Clock3 } from "lucide-react";
import { requireAuthenticatedUser } from "@/lib/auth/guards";
import { eventDateLabel, timeLabel } from "@/lib/events/constants";
import { EventQrCode } from "@/components/events/event-qr-code";

export default async function MyEventQrPage({ params }) {
    const { registrationId } = await params;
    const { supabase, userId } = await requireAuthenticatedUser(`/my-events/${registrationId}/qr`);
    const { data: registration, error } = await supabase.from("event_registrations")
        .select("id,status,checked_in,checked_in_at,event:events!event_registrations_event_id_fkey(id,title,event_date,start_time,end_time,venue)")
        .eq("id", registrationId).eq("user_id", userId).in("status", ["registered", "checked_in"]).maybeSingle();
    if (error) return <main className="mx-auto max-w-3xl px-4 py-12"><p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950">Your event QR could not load. Check the check-in migration and try again.</p></main>;
    if (!registration?.event) notFound();
    const { data: token, error: tokenError } = await supabase.rpc("get_my_event_qr", { target_registration: registration.id });
    if (tokenError || !token) return <main className="mx-auto max-w-3xl px-4 py-12"><p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950">The private event token could not be loaded. Ask an organizer for help.</p></main>;
    const event = registration.event;

    return (
        <main className="mx-auto max-w-4xl px-4 pb-12 pt-7 sm:px-7 sm:pt-9">
            <Link href="/my-events" className="inline-flex items-center gap-1.5 text-xs font-medium text-[#697681]"><ArrowLeft size={14} />My Events</Link>
            <div className="mx-auto mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-center">
                <section className="rounded-2xl border border-[#e9e9e5] bg-white p-5 sm:p-7">
                    <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#8b6970]">Registration confirmed</p>
                    <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[#202a35]">{event.title}</h1>
                    <div className="mt-5 space-y-3 text-xs text-[#697681]"><p className="flex items-center gap-2"><CalendarDays size={15}/>{eventDateLabel(event.event_date)}</p><p className="flex items-center gap-2"><Clock3 size={15}/>{timeLabel(event.start_time)} - {timeLabel(event.end_time)}</p><p className="flex items-center gap-2"><MapPin size={15}/>{event.venue}</p></div>
                    {registration.checked_in_at && <p className="mt-5 rounded-xl bg-emerald-50 p-3 text-xs text-emerald-900">Checked in at {new Date(registration.checked_in_at).toLocaleString("en", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Dhaka" })}.</p>}
                </section>
                <EventQrCode token={token} eventTitle={event.title} checkedIn={registration.checked_in} />
            </div>
        </main>
    );
}