"use client";

export default function ClubsError({ reset }) {
    return <main className="mx-auto max-w-3xl px-4 py-12 sm:px-7"><section role="alert" className="rounded-2xl border border-amber-200 bg-amber-50 p-6"><h1 className="font-semibold text-amber-950">The club directory is temporarily unavailable</h1><p className="mt-2 text-sm leading-6 text-amber-900">We could not load the City University clubs. Try again in a moment.</p><button type="button" onClick={() => reset()} className="mt-4 min-h-10 rounded-lg bg-[#762c3a] px-4 text-xs font-semibold text-white">Try again</button></section></main>;
}