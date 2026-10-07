"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
    Menu,
    UsersRound,
    Search,
    ShieldCheck,
    Sparkles,
    X,
} from "lucide-react";
import { SignOutButton } from "@/components/auth/sign-out-button";

const navigation = [
    ["Campus Pulse", "#overview", Sparkles],
    ["Events", "/events", CalendarDays],
    ["My Events", "/my-events", CheckCircle2],
    ["Clubs", "/clubs", UsersRound],
    ["Resource Hub", "/resources", BookOpen],
    ["Helpdesk · CampusAI", "/helpdesk", CircleHelp],
    ["Search campus", "/search", Search],
    ["Notices", "/notices", Bell],
    ["Campus services", "#campus-services", LifeBuoy],
];

const quickLinks = [
    { title: "Resource Hub", detail: "Course notes and learning materials", icon: BookOpen, href: "#resources", source: "resources" },
    { title: "Events", detail: "What's happening around campus", icon: CalendarDays, href: "/events", source: "events" },
    { title: "My Events", detail: "Your event registrations", icon: CheckCircle2, href: "/my-events", source: "events" },
    { title: "Club directory", detail: "Explore City University clubs", icon: UsersRound, href: "/clubs", source: "events" },
    { title: "CampusAI · Helpdesk", detail: "University information and transport guidance", icon: Sparkles, href: "/helpdesk", source: "helpdesk" },
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
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#f5f1ef] text-[#762c3a]"><Icon size={19} aria-hidden="true" /></span>
                <div>
                    <h3 className="text-sm font-semibold">{title} isn&apos;t connected yet</h3>
                    <p className="mt-2 max-w-lg text-xs leading-relaxed text-[#7c858d]">This section will show campus updates when its City University data source is available.</p>
                    <span className="mt-3 inline-flex rounded-full bg-[#f3f1ed] px-2.5 py-1 text-[10px] font-medium text-[#747d83]">Data source not connected</span>
                </div>
            </div>
        );
    }

    if (module.status === "error") {
        return (
            <div role="alert" className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
                <h3 className="text-sm font-semibold text-amber-950">{title} couldn&apos;t load</h3>
                <p className="mt-2 text-xs leading-relaxed text-amber-900">The campus data source is temporarily unavailable. Reload the dashboard to try again.</p>
                <a href="/dashboard" className="mt-3 inline-flex text-xs font-semibold text-[#762c3a] underline underline-offset-4">Reload dashboard</a>
            </div>
        );
    }

    if (!module.items.length) {
        return (
            <div className="flex min-h-36 items-start gap-4 rounded-2xl border border-dashed border-[#deded9] bg-white p-5">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#f5f1ef] text-[#762c3a]"><Icon size={19} aria-hidden="true" /></span>
                <div><h3 className="text-sm font-semibold">Nothing posted yet</h3><p className="mt-2 max-w-lg text-xs leading-relaxed text-[#7c858d]">{emptyMessage}</p></div>
            </div>
        );
    }

    return null;
}

function SearchInput({ value, onChange, className = "" }) {
    return (
        <label className={`flex min-h-11 items-center gap-2.5 rounded-xl border border-[#e5e3de] bg-white px-3.5 text-[#78828b] focus-within:border-[#9c6871] focus-within:ring-2 focus-within:ring-[#762c3a]/10 ${className}`}>
            <Search size={17} aria-hidden="true" />
            <span className="sr-only">Search campus events, resources, and notices</span>
            <input
                id="global-search"
                name="q"
                type="search"
                value={value}
                onChange={(event) => onChange(event.target.value)}
                placeholder="Search all campus information"
                className="min-w-0 flex-1 bg-transparent text-xs text-[#202a35] outline-none placeholder:text-[#92999e]"
            />

        </label>
    );
}

