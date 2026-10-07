import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/guards";
import { AdminDashboard } from "@/components/admin/admin-dashboard";

const emptyStats={total_users:0,total_students:0,total_events:0,total_resources:0,total_notices:0,total_lost_found:0,pending_complaints:0,total_registrations:0,total_check_ins:0};

export default async function AdminPage(){
  const auth=await requireRole("admin","/admin");
  if(auth.kind!=="ok")redirect("/dashboard");
  const queries=await Promise.all([
    auth.supabase.rpc("admin_dashboard_stats"),
    auth.supabase.from("events").select("id,title,event_type,club_id,venue,event_date,status,created_at").order("event_date",{ascending:false}).limit(500),
    auth.supabase.from("club_profiles").select("id,name,slug,short_description,description,contact_email,manager_id").order("name").limit(500),
    auth.supabase.from("resources").select("id,title,description,course,department,category,storage_path,created_at").order("created_at",{ascending:false}).limit(500),
    auth.supabase.from("notices").select("id,title,category,description,priority,is_published,published_date").order("published_date",{ascending:false}).limit(500),
    auth.supabase.from("helpdesk_articles").select("id,slug,title,summary,content,category,keywords,source_label,source_url,is_published").order("updated_at",{ascending:false}).limit(500),
    auth.supabase.from("bus_routes").select("id,route_code,route_name,origin,destination,service_information,contact_information,fare_information,source_label,source_url,departure_time,return_time,is_published").order("route_name").limit(500),
    auth.supabase.from("lost_found_items").select("id,item_type,title,description,photo_url,storage_path,location,item_date,contact_information,status,created_by,created_at").order("created_at",{ascending:false}).limit(500),
    auth.supabase.from("complaints").select("id,category,description,status,submitted_at,user_id").order("submitted_at",{ascending:false}).limit(500),
    auth.supabase.from("profiles").select("id,full_name,student_id,department,role,created_at").order("created_at",{ascending:false}).limit(500),
    auth.supabase.from("event_registrations").select("id,event_id,status,checked_in").limit(5000),
  ]);
  const [stats,events,clubs,resources,notices,articles,routes,items,complaints,users,registrations]=queries;
  const errors={Overview:stats.error,Events:events.error,Clubs:clubs.error,Resources:resources.error,Notices:notices.error,"FAQs & buses":articles.error||routes.error,"Lost & Found":items.error,Complaints:complaints.error,Users:users.error};
  return <AdminDashboard profile={auth.profile} stats={stats.data?.[0]||emptyStats} events={events.data||[]} clubs={clubs.data||[]} resources={resources.data||[]} notices={notices.data||[]} articles={articles.data||[]} routes={routes.data||[]} items={items.data||[]} complaints={complaints.data||[]} users={users.data||[]} registrations={registrations.data||[]} errors={Object.fromEntries(Object.entries(errors).map(([key,value])=>[key,Boolean(value)]))}/>;
}
