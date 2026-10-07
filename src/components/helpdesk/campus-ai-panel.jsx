"use client";

import { useState } from "react";
import { ExternalLink, Send } from "lucide-react";

export function CampusAiPanel() {
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function ask(event) {
    event.preventDefault();
    setLoading(true); setError(""); setResult(null);
    try {
      const response = await fetch("/api/helpdesk/ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "CampusAI could not answer right now.");
      setResult(data);
    } catch (cause) { setError(cause.message || "CampusAI could not answer right now."); }
    finally { setLoading(false); }
  }

  return <div className="mt-4"><form onSubmit={ask} className="flex flex-col gap-2 sm:flex-row"><label className="sr-only" htmlFor="campus-ai-question">Ask CampusAI</label><input id="campus-ai-question" value={question} onChange={event=>setQuestion(event.target.value)} minLength={5} maxLength={800} required placeholder="Ask about exams, registration, transport…" className="h-12 min-w-0 flex-1 rounded-xl border border-white/30 bg-white px-4 text-sm text-[#26313a] placeholder:text-[#92999e] outline-none focus:border-white"/><button disabled={loading} className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#f3e9e7] px-5 text-sm font-semibold text-[#762c3a] disabled:opacity-60">{loading ? "Checking sources…" : "Ask CampusAI"}<Send size={15}/></button></form><p className="mt-2 text-[11px] text-white/65">Answers use published CampusOS helpdesk records. If the records do not cover a question, CampusAI will say so.</p>{loading&&<p role="status" className="mt-3 text-sm text-white">Searching CampusOS information…</p>}{error&&<p role="alert" className="mt-3 rounded-xl bg-white/10 p-3 text-sm text-white">{error}</p>}{result&&<div aria-live="polite" className="mt-4 rounded-2xl bg-white p-4 text-[#303a43]"><p className="whitespace-pre-line text-sm leading-6">{result.answer}</p>{result.sources?.length>0&&<div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">{result.sources.map(source=><a key={source.id} href={source.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-[#762c3a]">{source.label}<ExternalLink size={12}/></a>)}</div>}</div>}</div>;
}
