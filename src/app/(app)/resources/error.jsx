"use client";

export default function ResourcesError({ reset }) {
    return <main className="mx-auto max-w-3xl px-4 py-12 sm:px-7"><section role="alert" className="rounded-2xl border border-amber-200 bg-amber-50 p-6"><h1 className="font-semibold text-amber-950">Resource Hub is unavailable</h1><p className="mt-2 text-sm leading-relaxed text-amber-900">We couldn&apos;t load the resource library. Check the connection and try again.</p><button type="button" onClick={() => reset()} className="mt-4 rounded-lg bg-[#762c3a] px-4 py-2.5 text-sm font-semibold text-white">Try again</button></section></main>;
}
