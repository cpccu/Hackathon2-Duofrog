"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, LoaderCircle, Save } from "lucide-react";
import { EVENT_TYPES } from "@/lib/events/constants";
import { createClient } from "@/lib/supabase/client";

export function EventEditorForm({ clubs, event = null }) {
    const router = useRouter();
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const [step, setStep] = useState("");

    async function saveEvent(submitEvent) {
        submitEvent.preventDefault();
        setError("");
        const values = new FormData(submitEvent.currentTarget);
        const title = String(values.get("title") || "").trim();
        const shortDescription = String(values.get("short_description") || "").trim();
        const description = String(values.get("description") || "").trim();
        const eventType = String(values.get("event_type") || "");
        const clubId = String(values.get("club_id") || "");
        const venue = String(values.get("venue") || "").trim();
        const eventDate = String(values.get("event_date") || "");
        const startTime = String(values.get("start_time") || "");
        const endTime = String(values.get("end_time") || "");
        const coverImageUrl = String(values.get("cover_image_url") || "").trim();
        const status = String(values.get("status") || "draft");
        const maxValue = String(values.get("max_attendees") || "").trim();
        const maxAttendees = maxValue ? Number(maxValue) : null;

        if (title.length < 3 || title.length > 180) return setError("Title must be between 3 and 180 characters.");
        if (shortDescription.length > 360) return setError("Short description must be 360 characters or fewer.");
        if (!description || description.length > 10000) return setError("Add a full description up to 10,000 characters.");
        if (!EVENT_TYPES.includes(eventType)) return setError("Choose a valid event type.");
        if (!clubs.some((club) => club.id === clubId)) return setError("Choose a club that your account is allowed to manage.");
        if (venue.length < 2 || venue.length > 240) return setError("Venue must be between 2 and 240 characters.");
        if (!/^\d{4}-\d{2}-\d{2}$/.test(eventDate) || !startTime || !endTime || endTime <= startTime) return setError("Choose a date and ensure the end time is after the start time.");
        if (status === "published" && new Date(`${eventDate}T${endTime}:00+06:00`) <= new Date()) return setError("Published events must end in the future.");
        if (status !== "draft" && status !== "published" && status !== "cancelled") return setError("Choose a valid event status.");
        if (maxAttendees !== null && (!Number.isInteger(maxAttendees) || maxAttendees < 1 || maxAttendees > 100000)) return setError("Maximum attendees must be a whole number between 1 and 100,000.");
        if (coverImageUrl) {
            try { if (!["http:", "https:"].includes(new URL(coverImageUrl).protocol)) return setError("Cover image must use an HTTPS or HTTP URL."); }
            catch { return setError("Enter a valid cover image URL."); }
        }

        setBusy(true);
        setStep(event ? "Updating event…" : "Creating event…");
        try {
            const supabase = createClient();
            const { data: authData, error: authError } = await supabase.auth.getUser();
            if (authError || !authData.user) throw new Error("Your session expired. Sign in again and retry.");
            const payload = {
                title,
                short_description: shortDescription,
                description,
                event_type: eventType,
                club_id: clubId,
                venue,
                event_date: eventDate,
                start_time: startTime,
                end_time: endTime,
                cover_image_url: coverImageUrl || null,
                registration_enabled: values.get("registration_enabled") === "on",
                max_attendees: maxAttendees,
                status,
            };
            const result = event
                ? await supabase.from("events").update(payload).eq("id", event.id).select("id").maybeSingle()
                : await supabase.from("events").insert({ ...payload, created_by: authData.user.id }).select("id").single();
            if (result.error) throw result.error;
            if (!result.data?.id) throw new Error("Your account cannot manage this event.");
            router.replace(`/manage/events?success=${event ? "updated" : "created"}`);
            router.refresh();
        } catch (caught) {
            setError(caught instanceof Error ? caught.message : "The event could not be saved.");
        } finally {
            setBusy(false);
            setStep("");
        }
    }

    const defaultDate = event?.event_date || "";
    return (
        <main className="mx-auto max-w-3xl px-4 pb-12 pt-7 sm:px-7 sm:pt-9">
            <Link href="/manage/events" className="inline-flex items-center gap-1.5 text-xs font-medium text-[#697681]"><ArrowLeft size={14} />Event management</Link>
            <div className="mt-5 rounded-3xl border border-[#e9e9e5] bg-white p-5 sm:p-8"><p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#8b6970]">Organizer workspace</p><h1 className="mt-1 text-2xl font-semibold text-[#202a35]">{event ? "Edit event" : "Create event"}</h1><p className="mt-2 text-sm leading-relaxed text-[#697681]">Event changes are checked by Supabase using your club manager or admin permissions.</p>
                {error && <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
                <form onSubmit={saveEvent} className="mt-6 space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2"><label className="text-xs font-medium text-[#37414a]">Event title<input name="title" required minLength={3} maxLength={180} defaultValue={event?.title || ""} className="mt-1.5 min-h-11 w-full rounded-xl border border-[#deded9] px-3.5 text-sm outline-none focus:border-[#762c3a]" /></label><label className="text-xs font-medium text-[#37414a]">Club<select name="club_id" required defaultValue={event?.club_id || ""} className="mt-1.5 min-h-11 w-full rounded-xl border border-[#deded9] bg-white px-3.5 text-sm"><option value="" disabled>Select club</option>{clubs.map((club) => <option key={club.id} value={club.id}>{club.name}</option>)}</select></label></div>
                    <label className="block text-xs font-medium text-[#37414a]">Short description<input name="short_description" maxLength={360} defaultValue={event?.short_description || ""} className="mt-1.5 min-h-11 w-full rounded-xl border border-[#deded9] px-3.5 text-sm outline-none focus:border-[#762c3a]" /></label>
                    <label className="block text-xs font-medium text-[#37414a]">Full description<textarea name="description" required maxLength={10000} rows={6} defaultValue={event?.description || ""} className="mt-1.5 w-full rounded-xl border border-[#deded9] px-3.5 py-3 text-sm leading-relaxed outline-none focus:border-[#762c3a]" /></label>
                    <div className="grid gap-4 sm:grid-cols-2"><label className="text-xs font-medium text-[#37414a]">Event type<select name="event_type" required defaultValue={event?.event_type || ""} className="mt-1.5 min-h-11 w-full rounded-xl border border-[#deded9] bg-white px-3.5 text-sm"><option value="" disabled>Choose type</option>{EVENT_TYPES.map((type) => <option key={type}>{type}</option>)}</select></label><label className="text-xs font-medium text-[#37414a]">Venue<input name="venue" required maxLength={240} defaultValue={event?.venue || ""} className="mt-1.5 min-h-11 w-full rounded-xl border border-[#deded9] px-3.5 text-sm" /></label></div>
                    <div className="grid gap-4 sm:grid-cols-3"><label className="text-xs font-medium text-[#37414a]">Date<input name="event_date" type="date" required defaultValue={defaultDate} className="mt-1.5 min-h-11 w-full rounded-xl border border-[#deded9] bg-white px-3 text-sm" /></label><label className="text-xs font-medium text-[#37414a]">Start time<input name="start_time" type="time" required defaultValue={event?.start_time?.slice(0, 5) || ""} className="mt-1.5 min-h-11 w-full rounded-xl border border-[#deded9] bg-white px-3 text-sm" /></label><label className="text-xs font-medium text-[#37414a]">End time<input name="end_time" type="time" required defaultValue={event?.end_time?.slice(0, 5) || ""} className="mt-1.5 min-h-11 w-full rounded-xl border border-[#deded9] bg-white px-3 text-sm" /></label></div>
                    <div className="grid gap-4 sm:grid-cols-2"><label className="text-xs font-medium text-[#37414a]">Maximum attendees <span className="font-normal text-[#92999e]">(optional)</span><input name="max_attendees" type="number" min="1" max="100000" defaultValue={event?.max_attendees ?? ""} className="mt-1.5 min-h-11 w-full rounded-xl border border-[#deded9] px-3.5 text-sm" /></label><label className="text-xs font-medium text-[#37414a]">Cover image URL <span className="font-normal text-[#92999e]">(optional)</span><input name="cover_image_url" type="url" defaultValue={event?.cover_image_url || ""} placeholder="https://…" className="mt-1.5 min-h-11 w-full rounded-xl border border-[#deded9] px-3.5 text-sm" /></label></div>
                    <div className="grid gap-4 sm:grid-cols-2"><label className="text-xs font-medium text-[#37414a]">Publishing status<select name="status" defaultValue={event?.status || "draft"} className="mt-1.5 min-h-11 w-full rounded-xl border border-[#deded9] bg-white px-3.5 text-sm"><option value="draft">Draft</option><option value="published">Published</option><option value="cancelled">Cancelled</option></select></label><label className="flex items-center gap-3 rounded-xl border border-[#e9e9e5] px-3.5 py-3 text-xs text-[#37414a]"><input name="registration_enabled" type="checkbox" defaultChecked={event ? event.registration_enabled : true} className="size-4 accent-[#762c3a]" />Allow student registration</label></div>
                    <button type="submit" disabled={busy || clubs.length === 0} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#762c3a] px-4 text-sm font-semibold text-white disabled:cursor-wait disabled:opacity-60">{busy ? <><LoaderCircle size={16} className="animate-spin" />{step}</> : <><Save size={16} />{event ? "Save changes" : "Create event"}</>}</button>
                </form>
            </div>
        </main>
    );
}
