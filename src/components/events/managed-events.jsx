"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CalendarDays, LoaderCircle, Pencil, Plus, Trash2, UsersRound } from "lucide-react";
import { eventDateLabel, timeLabel } from "@/lib/events/constants";
import { createClient } from "@/lib/supabase/client";

export function ManagedEvents({ events, error, success }) {
    const router = useRouter();
    const [deleting, setDeleting] = useState("");
    const [notice, setNotice] = useState("");
    const [failure, setFailure] = useState("");

    async function deleteEvent(event) {
        if (!window.confirm(`Delete “${event.title}”? This also removes its registrations and cannot be undone.`)) return;
        setDeleting(event.id);
        setFailure("");
        setNotice("");
        const { error: deleteError } = await createClient().from("events").delete().eq("id", event.id);
        if (deleteError) setFailure(deleteError.message || "The event could not be deleted.");
        else {
            setNotice("Event deleted. Its registrations were removed.");
            router.refresh();
        }
        setDeleting("");
    }

    return (
        <main className="mx-auto max-w-7xl px-4 pb-12 pt-7 sm:px-7 sm:pt-9 xl:px-10">
            <div className="mb-7 flex flex-wrap items-end justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#8b6970]">Organizer workspace</p><h1 className="mt-1 text-3xl font-semibold tracking-tight text-[#202a35]">Event management</h1><p className="mt-2 text-sm text-[#697681]">Create events for the clubs you manage and follow registrations.</p></div><Link href="/manage/events/new" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#762c3a] px-4 text-xs font-semibold text-white"><Plus size={16} />Create event</Link></div>
            {success && <p role="status" className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">{success === "created" ? "Event created." : "Event updated."}</p>}
            {notice && <p role="status" className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">{notice}</p>}
            {(error || failure) && <p role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{failure || error}</p>}
            {events.length ? <div className="space-y-3">{events.map((event) => <article key={event.id} className="grid gap-4 rounded-2xl border border-[#e9e9e5] bg-white p-5 lg:grid-cols-[minmax(0,1fr)_200px]"><div><div className="flex flex-wrap items-center gap-2"><span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${event.status === "published" ? "bg-emerald-50 text-emerald-800" : event.status === "cancelled" ? "bg-red-50 text-red-800" : "bg-[#f3f1ed] text-[#697681]"}`}>{event.status}</span><span className="text-[10px] text-[#697681]">{event.event_type} · {event.club_name}</span></div><h2 className="mt-2 text-base font-semibold text-[#202a35]">{event.title}</h2><p className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-[#74808a]"><span className="inline-flex items-center gap-1"><CalendarDays size={13} />{eventDateLabel(event.event_date)} · {timeLabel(event.start_time)}–{timeLabel(event.end_time)}</span><span>{event.venue}</span></p></div><div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#efeee9] pt-3 lg:flex-col lg:items-stretch lg:border-0 lg:pt-0"><p className="text-xs text-[#697681]">{event.registration_count} registered{event.max_attendees ? ` / ${event.max_attendees}` : ""}</p><Link href={`/manage/events/${event.id}/attendees`} className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg border border-[#e5e3de] px-3 text-xs font-medium text-[#4d5861]"><UsersRound size={14} />Attendees</Link><Link href={`/manage/events/${event.id}/check-in`} className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg border border-[#e5e3de] px-3 text-xs font-medium text-emerald-800"><UsersRound size={14} />Check in</Link><Link href={`/manage/events/${event.id}/edit`} className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg border border-[#e5e3de] px-3 text-xs font-medium text-[#762c3a]"><Pencil size={14} />Edit</Link><button type="button" onClick={() => deleteEvent(event)} disabled={deleting === event.id} className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50">{deleting === event.id ? <LoaderCircle size={14} className="animate-spin" /> : <Trash2 size={14} />}Delete</button></div></article>)}</div> : !error && <section className="rounded-2xl border border-dashed border-[#deded9] bg-white px-5 py-10 text-center"><CalendarDays className="mx-auto text-[#762c3a]" size={22} /><h2 className="mt-4 text-base font-semibold text-[#202a35]">No events to manage</h2><p className="mx-auto mt-2 max-w-md text-sm text-[#73808a]">Create an event for a club assigned to your account.</p><Link href="/manage/events/new" className="mt-4 inline-flex min-h-10 items-center rounded-lg bg-[#762c3a] px-4 text-xs font-semibold text-white">Create event</Link></section>}
        </main>
    );
}