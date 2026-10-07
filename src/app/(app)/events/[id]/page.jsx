import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, Clock3, MapPin, Pencil, UsersRound } from "lucide-react";
import { requireAuthenticatedUser } from "@/lib/auth/guards";
import { campusDate, eventDateLabel, timeLabel } from "@/lib/events/constants";
import { EventRegistrationButton } from "@/components/events/event-registration-button";

function hasStarted(event) {
    const today = campusDate();
    if (event.event_date < today) return true;
    if (event.event_date > today) return false;
    return new Date(`${event.event_date}T${event.start_time}+06:00`) <= new Date();
}

export default async function EventDetailsPage({ params }) {
    const { id } = await params;
    const { supabase, userId } = await requireAuthenticatedUser(`/events/${id}`);
    const { data: event, error } = await supabase.from("events").select("*,club:club_profiles!events_club_id_fkey(id,name,slug,contact_email)").eq("id", id).maybeSingle();
    if (error) return <main role="alert" className="mx-auto max-w-3xl px-4 py-12 sm:px-7"><div className="rounded-2xl border border-amber-200 bg-amber-50 p-6"><h1 className="font-semibold text-amber-950">Event details are unavailable</h1><p className="mt-2 text-sm text-amber-900">The event data could not be loaded. Check that the Club & Event Engine migration has been applied.</p><Link href="/events" className="mt-4 inline-flex text-sm font-semibold text-[#762c3a] underline">Return to Events</Link></div></main>;
    if (!event) notFound();

    const [registrationResult, countResult, managerResult] = await Promise.all([
        supabase.from("event_registrations").select("id,status,registered_at").eq("event_id", id).eq("user_id", userId).maybeSingle(),
        supabase.rpc("get_event_registration_count", { target_event: id }),
        supabase.rpc("can_manage_event", { target_event: id }),
    ]);
    const registration = registrationResult.data;
    const count = Number(countResult.data || 0);
    const expired = hasStarted(event);
    const full = event.max_attendees !== null && count >= event.max_attendees;
    const canRegister = registration?.status !== "registered" && registration?.status !== "checked_in" && event.status === "published" && event.registration_enabled && !expired && !full && !countResult.error && !registrationResult.error;
    const canCancel = registration?.status === "registered" && !expired;
    const imageUrl = /^https?:\/\//i.test(event.cover_image_url || "") ? event.cover_image_url : "";

    return (
        <main className="mx-auto max-w-5xl px-4 pb-12 pt-7 sm:px-7 sm:pt-9">
            <Link href="/events" className="text-xs font-medium text-[#697681] hover:text-[#762c3a]">← Back to Events</Link>
            {event.status === "cancelled" && <p role="status" className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">This event has been cancelled by its organizer.</p>}
            <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
                <article className="overflow-hidden rounded-3xl border border-[#e9e9e5] bg-white">
                    {imageUrl && <div role="img" aria-label={`${event.title} cover image`} className="h-48 bg-cover bg-center sm:h-64" style={{ backgroundImage: `url('${imageUrl}')` }} />}
                    <div className="p-5 sm:p-8"><span className="rounded-full bg-[#f2e8e9] px-3 py-1 text-[10px] font-semibold text-[#762c3a]">{event.event_type}</span><h1 className="mt-4 text-2xl font-semibold tracking-tight text-[#202a35] sm:text-3xl">{event.title}</h1><p className="mt-2 text-sm font-medium text-[#8b6970]">{event.club?.slug ? <Link href={`/clubs/${event.club.slug}`} className="hover:underline">{event.club.name}</Link> : event.club?.name || "City University"}</p>{event.short_description && <p className="mt-4 text-sm font-medium leading-6 text-[#4c5861]">{event.short_description}</p>}<div className="mt-5 space-y-3 text-xs text-[#697681]"><p className="flex items-center gap-2"><CalendarDays size={15} />{eventDateLabel(event.event_date)}</p><p className="flex items-center gap-2"><Clock3 size={15} />{timeLabel(event.start_time)} – {timeLabel(event.end_time)}</p><p className="flex items-center gap-2"><MapPin size={15} />{event.venue}</p></div><div className="mt-7 border-t border-[#efeee9] pt-6"><h2 className="text-sm font-semibold text-[#202a35]">About this event</h2><p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[#66727c]">{event.description}</p></div>{event.club?.contact_email && <p className="mt-6 text-xs text-[#697681]">Questions? <a href={`mailto:${event.club.contact_email}`} className="font-medium text-[#762c3a] underline underline-offset-4">Contact {event.club.name}</a></p>}<p className="mt-7 border-t border-[#efeee9] pt-4 text-[10px] text-[#92999e]">Published {new Date(event.created_at).toLocaleDateString("en", { dateStyle: "medium", timeZone: "Asia/Dhaka" })}{event.updated_at !== event.created_at ? ` · Updated ${new Date(event.updated_at).toLocaleDateString("en", { dateStyle: "medium", timeZone: "Asia/Dhaka" })}` : ""}</p></div>
                </article>
                <aside className="h-fit rounded-2xl border border-[#e9e9e5] bg-white p-5 lg:sticky lg:top-20"><h2 className="text-sm font-semibold text-[#202a35]">Your RSVP</h2>{countResult.error ? <p role="alert" className="mt-2 text-xs text-amber-800">Registration availability could not load.</p> : <p className="mt-1 text-xs leading-relaxed text-[#74808a]">{event.max_attendees ? `${Math.max(0, event.max_attendees - count)} places remaining · ${count} registered` : `${count} registered`}</p>}{registrationResult.error && <p role="alert" className="mt-2 text-xs text-amber-800">Your registration status could not load, so RSVP actions are disabled.</p>}<div className="mt-5"><EventRegistrationButton eventId={event.id} status={registration?.status || ""} canRegister={canRegister} canCancel={canCancel} /></div>{managerResult.data === true && <><Link href={`/manage/events/${event.id}/attendees`} className="mt-4 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-[#e5e3de] text-xs font-semibold text-[#4d5861]"><UsersRound size={15} />View attendees</Link><Link href={`/manage/events/${event.id}/check-in`} className="mt-2 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 text-xs font-semibold text-emerald-800"><UsersRound size={15} />Check In Attendees</Link></>}{managerResult.data === true && <Link href={`/manage/events/${event.id}/edit`} className="mt-2 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl px-2 text-xs font-semibold text-[#762c3a]"><Pencil size={14} />Edit event</Link>}</aside>
            </div>
        </main>
    );
}
