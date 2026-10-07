import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/guards";
import { ComplaintCenter } from "@/components/complaints/complaint-center";
export default async function AdminComplaintsPage(){const auth=await requireRole("admin","/admin/complaints");if(auth.kind!=="ok")redirect("/admin");const {data,error}=await auth.supabase.from("complaints").select("id,category,description,status,submitted_at,user_id").order("submitted_at",{ascending:false});return <ComplaintCenter complaints={error?[]:data||[]} isAdmin error={error?"Complaints could not be loaded.":""}/>;}
