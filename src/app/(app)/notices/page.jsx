import { createClient } from "@/lib/supabase/server";
import { NoticesList } from "@/components/notices/notices-list";
export const metadata = { title: "Notices · CampusOS" };
export default async function NoticesPage({searchParams}) {
  const params=await searchParams; const query=typeof params?.q==="string"?params.q.trim().slice(0,120):""; const category=typeof params?.category==="string"?params.category:"";
  const {data,error}=await (await createClient()).rpc("search_notices",{search_query:query,category_filter:category,result_limit:100});
  return <NoticesList notices={data||[]} query={query} category={category} error={error?"Notices could not be loaded. Apply the Notices migration and try again.":""}/>;
}
