import { BookOpen, CalendarDays, FileText, LoaderCircle, MapPin } from "lucide-react";

function PulseLoadingCard() {
    return <div className="animate-pulse rounded-2xl border border-[#e9e9e5] bg-white p-5"><div className="h-3 w-24 rounded bg-[#eceae6]"/><div className="mt-4 h-5 w-2/3 rounded bg-[#eceae6]"/><div className="mt-3 h-3 w-full rounded bg-[#f1efec]"/></div>;
}

export default function DashboardLoading() {
    return (
        <main aria-busy="true" aria-label="Loading your campus dashboard" className="mx-auto max-w-7xl space-y-6 px-5 py-8 sm:px-8">
            <div className="h-8 w-56 animate-pulse rounded bg-[#e9e7e2]" />
            <div className="h-52 animate-pulse rounded-3xl bg-[#762c3a]/80" />
            <div className="grid gap-5 lg:grid-cols-3">
                <PulseLoadingCard />
                <PulseLoadingCard />
                <PulseLoadingCard />
            </div>
            <p className="sr-only"><LoaderCircle />Loading your campus updates</p>
        </main>
    );
}
