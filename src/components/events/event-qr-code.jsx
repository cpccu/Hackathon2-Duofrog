"use client";

import { useState } from "react";
import { Check, Copy, QrCode } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

export function EventQrCode({ token, eventTitle, checkedIn }) {
    const [copied, setCopied] = useState(false);
    async function copyToken() {
        try {
            await navigator.clipboard.writeText(token);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1800);
        } catch {
            setCopied(false);
        }
    }

    return (
        <section className="mx-auto max-w-md rounded-3xl border border-[#e9e9e5] bg-white p-5 text-center shadow-sm sm:p-7">
            <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-[#fbecef] text-[#c8102e]"><QrCode size={22} aria-hidden="true" /></div>
            <h2 className="mt-4 text-lg font-semibold text-[#202a35]">Your event QR</h2>
            <p className="mt-1 text-xs leading-relaxed text-[#697681]">Show this code to an authorized event organizer at check-in.</p>
            <div className="mx-auto mt-5 grid w-fit place-items-center rounded-2xl border border-[#efeee9] bg-white p-3"><QRCodeSVG value={token} size={240} level="M" marginSize={2} title={`Check-in QR for ${eventTitle}`} /></div>
            <p className={`mt-5 rounded-xl px-3 py-2.5 text-xs font-semibold ${checkedIn ? "bg-emerald-50 text-emerald-900" : "bg-[#f5f3ef] text-[#65717a]"}`} role="status">{checkedIn ? "Checked in" : "Not checked in"}</p>
            {!checkedIn && <button type="button" onClick={copyToken} className="mt-3 inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[#ecd0d4] px-4 text-xs font-semibold text-[#c8102e]">{copied ? <Check size={15} /> : <Copy size={15} />}{copied ? "Token copied" : "Copy QR token"}</button>}
            <p className="mt-3 text-[10px] leading-relaxed text-[#92999e]">This private registration code contains no profile details. Keep it within your event check-in.</p>
        </section>
    );
}