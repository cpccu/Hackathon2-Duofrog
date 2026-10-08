import Link from "next/link";
import { ArrowDownToLine, ArrowLeft, ArrowUpRight, BookOpen, CalendarDays, GraduationCap, MapPin, UserRound } from "lucide-react";
import { getResourceById } from "@/lib/resources/data";

function dateLabel(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Date unavailable";
    return new Intl.DateTimeFormat("en", { dateStyle: "long", timeZone: "Asia/Dhaka" }).format(date);
}

export default async function ResourceDetailsPage({ params, searchParams }) {
    const { id } = await params;
    const query = await searchParams;
    const { resource, error } = await getResourceById(id);

    if (error) {
        return <main className="mx-auto max-w-3xl px-4 py-12 sm:px-7"><div role="alert" className="rounded-2xl border border-amber-200 bg-amber-50 p-6"><h1 className="font-semibold text-amber-950">Resource details are unavailable</h1><p className="mt-2 text-sm leading-relaxed text-amber-900">The resource database migration may not be applied, or the connection may be temporarily unavailable.</p><Link href="/resources" className="mt-4 inline-flex text-sm font-semibold text-[#c8102e] underline underline-offset-4">Return to Resource Hub</Link></div></main>;
    }
    if (!resource) return <main className="mx-auto max-w-3xl px-4 py-12 sm:px-7"><div className="rounded-2xl border border-[#e9e9e5] bg-white p-6"><h1 className="font-semibold text-[#202a35]">Resource not found</h1><p className="mt-2 text-sm text-[#697681]">It may have been removed or is no longer available.</p><Link href="/resources" className="mt-4 inline-flex text-sm font-semibold text-[#c8102e] underline underline-offset-4">Return to Resource Hub</Link></div></main>;

    const fileUrl = `/api/resources/${resource.id}/file`;
    return (
        <main className="mx-auto max-w-4xl px-4 pb-12 pt-7 sm:px-7 sm:pt-9">
            <Link href="/resources" className="inline-flex items-center gap-1.5 text-xs font-medium text-[#697681] hover:text-[#c8102e]"><ArrowLeft size={15} />Back to Resource Hub</Link>
            {query?.created === "1" && <p role="status" className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">Resource uploaded and published successfully.</p>}
            {query?.fileError === "1" && <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">The file could not be opened. It may have been removed from storage.</p>}
            <article className="mt-5 overflow-hidden rounded-3xl border border-[#e9e9e5] bg-white">
                <div className="border-b border-[#efeee9] bg-[#fbfaf8] p-5 sm:p-8"><div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-[#f9e6e9] px-3 py-1 text-[10px] font-semibold text-[#c8102e]">{resource.category}</span><span className="text-[10px] text-[#92999e]">Shared {dateLabel(resource.created_at)}</span></div><h1 className="mt-4 max-w-3xl text-2xl font-semibold tracking-tight text-[#202a35] sm:text-3xl">{resource.title}</h1>{resource.description && <p className="mt-3 max-w-3xl whitespace-pre-wrap text-sm leading-7 text-[#66727c]">{resource.description}</p>}<div className="mt-6 flex flex-wrap gap-2"><a href={fileUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#c8102e] px-4 text-xs font-semibold text-white hover:bg-[#a50e26]">Open resource<ArrowUpRight size={15} /></a><a href={`${fileUrl}?download=1`} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#deded9] px-4 text-xs font-semibold text-[#4d5861] hover:bg-[#f8f7f4]">Download file<ArrowDownToLine size={15} /></a></div></div>
                <dl className="grid gap-px bg-[#efeee9] sm:grid-cols-2"><div className="bg-white p-5"><dt className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wide text-[#92999e]"><BookOpen size={14} />Course</dt><dd className="mt-2 text-sm font-medium text-[#37414a]">{resource.course}</dd></div><div className="bg-white p-5"><dt className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wide text-[#92999e]"><GraduationCap size={14} />Department</dt><dd className="mt-2 text-sm font-medium text-[#37414a]">{resource.department}</dd></div><div className="bg-white p-5"><dt className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wide text-[#92999e]"><UserRound size={14} />Uploaded by</dt><dd className="mt-2 text-sm font-medium text-[#37414a]">{resource.uploader_name}</dd></div><div className="bg-white p-5"><dt className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wide text-[#92999e]"><CalendarDays size={14} />Upload date</dt><dd className="mt-2 text-sm font-medium text-[#37414a]">{dateLabel(resource.created_at)}</dd></div></dl>
            </article>
            <p className="mt-4 flex items-center gap-2 text-[10px] leading-relaxed text-[#8a9297]"><MapPin size={13} />Files are stored privately and shared with authenticated CampusOS members.</p>
        </main>
    );
}