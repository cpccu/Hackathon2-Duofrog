"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
    ArrowUpRight,
    Bell,
    BookOpen,
    CalendarDays,
    CheckCircle2,
    ChevronRight,
    CircleHelp,
    FileText,
    GraduationCap,
    LifeBuoy,
    MapPin,
    Search,
    UsersRound,
} from "lucide-react";

const quickLinks = [
    { title: "Resource Hub", detail: "Course notes and learning materials", icon: BookOpen, href: "#resources", source: "resources" },
    { title: "Events", detail: "What's happening around campus", icon: CalendarDays, href: "/events", source: "events" },
    { title: "My Events", detail: "Your event registrations", icon: CheckCircle2, href: "/my-events", source: "events" },
    { title: "Club directory", detail: "Explore City University clubs", icon: UsersRound, href: "/clubs", source: "events" },
    { title: "Campus Helpdesk", detail: "University information and transport guidance", icon: CircleHelp, href: "/helpdesk", source: "helpdesk" },
    { title: "Lost & Found", detail: "Post or find campus items", icon: Search, href: "/lost-found", source: "student-service" },
    { title: "Complaint Box", detail: "Submit and privately track a complaint", icon: LifeBuoy, href: "/complaints", source: "student-service" },
    { title: "Search campus", detail: "Search across connected campus information", icon: Search, href: "/search", source: "search" },
];

function fullName(profile) {
    return profile.full_name || "Student";
}

function getValue(record, ...keys) {
    for (const key of keys) {
        if (record?.[key] !== undefined && record[key] !== null && record[key] !== "") return record[key];
    }
    return "";
}

function readableDate(value, options = { month: "short", day: "numeric", year: "numeric" }) {
    if (!value) return "Date to be announced";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return new Intl.DateTimeFormat("en", { ...options, timeZone: "Asia/Dhaka" }).format(date);
}

function ModuleState({ module, title, icon: Icon, emptyMessage }) {
    if (module.status === "not-connected") {
        return (
            <div className="flex min-h-36 items-start gap-4 rounded-2xl border border-dashed border-[#deded9] bg-white p-5">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#f9eff0] text-[#c8102e]"><Icon size={19} aria-hidden="true" /></span>
                <div>
                    <h3 className="text-sm font-semibold">{title} isn&apos;t connected yet</h3>
                    <p className="mt-2 max-w-lg text-xs leading-relaxed text-[#5e6a74]">This section will show campus updates when its City University data source is available.</p>
                    <span className="mt-3 inline-flex rounded-full bg-[#f3f1ed] px-2.5 py-1 text-[11px] font-medium text-[#5e6a74]">Data source not connected</span>
                </div>
            </div>
        );
    }

    if (module.status === "error") {
        return (
            <div role="alert" className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
                <h3 className="text-sm font-semibold text-amber-950">{title} couldn&apos;t load</h3>
                <p className="mt-2 text-xs leading-relaxed text-amber-900">The campus data source is temporarily unavailable. Reload the dashboard to try again.</p>
                <a href="/dashboard" className="mt-3 inline-flex text-xs font-semibold text-[#c8102e] underline underline-offset-4">Reload dashboard</a>
            </div>
        );
    }

    if (!module.items.length) {
        return (
            <div className="flex min-h-36 items-start gap-4 rounded-2xl border border-dashed border-[#deded9] bg-white p-5">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#f9eff0] text-[#c8102e]"><Icon size={19} aria-hidden="true" /></span>
                <div><h3 className="text-sm font-semibold">Nothing posted yet</h3><p className="mt-2 max-w-lg text-xs leading-relaxed text-[#5e6a74]">{emptyMessage}</p></div>
            </div>
        );
    }

    return null;
}

function SearchInput({ value, onChange, className = "" }) {
    return (
        <label className={`flex min-h-11 items-center gap-2.5 rounded-xl border border-[#e5e3de] bg-white px-3.5 text-[#5e6a74] focus-within:border-[#a54756] focus-within:ring-2 focus-within:ring-[#c8102e]/10 ${className}`}>
            <Search size={17} aria-hidden="true" />
            <span className="sr-only">Search campus events, resources, and notices</span>
            <input
                id="global-search"
                name="q"
                type="search"
                value={value}
                onChange={(event) => onChange(event.target.value)}
                placeholder="Search all campus information"
                className="min-w-0 flex-1 bg-transparent text-xs text-[#202a35] outline-none text-[#5e6a74]"
            />

        </label>
    );
}

function SectionHeading({ eyebrow, title, action }) {
    return (
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div><p className="mb-1 text-[11px] font-bold uppercase tracking-[.16em] text-[#5e6a74]">{eyebrow}</p><h2 className="text-base font-semibold tracking-tight text-[#202a35] sm:text-lg">{title}</h2></div>
            {action}
        </div>
    );
}

