import { Suspense } from "react";
import { requireAuthenticatedUser } from "@/lib/auth/guards";
async function AuthenticatedContent({ children }) {
    await requireAuthenticatedUser();
    return children;
}
export default function ProtectedLayout({ children }) {
    return <Suspense fallback={<main className="grid min-h-screen place-items-center text-sm text-[#697681]">Checking your session...</main>}><AuthenticatedContent>{children}</AuthenticatedContent></Suspense>;
}
