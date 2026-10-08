"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Bell, BookOpen, CalendarDays, Check, Clock3, MapPin, Sparkles } from "lucide-react";

const emptyItems = [];

function clockMinutes(value) {
    const [hours = 0, minutes = 0] = String(value ?? "").split(":").map(Number);
    return hours * 60 + minutes;
}

function displayTime(value) {
    if (!value) return "Time to be announced";
    const [hours, minutes] = String(value).split(":").map(Number);
    return new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit", timeZone: "UTC" })
        .format(new Date(Date.UTC(2020, 0, 1, hours || 0, minutes || 0)));
}

function displayDay(value) {
    return new Intl.DateTimeFormat("en", { weekday: "long", month: "long", day: "numeric", timeZone: "UTC" })
        .format(new Date(`${value}T00:00:00Z`));
}

function eventDate(event) {
    return event.event_date ?? event.date ?? "";
}

function resourceRecommendations(resources, profile, events) {
    const terms = [profile?.department, ...events.flatMap((event) => [event.title, event.event_type])]
        .filter(Boolean)
        .join(" ").toLowerCase().split(/[^a-z0-9]+/).filter((term) => term.length > 3);

    return [...resources].map((resource) => {
        const department = String(resource.department ?? "").toLowerCase();
        const course = String(resource.course ?? "").toLowerCase();
        const text = [resource.title, resource.description, resource.category].join(" ").toLowerCase();
        const score = (profile?.department && department.includes(profile.department.toLowerCase()) ? 10 : 0)
            + terms.reduce((total, term) => total + (course.includes(term) ? 4 : text.includes(term) ? 1 : 0), 0);
        return { ...resource, relevance: score };
    }).sort((a, b) => b.relevance - a.relevance || String(b.created_at).localeCompare(String(a.created_at))).slice(0, 2);
}