function EventList({ module, search }) {
    const visibleEvents = module.items.filter((event) => {
        const text = [event.title, event.description, event.location, event.category, event.organizer].join(" ").toLowerCase();
        return text.includes(search.toLowerCase());
    });
    return (
        <>
            {module.status !== "ready" || module.items.length === 0 ? <ModuleState module={module} title="Events" icon={CalendarDays} emptyMessage="There are no upcoming events at the moment. Check back for new campus activities." /> : visibleEvents.length === 0 ? <p className="rounded-2xl border border-dashed border-[#deded9] bg-white p-5 text-sm text-[#5e6a74]">No upcoming events match “{search}”.</p> : (
                <ul className="divide-y divide-[#efeee9] rounded-2xl border border-[#e9e9e5] bg-white px-5">
                    {visibleEvents.map((event) => (
                        <li key={event.id} className="flex gap-4 py-4 first:pt-5 last:pb-5">
                            <div className="grid size-12 shrink-0 content-center justify-items-center rounded-xl bg-[#f8ecee] text-center text-[#c8102e]"><span className="text-[9px] font-bold uppercase">{readableDate(getValue(event, "date", "event_date", "starts_at"), { month: "short" }).split(" ")[0]}</span><span className="text-lg font-semibold leading-5">{readableDate(getValue(event, "date", "event_date", "starts_at"), { day: "numeric" })}</span></div>
                            <div className="min-w-0 flex-1"><div className="flex flex-wrap items-start justify-between gap-2"><h3 className="text-sm font-semibold text-[#26313a]"><Link href={event.id ? `/events/${event.id}` : "/events"} className="hover:text-[#c8102e]">{event.title || "Campus event"}</Link></h3>{getValue(event, "event_type", "category") && <span className="rounded-full bg-[#f4f2ee] px-2.5 py-1 text-[11px] text-[#5e6a74]">{getValue(event, "event_type", "category")}</span>}</div><p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[#5e6a74]">{getValue(event, "short_description", "description") || "Details will be shared by the event organizer."}</p><p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-[#5e6a74]">{getValue(event, "time", "start_time") && <span>{getValue(event, "time", "start_time")}</span>}{getValue(event, "venue", "location") && <span>{getValue(event, "venue", "location")}</span>}<span>{getValue(event, "club_name", "organizer")}</span></p></div>
                        </li>
                    ))}
                </ul>
            )}
        </>
    );
}

function ResourceList({ module, search }) {
    const visibleResources = module.items.filter((resource) => [resource.title, resource.description, resource.course, resource.department, resource.category].join(" ").toLowerCase().includes(search.toLowerCase()));
    return (
        <>
            {module.status !== "ready" || module.items.length === 0 ? <ModuleState module={module} title="Resources" icon={BookOpen} emptyMessage="Newly shared course materials will appear here when available." /> : visibleResources.length === 0 ? <p className="rounded-2xl border border-dashed border-[#deded9] bg-white p-5 text-sm text-[#5e6a74]">No recent resources match “{search}”.</p> : (
                <ul className="space-y-3">
                    {visibleResources.map((resource) => (
                        <li key={resource.id} className="flex items-start gap-3 rounded-2xl border border-[#e9e9e5] bg-white p-4">
                            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#f6f4ef] text-[#7c642f]"><FileText size={18} aria-hidden="true" /></span>
                            <div className="min-w-0 flex-1"><h3 className="text-sm font-semibold text-[#26313a]"><Link href={resource.id ? `/resources/${resource.id}` : "/resources"} className="rounded-sm hover:text-[#c8102e] hover:underline">{resource.title || "Course resource"}</Link></h3><p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[#5e6a74]">{getValue(resource, "description") || [getValue(resource, "course"), getValue(resource, "department")].filter(Boolean).join(" · ") || "Shared learning material"}</p><p className="mt-2 text-[11px] text-[#5e6a74]">{getValue(resource, "category")}{getValue(resource, "created_at", "createdAt") ? ` · Added ${readableDate(getValue(resource, "created_at", "createdAt"), { month: "short", day: "numeric" })}` : ""}</p></div>
                            <ArrowUpRight size={16} className="mt-1 shrink-0 text-[#5e6a74]" aria-hidden="true" />
                        </li>
                    ))}
                </ul>
            )}
        </>
    );
}

function NoticeList({ module, search }) {
    const priority = { urgent: 0, important: 1, normal: 2 };
    const visibleNotices = [...module.items]
        .sort((a, b) => (priority[String(getValue(a, "priority")).toLowerCase()] ?? 3) - (priority[String(getValue(b, "priority")).toLowerCase()] ?? 3))
        .filter((notice) => [notice.title, notice.description, notice.category, notice.priority].join(" ").toLowerCase().includes(search.toLowerCase()));
    return (
        <>
            {module.status !== "ready" || module.items.length === 0 ? <ModuleState module={module} title="Notices" icon={Bell} emptyMessage="Official campus announcements will be listed here when published." /> : visibleNotices.length === 0 ? <p className="rounded-2xl border border-dashed border-[#deded9] bg-white p-5 text-sm text-[#5e6a74]">No notices match “{search}”.</p> : (
                <ul className="space-y-3">
                    {visibleNotices.map((notice) => {
                        const level = String(getValue(notice, "priority") || "normal").toLowerCase();
                        const urgent = level === "urgent";
                        const important = level === "important";
                        return <li key={notice.id} className={`rounded-2xl border bg-white p-4 ${urgent ? "border-red-200" : important ? "border-amber-200" : "border-[#e9e9e5]"}`}><div className="flex flex-wrap items-center justify-between gap-2"><span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide ${urgent ? "text-red-800" : important ? "text-amber-800" : "text-[#5e6a74]"}`}>{urgent || important ? <Bell size={13} aria-hidden="true" /> : <FileText size={13} aria-hidden="true" />}{getValue(notice, "priority") || "Campus notice"}</span><time className="text-[11px] text-[#5e6a74]">{readableDate(getValue(notice, "published_date", "publishedDate", "created_at"), { month: "short", day: "numeric" })}</time></div><h3 className="mt-2 text-sm font-semibold text-[#26313a]"><Link href={notice.id ? `/notices/${notice.id}` : "/notices"} className="rounded-sm hover:text-[#c8102e] hover:underline">{notice.title || "Campus announcement"}</Link></h3><p className="mt-1 text-xs leading-relaxed text-[#5e6a74]">{getValue(notice, "description") || "Open this notice for more information."}</p></li>;
                    })}
                </ul>
            )}
        </>
    );
}

function ServiceCard({ id, title, detail, icon: Icon, sourceStatus = "not-connected", statusLabel }) {
    return <article id={id} className="scroll-mt-24 rounded-2xl border border-[#e9e9e5] bg-white p-4 transition-colors hover:border-[#ded4d2]"><div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-xl bg-[#f6f4ef] text-[#c8102e]"><Icon size={17} aria-hidden="true" /></span><h3 className="text-xs font-semibold text-[#303a43]">{title}</h3></div><p className="mt-3 text-[11px] leading-relaxed text-[#5e6a74]">{detail}</p><span className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-medium text-[#5e6a74]"><span className={`size-1.5 rounded-full ${sourceStatus === "available" ? "bg-emerald-500" : "bg-[#b7b9b4]"}`} />{statusLabel || (sourceStatus === "available" ? "Available" : "Not connected yet")}</span></article>;
}

export function CampusDashboard({ profile, events, resources, notices }) {
    const [search, setSearch] = useState("");
    const greetingName = fullName(profile).trim().split(/\s+/)[0];
    const todayLabel = useMemo(() => new Intl.DateTimeFormat("en", { weekday: "long", month: "long", day: "numeric", timeZone: "Asia/Dhaka" }).format(new Date()), []);
    const moduleCount = [events, resources, notices].filter((module) => module.status === "ready").length;
    return (
        <main id="overview" className="mx-auto max-w-7xl px-4 pb-12 pt-6 sm:px-7 sm:pt-8 xl:px-10">
                    <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div><p className="text-[11px] font-semibold uppercase tracking-[.16em] text-[#a13e4c]">{todayLabel} · City University</p><h1 className="mt-1 text-2xl font-semibold tracking-tight text-[#202a35] sm:text-3xl">Campus Pulse</h1></div><div className="inline-flex items-center gap-2 rounded-full border border-[#e8e6e1] bg-white px-3 py-1.5 text-[11px] text-[#5e6a74]"><span className={`size-1.5 rounded-full ${moduleCount === 3 ? "bg-emerald-500" : "bg-amber-500"}`} />{moduleCount === 3 ? "Campus updates connected" : `${moduleCount} of 3 update sources connected`}</div></div>

                    <section className="relative overflow-hidden rounded-3xl bg-[#c8102e] px-5 py-7 text-white sm:px-9 sm:py-9">
                        <div aria-hidden="true" className="absolute -right-16 -top-24 size-72 rounded-full border border-white/10 sm:size-96" />
                        <div className="relative grid gap-7 lg:grid-cols-[1fr_minmax(260px,360px)] lg:items-end">
                            <div><p className="mb-3 text-[11px] font-bold uppercase tracking-[.18em] text-white">Your City University home</p><h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Good to see you, {greetingName}.</h2><p className="mt-3 max-w-xl text-sm leading-6 text-white">Your daily view of campus events, learning resources, and important updates.</p><a href="#events" className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-4 text-xs font-semibold text-[#c8102e] hover:bg-[#fbf8f6]">See what&apos;s happening <ChevronRight size={16} aria-hidden="true" /></a></div>
                            <div className="rounded-2xl border border-white/15 bg-white/10 p-4"><p className="text-[11px] font-semibold uppercase tracking-[.14em] text-white">Quick campus search</p><form action="/search" className="mt-3 flex gap-2"><SearchInput value={search} onChange={setSearch} className="min-w-0 flex-1 border-white/70" /><button className="rounded-lg bg-white px-3 text-[11px] font-semibold text-[#c8102e]">Search all</button></form><p className="mt-2 text-[11px] leading-relaxed text-white">Search across events, clubs, resources, notices, FAQs, and Lost &amp; Found.</p></div>
                        </div>
                    </section>

                    <section id="events" className="mt-9 scroll-mt-24">
                        <SectionHeading eyebrow="Your day" title="Today's & upcoming events" action={<Link href="/events" className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#c8102e]">View events <ChevronRight size={14} /></Link>} />
                        <EventList module={events} search={search} />
                    </section>

                    <section className="mt-9 grid gap-8 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,.95fr)]">
                        <div id="notices" className="scroll-mt-24"><SectionHeading eyebrow="Stay informed" title="Important & urgent notices" action={<Link href="/notices" className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#c8102e]">All notices <ChevronRight size={14} /></Link>} /><NoticeList module={notices} search={search} /></div>
                        <div id="resources" className="scroll-mt-24"><SectionHeading eyebrow="Keep learning" title="Recently added resources" action={<a href="#resources" className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#c8102e]">Resource Hub <ChevronRight size={14} /></a>} /><ResourceList module={resources} search={search} /></div>
                    </section>

                    <section id="quick-access" className="mt-10 scroll-mt-24">
                        <SectionHeading eyebrow="Your shortcuts" title="Quick Access" />
                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                            {quickLinks.map(({ title, detail, icon: Icon, href, source }) => { const available = source === "search" ? [events, resources, notices].some((module) => module.status === "ready") : ["helpdesk", "student-service"].includes(source) ? true : source ? ({ events, resources }[source]?.status === "ready") : false; return <a key={title} href={href} className="group flex min-h-24 items-start gap-3 rounded-2xl border border-[#e9e9e5] bg-white p-4 transition-colors hover:border-[#e7c4c9] hover:bg-[#fffdfc]"><span className="rounded-xl bg-[#f7f3f0] p-2.5 text-[#c8102e]"><Icon size={18} aria-hidden="true" /></span><span className="min-w-0 flex-1"><span className="flex flex-wrap items-center gap-2"><b className="text-xs text-[#303a43]">{title}</b>{!available && <small className="rounded-full bg-[#f3f1ed] px-2 py-0.5 text-[9px] text-[#5e6a74]">Not connected</small>}</span><small className="mt-1 block text-[11px] leading-relaxed text-[#5e6a74]">{detail}</small></span><ArrowUpRight size={15} className="mt-1 text-[#5e6a74] transition-colors group-hover:text-[#c8102e]" aria-hidden="true" /></a>; })}
                        </div>
                    </section>

                    <section id="campus-services" className="mt-10 scroll-mt-24">
                        <SectionHeading eyebrow="Campus life" title="Support Services" />
                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                            <ServiceCard id="lost-found" title="Lost & Found" detail="Create a post, search items, and mark your post resolved." icon={Search} sourceStatus="available" statusLabel="Student service available" />
                            <ServiceCard id="complaint-box" title="Complaint Box" detail="Submit a complaint privately and track its status." icon={LifeBuoy} sourceStatus="available" statusLabel="Private student support" />
                            <ServiceCard id="campus-info" title="Campus information" detail="City University · Dhaka, Bangladesh. Your profile details are managed by your campus account." icon={MapPin} sourceStatus="available" statusLabel="City University" />
                            <ServiceCard id="student-profile" title="Your student profile" detail={[profile.department, profile.student_id ? `Student ID ${profile.student_id}` : null].filter(Boolean).join(" · ") || "Profile details can be added through your student account."} icon={GraduationCap} sourceStatus="available" statusLabel="Your campus profile" />
                            <ServiceCard id="campus-support" title="Official campus support" detail="Support contact information has not been published in CampusOS yet." icon={CircleHelp} />
                        </div>
                    </section>

                    <footer className="mt-10 flex flex-wrap justify-between gap-2 border-t border-[#e6e4df] pt-5 text-[11px] text-[#5e6a74]"><span>CampusOS · One Campus. Everything You Need.</span><span className="inline-flex items-center gap-1"><MapPin size={12} aria-hidden="true" />City University, Dhaka, Bangladesh</span></footer>
        </main>
    );
}
