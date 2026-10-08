"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowDown, ArrowUpRight, BookOpen, ChevronLeft, ChevronRight, FileText, Search, UploadCloud } from "lucide-react";
import { RESOURCE_CATEGORIES } from "@/lib/resources/constants";

function dateLabel(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Date unavailable";
    return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric", timeZone: "Asia/Dhaka" }).format(date);
}

function ResourceCard({ resource }) {
    return (
        <article className="flex min-h-full flex-col rounded-2xl border border-[#e9e9e5] bg-white p-5 transition-colors hover:border-[#e7c4c9]">
            <div className="flex items-start justify-between gap-3"><span className="grid size-10 place-items-center rounded-xl bg-[#f7f3f0] text-[#c8102e]"><FileText size={19} aria-hidden="true" /></span><span className="rounded-full bg-[#f4f2ee] px-2.5 py-1 text-[10px] font-medium text-[#697681]">{resource.category}</span></div>
            <h2 className="mt-4 text-sm font-semibold leading-5 text-[#202a35]">{resource.title}</h2>
            <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-[#74808a]">{resource.description || "No additional description."}</p>
            <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2 border-t border-[#efeee9] pt-4 text-[10px]">
                <div><dt className="text-[#92999e]">Course</dt><dd className="mt-0.5 truncate font-medium text-[#49545d]">{resource.course}</dd></div>
                <div><dt className="text-[#92999e]">Department</dt><dd className="mt-0.5 truncate font-medium text-[#49545d]">{resource.department}</dd></div>
                <div><dt className="text-[#92999e]">Shared by</dt><dd className="mt-0.5 truncate font-medium text-[#49545d]">{resource.uploader_name}</dd></div>
                <div><dt className="text-[#92999e]">Added</dt><dd className="mt-0.5 font-medium text-[#49545d]">{dateLabel(resource.created_at)}</dd></div>
            </dl>
            <Link href={`/resources/${resource.id}`} className="mt-5 inline-flex min-h-10 items-center justify-between rounded-xl border border-[#e7e4df] px-3.5 text-xs font-semibold text-[#c8102e] hover:bg-[#faf8f5]">View resource <ArrowUpRight size={15} aria-hidden="true" /></Link>
        </article>
    );
}

function Pagination({ page, pageSize, totalCount, search, department, course, category }) {
    const pages = Math.max(1, Math.ceil(totalCount / pageSize));
    if (pages < 2) return null;
    function href(nextPage) {
        const params = new URLSearchParams();
        if (search) params.set("q", search);
        if (department) params.set("department", department);
        if (course) params.set("course", course);
        if (category) params.set("category", category);
        params.set("page", String(nextPage));
        return `/resources?${params.toString()}`;
    }
    return <nav aria-label="Resource pages" className="mt-7 flex items-center justify-between rounded-xl border border-[#e9e9e5] bg-white px-4 py-3"><span className="text-xs text-[#697681]">Page {page} of {pages}</span><div className="flex gap-2">{page > 1 && <Link href={href(page - 1)} className="inline-flex min-h-9 items-center gap-1 rounded-lg border px-3 text-xs text-[#4d5861]"><ChevronLeft size={14} />Previous</Link>}{page < pages && <Link href={href(page + 1)} className="inline-flex min-h-9 items-center gap-1 rounded-lg border px-3 text-xs font-medium text-[#c8102e]">Next<ChevronRight size={14} /></Link>}</div></nav>;
}

export function ResourceHub({ resources, totalCount, search, department, course, category, page, pageSize, options, isAdmin, queryError, optionsError, created, seeded }) {
    const [copied, setCopied] = useState(false);
    const [query, setQuery] = useState(search);
    const activeFilters = [search, department, course, category].filter(Boolean).length;

    async function copyCurrentSearch() {
        try {
            await navigator.clipboard.writeText(window.location.href);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1800);
        } catch {
            setCopied(false);
        }
    }

    return (
        <main className="mx-auto max-w-7xl px-4 pb-12 pt-7 sm:px-7 sm:pt-9 xl:px-10">
            <div className="mb-7 flex flex-wrap items-end justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#a13e4c]">Learning at City University</p><h1 className="mt-1 text-3xl font-semibold tracking-tight text-[#202a35]">Resource Hub</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-[#697681]">Find course notes, question papers, and study materials shared with the campus community.</p></div>{isAdmin && <Link href="/resources/upload" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#c8102e] px-4 text-xs font-semibold text-white hover:bg-[#a50e26]"><UploadCloud size={16} aria-hidden="true" />Upload resource</Link>}</div>

            {created && <p role="status" className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">Resource uploaded and published successfully.</p>}
            {seeded && <p role="status" className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">Original demo files were uploaded to secure storage and published.</p>}
            {queryError && <div role="alert" className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">{queryError}</div>}
            {optionsError && <p role="status" className="mb-4 text-xs text-amber-800">{optionsError} Existing search and category filters remain available.</p>}

            <form action="/resources" method="get" className="rounded-2xl border border-[#e9e9e5] bg-white p-4 sm:p-5">
                <div className="flex flex-col gap-2 sm:flex-row"><label className="flex min-h-12 min-w-0 flex-1 items-center gap-3 rounded-xl border border-[#e2e0da] px-3.5 focus-within:border-[#a54756] focus-within:ring-2 focus-within:ring-[#c8102e]/10"><Search size={17} className="shrink-0 text-[#8a9297]" aria-hidden="true" /><span className="sr-only">Search title, description, or course</span><input name="q" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search title, description, or course" maxLength={120} className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#92999e]" /></label><button type="submit" className="min-h-11 shrink-0 rounded-xl bg-[#c8102e] px-5 text-xs font-semibold text-white transition-colors hover:bg-[#a50e26]">Search resources</button></div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto_auto]">
                    <label className="text-[10px] font-semibold uppercase tracking-wide text-[#858d92]">Department<select name="department" defaultValue={department} className="mt-1.5 min-h-10 w-full rounded-lg border border-[#e5e3de] bg-white px-3 text-xs font-normal normal-case tracking-normal text-[#37414a]"><option value="">All departments</option>{options.departments.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
                    <label className="text-[10px] font-semibold uppercase tracking-wide text-[#858d92]">Course<select name="course" defaultValue={course} className="mt-1.5 min-h-10 w-full rounded-lg border border-[#e5e3de] bg-white px-3 text-xs font-normal normal-case tracking-normal text-[#37414a]"><option value="">All courses</option>{options.courses.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
                    <label className="text-[10px] font-semibold uppercase tracking-wide text-[#858d92]">Category<select name="category" defaultValue={category} className="mt-1.5 min-h-10 w-full rounded-lg border border-[#e5e3de] bg-white px-3 text-xs font-normal normal-case tracking-normal text-[#37414a]"><option value="">All categories</option>{RESOURCE_CATEGORIES.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
                    <button type="submit" className="mt-auto min-h-10 rounded-lg border border-[#e5e3de] px-4 text-xs font-medium text-[#4d5861] hover:bg-[#f8f7f4]">Apply filters</button>
                    {activeFilters > 0 && <Link href="/resources" className="mt-auto inline-flex min-h-10 items-center justify-center gap-1 rounded-lg px-3 text-xs text-[#c8102e]"><ArrowDown className="rotate-90" size={14} />Clear</Link>}
                </div>
            </form>

            <div className="mt-7 flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-base font-semibold text-[#202a35]">Available resources</h2><p className="mt-1 text-xs text-[#7b858d]">{totalCount} {totalCount === 1 ? "resource" : "resources"}{activeFilters ? " matching your filters" : " in the hub"}</p></div><button type="button" onClick={copyCurrentSearch} className="rounded-lg px-3 py-2 text-xs font-medium text-[#c8102e] hover:bg-white">{copied ? "Link copied" : "Copy filtered link"}</button></div>

            {resources.length ? <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{resources.map((resource) => <ResourceCard key={resource.id} resource={resource} />)}</div> : queryError ? null : (
                <section className="mt-4 rounded-2xl border border-dashed border-[#deded9] bg-white px-5 py-10 text-center">
                    <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-[#f6f2ee] text-[#c8102e]"><BookOpen size={21} aria-hidden="true" /></span>
                    <h2 className="mt-4 text-base font-semibold text-[#202a35]">{activeFilters ? "No matching resources" : "The Resource Hub is ready for its first resources"}</h2>
                    <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[#73808a]">{activeFilters ? "Try a different keyword or clear one of the filters." : isAdmin ? "Upload course materials or add original sample study files for the hackathon demo." : "Campus resources will appear here once an administrator shares them."}</p>
                    {activeFilters && <Link href="/resources" className="mt-4 inline-flex text-xs font-semibold text-[#c8102e] underline underline-offset-4">Clear search and filters</Link>}
                    {!activeFilters && isAdmin && <Link href="/resources/upload?demo=1" className="mt-4 inline-flex min-h-10 items-center rounded-lg border border-[#e5e1da] px-4 text-xs font-semibold text-[#c8102e] hover:bg-[#faf8f5]">Add original demo study files</Link>}
                </section>
            )}
            <Pagination page={page} pageSize={pageSize} totalCount={totalCount} search={search} department={department} course={course} category={category} />
        </main>
    );
}
