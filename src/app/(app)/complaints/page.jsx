import { createClient } from "@/lib/supabase/server";
import { requireAuthenticatedUser } from "@/lib/auth/guards";
import { ComplaintCenter } from "@/components/complaints/complaint-center";
export const metadata={title:"Complaint Box · CampusOS"};
export default async function ComplaintsPage(){const auth=await requireAuthenticatedUser("/complaints");const [{data:profile},{data,error}]=await Promise.all([auth.supabase.from("profiles").select("role").eq("id",auth.userId).maybeSingle(),auth.supabase.from("complaints").select("id,category,description,status,submitted_at,user_id").eq("user_id",auth.userId).order("submitted_at",{ascending:false})]);return <ComplaintCenter complaints={data||[]} isAdmin={profile?.role==="admin"} error={error?"Your complaint history could not be loaded. Apply the Complaint Box migration and reload.":""}/>;}
