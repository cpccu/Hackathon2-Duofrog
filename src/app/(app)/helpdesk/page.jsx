import Link from "next/link";
import { BookOpenText, BusFront, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { HelpdeskPage } from "@/components/helpdesk/helpdesk-page";

export const metadata = { title: "Helpdesk · CampusOS" };

export default async function HelpdeskRoute({ searchParams }) {
  const params = await searchParams;
  const query = typeof params?.q === "string" ? params.q.trim().slice(0, 120) : "";
  const selectedCategory = typeof params?.category === "string" ? params.category : "";
  const categories = ["faq", "academic", "exams", "registration", "campus", "transport"];
  const category = categories.includes(selectedCategory) ? selectedCategory : "";
  let articles = [];
  let routes = [];
  let error = "";

  try {
    const supabase = await createClient();
    const [{ data, error: articlesError }, { data: routeData, error: routesError }] = await Promise.all([
      supabase.rpc("search_helpdesk_articles", { search_text: query, category_filter: category, result_limit: 100 }),
      supabase.from("bus_routes").select("id,route_code,route_name,origin,destination,stops,departure_time,return_time,operating_days,fare_information,service_information,contact_information,source_label,source_url").eq("is_published", true).order("route_name"),
    ]);
    if (articlesError) throw articlesError;
    if (routesError) throw routesError;
    articles = data || [];
    routes = routeData || [];
  } catch (cause) {
    error = cause?.code === "42P01" || cause?.code === "PGRST202"
      ? "Helpdesk database setup is incomplete. Apply the CampusOS Helpdesk migration, then reload this page."
      : "Campus help information could not be loaded. Please try again shortly.";
  }

  return <HelpdeskPage articles={articles} routes={routes} error={error} query={query} category={category} />;
}
