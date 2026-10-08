import { eventDateLabel, timeLabel } from "@/lib/events/constants";
import Link from "next/link";
import { ArrowUpRight, CalendarDays, MapPin } from "lucide-react";

export function EventCard({ event }) {
    const isSample = event.slug?.startsWith("demo-") || event.title?.startsWith("Sample: ");
    const title = event.title?.startsWith("Sample: ") ? event.title.slice(8) : event.title;
    const imageUrl = /^https?:\/\//i.test(event.cover_image_url || "") ? event.cover_image_url : "";
    const registered = event.registration_status === "registered" || event.registration_status === "checked_in";
    const remaining = event.max_attendees == null ? null : Math.max(0, Number(event.max_attendees) - Number(event.registration_count || 0));
    return (
        <article className="flex min-h-full flex-col overflow-hidden rounded-2xl border border-[#e9e9e5] bg-white transition-colors hover:border-[#e7c4c9]">
            <div aria-hidden="true" className={imageUrl ? "h-40 bg-[#eee9e3]" : "h-2 bg-[#c8102e]"} style={imageUrl ? { backgroundImage: `linear-gradient(90deg,rgba(48,22,29,.4),rgba(48,22,29,.05)),url('${imageUrl}')`, backgroundSize: "cover", backgroundPosition: "center" } : undefined} />
            <div className="flex flex-1 flex-col p-5">
                <div className="flex flex-wrap items-center justify-between gap-2"><span className="rounded-full bg-[#f4f2ee] px-2.5 py-1 text-[11px] font-medium text-[#5e6a74]">{event.event_type}</span><div className="flex items-center gap-2">{isSample && <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-900">Sample</span>}{registered && <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-800">Registered</span>}</div></div>
                <h2 className="mt-3 text-base font-semibold leading-6 text-[#202a35]"><Link href={`/events/${event.id}`} className="hover:text-[#c8102e]">{title}</Link></h2>
                <p className="mt-1 text-[11px] font-medium text-[#a13e4c]">{event.club_slug ? <Link href={`/clubs/${event.club_slug}`} className="hover:underline">{event.club_name}</Link> : event.club_name}</p>
                <p className="mt-3 line-clamp-3 flex-1 text-xs leading-relaxed text-[#5e6a74]">{event.short_description || event.description}</p>
                <div className="mt-4 space-y-2 border-t border-[#efeee9] pt-4 text-[11px] text-[#5e6a74]"><p className="flex items-center gap-2"><CalendarDays size={13} className="text-[#a13e4c]" />{eventDateLabel(event.event_date)} · {timeLabel(event.start_time)}</p><p className="flex items-center gap-2"><MapPin size={13} className="text-[#a13e4c]" /><span className="truncate">{event.venue}</span></p></div>
                {remaining !== null && <p className={`mt-3 text-[11px] ${remaining === 0 ? "font-semibold text-red-700" : "text-[#5e6a74]"}`}>{remaining === 0 ? "At capacity" : `${remaining} places remaining`}</p>}
                <Link href={`/events/${event.id}`} className="mt-4 inline-flex min-h-10 items-center justify-between rounded-xl border border-[#e7e4df] px-3.5 text-xs font-semibold text-[#c8102e] hover:bg-[#faf8f5]">Event details <ArrowUpRight size={15} aria-hidden="true" /></Link>
            </div>
        </article>
    );
}
