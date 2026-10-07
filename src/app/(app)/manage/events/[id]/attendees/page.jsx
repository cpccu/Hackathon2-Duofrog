import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, CheckCircle2, Percent, UsersRound } from "lucide-react";
import { requireAuthenticatedUser } from "@/lib/auth/guards";
import { eventDateLabel, timeLabel } from "@/lib/events/constants";

function first(value) { return Array.isArray(value) ? value[0] || "" : value || ""; }

export default async function EventAttendeesPage({ params, searchParams }) {
    const { id } = await params;
    const filters = await searchParams;
    const filter = ["checked_in", "not_checked_in"].includes(first(filters?.status)) ? first(filters.status) : "all";
    const { supabase } = await requireAuthenticatedUser(`/manage/events/${id}/attendees`);
    const { data: authorized, error: permissionError } = await supabase.rpc("can_manage_event", { target_event: id });
    if (permissionError || !authorized) redirect("/dashboard");
    const [eventResult, attendeesResult] = await Promise.all([
        supabase.from("events").select("id,title,event_date,start_time,end_time,venue,max_attendees,club:club_profiles!events_club_id_fkey(name)").eq("id", id).maybeSingle(),
        supabase.rpc("get_event_attendees", { target_event: id }),
    ]);
    if (eventResult.error || attendeesResult.error) return <main role="alert" className="mx-auto max-w-3xl px-4 py-12"><div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950">Attendee information could not load. Check your event permissions and database migration.</div></main>;
    if (!eventResult.data) notFound();
    const event = eventResult.data;
    const attendees = attendeesResult.data ?? [];
    const checkedCount = attendees.filter((person) => person.checked_in).length;
    const registeredCount = attendees.length;
    const attendancePercent = registeredCount ? Math.round((checkedCount / registeredCount) * 100) : 0;
    const filtered = attendees.filter((person) => filter === "all" || (filter === "checked_in" ? person.checked_in : !person.checked_in));

    return (
        <main className="mx-auto max-w-6xl px-4 pb-12 pt-7 sm:px-7 sm:pt-9">
            <Link href="/manage/events" className="inline-flex items-center gap-1.5 text-xs font-medium text-[#697681]"><ArrowLeft size={14}/>Event management</Link>
            <div className="mt-5 flex flex-wrap items-end justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#8b6970]">{event.club?.name}</p><h1 className="mt-1 text-2xl font-semibold text-[#202a35]">{event.title}</h1><p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#697681]"><span className="inline-flex items-center gap-1.5"><CalendarDays size={14}/>{eventDateLabel(event.event_date)}</span><span>{timeLabel(event.start_time)} - {timeLabel(event.end_time)}</span><span>{event.venue}</span></p></div><Link href={`/manage/events/${id}/check-in`} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#762c3a] px-4 text-xs font-semibold text-white"><CheckCircle2 size={15}/>Check In Attendees</Link></div>
            <section aria-label="Attendance summary" className="mt-6 grid gap-3 sm:grid-cols-3"><div className="rounded-2xl border border-[#e9e9e5] bg-white p-4"><p className="flex items-center gap-2 text-[10px] text-[#74808a]"><UsersRound size={14}/>Total registered</p><p className="mt-2 text-2xl font-semibold text-[#202a35]">{registeredCount}{event.max_attendees ? <span className="text-sm font-normal text-[#92999e]"> / {event.max_attendees}</span> : null}</p></div><div className="rounded-2xl border border-[#e9e9e5] bg-white p-4"><p className="flex items-center gap-2 text-[10px] text-[#74808a]"><CheckCircle2 size={14}/>Checked in</p><p className="mt-2 text-2xl font-semibold text-emerald-800">{checkedCount}</p></div><div className="rounded-2xl border border-[#e9e9e5] bg-white p-4"><p className="flex items-center gap-2 text-[10px] text-[#74808a]"><Percent size={14}/>Attendance</p><p className="mt-2 text-2xl font-semibold text-[#202a35]">{attendancePercent}%</p></div></section>
            <nav aria-label="Filter attendees" className="mt-6 flex flex-wrap gap-2">{[["all", "All"], ["checked_in", "Checked in"], ["not_checked_in", "Not checked in"]].map(([value, label]) => <Link key={value} href={value === "all" ? `/manage/events/${id}/attendees` : `/manage/events/${id}/attendees?status=${value}`} aria-current={filter === value ? "page" : undefined} className={`inline-flex min-h-9 items-center rounded-lg px-3 text-xs font-medium ${filter === value ? "bg-[#762c3a] text-white" : "border border-[#e5e3de] bg-white text-[#4d5861]"}`}>{label}</Link>)}</nav>
            {filtered.length ? <div className="mt-4 overflow-hidden rounded-2xl border border-[#e9e9e5] bg-white"><div className="hidden grid-cols-[1.1fr_1fr_1fr_1.2fr_1fr] gap-4 border-b bg-[#faf9f6] px-5 py-3 text-[10px] font-bold uppercase tracking-wide text-[#858d92] md:grid"><span>Student</span><span>Student ID</span><span>Department</span><span>Registration</span><span>Check-in</span></div><ul className="divide-y divide-[#efeee9]">{filtered.map((person) => <li key={person.registration_id} className="grid gap-2 px-5 py-4 text-xs sm:grid-cols-2 md:grid-cols-[1.1fr_1fr_1fr_1.2fr_1fr] md:items-center md:gap-4"><span className="font-semibold text-[#303a43]">{person.full_name || "Student"}</span><span className="text-[#697681]">{person.student_id || "Not provided"}</span><span className="text-[#697681]">{person.department || "Not provided"}</span><span className="text-[10px] text-[#858d92]">{new Date(person.registered_at).toLocaleString("en", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Dhaka" })}</span><span className={`text-[10px] font-medium ${person.checked_in ? "text-emerald-800" : "text-[#858d92]"}`}>{person.checked_in ? `Checked in · ${new Date(person.checked_in_at).toLocaleString("en", { dateStyle: "short", timeStyle: "short", timeZone: "Asia/Dhaka" })}` : "Not checked in"}</span></li>)}</ul></div> : <section className="mt-4 rounded-2xl border border-dashed border-[#deded9] bg-white px-5 py-9 text-center"><UsersRound size={22} className="mx-auto text-[#762c3a]"/><h2 className="mt-3 text-sm font-semibold text-[#202a35]">{registeredCount ? "No attendees in this filter" : "No one has registered yet"}</h2><p className="mt-2 text-xs text-[#73808a]">{registeredCount ? "Choose another filter to see more registrations." : "Student RSVPs will appear here."}</p></section>}
        </main>
    );
}