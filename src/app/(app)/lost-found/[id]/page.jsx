import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { requireAuthenticatedUser } from "@/lib/auth/guards";

export default async function LostFoundItemPage({params}){
  const {supabase}=await requireAuthenticatedUser("/lost-found");const {id}=await params;
  const {data,error}=await supabase.from("lost_found_items").select("id,item_type,title,description,storage_path,photo_url,location,item_date,contact_information,status,created_at").eq("id",id).maybeSingle();
  if(error||!data)notFound();
  let photoUrl=data.photo_url;
  if(data.storage_path){const {data:signed}=await supabase.storage.from("campus-lost-found").createSignedUrl(data.storage_path,3600);photoUrl=signed?.signedUrl||null;}
  return <main className="mx-auto max-w-3xl px-4 py-9 sm:px-7"><Link href="/lost-found" className="text-xs font-semibold text-[#c8102e]">All Lost &amp; Found posts</Link><article className="mt-5 overflow-hidden rounded-3xl border border-[#e8e8e4] bg-white">{photoUrl&&<Image src={photoUrl} alt={`Photo of ${data.title}`} width={1200} height={800} unoptimized className="max-h-[28rem] w-full object-cover"/>}<div className="p-6 sm:p-9"><div className="flex items-center gap-2"><span className="rounded-full bg-[#f9eff0] px-3 py-1 text-xs font-semibold uppercase text-[#c8102e]">{data.item_type}</span><span className="text-xs capitalize text-[#5e6a74]">{data.status}</span></div><h1 className="mt-4 text-2xl font-semibold text-[#202a35] sm:text-3xl">{data.title}</h1><p className="mt-5 whitespace-pre-wrap text-sm leading-7 text-[#48545d]">{data.description}</p><dl className="mt-6 grid gap-4 border-t pt-5 sm:grid-cols-2"><div><dt className="text-[11px] font-bold uppercase tracking-wide text-[#a13e4c]">Location</dt><dd className="mt-1 text-sm text-[#303a43]">{data.location}</dd></div><div><dt className="text-[11px] font-bold uppercase tracking-wide text-[#a13e4c]">Date</dt><dd className="mt-1 text-sm text-[#303a43]">{new Date(`${data.item_date}T12:00:00`).toLocaleDateString("en",{dateStyle:"long",timeZone:"Asia/Dhaka"})}</dd></div><div className="sm:col-span-2"><dt className="text-[11px] font-bold uppercase tracking-wide text-[#a13e4c]">Contact / claim information</dt><dd className="mt-1 whitespace-pre-wrap text-sm text-[#303a43]">{data.contact_information}</dd></div></dl></div></article></main>;
}
