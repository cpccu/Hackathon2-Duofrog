"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FileUp, LoaderCircle, ShieldCheck } from "lucide-react";
import { RESOURCE_BUCKET } from "@/lib/resources/constants";
import { RESOURCE_CATEGORIES } from "@/lib/resources/constants";
import { createClient } from "@/lib/supabase/client";

const maxFileSize = 20 * 1024 * 1024;
const allowedTypes = new Map([
    [".pdf", "application/pdf"],
    [".docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
    [".pptx", "application/vnd.openxmlformats-officedocument.presentationml.presentation"],
    [".xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
    [".txt", "text/plain"],
    [".jpg", "image/jpeg"],
    [".jpeg", "image/jpeg"],
    [".png", "image/png"],
    [".webp", "image/webp"],
]);

function safeFilename(name) {
    return name.normalize("NFKD").replace(/[^a-zA-Z0-9._-]+/g, "_").replace(/^\.+/, "").slice(-120) || "resource";
}

async function validateFile(file) {
    const extension = `.${file.name.split(".").pop()?.toLowerCase()}`;
    if (!allowedTypes.has(extension) || file.type !== allowedTypes.get(extension)) {
        return "Choose a PDF, DOCX, PPTX, XLSX, TXT, JPG, PNG, or WEBP file.";
    }
    if (file.size === 0 || file.size > maxFileSize) return "Choose a file smaller than 20 MB.";

    const bytes = new Uint8Array(await file.slice(0, 16).arrayBuffer());
    const isZip = bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04;
    const isValid = {
        ".pdf": () => new TextDecoder().decode(bytes.slice(0, 5)) === "%PDF-",
        ".docx": () => isZip,
        ".pptx": () => isZip,
        ".xlsx": () => isZip,
        ".txt": () => !bytes.includes(0),
        ".jpg": () => bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff,
        ".jpeg": () => bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff,
        ".png": () => [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((byte, index) => bytes[index] === byte),
        ".webp": () => new TextDecoder().decode(bytes.slice(0, 4)) === "RIFF" && new TextDecoder().decode(bytes.slice(8, 12)) === "WEBP",
    }[extension]();
    if (!isValid) return "The selected file does not match its file type.";
    return "";
}

async function storeResource(supabase, userId, metadata, file) {
    const path = `${userId}/${crypto.randomUUID()}/${safeFilename(file.name)}`;
    const { error: uploadError } = await supabase.storage.from(RESOURCE_BUCKET).upload(path, file, {
        contentType: file.type,
        upsert: false,
    });
    if (uploadError) throw uploadError;

    const { data, error: insertError } = await supabase.from("resources").insert({
        ...metadata,
        storage_path: path,
        uploader_id: userId,
    }).select("id").single();

    if (insertError) {
        await supabase.storage.from(RESOURCE_BUCKET).remove([path]);
        throw insertError;
    }

    return data;
}

const demoResources = [
    {
        title: "Data Structures: Original Revision Notes",
        description: "CampusOS-created demo notes covering arrays, linked lists, stacks, queues, trees, and complexity. Prepared as original sample content for the hackathon demonstration.",
        course: "CSE 221 · Data Structures",
        department: "Computer Science & Engineering",
        category: "Lecture Notes",
        fileName: "cse-221-original-revision-notes.txt",
        body: "CampusOS demo learning file\n\nData Structures: Original Revision Notes\n\nArrays store values in contiguous positions and support constant-time indexed access. Linked lists connect nodes through references and make insertion at a known position efficient.\n\nA stack follows last-in, first-out order. A queue follows first-in, first-out order. A binary search tree can support efficient lookup when balanced.\n\nComplexity reminder: linear search is O(n); binary search on sorted data is O(log n); traversing every node in a tree is O(n).\n\nThese notes were written for a CampusOS demo and are not an official City University handout.\n",
    },
    {
        title: "Calculus I: Original Practice Set",
        description: "A short, original practice set for limits, differentiation, and integration, created for the CampusOS hackathon demo.",
        course: "MAT 111 · Calculus I",
        department: "General Education",
        category: "Question Papers",
        fileName: "mat-111-original-practice-set.txt",
        body: "CampusOS demo learning file\n\nCalculus I: Original Practice Set\n\n1. Evaluate the limit of (x^2 - 9) / (x - 3) as x approaches 3.\n2. Differentiate f(x) = 3x^4 - 2x^2 + 5.\n3. Find the stationary points of f(x) = x^2 - 6x + 8.\n4. Integrate 4x^3 - 2x with respect to x.\n5. Explain in one sentence how the derivative describes the local rate of change.\n\nSuggested approach: show each algebraic step and include the constant of integration.\n\nThis original practice set is a demo and is not an official examination paper.\n",
    },
    {
        title: "Academic Writing: Study Guide",
        description: "An original one-page guide to thesis statements, paragraph structure, source evaluation, and revision for student writing.",
        course: "ENG 101 · Academic Writing",
        department: "English",
        category: "Study Materials",
        fileName: "eng-101-study-guide.txt",
        body: "CampusOS demo learning file\n\nAcademic Writing: Study Guide\n\nA focused thesis makes a specific, arguable claim and gives readers a map of the paper. Build each paragraph around one main point, then support it with evidence and explain how that evidence advances the argument.\n\nEvaluate sources by checking the author's expertise, publication context, evidence, date, and purpose. Keep notes that distinguish quotations from paraphrases and record citation details as you work.\n\nRevision checklist: clarify the argument, improve paragraph order, verify evidence, check citations, and proofread sentence-level errors last.\n\nThis original guide was created for a CampusOS hackathon demo and is not an official course handout.\n",
    },
];

export function ResourceUploadForm({ demoMode = false }) {
    const router = useRouter();
    const [busy, setBusy] = useState(false);
    const [step, setStep] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [selectedFile, setSelectedFile] = useState(null);

    async function submit(event) {
        event.preventDefault();
        setError("");
        setSuccess("");
        const form = new FormData(event.currentTarget);
        const file = form.get("file");
        const title = String(form.get("title") || "").trim();
        const description = String(form.get("description") || "").trim();
        const course = String(form.get("course") || "").trim();
        const department = String(form.get("department") || "").trim();
        const category = String(form.get("category") || "");

        if (!(file instanceof File)) return setError("Choose a resource file to upload.");
        const fileError = await validateFile(file);
        if (fileError) return setError(fileError);
        if (title.length < 2 || title.length > 180) return setError("Title must be between 2 and 180 characters.");
        if (!course || course.length > 160) return setError("Enter a course name up to 160 characters.");
        if (!department || department.length > 160) return setError("Enter a department up to 160 characters.");
        if (!RESOURCE_CATEGORIES.includes(category)) return setError("Choose a valid resource category.");

        setBusy(true);
        setStep("Checking your admin session…");
        try {
            const supabase = createClient();
            const { data: authData, error: authError } = await supabase.auth.getUser();
            if (authError || !authData.user) throw new Error("Your session expired. Sign in again and retry.");

            setStep("Uploading file to secure campus storage…");
            const resource = await storeResource(supabase, authData.user.id, { title, description, course, department, category }, file);
            setStep("Saving resource details…");
            setSuccess("Resource uploaded successfully.");
            router.replace(`/resources/${resource.id}?created=1`);
            router.refresh();
        } catch (caught) {
            setError(caught instanceof Error ? caught.message : "Upload failed. Please try again.");
        } finally {
            setBusy(false);
            setStep("");
        }
    }

    async function seedDemoResources() {
        setBusy(true);
        setError("");
        setSuccess("");
        try {
            const supabase = createClient();
            const { data: authData, error: authError } = await supabase.auth.getUser();
            if (authError || !authData.user) throw new Error("Your session expired. Sign in again and retry.");
            for (let index = 0; index < demoResources.length; index += 1) {
                const item = demoResources[index];
                setStep(`Adding original demo material ${index + 1} of ${demoResources.length}…`);
                const file = new File([item.body], item.fileName, { type: "text/plain" });
                await storeResource(supabase, authData.user.id, {
                    title: item.title,
                    description: item.description,
                    course: item.course,
                    department: item.department,
                    category: item.category,
                }, file);
            }
            setSuccess("Three original demo resources were uploaded to Supabase Storage and published.");
            router.replace("/resources?seeded=1");
            router.refresh();
        } catch (caught) {
            setError(caught instanceof Error ? caught.message : "Demo resources could not be added.");
        } finally {
            setBusy(false);
            setStep("");
        }
    }

    return (
        <div className="mx-auto max-w-3xl px-4 pb-12 pt-7 sm:px-7 sm:pt-9">
            <Link href="/resources" className="inline-flex items-center gap-1.5 text-xs font-medium text-[#697681] hover:text-[#c8102e]"><ArrowLeft size={15} />Back to Resource Hub</Link>
            <div className="mt-5 rounded-3xl border border-[#e9e9e5] bg-white p-5 sm:p-8">
                <div className="flex items-start gap-4"><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#fbecef] text-[#c8102e]"><FileUp size={20} /></span><div><h1 className="text-xl font-semibold text-[#202a35]">{demoMode ? "Add demo study files" : "Upload a resource"}</h1><p className="mt-1 text-sm leading-relaxed text-[#697681]">{demoMode ? "These original, clearly labeled text files are generated for the CampusOS hackathon demo and will be stored in Supabase." : "Share an academic resource with authenticated City University students."}</p></div></div>
                <div className="mt-5 flex gap-3 rounded-xl border border-[#ebe5d8] bg-[#faf8f3] p-3.5 text-xs leading-relaxed text-[#69604e]"><ShieldCheck size={16} className="mt-0.5 shrink-0" /><p>Resource uploads are limited to campus administrators. Students can browse and download published files.</p></div>
                {error && <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
                {success && <p role="status" className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">{success}</p>}

                {demoMode ? (
                    <div className="mt-6"><ul className="space-y-2 text-xs leading-relaxed text-[#66727c]">{demoResources.map((item) => <li key={item.fileName} className="rounded-lg bg-[#f8f7f4] p-3"><b className="text-[#37414a]">{item.title}</b><span className="block">{item.course} · {item.category}</span></li>)}</ul><button type="button" disabled={busy} onClick={seedDemoResources} className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#c8102e] px-4 text-sm font-semibold text-white disabled:cursor-wait disabled:opacity-60">{busy ? <><LoaderCircle size={17} className="animate-spin" />{step || "Adding demo files…"}</> : "Upload 3 original demo resources"}</button></div>
                ) : (
                    <form onSubmit={submit} className="mt-6 space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2"><label className="text-xs font-medium text-[#37414a]">Resource title<input name="title" required minLength={2} maxLength={180} className="mt-1.5 min-h-11 w-full rounded-xl border border-[#deded9] px-3.5 text-sm outline-none focus:border-[#c8102e]" /></label><label className="text-xs font-medium text-[#37414a]">Category<select name="category" required defaultValue="" className="mt-1.5 min-h-11 w-full rounded-xl border border-[#deded9] bg-white px-3.5 text-sm outline-none focus:border-[#c8102e]"><option value="" disabled>Select category</option>{RESOURCE_CATEGORIES.map((item) => <option key={item}>{item}</option>)}</select></label></div>
                        <label className="block text-xs font-medium text-[#37414a]">Description <span className="font-normal text-[#92999e]">(optional)</span><textarea name="description" rows={4} maxLength={5000} className="mt-1.5 w-full rounded-xl border border-[#deded9] px-3.5 py-3 text-sm outline-none focus:border-[#c8102e]" /></label>
                        <div className="grid gap-4 sm:grid-cols-2"><label className="text-xs font-medium text-[#37414a]">Course<input name="course" required maxLength={160} placeholder="e.g. CSE 221 · Data Structures" className="mt-1.5 min-h-11 w-full rounded-xl border border-[#deded9] px-3.5 text-sm outline-none focus:border-[#c8102e]" /></label><label className="text-xs font-medium text-[#37414a]">Department<input name="department" required maxLength={160} placeholder="e.g. Computer Science & Engineering" className="mt-1.5 min-h-11 w-full rounded-xl border border-[#deded9] px-3.5 text-sm outline-none focus:border-[#c8102e]" /></label></div>
                        <label className="block rounded-xl border border-dashed border-[#d9d5cd] bg-[#fbfaf8] p-4 text-xs font-medium text-[#37414a]">Choose a file<input name="file" type="file" required accept=".pdf,.docx,.pptx,.xlsx,.txt,.jpg,.jpeg,.png,.webp" onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)} className="mt-2 block w-full text-xs file:mr-3 file:rounded-lg file:border-0 file:bg-[#f2e9e9] file:px-3 file:py-2 file:text-xs file:font-semibold file:text-[#c8102e]" /><span className="mt-2 block text-[10px] font-normal leading-relaxed text-[#858d92]">PDF, DOCX, PPTX, XLSX, TXT, JPG, PNG, or WEBP · Maximum 20 MB{selectedFile ? ` · Selected: ${selectedFile.name}` : ""}</span></label>
                        <button type="submit" disabled={busy} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#c8102e] px-4 text-sm font-semibold text-white hover:bg-[#a50e26] disabled:cursor-wait disabled:opacity-60">{busy ? <><LoaderCircle size={17} className="animate-spin" />{step}</> : <><FileUp size={17} />Upload resource</>}</button>
                    </form>
                )}
                <p aria-live="polite" className="mt-3 min-h-4 text-center text-xs text-[#697681]">{busy ? step : ""}</p>
            </div>
        </div>
    );
}
