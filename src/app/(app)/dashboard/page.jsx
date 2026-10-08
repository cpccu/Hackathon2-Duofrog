import { getCampusPulseData } from "@/lib/dashboard/get-campus-pulse";
import { CampusDashboard } from "@/components/dashboard/campus-dashboard";

export default async function DashboardPage() {
    const data = await getCampusPulseData();

    if (data.profileError || !data.profile) {
        return (
            <main className="mx-auto grid min-h-[60vh] max-w-xl place-items-center px-6 py-12">
                <section role="alert" className="w-full rounded-2xl border border-red-200 bg-white p-6">
                    <h1 className="text-lg font-semibold text-[#202a35]">Your profile could not be loaded</h1>
                    <p className="mt-2 text-sm leading-6 text-[#697681]">
                        CampusOS could not retrieve your student profile. Refresh the page or contact campus support if the problem continues.
                    </p>
                    <a href="/dashboard" className="mt-5 inline-flex rounded-lg bg-[#c8102e] px-4 py-2.5 text-sm font-semibold text-white">
                        Reload dashboard
                    </a>
                </section>
            </main>
        );
    }

    return (
        <CampusDashboard
            profile={data.profile}
            events={data.events}
            resources={data.resources}
            notices={data.notices}
        />
    );
}
