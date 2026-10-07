export default function EventManagementLoading() {
    return <main aria-busy="true" className="mx-auto max-w-7xl px-4 py-10 sm:px-7"><div className="h-8 w-56 animate-pulse rounded-lg bg-[#e9e7e1]"/><div className="mt-6 space-y-3">{[1,2,3].map((item) => <div key={item} className="h-28 animate-pulse rounded-2xl bg-white"/>)}</div><span className="sr-only">Loading event management</span></main>;
}