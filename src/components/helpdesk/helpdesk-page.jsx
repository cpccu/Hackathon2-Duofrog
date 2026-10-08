import Link from "next/link";
import { BookOpenText, BusFront, ExternalLink, Search } from "lucide-react";

const labels = {
    faq: "Common questions",
    academic: "Academic",
    exams: "Exams",
    registration: "Registration",
    campus: "Campus information",
    transport: "Transport",
};

function formatTime(value) {
    if (!value) return "";
    const [hour, minute] = String(value).split(":").map(Number);
    if (!Number.isInteger(hour) || !Number.isInteger(minute)) return "";
    return `${hour % 12 || 12}:${String(minute).padStart(2, "0")} ${hour >= 12 ? "PM" : "AM"}`;
}

function BusRoute({ route }) {
    const departure = formatTime(route.departure_time);
    const returning = formatTime(route.return_time);
    const days = route.operating_days || [];

    return (
        <article className="rounded-2xl border border-[#e8e8e4] bg-white p-4">
            <h3 className="text-sm font-semibold text-[#303a43]">{route.route_name}</h3>
            {(route.origin || route.destination) && <p className="mt-2 text-xs text-[#697681]">{[route.origin, route.destination].filter(Boolean).join(" → ")}</p>}
            {(departure || returning || days.length > 0) ? <p className="mt-2 text-xs text-[#697681]">
                {[departure && `Departure ${departure}`, returning && `Return ${returning}`, days.length > 0 && days.join(", ")].filter(Boolean).join(" · ")}
            </p> : <p className="mt-2 text-xs text-[#79838c]">Departure and return times have not been published.</p>}
            {route.service_information && <p className="mt-2 text-xs leading-5 text-[#697681]">{route.service_information}</p>}
            {route.fare_information && <p className="mt-2 text-xs text-[#697681]">Fare: {route.fare_information}</p>}
            {route.contact_information && <p className="mt-3 text-xs font-medium text-[#303a43]">{route.contact_information}</p>}
            {route.source_url && <a href={route.source_url} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-[#c8102e]">{route.source_label || "Source"}<ExternalLink size={12}/></a>}
        </article>
    );
}

export function HelpdeskPage({ articles, routes, error, query, category }) {
    return <main className="mx-auto max-w-6xl px-4 py-7 sm:px-7 sm:py-10">
        <div className="mb-7"><Link href="/dashboard" className="text-xs text-[#c8102e] hover:underline">Campus Pulse</Link><p className="mt-5 text-[10px] font-bold uppercase tracking-[.18em] text-[#a13e4c]">City University · Student support</p><h1 className="mt-1 text-3xl font-semibold tracking-tight text-[#202a35]">Campus Helpdesk</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-[#697681]">University guidance and transport information from published City University sources.</p></div>
        <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
            <div>
                <div className="mb-4 flex items-center gap-2"><BookOpenText size={18} className="text-[#c8102e]"/><h2 className="text-lg font-semibold text-[#202a35]">University information</h2></div>
                <form action="/helpdesk" className="mb-4 grid gap-2 sm:grid-cols-[1fr_190px_auto]">
                    <label className="relative"><span className="sr-only">Search help articles</span><Search size={16} className="absolute left-3 top-3 text-[#899198]"/><input name="q" defaultValue={query} placeholder="Search exams, registration, campus…" className="h-11 w-full rounded-xl border border-[#e3e3de] bg-white pl-9 pr-3 text-sm outline-none focus:border-[#c8102e]"/></label>
                    <label><span className="sr-only">Category</span><select name="category" defaultValue={category} className="h-11 w-full rounded-xl border border-[#e3e3de] bg-white px-3 text-sm text-[#39444d]"><option value="">All categories</option>{Object.entries(labels).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
                    <button className="h-11 rounded-xl bg-[#c8102e] px-5 text-sm font-semibold text-white hover:bg-[#8f1023]">Search</button>
                </form>
                {error ? <div role="alert" className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">{error}</div> : articles.length ? <div className="space-y-3">{articles.map(article=><details key={article.id} className="group rounded-2xl border border-[#e8e8e4] bg-white p-4 open:border-[#e7c1c7] sm:p-5"><summary className="cursor-pointer list-none pr-6 marker:hidden"><span className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-[#f9eff0] px-2.5 py-1 text-[10px] font-semibold text-[#c8102e]">{labels[article.category] || article.category}</span></span><span className="mt-2 block font-semibold text-[#26313a]">{article.title}</span><span className="mt-1 block text-sm text-[#697681]">{article.summary}</span></summary><div className="mt-4 border-t border-[#efeee9] pt-4"><p className="whitespace-pre-line text-sm leading-6 text-[#48545d]">{article.content}</p>{article.source_url&&<a href={article.source_url} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[#c8102e]">Source: {article.source_label}<ExternalLink size={13}/></a>}</div></details>)}</div> : <div className="rounded-2xl border border-dashed border-[#deded9] bg-white p-7 text-center"><BookOpenText className="mx-auto text-[#ad7a81]"/><h3 className="mt-3 text-sm font-semibold text-[#303a43]">No matching information</h3><p className="mt-1 text-xs text-[#79838c]">Try another keyword or category.</p></div>}
            </div>
            <aside><div className="mb-4 flex items-center gap-2"><BusFront size={18} className="text-[#c8102e]"/><h2 className="text-lg font-semibold text-[#202a35]">Bus information</h2></div>{error ? <p role="status" className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-950">Transport information is temporarily unavailable.</p> : routes.length ? <div className="space-y-3">{routes.map(route=><BusRoute key={route.id} route={route}/>)}</div> : <p className="rounded-2xl border border-dashed border-[#deded9] bg-white p-5 text-sm text-[#697681]">No transport information has been published.</p>}</aside>
        </section>
    </main>;
}
