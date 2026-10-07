import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/guards";
import { NoticeAdmin } from "@/components/notices/notice-admin";
export default async function AdminNoticesPage(){const auth=await requireRole("admin","/admin/notices");if(auth.kind!=="ok")redirect("/admin");const {data,error}=await auth.supabase.from("notices").select("id,title,category,description,priority,is_published,published_date").order("published_date",{ascending:false});return <NoticeAdmin notices={error?[]:data||[]}/>;}
