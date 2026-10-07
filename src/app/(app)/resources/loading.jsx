export default function ResourcesLoading() {
    return (
        <main aria-busy="true" aria-label="Loading Resource Hub" className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-7">
            <div className="h-12 w-56 animate-pulse rounded bg-[#e9e7e2]" />
            <div className="h-40 animate-pulse rounded-2xl bg-white" />
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{[1, 2, 3, 4, 5, 6].map((item) => <div key={item} className="h-64 animate-pulse rounded-2xl border bg-white" />)}</div>
        </main>
    );
}
