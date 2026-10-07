import Link from "next/link";
import { requireAuthenticatedUser } from "@/lib/auth/guards";
import { ResourceHub } from "@/components/resources/resource-hub";

const pageSize = 24;

function first(value) {
    return Array.isArray(value) ? value[0] || "" : value || "";
}

function validPage(value) {
    const page = Number.parseInt(first(value), 10);
    return Number.isInteger(page) && page > 0 ? page : 1;
}

export default async function ResourcesPage({ searchParams }) {
    const params = await searchParams;
    const search = String(first(params?.q)).trim().slice(0, 120);
    const department = String(first(params?.department)).trim().slice(0, 160);
    const course = String(first(params?.course)).trim().slice(0, 160);
    const category = String(first(params?.category)).trim();
    const page = validPage(params?.page);
    const { supabase, userId } = await requireAuthenticatedUser("/resources");

    const [resourcesResult, optionsResult, profileResult] = await Promise.all([
        supabase.rpc("search_resources", {
            search_query: search,
            department_filter: department,
            course_filter: course,
            category_filter: category,
            page_number: page,
            page_size: pageSize,
        }),
        supabase.rpc("get_resource_filter_options"),
        supabase.from("profiles").select("role").eq("id", userId).maybeSingle(),
    ]);

    const options = { departments: [], courses: [] };
    for (const option of optionsResult.data ?? []) {
        if (option.option_type === "department") options.departments.push(option.option_value);
        if (option.option_type === "course") options.courses.push(option.option_value);
    }

    return (
        <ResourceHub
            resources={resourcesResult.data ?? []}
            totalCount={Number(resourcesResult.data?.[0]?.total_count ?? 0)}
            search={search}
            department={department}
            course={course}
            category={category}
            page={page}
            pageSize={pageSize}
            options={options}
            isAdmin={profileResult.data?.role === "admin"}
            queryError={resourcesResult.error ? "Resource search is unavailable. Apply the Resource Hub database migration, then reload." : null}
            optionsError={optionsResult.error ? "Filter options could not load." : null}
            created={first(params?.created) === "1"}
            seeded={first(params?.seeded) === "1"}
        />
    );
}
