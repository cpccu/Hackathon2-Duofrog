import { requireAuthenticatedUser } from "@/lib/auth/guards";
import { GlobalSearchResults } from "@/components/search/global-search-results";
export const metadata={title:"Global Search · CampusOS"};

export default async function GlobalSearchPage({searchParams}){
  const {supabase}=await requireAuthenticatedUser("/search");const params=await searchParams;const query=typeof params?.q==="string"?params.q.trim().slice(0,120):"";
  if(!query)return <GlobalSearchResults query="" results={{}} errors={{}}/>;
  const [events,clubs,resources,notices,faqs,lost]=await Promise.all([
    supabase.rpc("search_events",{search_query:query,club_filter:null,type_filter:"",date_from:null,date_to:null,result_limit:10}),
    supabase.rpc("search_clubs",{search_query:query}),
    supabase.rpc("search_resources",{search_query:query,department_filter:"",course_filter:"",category_filter:"",page_number:1,page_size:10}),
    supabase.rpc("search_notices",{search_query:query,category_filter:"",result_limit:10}),
    supabase.rpc("search_helpdesk_articles",{search_text:query,category_filter:"",result_limit:10}),
    supabase.rpc("search_lost_found",{search_query:query,type_filter:"",status_filter:"",result_limit:10}),
  ]);
  const results={
    Events:(events.data||[]).map(item=>({id:item.id,title:item.title,description:item.short_description||item.description,meta:[item.event_type,item.club_name,item.venue].filter(Boolean).join(" · "),href:`/events/${item.id}`})),
    Clubs:(clubs.data||[]).map(item=>({id:item.id,title:item.name,description:item.short_description||item.description,meta:`${item.upcoming_event_count||0} upcoming events`,href:`/clubs/${encodeURIComponent(item.slug)}`})),
    Resources:(resources.data||[]).map(item=>({id:item.id,title:item.title,description:item.description,meta:[item.course,item.department,item.category].filter(Boolean).join(" · "),href:`/resources/${item.id}`})),
    Notices:(notices.data||[]).map(item=>({id:item.id,title:item.title,description:item.description,meta:[item.category,item.priority].filter(Boolean).join(" · "),href:`/notices/${item.id}`})),
    FAQs:(faqs.data||[]).map(item=>({id:item.id,title:item.title,description:item.summary||item.content,meta:item.category,href:`/helpdesk?q=${encodeURIComponent(item.title)}`})),
    "Lost & Found":(lost.data||[]).map(item=>({id:item.id,title:item.title,description:item.description,meta:[item.item_type,item.status,item.location].filter(Boolean).join(" · "),href:`/lost-found/${item.id}`})),
  };
  const errors={Events:events.error,Clubs:clubs.error,Resources:resources.error,Notices:notices.error,FAQs:faqs.error,"Lost & Found":lost.error};
  return <GlobalSearchResults query={query} results={results} errors={Object.fromEntries(Object.entries(errors).map(([key,value])=>[key,Boolean(value)]))}/>;
}
