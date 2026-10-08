export const NOTICE_ATTACHMENT_BUCKET = "campus-notice-attachments";
export const NOTICE_ATTACHMENT_MAX_BYTES = 20 * 1024 * 1024;
export const NOTICE_ATTACHMENT_MAX_COUNT = 5;

export const NOTICE_ATTACHMENT_TYPES = new Map([
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

export function safeNoticeFilename(name) {
    return name.normalize("NFKD").replace(/[^a-zA-Z0-9._-]+/g, "_").replace(/^\.+/, "").slice(-140) || "attachment";
}
