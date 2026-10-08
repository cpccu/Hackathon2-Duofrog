import Image from "next/image";

export function CityUniversityBrand({ compact = false, className = "" }) {
    return (
        <span className={`inline-flex flex-col items-start gap-2 ${className}`}>
            <Image
                src="/city-university-logo.png"
                alt="City University"
                width={210}
                height={111}
                priority
                className={`h-auto shrink-0 object-contain ${compact ? "w-[96px]" : "w-[152px]"}`}
            />
            {!compact && <span className="text-xs font-bold tracking-wide text-[#303a43]">CampusOS</span>}
        </span>
    );
}
