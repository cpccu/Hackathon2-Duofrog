"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Camera, CheckCircle2, LoaderCircle, RotateCcw, ScanLine, XCircle } from "lucide-react";

const outcomeText = {
    already_checked_in: "Already checked in",
    invalid_qr: "Invalid QR code",
    wrong_event: "This QR registration belongs to another event.",
    not_registered: "This student does not have an active registration.",
    checkin_closed: "Check-in is closed for this event.",
    unauthorized: "You are not authorized to check in attendees for this event.",
};

export function EventCheckinScanner({ eventId, initialRegistered, initialCheckedIn }) {
    const router = useRouter();
    const videoRef = useRef(null);
    const controlsRef = useRef(null);
    const busyRef = useRef(false);
    const [cameraState, setCameraState] = useState("idle");
    const [cameraError, setCameraError] = useState("");
    const [scanning, setScanning] = useState(false);
    const [manualToken, setManualToken] = useState("");
    const [busy, setBusy] = useState(false);
    const registeredCount = initialRegistered;
    const [checkedInCountOverride, setCheckedInCountOverride] = useState(null);
    const checkedInCount = Math.max(initialCheckedIn, checkedInCountOverride ?? initialCheckedIn);
    const [result, setResult] = useState(null);

    useEffect(() => {
        setCheckedInCount(initialCheckedIn);
    }, [initialCheckedIn]);

    const submitToken = useCallback(async (rawToken) => {
        const token = String(rawToken || "").trim();
        if (!token || busyRef.current) return;
        busyRef.current = true;
        setBusy(true);
        setResult(null);
        try {
            const response = await fetch(`/api/events/${encodeURIComponent(eventId)}/check-in`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token }),
            });
            const data = await response.json();
            setResult(data);
            if (data.outcome === "checked_in") {
                if (typeof data.checked_in_count === "number") setCheckedInCountOverride(data.checked_in_count);
                else setCheckedInCountOverride((count) => Math.max(initialCheckedIn, count ?? initialCheckedIn) + 1);
                setManualToken("");
                setScanning(false);
                router.refresh();
            } else if (data.outcome === "already_checked_in") {
                if (typeof data.checked_in_count === "number") setCheckedInCountOverride(data.checked_in_count);
                setScanning(false);
            }
        } catch {
            setResult({ outcome: "error", message: "The check-in service could not be reached. Try again." });
        } finally {
            busyRef.current = false;
            setBusy(false);
        }
    }, [eventId, initialCheckedIn, router]);

    useEffect(() => {
        if (!scanning || !videoRef.current) return undefined;
        let active = true;
        setCameraState("starting");
        setCameraError("");
        import("@zxing/browser").then(({ BrowserMultiFormatReader }) => {
            if (!active || !videoRef.current) return;
            const reader = new BrowserMultiFormatReader();
            reader.decodeFromConstraints(
                { audio: false, video: { facingMode: { ideal: "environment" } } },
                videoRef.current,
                (scanResult, scanError, controls) => {
                    controlsRef.current = controls;
                    if (!active) return;
                    if (scanResult) {
                        controls.stop();
                        setCameraState("idle");
                        setScanning(false);
                        submitToken(scanResult.getText());
                    } else if (scanError?.name === "NotAllowedError" || scanError?.name === "NotReadableError") {
                        setCameraError("Camera access was denied or no camera is available. Use the token field below.");
                        setCameraState("error");
                        setScanning(false);
                    }
                },
            ).then((controls) => {
                controlsRef.current = controls;
                if (active) setCameraState("ready");
                else controls.stop();
            }).catch((error) => {
                if (!active) return;
                setCameraError(error?.name === "NotAllowedError" ? "Camera permission was denied. Use the token field below." : "The camera could not start. Use the token field below.");
                setCameraState("error");
                setScanning(false);
            });
        }).catch(() => {
            if (active) {
                setCameraError("The QR scanner could not load. Use the token field below.");
                setCameraState("error");
                setScanning(false);
            }
        });
        return () => {
            active = false;
            controlsRef.current?.stop();
            controlsRef.current = null;
        };
    }, [scanning, submitToken]);

    function resetScan() {
        setResult(null);
        setCameraError("");
        setManualToken("");
        setScanning(false);
    }

    const successful = result?.outcome === "checked_in";
    const duplicate = result?.outcome === "already_checked_in";
    const invalid = ["invalid_qr", "wrong_event", "not_registered"].includes(result?.outcome);

    return (
        <section className="rounded-2xl border border-[#e9e9e5] bg-white p-4 sm:p-6">
            <div className="mb-4"><p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#a13e4c]">Organizer scanner</p><h2 className="mt-1 text-lg font-semibold text-[#202a35]">Scan attendee QR</h2><p className="mt-1 text-xs leading-relaxed text-[#74808a]">Each scan is checked against the signed-in organizer, event, and active registration in Supabase.</p></div>
            <div className="overflow-hidden rounded-2xl border border-[#e9e9e5] bg-[#f7f6f3]">
                {scanning ? <div className="relative aspect-video min-h-56"><video ref={videoRef} className="absolute inset-0 size-full object-cover" muted playsInline aria-label="Camera QR scanner"/><div className="pointer-events-none absolute inset-[12%] rounded-2xl border-2 border-white shadow-[0_0_0_999px_rgba(23,33,42,.18)]"/><span className="absolute bottom-3 left-3 rounded-full bg-black/60 px-3 py-1.5 text-[10px] text-white">{cameraState === "starting" ? "Starting camera..." : "Point the camera at the attendee QR"}</span></div> : <div className="grid min-h-44 place-items-center p-5 text-center"><div><span className="mx-auto grid size-12 place-items-center rounded-2xl bg-white text-[#c8102e]"><ScanLine size={22}/></span><p className="mt-3 text-xs text-[#697681]">Camera scanning is available on secure origins such as localhost or HTTPS.</p></div></div>}
            </div>
            {cameraError && <p role="alert" className="mt-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900"><AlertCircle size={15} className="mt-0.5 shrink-0"/>{cameraError}</p>}
            {result && <div role={successful ? "status" : "alert"} className={`mt-4 rounded-xl border p-4 ${successful ? "border-emerald-200 bg-emerald-50" : duplicate ? "border-amber-200 bg-amber-50" : "border-red-200 bg-red-50"}`}>
                <div className="flex items-start gap-2.5">{successful ? <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-700" size={18}/> : duplicate ? <AlertCircle className="mt-0.5 shrink-0 text-amber-700" size={18}/> : <XCircle className="mt-0.5 shrink-0 text-red-700" size={18}/>}<div><p className={`text-sm font-semibold ${successful ? "text-emerald-950" : duplicate ? "text-amber-950" : "text-red-950"}`}>{successful ? "Checked in successfully" : outcomeText[result.outcome] || result.message || "Check-in failed"}</p>{(result.student_name || result.student_id || result.registration_id) && <p className="mt-1 text-xs text-[#4d5861]">{result.student_name || `Registration ${String(result.registration_id || "").slice(0, 8)}`}{result.student_id ? ` · ${result.student_id}` : ""}</p>}{(successful || duplicate) && result.checked_in_at && <p className="mt-1 text-[10px] text-[#697681]">{duplicate ? "Previous check-in" : "Checked in"} {new Date(result.checked_in_at).toLocaleTimeString("en", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Dhaka" })}</p>}</div></div>
            </div>}
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <button type="button" onClick={() => { resetScan(); setScanning(true); }} disabled={busy} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#c8102e] px-4 text-xs font-semibold text-white disabled:opacity-60"><Camera size={16}/>{scanning ? "Restart camera" : "Start camera scan"}</button>
                {(result || cameraError) && <button type="button" onClick={resetScan} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#e5e3de] px-4 text-xs font-semibold text-[#4d5861]"><RotateCcw size={15}/>Scan again</button>}
            </div>
            <form onSubmit={(event) => { event.preventDefault(); submitToken(manualToken); }} className="mt-5 border-t border-[#efeee9] pt-4">
                <label htmlFor="manual-token" className="text-xs font-semibold text-[#37414a]">Camera unavailable? Enter the attendee token</label>
                <div className="mt-2 flex flex-col gap-2 sm:flex-row"><input id="manual-token" value={manualToken} onChange={(event) => setManualToken(event.target.value)} autoComplete="off" spellCheck="false" maxLength={128} placeholder="Paste the private QR token" className="min-h-11 min-w-0 flex-1 rounded-xl border border-[#deded9] px-3.5 font-mono text-xs outline-none focus:border-[#c8102e]"/><button type="submit" disabled={busy || !/^[0-9a-f]{64}$/.test(manualToken.trim())} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#e5e3de] px-4 text-xs font-semibold text-[#4d5861] disabled:cursor-not-allowed disabled:opacity-50">{busy ? <LoaderCircle size={15} className="animate-spin"/> : null}{busy ? "Validating..." : "Validate token"}</button></div>
                <p className="mt-2 text-[10px] text-[#92999e]">Manual entry uses the same server-side validation as camera scans.</p>
            </form>
            <div className="mt-5 grid grid-cols-3 gap-2 sm:gap-3"><div className="rounded-xl bg-[#f7f6f3] p-3"><p className="text-[10px] text-[#74808a]">Registered</p><p className="mt-1 text-lg font-semibold text-[#202a35]">{registeredCount}</p></div><div className="rounded-xl bg-emerald-50 p-3"><p className="text-[10px] text-emerald-800">Checked in</p><p className="mt-1 text-lg font-semibold text-emerald-950">{checkedInCount}</p></div><div className="rounded-xl bg-[#f7f6f3] p-3"><p className="text-[10px] text-[#74808a]">Remaining</p><p className="mt-1 text-lg font-semibold text-[#202a35]">{Math.max(registeredCount - checkedInCount, 0)}</p></div></div>
        </section>
    );
}
