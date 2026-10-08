export function EmptyState({ icon: Icon, title, description }) {
    return <div className="flex min-h-36 gap-4 rounded-2xl border border-dashed border-[#deded9] bg-white p-5">
 <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#f9eff0] text-[#c8102e]"><Icon size={19} aria-hidden="true"/></span>
 <div><h3 className="text-sm font-semibold">{title}</h3><p className="mt-2 max-w-md text-xs leading-relaxed text-[#5e6a74]">{description}</p><p className="mt-3 text-[11px] text-[#5e6a74]">Awaiting live campus data</p></div></div>;
}
