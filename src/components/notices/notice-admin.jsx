"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Paperclip, Trash2, Upload } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
    NOTICE_ATTACHMENT_BUCKET,
    NOTICE_ATTACHMENT_MAX_BYTES,
    NOTICE_ATTACHMENT_MAX_COUNT,
    NOTICE_ATTACHMENT_TYPES,
    safeNoticeFilename,
} from "@/lib/notices/constants";

const categories = ["Academic", "Exams", "Registration", "Campus", "Events", "General"];

function formatFileSize(bytes) {
    return bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function validateAttachment(file) {
    const extension = `.${file.name.split(".").pop()?.toLowerCase()}`;
    if (!NOTICE_ATTACHMENT_TYPES.has(extension) || NOTICE_ATTACHMENT_TYPES.get(extension) !== file.type) {
        return `${file.name}: choose a PDF, DOCX, PPTX, XLSX, TXT, JPG, PNG, or WEBP file.`;
    }
    if (!file.size || file.size > NOTICE_ATTACHMENT_MAX_BYTES) {
        return `${file.name}: each file must be smaller than 20 MB.`;
    }
    return "";
}

export function NoticeAdmin({ notices, attachmentsReady }) {
    const router = useRouter();
    const [editing, setEditing] = useState(null);
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    async function save(event) {
        event.preventDefault();
        const formElement = event.currentTarget;
        const form = new FormData(formElement);
        const files = form.getAll("attachments").filter((value) => value instanceof File && value.size > 0);
        const removeIds = form.getAll("remove_attachment").map(String);
        const keptAttachments = (editing?.attachments || []).filter((attachment) => !removeIds.includes(attachment.id));

        if (!attachmentsReady && files.length) {
            setError("Apply the notice attachment migration in Supabase before uploading files.");
            return;
        }
        if (keptAttachments.length + files.length > NOTICE_ATTACHMENT_MAX_COUNT) {
            setError(`A notice can have up to ${NOTICE_ATTACHMENT_MAX_COUNT} attachments.`);
            return;
        }
        for (const file of files) {
            const validationError = validateAttachment(file);
            if (validationError) {
                setError(validationError);
                return;
            }
        }

        setBusy(true);
        setError("");
        setMessage("");
        const values = {
            title: String(form.get("title") || "").trim(),
            category: String(form.get("category") || ""),
            description: String(form.get("description") || "").trim(),
            priority: String(form.get("priority") || "normal"),
            is_published: form.get("is_published") === "on",
            published_date: form.get("published_date")
                ? new Date(String(form.get("published_date"))).toISOString()
                : new Date().toISOString(),
        };

        const supabase = createClient();
        const uploadedPaths = [];
        const insertedAttachmentIds = [];
        let noticeId = editing?.id;
        let createdNotice = false;

        try {
            const { data: { user }, error: authError } = await supabase.auth.getUser();
            if (authError || !user) throw new Error("Sign in again to manage notices.");

            if (!noticeId) {
                const { data, error: insertError } = await supabase
                    .from("notices")
                    .insert({ ...values, created_by: user.id })
                    .select("id")
                    .single();
                if (insertError) throw insertError;
                noticeId = data.id;
                createdNotice = true;
            }

            for (const file of files) {
                const path = `${user.id}/${noticeId}/${crypto.randomUUID()}-${safeNoticeFilename(file.name)}`;
                const { error: uploadError } = await supabase.storage.from(NOTICE_ATTACHMENT_BUCKET).upload(path, file, {
                    cacheControl: "3600",
                    contentType: file.type,
                    upsert: false,
                });
                if (uploadError) throw uploadError;
                uploadedPaths.push(path);

                const { data, error: metadataError } = await supabase
                    .from("notice_attachments")
                    .insert({
                        notice_id: noticeId,
                        storage_path: path,
                        file_name: file.name.slice(-180),
                        content_type: file.type,
                        file_size: file.size,
                        uploaded_by: user.id,
                    })
                    .select("id")
                    .single();
                if (metadataError) throw metadataError;
                insertedAttachmentIds.push(data.id);
            }

            if (!createdNotice) {
                const { error: updateError } = await supabase.from("notices").update(values).eq("id", noticeId);
                if (updateError) throw updateError;
            }

            let cleanupWarning = "";
            const attachmentsToRemove = (editing?.attachments || []).filter((attachment) => removeIds.includes(attachment.id));
            if (attachmentsToRemove.length) {
                const { error: storageError } = await supabase.storage
                    .from(NOTICE_ATTACHMENT_BUCKET)
                    .remove(attachmentsToRemove.map((attachment) => attachment.storage_path));
                if (storageError) {
                    cleanupWarning = "Notice saved, but one or more old files could not be removed.";
                } else {
                    const { error: metadataError } = await supabase.from("notice_attachments").delete().in("id", removeIds);
                    if (metadataError) cleanupWarning = "Notice saved, but attachment records could not be fully removed.";
                }
            }

            setEditing(null);
            setMessage(cleanupWarning || (editing ? "Notice updated." : "Notice published."));
            router.refresh();
        } catch (caught) {
            if (insertedAttachmentIds.length) {
                await supabase.from("notice_attachments").delete().in("id", insertedAttachmentIds);
            }
            if (uploadedPaths.length) {
                await supabase.storage.from(NOTICE_ATTACHMENT_BUCKET).remove(uploadedPaths);
            }
            if (createdNotice && noticeId) {
                await supabase.from("notices").delete().eq("id", noticeId);
            }
            setError(caught.message || "Notice could not be saved.");
        } finally {
            setBusy(false);
        }
    }

    async function removeAttachment(attachment) {
        if (!window.confirm(`Remove “${attachment.file_name}” from this notice?`)) return;
        setBusy(true);
        setError("");
        try {
            const supabase = createClient();
            const { error: storageError } = await supabase.storage.from(NOTICE_ATTACHMENT_BUCKET).remove([attachment.storage_path]);
            if (storageError) throw storageError;
            const { error: deleteError } = await supabase.from("notice_attachments").delete().eq("id", attachment.id);
            if (deleteError) throw deleteError;
            setEditing((current) => current ? { ...current, attachments: current.attachments.filter((item) => item.id !== attachment.id) } : current);
            setMessage("Attachment removed.");
            router.refresh();
        } catch (caught) {
            setError(caught.message || "Attachment could not be removed.");
        } finally {
            setBusy(false);
        }
    }

    async function remove(notice) {
        if (!window.confirm(`Delete “${notice.title}”?`)) return;
        setBusy(true);
        setError("");
        setMessage("");
        try {
            const supabase = createClient();
            const paths = (notice.attachments || []).map((attachment) => attachment.storage_path);
            if (paths.length) {
                const { error: storageError } = await supabase.storage.from(NOTICE_ATTACHMENT_BUCKET).remove(paths);
                if (storageError) throw storageError;
            }
            const { error: deleteError } = await supabase.from("notices").delete().eq("id", notice.id);
            if (deleteError) throw deleteError;
            setMessage("Notice deleted.");
            router.refresh();
        } catch (caught) {
            setError(caught.message || "Notice could not be deleted.");
        } finally {
            setBusy(false);
        }
    }

    return <div className="mx-auto max-w-5xl px-4 py-8 sm:px-7">
        <a href="/dashboard" className="text-xs text-[#c8102e]">Campus Pulse</a>
        <h1 className="mt-4 text-3xl font-semibold text-[#202a35]">Manage notices</h1>
        <p className="mt-2 text-sm text-[#697681]">Create, update, and remove official campus notices.</p>
        {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</p>}
        {message && <p role="status" className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900">{message}</p>}
        {!attachmentsReady && <p role="status" className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">Notice files are disabled until you apply <code>20261008080000_notice_attachments.sql</code> in Supabase.</p>}

        <form key={editing?.id || "new-notice"} onSubmit={save} className="mt-6 space-y-4 rounded-2xl border border-[#e8e8e4] bg-white p-5">
            <h2 className="font-semibold">{editing ? "Edit notice" : "Create a notice"}</h2>
            <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-xs">Title<input name="title" required minLength={4} maxLength={180} defaultValue={editing?.title || ""} className="mt-1 block h-11 w-full rounded-lg border px-3 text-sm" /></label>
                <label className="text-xs">Category<select name="category" defaultValue={editing?.category || "General"} className="mt-1 block h-11 w-full rounded-lg border bg-white px-3 text-sm">{categories.map((value) => <option key={value}>{value}</option>)}</select></label>
                <label className="text-xs">Priority<select name="priority" defaultValue={editing?.priority || "normal"} className="mt-1 block h-11 w-full rounded-lg border bg-white px-3 text-sm"><option value="normal">Normal</option><option value="important">Important</option><option value="urgent">Urgent</option></select></label>
                <label className="text-xs">Publish date/time<input type="datetime-local" name="published_date" defaultValue={editing ? new Date(new Date(editing.published_date).getTime() - new Date(editing.published_date).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ""} className="mt-1 block h-11 w-full rounded-lg border px-3 text-sm" /></label>
            </div>
            <label className="block text-xs">Details<textarea name="description" required minLength={10} maxLength={8000} defaultValue={editing?.description || ""} rows={5} className="mt-1 w-full rounded-lg border p-3 text-sm" /></label>

            {editing?.attachments?.length > 0 && <fieldset className="rounded-xl border border-[#e8e8e4] p-3">
                <legend className="px-1 text-xs font-medium">Current attachments</legend>
                <ul className="space-y-2">{editing.attachments.map((attachment) => <li key={attachment.id} className="flex flex-wrap items-center gap-2 text-xs">
                    <Paperclip size={14} className="shrink-0 text-[#a13e4c]" />
                    <span className="min-w-0 flex-1 truncate">{attachment.file_name} · {formatFileSize(attachment.file_size)}</span>
                    <button type="button" disabled={busy} onClick={() => removeAttachment(attachment)} className="inline-flex items-center gap-1 rounded-md px-2 py-1 font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"><Trash2 size={13} />Remove</button>
                </li>)}</ul>
            </fieldset>}

            <label className="block text-xs">Attachments <span className="text-[#79838c]">(up to {NOTICE_ATTACHMENT_MAX_COUNT} files, 20 MB each)</span>
                <span className="mt-1 flex min-h-12 items-center gap-2 rounded-lg border border-dashed border-[#d8d5d1] bg-[#fcfbfa] px-3 text-sm text-[#697681]"><Upload size={16} className="shrink-0 text-[#a13e4c]" /><input disabled={busy || !attachmentsReady} type="file" name="attachments" multiple accept=".pdf,.docx,.pptx,.xlsx,.txt,.jpg,.jpeg,.png,.webp" className="min-w-0 flex-1 text-xs file:mr-3 file:rounded-md file:border-0 file:bg-[#f9eff0] file:px-3 file:py-2 file:text-xs file:font-semibold file:text-[#a50e26] disabled:opacity-50" /></span>
                <span className="mt-1 block text-[10px] text-[#79838c]">PDF, DOCX, PPTX, XLSX, TXT, JPG, PNG, or WEBP</span>
            </label>
            <label className="flex items-center gap-2 text-xs"><input type="checkbox" name="is_published" defaultChecked={editing ? editing.is_published : true} />Published</label>
            <div className="flex flex-wrap gap-2"><button disabled={busy} className="min-h-10 rounded-lg bg-[#c8102e] px-4 text-sm font-semibold text-white disabled:opacity-50">{busy ? "Saving…" : editing ? "Save changes" : "Publish notice"}</button>{editing && <button type="button" disabled={busy} onClick={() => setEditing(null)} className="min-h-10 rounded-lg border px-4 text-sm disabled:opacity-50">Cancel edit</button>}</div>
        </form>

        <h2 className="mt-8 text-lg font-semibold">All notices</h2>
        <ul className="mt-3 space-y-2">{notices.map((notice) => <li key={notice.id} className="flex flex-wrap items-center gap-3 rounded-xl border bg-white p-4">
            <div className="min-w-0 flex-1"><b className="block truncate text-sm">{notice.title}</b><span className="text-xs text-[#75808a]">{notice.category} · {notice.priority} · {notice.is_published ? "Published" : "Draft"}</span>{notice.attachments?.length > 0 && <span className="mt-1 flex items-center gap-1 text-[10px] text-[#697681]"><FileText size={12} />{notice.attachments.length} attachment{notice.attachments.length === 1 ? "" : "s"}</span>}</div>
            <button type="button" disabled={busy} onClick={() => { setEditing(notice); setMessage(""); setError(""); }} className="text-xs font-semibold text-[#c8102e] disabled:opacity-50">Edit</button>
            <button type="button" disabled={busy} onClick={() => remove(notice)} className="text-xs font-semibold text-red-700 disabled:opacity-50">Delete</button>
        </li>)}</ul>
        {!notices.length && <p className="mt-3 rounded-xl border border-dashed p-6 text-sm text-[#697681]">No notices have been created.</p>}
    </div>;
}
