"use client";

export default function EventManagementError({ reset }) {
    return <main className="mx-auto max-w-3xl px-4 py-12 sm:px-7"><section role="alert" className="rounded-2xl border border-amber-200 bg-amber-50 p-6"><h1 className="font-semibold text-amber-950">Event management is unavailable</h1><p className="mt-2 text-sm leading-6 text-amber-900">The event management workspace could not load. Try again in a moment.</p><button type="button" onClick={() => reset()} className="mt-4 min-h-10 rounded-lg bg-[#c8102e] px-4 text-xs font-semibold text-white">Try again</button></section></main>;
}