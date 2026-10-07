import { NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";
export async function proxy(request) {
    const { response, authenticated } = await updateSession(request);
    const { pathname } = request.nextUrl;
    const protectedRoute = pathname === "/dashboard" || pathname.startsWith("/dashboard/") || pathname === "/admin" || pathname.startsWith("/admin/") || pathname === "/resources" || pathname.startsWith("/resources/") || pathname === "/events" || pathname.startsWith("/events/") || pathname === "/my-events" || pathname.startsWith("/my-events/") || pathname === "/clubs" || pathname.startsWith("/clubs/") || pathname === "/manage/events" || pathname.startsWith("/manage/events/") || pathname.startsWith("/api/resources/");
    const authRoute = pathname === "/login" || pathname === "/signup";
    let destination = null;
    if (protectedRoute && !authenticated)
        destination = "/login?next=" + encodeURIComponent(pathname + request.nextUrl.search);
    else if (authRoute && authenticated)
        destination = "/dashboard";
    else if (pathname === "/")
        destination = authenticated ? "/dashboard" : "/login";
    if (!destination)
        return response;
    const redirectResponse = NextResponse.redirect(new URL(destination, request.url));
    response.cookies.getAll().forEach(cookie => redirectResponse.cookies.set(cookie));
    return redirectResponse;
}
export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"] };
