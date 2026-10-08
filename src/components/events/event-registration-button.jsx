"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarCheck2, LoaderCircle, UserRoundX } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const registrationMessages = {
    already_registered: "You are already registered for this event.",
    event_not_found: "This event is no longer available.",
    registration_closed: "Registration is closed for this event.",
    registration_disabled: "This event is not accepting registrations.",
    event_expired: "This event has already ended.",
    event_full: "This event has reached its attendee limit.",
    event_started: "Registration changes are closed because this event has started.",
    not_registered: "There is no active registration to cancel.",
    not_authenticated: "Your session has expired. Sign in and try again.",
};

export function EventRegistrationButton({ eventId, status, canRegister, canCancel }) {
    const router = useRouter();
    const [busy, setBusy] = useState(false);
    const [notice, setNotice] = useState("");
    const [error, setError] = useState("");
    const isRegistered = status === "registered" || status === "checked_in";

    async function submit(action) {
        setBusy(true);
        setNotice("");
        setError("");
        try {
            const supabase = createClient();
            const { data, error: requestError } = await supabase.rpc(action === "register" ? "register_for_event" : "cancel_event_registration", { target_event: eventId });
            if (requestError) throw requestError;
            const outcome = Array.isArray(data) ? data[0]?.outcome : data;
            if (outcome === "registered") setNotice("You are registered. The event has been added to My Events.");
            else if (outcome === "cancelled") setNotice("Your registration was cancelled.");
            else setError(registrationMessages[outcome] || "We could not update your event registration. Try again.");
            if (outcome === "registered" || outcome === "cancelled" || outcome === "already_registered") router.refresh();
        } catch (caught) {
            setError(caught instanceof Error ? caught.message : "We could not update your registration. Please try again.");
        } finally {
            setBusy(false);
        }
    }

    return (
        <div className="space-y-3">
            {notice && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-900">{notice}</p>}
            {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800">{error}</p>}
            {isRegistered ? <><p className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3.5 py-3 text-xs font-medium text-emerald-900"><CalendarCheck2 size={16} />{status === "checked_in" ? "Attendance recorded - checked in." : "You are registered for this event."}</p>{canCancel && <button type="button" onClick={() => submit("cancel")} disabled={busy} className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-[#ecd0d4] px-4 text-xs font-semibold text-[#c8102e] hover:bg-[#faf6f6] disabled:cursor-wait disabled:opacity-60">{busy ? <LoaderCircle size={15} className="animate-spin" /> : <UserRoundX size={15} />}{busy ? "Cancelling…" : "Cancel registration"}</button>}</> : canRegister ? <button type="button" onClick={() => submit("register")} disabled={busy} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#c8102e] px-4 text-sm font-semibold text-white hover:bg-[#a50e26] disabled:cursor-wait disabled:opacity-60">{busy ? <><LoaderCircle size={16} className="animate-spin" />Saving registration…</> : <><CalendarCheck2 size={16} />Register for this event</>}</button> : <p className="rounded-xl bg-[#f5f3ef] px-3.5 py-3 text-xs leading-relaxed text-[#65717a]">{!canCancel && isRegistered ? (status === "checked_in" ? "Your attendance has been recorded." : "This event has started, so registration changes are closed.") : "Registration is not available for this event."}</p>}
        </div>
    );
}
