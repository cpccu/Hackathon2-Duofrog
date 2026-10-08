"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Bell,
    BookOpen,
    CalendarDays,
    CheckCircle2,
    CircleHelp,
    FileText,
    LifeBuoy,
    Menu,
    Search,
    ShieldCheck,
    Sparkles,
    UsersRound,
    X,
} from "lucide-react";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { CityUniversityBrand } from "@/components/brand/city-university-brand";

const studentNavigation = [
    ["Campus Pulse", "/dashboard", Sparkles],
    ["Events", "/events", CalendarDays],
    ["My Events", "/my-events", CheckCircle2],
    ["Clubs", "/clubs", UsersRound],
    ["Resource Hub", "/resources", BookOpen],
    ["Helpdesk", "/helpdesk", CircleHelp],
    ["Search campus", "/search", Search],
    ["Notices", "/notices", Bell],
    ["Lost & Found", "/lost-found", Search],
    ["Complaints", "/complaints", LifeBuoy],
];

function Brand({ compact = false }) {
    return <CityUniversityBrand compact={compact} />;
}

function Sidebar({ profile, isEventManager, mobile = false, close }) {
    const pathname = usePathname();
    const links = [
        ...studentNavigation,
        ...(isEventManager ? [["Manage events", "/manage/events", CalendarDays]] : []),
        ...(profile?.role === "admin" ? [
            ["Admin dashboard", "/admin", ShieldCheck],
            ["Manage notices", "/admin/notices", Bell],
            ["Review complaints", "/admin/complaints", LifeBuoy],
            ["Upload resource", "/resources/upload", FileText],
        ] : []),
    ];

    return (
        <aside className={`campus-sidebar ${mobile ? "absolute inset-y-0 left-0 w-[min(86vw,310px)] overflow-y-auto bg-white p-5 shadow-2xl" : "sticky top-0 hidden h-screen w-64 shrink-0 overflow-y-auto border-r border-[#ebe9e4] bg-white p-5 lg:flex lg:flex-col"}`}>
            <div className="flex items-center justify-between">
                <Brand />
                {mobile && <button type="button" aria-label="Close navigation" onClick={close} className="rounded-lg p-2 text-[#66727c] hover:bg-[#f6f5f2]"><X size={20} /></button>}
            </div>
            <p className="mb-3 mt-7 flex items-center gap-2 px-3 text-[10px] font-bold uppercase tracking-[.16em] text-[#92999e]"><span>Your workspace</span><span aria-hidden="true" className="h-px flex-1 bg-[#ece9e6]" /></p>
            <nav aria-label="Main navigation" className="space-y-1">
                {links.map(([label, href, Icon]) => {
                    const active = pathname === href || (href !== "/admin" && pathname.startsWith(`${href}/`) && !(href === "/resources" && pathname === "/resources/upload"));
                    return (
                        <Link key={href} href={href} onClick={close} aria-current={active ? "page" : undefined} className={active ? "flex items-center gap-3 rounded-lg border-l-[3px] border-[#a50e26] bg-[#fdf0f2] px-3 py-3 text-sm font-semibold text-[#9f1a2c]" : "flex items-center gap-3 rounded-lg border-l-[3px] border-transparent px-3 py-3 text-sm text-[#66727c] transition-colors duration-150 hover:bg-[#f8f7f6] hover:text-[#303a43]"}>
                            <Icon size={17} aria-hidden="true" />{label}
                        </Link>
                    );
                })}
            </nav>
            <div className="mt-auto pt-6">
                <div className="rounded-2xl bg-[#f7f5f1] p-4">
                    <ShieldCheck className="mb-3 size-5 text-[#c8102e]" aria-hidden="true" />
                    <b className="text-xs text-[#303a43]">A campus, connected.</b>
                    <p className="mt-1 text-[11px] leading-relaxed text-[#79838c]">Your City University updates, together in one place.</p>
                    <small className="mt-4 block text-[#92999e]">City University · Dhaka</small>
                </div>
            </div>
        </aside>
    );
}

export function CampusAppShell({ children, profile, isEventManager = false }) {
    const [menuPathname, setMenuPathname] = useState(null);
    const pathname = usePathname();
    const menuOpen = menuPathname === pathname;
    const closeMenu = () => setMenuPathname(null);
    const displayProfile = profile || { full_name: "Student", role: "student" };

    useEffect(() => {
        if (!menuOpen) return undefined;
        const previousOverflow = document.body.style.overflow;
        const closeOnEscape = (event) => { if (event.key === "Escape") setMenuPathname(null); };
        document.body.style.overflow = "hidden";
        window.addEventListener("keydown", closeOnEscape);
        return () => {
            document.body.style.overflow = previousOverflow;
            window.removeEventListener("keydown", closeOnEscape);
        };
    }, [menuOpen]);

    return (
        <div className="min-h-screen bg-[#f6f5f2] lg:flex">
            <Sidebar profile={displayProfile} isEventManager={isEventManager} />
            {menuOpen && <div role="dialog" aria-modal="true" aria-label="CampusOS navigation" className="fixed inset-0 z-50 bg-[#17212a]/35 lg:hidden"><button type="button" className="absolute inset-0 cursor-default" aria-label="Close navigation" onClick={closeMenu} /><Sidebar profile={displayProfile} isEventManager={isEventManager} mobile close={closeMenu} /></div>}
            <div className="min-w-0 flex-1">
                <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-[#e8e8e4] bg-[#f6f5f2]/95 px-4 backdrop-blur sm:px-7">
                    <div className="flex min-w-0 items-center gap-3">
                        <button type="button" className="rounded-lg p-2 text-[#4b5862] hover:bg-white lg:hidden" aria-label="Open navigation" aria-expanded={menuOpen} onClick={() => setMenuPathname(pathname)}><Menu size={20} /></button>
                        <span className="lg:hidden"><Brand compact /></span>
                        <span className="hidden text-xs text-[#697681] lg:block">City University <span className="mx-1 text-[#c1c0bb]">/</span> Student workspace</span>
                    </div>
                    <div className="flex shrink-0 items-center gap-2 sm:gap-4">
                        <div className="hidden text-right sm:block"><b className="block max-w-44 truncate text-xs text-[#37414a]">{displayProfile.full_name || "Student"}</b><small className="text-[10px] capitalize text-[#79838c]">{displayProfile.role || "student"}{displayProfile.student_id ? ` · ${displayProfile.student_id}` : ""}</small></div>
                        <SignOutButton />
                    </div>
                </header>
                {children}
            </div>
        </div>
    );
}
