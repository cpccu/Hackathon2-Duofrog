import { createClient } from "@/lib/supabase/server";
import { NoticesList } from "@/components/notices/notices-list";
export const metadata = { title: "Notices · CampusOS" };
export default async function NoticesPage({searchParams}) {
  const params=await searchParams; const query=typeof params?.q==="string"?params.q.trim().slice(0,120):""; const category=typeof params?.category==="string"?params.category:"";
  const supabase=await createClient();
  const {data,error}=await supabase.rpc("search_notices",{search_query:query,category_filter:category,result_limit:100});
  let notices=data||[];
  if(notices.length){const {data:attachments}=await supabase.from("notice_attachments").select("notice_id").in("notice_id",notices.map(notice=>notice.id));const counts=new Map();for(const attachment of attachments||[])counts.set(attachment.notice_id,(counts.get(attachment.notice_id)||0)+1);notices=notices.map(notice=>({...notice,attachment_count:counts.get(notice.id)||0}));}
  return <NoticesList notices={notices} query={query} category={category} error={error?"Notices could not be loaded. Apply the Notices migration and try again.":""}/>;
}
