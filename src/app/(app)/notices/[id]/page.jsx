import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NoticeSummarizer } from "@/components/notices/notice-summarizer";
export default async function NoticeDetailPage({params}) {
  const {id}=await params; const {data,error}=await (await createClient()).from("notices").select("id,title,category,description,priority,published_date").eq("id",id).eq("is_published",true).maybeSingle();
  if(error||!data) notFound();
  return <main className="mx-auto max-w-3xl px-4 py-10 sm:px-7"><Link href="/notices" className="text-xs font-semibold text-[#762c3a]">â† All notices</Link><article className="mt-5 rounded-3xl border border-[#e8e8e4] bg-white p-6 sm:p-9"><div className="flex flex-wrap gap-2"><span className="rounded-full bg-[#f6f1ef] px-3 py-1 text-xs font-semibold text-[#762c3a]">{data.category}</span><span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold capitalize text-amber-900">{data.priority}</span></div><h1 className="mt-4 text-2xl font-semibold text-[#202a35] sm:text-3xl">{data.title}</h1><time className="mt-2 block text-xs text-[#8a9297]">{new Date(data.published_date).toLocaleString("en",{dateStyle:"long",timeStyle:"short",timeZone:"Asia/Dhaka"})}</time><p className="mt-7 whitespace-pre-wrap text-sm leading-7 text-[#48545d]">{data.description}</p><NoticeSummarizer noticeId={data.id}/></article></main>;
}
