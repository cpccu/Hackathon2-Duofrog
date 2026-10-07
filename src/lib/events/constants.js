export const EVENT_TYPES = ["Technical", "Academic", "Cultural", "Sports", "Career", "Workshop", "Community", "Other"];

export function campusDate() {
    return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Dhaka", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

export function eventDateLabel(value, options = { weekday: "short", month: "short", day: "numeric", year: "numeric" }) {
    if (!value) return "Date to be announced";
    const date = new Date(`${value}T12:00:00+06:00`);
    if (Number.isNaN(date.getTime())) return String(value);
    return new Intl.DateTimeFormat("en", { ...options, timeZone: "Asia/Dhaka" }).format(date);
}

export function timeLabel(value) {
    if (!value) return "";
    const date = new Date(`1970-01-01T${String(value).slice(0, 8)}+06:00`);
    if (Number.isNaN(date.getTime())) return String(value);
    return new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Dhaka" }).format(date);
}
