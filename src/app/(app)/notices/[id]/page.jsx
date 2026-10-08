import Link from "next/link";
import { notFound } from "next/navigation";
import { Download, ExternalLink, Paperclip } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { NOTICE_ATTACHMENT_BUCKET } from "@/lib/notices/constants";

function formatFileSize(bytes) {
  return bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export default async function NoticeDetailPage({params}) {
  const {id}=await params;
  const supabase=await createClient();
  const {data,error}=await supabase.from("notices").select("id,title,category,description,priority,published_date,source_url").eq("id",id).eq("is_published",true).maybeSingle();
  if(error||!data) notFound();
  const {data:attachmentRows,error:attachmentError}=await supabase.from("notice_attachments").select("id,file_name,content_type,file_size,storage_path").eq("notice_id",data.id).order("created_at");
  const attachments=attachmentError?[]:(await Promise.all((attachmentRows||[]).map(async attachment=>{
    const {data:signed}=await supabase.storage.from(NOTICE_ATTACHMENT_BUCKET).createSignedUrl(attachment.storage_path,3600,{download:attachment.file_name});
    return signed?.signedUrl?{...attachment,url:signed.signedUrl}:null;
  }))).filter(Boolean);
  return <main className="mx-auto max-w-3xl px-4 py-10 sm:px-7"><Link href="/notices" className="text-xs font-semibold text-[#c8102e]">← All notices</Link><article className="mt-5 rounded-3xl border border-[#e8e8e4] bg-white p-6 sm:p-9"><div className="flex flex-wrap gap-2"><span className="rounded-full bg-[#f9eff0] px-3 py-1 text-xs font-semibold text-[#c8102e]">{data.category}</span><span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold capitalize text-amber-900">{data.priority}</span></div><h1 className="mt-4 text-2xl font-semibold text-[#202a35] sm:text-3xl">{data.title}</h1><time className="mt-2 block text-xs text-[#8a9297]">{new Date(data.published_date).toLocaleDateString("en",{dateStyle:"long",timeZone:"Asia/Dhaka"})}</time><p className="mt-7 whitespace-pre-wrap text-sm leading-7 text-[#48545d]">{data.description}</p>{data.source_url&&<a href={data.source_url} target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-2 rounded-lg border border-[#e5e3de] px-3 py-2 text-xs font-semibold text-[#4d5861] hover:border-[#c8102e]">Open official source <ExternalLink size={14}/></a>}{attachments.length>0&&<section aria-label="Notice attachments" className="mt-7 border-t border-[#efeee9] pt-5"><h2 className="flex items-center gap-2 text-sm font-semibold text-[#303a43]"><Paperclip size={16} className="text-[#a13e4c]"/>Attachments</h2><ul className="mt-3 space-y-2">{attachments.map(attachment=><li key={attachment.id}><a href={attachment.url} target="_blank" rel="noreferrer" className="flex min-h-12 items-center gap-3 rounded-xl border border-[#e8e8e4] px-4 py-3 text-sm hover:border-[#e6bfc5]"><Paperclip size={15} className="shrink-0 text-[#a13e4c]"/><span className="min-w-0 flex-1"><b className="block truncate text-[#303a43]">{attachment.file_name}</b><small className="text-xs text-[#79838c]">{formatFileSize(attachment.file_size)}</small></span><Download size={16} className="shrink-0 text-[#a13e4c]"/><span className="sr-only">Download</span></a></li>)}</ul></section>}{attachmentError&&<p role="status" className="mt-5 rounded-lg bg-amber-50 p-3 text-xs text-amber-900">Notice attachments are not available yet. Apply the notice attachment migration in Supabase.</p>}</article></main>;
}