function Brand({ compact = false }) {
    return (
        <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-[#762c3a] font-serif text-xl text-white">C</span>
            <span><b className="block text-sm text-[#202a35]">Campus<span className="text-[#762c3a]">OS</span></b>{!compact && <small className="text-[10px] uppercase tracking-widest text-[#78828b]">City University</small>}</span>
        </div>
    );
}

function Sidebar({ mobile = false, close }) {
    const pathname = usePathname();
    return (
        <aside className={mobile ? "absolute inset-y-0 left-0 w-[min(86vw,310px)] overflow-y-auto bg-white p-5 shadow-2xl" : "sticky top-0 hidden h-screen w-64 shrink-0 overflow-y-auto border-r border-[#ebe9e4] bg-white p-5 lg:flex lg:flex-col"}>
            <div className="flex items-center justify-between"><Brand />{mobile && <button type="button" aria-label="Close navigation" onClick={close} className="rounded-lg p-2 text-[#66727c] hover:bg-[#f6f5f2]"><X size={20} /></button>}</div>
            <p className="mb-3 mt-10 px-3 text-[10px] font-bold uppercase tracking-widest text-[#92999e]">Your workspace</p>
            <nav aria-label="Main navigation" className="space-y-1">
                {navigation.map(([label, href, Icon]) => {
                    const active = href.startsWith("#") ? pathname === "/dashboard" : pathname === href || pathname.startsWith(`${href}/`);
                    return <Link key={label} href={href} onClick={close} aria-current={active ? "page" : undefined} className={active ? "flex items-center gap-3 rounded-xl bg-[#f6edef] px-3 py-3 text-sm font-medium text-[#762c3a]" : "flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-[#66727c] transition-colors hover:bg-[#f7f7f5] hover:text-[#303a43]"}>
                        <Icon size={17} aria-hidden="true" />{label}
                    </Link>
                })}
            </nav>
            <div className="mt-auto rounded-2xl bg-[#f7f5f1] p-4">
                <ShieldCheck className="mb-3 size-5 text-[#762c3a]" aria-hidden="true" />
                <b className="text-xs text-[#303a43]">A campus, connected.</b>
                <p className="mt-1 text-[11px] leading-relaxed text-[#79838c]">Your City University updates, together in one place.</p>
                <small className="mt-4 block text-[#92999e]">City University · Dhaka</small>
            </div>
        </aside>
    );
}

function SectionHeading({ eyebrow, title, action }) {
    return (
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div><p className="mb-1 text-[10px] font-bold uppercase tracking-[.16em] text-[#8a9297]">{eyebrow}</p><h2 className="text-lg font-semibold tracking-tight text-[#202a35]">{title}</h2></div>
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
            {module.status !== "ready" || module.items.length === 0 ? <ModuleState module={module} title="Events" icon={CalendarDays} emptyMessage="There are no upcoming events at the moment. Check back for new campus activities." /> : visibleEvents.length === 0 ? <p className="rounded-2xl border border-dashed border-[#deded9] bg-white p-5 text-sm text-[#697681]">No upcoming events match “{search}”.</p> : (
                <ul className="divide-y divide-[#efeee9] rounded-2xl border border-[#e9e9e5] bg-white px-5">
                    {visibleEvents.map((event) => (
                        <li key={event.id} className="flex gap-4 py-4 first:pt-5 last:pb-5">
                            <div className="grid size-12 shrink-0 content-center justify-items-center rounded-xl bg-[#f7f1f1] text-center text-[#762c3a]"><span className="text-[9px] font-bold uppercase">{readableDate(getValue(event, "date", "event_date", "starts_at"), { month: "short" }).split(" ")[0]}</span><span className="text-lg font-semibold leading-5">{readableDate(getValue(event, "date", "event_date", "starts_at"), { day: "numeric" })}</span></div>
                            <div className="min-w-0 flex-1"><div className="flex flex-wrap items-start justify-between gap-2"><h3 className="text-sm font-semibold text-[#26313a]"><Link href={event.id ? `/events/${event.id}` : "/events"} className="hover:text-[#762c3a]">{event.title || "Campus event"}</Link></h3>{getValue(event, "event_type", "category") && <span className="rounded-full bg-[#f4f2ee] px-2.5 py-1 text-[10px] text-[#6e7880]">{getValue(event, "event_type", "category")}</span>}</div><p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[#77818a]">{getValue(event, "short_description", "description") || "Details will be shared by the event organizer."}</p><p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-[#8a9297]">{getValue(event, "time", "start_time") && <span>{getValue(event, "time", "start_time")}</span>}{getValue(event, "venue", "location") && <span>{getValue(event, "venue", "location")}</span>}<span>{getValue(event, "club_name", "organizer")}</span></p></div>
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
            {module.status !== "ready" || module.items.length === 0 ? <ModuleState module={module} title="Resources" icon={BookOpen} emptyMessage="Newly shared course materials will appear here when available." /> : visibleResources.length === 0 ? <p className="rounded-2xl border border-dashed border-[#deded9] bg-white p-5 text-sm text-[#697681]">No recent resources match “{search}”.</p> : (
                <ul className="space-y-3">
                    {visibleResources.map((resource) => (
                        <li key={resource.id} className="flex items-start gap-3 rounded-2xl border border-[#e9e9e5] bg-white p-4">
                            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#f6f4ef] text-[#7c642f]"><FileText size={18} aria-hidden="true" /></span>
                            <div className="min-w-0 flex-1"><h3 className="text-sm font-semibold text-[#26313a]"><Link href={resource.id ? `/resources/${resource.id}` : "/resources"} className="rounded-sm hover:text-[#762c3a] hover:underline">{resource.title || "Course resource"}</Link></h3><p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[#77818a]">{getValue(resource, "description") || [getValue(resource, "course"), getValue(resource, "department")].filter(Boolean).join(" · ") || "Shared learning material"}</p><p className="mt-2 text-[10px] text-[#92999e]">{getValue(resource, "category")}{getValue(resource, "created_at", "createdAt") ? ` · Added ${readableDate(getValue(resource, "created_at", "createdAt"), { month: "short", day: "numeric" })}` : ""}</p></div>
                            <ArrowUpRight size={16} className="mt-1 shrink-0 text-[#9a7379]" aria-hidden="true" />
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
            {module.status !== "ready" || module.items.length === 0 ? <ModuleState module={module} title="Notices" icon={Bell} emptyMessage="Official campus announcements will be listed here when published." /> : visibleNotices.length === 0 ? <p className="rounded-2xl border border-dashed border-[#deded9] bg-white p-5 text-sm text-[#697681]">No notices match “{search}”.</p> : (
                <ul className="space-y-3">
                    {visibleNotices.map((notice) => {
                        const level = String(getValue(notice, "priority") || "normal").toLowerCase();
                        const urgent = level === "urgent";
                        const important = level === "important";
                        return <li key={notice.id} className={`rounded-2xl border bg-white p-4 ${urgent ? "border-red-200" : important ? "border-amber-200" : "border-[#e9e9e5]"}`}><div className="flex flex-wrap items-center justify-between gap-2"><span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide ${urgent ? "text-red-800" : important ? "text-amber-800" : "text-[#747d83]"}`}>{urgent || important ? <Bell size={13} aria-hidden="true" /> : <FileText size={13} aria-hidden="true" />}{getValue(notice, "priority") || "Campus notice"}</span><time className="text-[10px] text-[#92999e]">{readableDate(getValue(notice, "published_date", "publishedDate", "created_at"), { month: "short", day: "numeric" })}</time></div><h3 className="mt-2 text-sm font-semibold text-[#26313a]"><Link href={notice.id ? `/notices/${notice.id}` : "/notices"} className="rounded-sm hover:text-[#762c3a] hover:underline">{notice.title || "Campus announcement"}</Link></h3><p className="mt-1 text-xs leading-relaxed text-[#77818a]">{getValue(notice, "description") || "Open this notice for more information."}</p></li>;
                    })}
                </ul>
            )}
        </>
    );
}

function ServiceCard({ id, title, detail, icon: Icon, sourceStatus = "not-connected", statusLabel }) {
    return <article id={id} className="scroll-mt-24 rounded-2xl border border-[#e9e9e5] bg-white p-4 transition-colors hover:border-[#ded4d2]"><div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-xl bg-[#f6f4ef] text-[#762c3a]"><Icon size={17} aria-hidden="true" /></span><h3 className="text-xs font-semibold text-[#303a43]">{title}</h3></div><p className="mt-3 text-[11px] leading-relaxed text-[#79838c]">{detail}</p><span className="mt-3 inline-flex items-center gap-1.5 text-[10px] font-medium text-[#8a9297]"><span className={`size-1.5 rounded-full ${sourceStatus === "available" ? "bg-emerald-500" : "bg-[#b7b9b4]"}`} />{statusLabel || (sourceStatus === "available" ? "Available" : "Not connected yet")}</span></article>;
}

export function CampusDashboard({ profile, events, resources, notices }) {
    const [menuOpen, setMenuOpen] = useState(false);
    const [search, setSearch] = useState("");
    const greetingName = fullName(profile).trim().split(/\s+/)[0];
    const todayLabel = useMemo(() => new Intl.DateTimeFormat("en", { weekday: "long", month: "long", day: "numeric", timeZone: "Asia/Dhaka" }).format(new Date()), []);
    const moduleCount = [events, resources, notices].filter((module) => module.status === "ready").length;
    useEffect(() => {
        if (!menuOpen) return undefined;
        const previousOverflow = document.body.style.overflow;
        const closeOnEscape = (event) => { if (event.key === "Escape") setMenuOpen(false); };
        document.body.style.overflow = "hidden";
        window.addEventListener("keydown", closeOnEscape);
        return () => { document.body.style.overflow = previousOverflow; window.removeEventListener("keydown", closeOnEscape); };
    }, [menuOpen]);

    return (
        <div className="min-h-screen lg:flex">
            <Sidebar />
            {menuOpen && <div role="dialog" aria-modal="true" aria-label="CampusOS navigation" className="fixed inset-0 z-50 bg-[#17212a]/35 lg:hidden"><button type="button" className="absolute inset-0 cursor-default" aria-label="Close navigation" onClick={() => setMenuOpen(false)} /><Sidebar mobile close={() => setMenuOpen(false)} /></div>}
            <div className="min-w-0 flex-1">
                <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-[#e8e8e4] bg-[#f6f5f2]/95 px-4 backdrop-blur sm:px-7">
                    <div className="flex min-w-0 items-center gap-3">
                        <button type="button" className="rounded-lg p-2 text-[#4b5862] hover:bg-white lg:hidden" aria-label="Open navigation" aria-expanded={menuOpen} onClick={() => setMenuOpen(true)}><Menu size={20} /></button>
                        <span className="lg:hidden"><Brand compact /></span>
                        <span className="hidden text-xs text-[#697681] lg:block">City University <span className="mx-1 text-[#c1c0bb]">/</span> Student workspace</span>
                    </div>
                    <div className="flex shrink-0 items-center gap-2 sm:gap-4">
                        <div className="hidden text-right sm:block"><b className="block max-w-44 truncate text-xs text-[#37414a]">{fullName(profile)}</b><small className="text-[10px] capitalize text-[#79838c]">{profile.role}{profile.student_id ? ` · ${profile.student_id}` : ""}</small></div>
                        {profile.role === "admin" && <a href="/admin" className="rounded-lg px-2 py-2 text-[11px] text-[#762c3a]">Admin</a>}
                        <SignOutButton />
                    </div>
                </header>

                <main id="overview" className="mx-auto max-w-7xl px-4 pb-12 pt-6 sm:px-7 sm:pt-8 xl:px-10">
                    <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div><p className="text-[10px] font-semibold uppercase tracking-[.16em] text-[#8b6970]">{todayLabel} · City University</p><h1 className="mt-1 text-2xl font-semibold tracking-tight text-[#202a35] sm:text-3xl">Campus Pulse</h1></div><div className="inline-flex items-center gap-2 rounded-full border border-[#e8e6e1] bg-white px-3 py-1.5 text-[10px] text-[#697681]"><span className={`size-1.5 rounded-full ${moduleCount === 3 ? "bg-emerald-500" : "bg-amber-500"}`} />{moduleCount === 3 ? "Campus updates connected" : `${moduleCount} of 3 update sources connected`}</div></div>

                    <section className="relative overflow-hidden rounded-3xl bg-[#762c3a] px-5 py-7 text-white sm:px-9 sm:py-9">
                        <div aria-hidden="true" className="absolute -right-16 -top-24 size-72 rounded-full border border-white/10 sm:size-96" />
                        <div className="relative grid gap-7 lg:grid-cols-[1fr_minmax(260px,360px)] lg:items-end">
                            <div><p className="mb-3 text-[10px] font-bold uppercase tracking-[.18em] text-white/70">Your City University home</p><h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Good to see you, {greetingName}.</h2><p className="mt-3 max-w-xl text-sm leading-6 text-white/75">Your daily view of campus events, learning resources, and important updates.</p><a href="#events" className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-4 text-xs font-semibold text-[#762c3a] hover:bg-[#fbf8f6]">See what&apos;s happening <ChevronRight size={16} aria-hidden="true" /></a></div>
                            <div className="rounded-2xl border border-white/15 bg-white/10 p-4"><p className="text-[10px] font-semibold uppercase tracking-[.14em] text-white/70">Quick campus search</p><form action="/search" className="mt-3 flex gap-2"><SearchInput value={search} onChange={setSearch} className="min-w-0 flex-1 border-white/70" /><button className="rounded-lg bg-white px-3 text-[11px] font-semibold text-[#762c3a]">Search all</button></form><p className="mt-2 text-[10px] leading-relaxed text-white/65">Search across events, clubs, resources, notices, FAQs, and Lost &amp; Found.</p></div>
                        </div>
                    </section>

                    <section id="events" className="mt-9 scroll-mt-24">
                        <SectionHeading eyebrow="Your day" title="Today's & upcoming events" action={<Link href="/events" className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#762c3a]">View events <ChevronRight size={14} /></Link>} />
                        <EventList module={events} search={search} />
                    </section>

                    <section className="mt-9 grid gap-8 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,.95fr)]">
                        <div id="notices" className="scroll-mt-24"><SectionHeading eyebrow="Stay informed" title="Important & urgent notices" action={<Link href="/notices" className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#762c3a]">All notices <ChevronRight size={14} /></Link>} /><NoticeList module={notices} search={search} /></div>
                        <div id="resources" className="scroll-mt-24"><SectionHeading eyebrow="Keep learning" title="Recently added resources" action={<a href="#resources" className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#762c3a]">Resource Hub <ChevronRight size={14} /></a>} /><ResourceList module={resources} search={search} /></div>
                    </section>

                    <section id="quick-access" className="mt-10 scroll-mt-24">
                        <SectionHeading eyebrow="Your shortcuts" title="Quick access" />
                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                            {quickLinks.map(({ title, detail, icon: Icon, href, source }) => { const available = source === "search" ? [events, resources, notices].some((module) => module.status === "ready") : ["helpdesk", "student-service"].includes(source) ? true : source ? ({ events, resources }[source]?.status === "ready") : false; return <a key={title} href={href} className="group flex min-h-24 items-start gap-3 rounded-2xl border border-[#e9e9e5] bg-white p-4 transition-colors hover:border-[#d9c4c8] hover:bg-[#fffdfc]"><span className="rounded-xl bg-[#f7f3f0] p-2.5 text-[#762c3a]"><Icon size={18} aria-hidden="true" /></span><span className="min-w-0 flex-1"><span className="flex flex-wrap items-center gap-2"><b className="text-xs text-[#303a43]">{title}</b>{!available && <small className="rounded-full bg-[#f3f1ed] px-2 py-0.5 text-[9px] text-[#7c858d]">Not connected</small>}</span><small className="mt-1 block text-[11px] leading-relaxed text-[#7c858d]">{detail}</small></span><ArrowUpRight size={15} className="mt-1 text-[#a2a6a4] transition-colors group-hover:text-[#762c3a]" aria-hidden="true" /></a>; })}
                        </div>
                    </section>

                    <section id="campus-services" className="mt-10 scroll-mt-24">
                        <SectionHeading eyebrow="Campus life" title="Support & campus services" />
                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                            <ServiceCard id="campus-ai" title="Smart Helpdesk · CampusAI" detail="Find City University guidance on exams, registration, campus information, and transport." icon={Sparkles} sourceStatus="available" statusLabel="Helpdesk available" />
                            <ServiceCard id="lost-found" title="Lost & Found" detail="Create a post, search items, and mark your post resolved." icon={Search} sourceStatus="available" statusLabel="Student service available" />
                            <ServiceCard id="complaint-box" title="Complaint Box" detail="Submit a complaint privately and track its status." icon={LifeBuoy} sourceStatus="available" statusLabel="Private student support" />
                            <ServiceCard id="campus-info" title="Campus information" detail="City University · Dhaka, Bangladesh. Your profile details are managed by your campus account." icon={MapPin} sourceStatus="available" statusLabel="City University" />
                            <ServiceCard id="student-profile" title="Your student profile" detail={[profile.department, profile.student_id ? `Student ID ${profile.student_id}` : null].filter(Boolean).join(" · ") || "Profile details can be added through your student account."} icon={GraduationCap} sourceStatus="available" statusLabel="Your campus profile" />
                            <ServiceCard id="campus-support" title="Official campus support" detail="Support contact information has not been published in CampusOS yet." icon={CircleHelp} />
                        </div>
                    </section>

                    <footer className="mt-10 flex flex-wrap justify-between gap-2 border-t border-[#e6e4df] pt-5 text-[10px] text-[#8a9297]"><span>CampusOS · One Campus. Everything You Need.</span><span className="inline-flex items-center gap-1"><MapPin size={12} aria-hidden="true" />City University, Dhaka, Bangladesh</span></footer>
                </main>
            </div>
        </div>
    );
}