function ScheduleEvent({ event, registered }) {
    return (
        <div className="flex gap-3 py-3 first:pt-0 last:pb-0">
            <div className="w-16 shrink-0 pt-0.5 text-xs font-semibold text-[#303a43]">{displayTime(event.start_time)}</div>
            <div className="min-w-0 flex-1 border-l-2 border-[#e9d3d6] pl-3">
                <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/events/${event.id}`} className="text-sm font-semibold text-[#26313a] hover:text-[#c8102e] hover:underline">{event.title}</Link>
                    {registered && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-800"><Check size={11} aria-hidden="true" /> RSVP&apos;d</span>}
                </div>
                <p className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-[#5e6a74]">
                    <span className="inline-flex items-center gap-1"><Clock3 size={12} aria-hidden="true" />Ends {displayTime(event.end_time)}</span>
                    {event.venue && <span className="inline-flex items-center gap-1"><MapPin size={12} aria-hidden="true" />{event.venue}</span>}
                    {event.club_name && <span>{event.club_name}</span>}
                </p>
            </div>
        </div>
    );
}

export function CampusDayBrief({ events, resources, notices, profile, today }) {
    const eventItems = events?.status === "ready" ? events.items : emptyItems;
    const dates = useMemo(() => [...new Set([today, ...eventItems.map(eventDate).filter(Boolean)])].sort(), [eventItems, today]);
    const firstRegisteredDate = eventItems.find((event) => ["registered", "checked_in"].includes(event.registration_status));
    const [selectedDate, setSelectedDate] = useState(() => firstRegisteredDate ? eventDate(firstRegisteredDate) : today);
    const dayEvents = eventItems.filter((event) => eventDate(event) === selectedDate);
    const mySchedule = dayEvents.filter((event) => ["registered", "checked_in"].includes(event.registration_status));
    const timeline = mySchedule.length ? mySchedule : dayEvents;
    const recommendations = useMemo(() => resourceRecommendations(resources?.items ?? [], profile, mySchedule), [resources, profile, mySchedule]);
    const priority = { urgent: 0, important: 1, normal: 2 };
    const featuredNotice = [...(notices?.items ?? [])].sort((a, b) => (priority[String(a.priority).toLowerCase()] ?? 3) - (priority[String(b.priority).toLowerCase()] ?? 3))[0];
    const conflictIndexes = new Set();
    for (let i = 1; i < mySchedule.length; i += 1) {
        if (clockMinutes(mySchedule[i].start_time) < clockMinutes(mySchedule[i - 1].end_time)) {
            conflictIndexes.add(i - 1);
            conflictIndexes.add(i);
        }
    }

    return (
        <section aria-labelledby="campus-day-title" className="mt-8 overflow-hidden rounded-3xl border border-[#e7e3dc] bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#eeeae4] bg-[#fbfaf7] px-5 py-5 sm:px-7">
                <div className="flex items-start gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#f8ecee] text-[#c8102e]"><Sparkles size={19} aria-hidden="true" /></span>
                    <div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#a13e4c]">A campus-aware daily brief</p><h2 id="campus-day-title" className="mt-1 text-lg font-semibold tracking-tight text-[#202a35]">Your Campus Day</h2><p className="mt-1 max-w-xl text-xs leading-relaxed text-[#5e6a74]">Your RSVPs, official updates, and study materials brought together for one day.</p></div>
                </div>
                <label className="flex min-h-10 items-center gap-2 rounded-xl border border-[#deded9] bg-white px-3 text-xs font-medium text-[#303a43]">
                    <CalendarDays size={15} aria-hidden="true" /><span className="sr-only">Choose a day for your campus brief</span>
                    <select value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} className="max-w-52 bg-transparent py-2 outline-none focus-visible:ring-2 focus-visible:ring-[#c8102e]">
                        {dates.map((date) => <option key={date} value={date}>{date === today ? `Today · ${displayDay(date)}` : displayDay(date)}</option>)}
                    </select>
                </label>
            </div>

            <div className="grid divide-y divide-[#eeeae4] lg:grid-cols-[1.15fr_.85fr] lg:divide-x lg:divide-y-0">
                <div className="p-5 sm:p-7">
                    <div className="mb-4 flex items-center justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#5e6a74]">{mySchedule.length ? "Your confirmed plans" : "On campus this day"}</p><p className="mt-1 text-sm font-semibold text-[#26313a]">{mySchedule.length ? `${mySchedule.length} event${mySchedule.length === 1 ? "" : "s"} on your schedule` : `${dayEvents.length} event${dayEvents.length === 1 ? "" : "s"} to explore`}</p></div><Link href="/my-events" className="inline-flex items-center gap-1 text-xs font-semibold text-[#c8102e] hover:underline">My events <ArrowUpRight size={13} aria-hidden="true" /></Link></div>
                    {events?.status === "error" ? <p role="alert" className="rounded-xl bg-amber-50 p-4 text-xs text-amber-900">Your event plans could not load right now. Try refreshing the dashboard.</p> : timeline.length ? <>
                        <ol className="divide-y divide-[#f0eee9]">{timeline.map((event, index) => <li key={event.id}><ScheduleEvent event={event} registered={Boolean(mySchedule.length)} />{mySchedule.length && conflictIndexes.has(index) && <p role="status" className="mb-2 ml-[4.75rem] rounded-lg bg-amber-50 px-3 py-2 text-[11px] leading-relaxed text-amber-900">Time overlap: check these event times before heading out.</p>}</li>)}</ol>
                        {!mySchedule.length && <p className="mt-3 rounded-xl bg-[#fbfaf7] p-3 text-xs leading-relaxed text-[#5e6a74]">These events are open to explore. RSVP on an event page to add it to your confirmed plans.</p>}
                    </> : <div className="rounded-2xl border border-dashed border-[#deded9] bg-[#fbfaf7] p-5"><p className="text-sm font-semibold text-[#303a43]">A little space in your campus day.</p><p className="mt-1 text-xs leading-relaxed text-[#5e6a74]">No published events are listed for this date. Check the campus feed for new activities.</p><Link href="/events" className="mt-3 inline-flex text-xs font-semibold text-[#c8102e] hover:underline">Browse all events <ArrowUpRight size={13} className="ml-1" aria-hidden="true" /></Link></div>}
                </div>

                <aside aria-label="Campus day preparation" className="space-y-5 p-5 sm:p-7">
                    <div><p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#5e6a74]">Worth a look</p>{featuredNotice ? <Link href={featuredNotice.id ? `/notices/${featuredNotice.id}` : "/notices"} className="mt-2 block rounded-xl border border-[#eeeae4] p-3 hover:border-[#e7c4c9]"><span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase text-[#a13e4c]"><Bell size={12} aria-hidden="true" />{featuredNotice.priority || "Official notice"}</span><span className="mt-1 block text-sm font-semibold text-[#26313a]">{featuredNotice.title}</span><span className="mt-1 line-clamp-2 block text-xs leading-relaxed text-[#5e6a74]">{featuredNotice.description || "Open the notice for its details."}</span></Link> : <p className="mt-2 rounded-xl bg-[#fbfaf7] p-3 text-xs text-[#5e6a74]">No official notices have been published yet. <Link href="/notices" className="font-semibold text-[#c8102e] hover:underline">Check notices</Link></p>}</div>
                    <div><div className="flex items-center justify-between gap-2"><p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#5e6a74]">Study picks{profile?.department ? ` · ${profile.department}` : ""}</p><Link href="/resources" className="text-[11px] font-semibold text-[#c8102e] hover:underline">Resource Hub</Link></div>{recommendations.length ? <ul className="mt-2 space-y-2">{recommendations.map((resource) => <li key={resource.id}><Link href={resource.id ? `/resources/${resource.id}` : "/resources"} className="flex items-start gap-2 rounded-xl border border-[#eeeae4] p-3 hover:border-[#e7c4c9]"><BookOpen size={15} className="mt-0.5 shrink-0 text-[#8a6f35]" aria-hidden="true" /><span className="min-w-0"><span className="block text-xs font-semibold text-[#26313a]">{resource.title}</span><span className="mt-1 block text-[11px] text-[#5e6a74]">{[resource.course, resource.category].filter(Boolean).join(" · ") || "Shared learning material"}</span></span></Link></li>)}</ul> : <p className="mt-2 rounded-xl bg-[#fbfaf7] p-3 text-xs text-[#5e6a74]">Study materials will appear here when they are shared in CampusOS. <Link href="/resources" className="font-semibold text-[#c8102e] hover:underline">Browse resources</Link></p>}</div>
                </aside>
            </div>
            <p className="border-t border-[#eeeae4] px-5 py-3 text-[10px] text-[#68737b] sm:px-7">Built from your live event RSVPs, published campus notices, and shared study materials.</p>
        </section>
    );
}
