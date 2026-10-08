"use client";

export default function DashboardError({ reset }) {
    return (
        <main className="mx-auto grid min-h-[60vh] max-w-xl place-items-center px-6 py-12">
            <section role="alert" className="w-full rounded-2xl border border-red-200 bg-white p-6">
                <h1 className="text-lg font-semibold text-[#202a35]">Campus Pulse is unavailable</h1>
                <p className="mt-2 text-sm leading-6 text-[#5e6a74]">We couldn&apos;t load your dashboard right now. Try again in a moment.</p>
                <button type="button" onClick={() => reset()} className="mt-5 rounded-lg bg-[#c8102e] px-4 py-2.5 text-sm font-semibold text-white">Try again</button>
            </section>
        </main>
    );
}
