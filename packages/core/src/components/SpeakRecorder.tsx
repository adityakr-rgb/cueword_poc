"use client";
import { useEffect, useRef, useState } from "react";

type RecState = "idle" | "recording" | "recorded" | "error";

const fmt = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

/** Turn a getUserMedia failure into a short, kid-friendly line. */
function micError(err: unknown): string {
  const name = err instanceof DOMException ? err.name : "";
  if (name === "NotAllowedError" || name === "SecurityError")
    return "Microphone blocked. Allow mic access for this site, then tap again.";
  if (name === "NotFoundError" || name === "OverconstrainedError")
    return "No microphone found. Plug one in and try again.";
  // NotReadableError / TrackStartError — device held by another app.
  if (name === "NotReadableError" || name === "AbortError")
    return "Couldn't open the mic. Close other apps using it, then tap again.";
  return "Couldn't start recording. Tap to try again.";
}

/**
 * The live-class "speak" recorder. Captures the local mic with MediaRecorder
 * and keeps the take right here for playback — nothing is uploaded.
 *
 * Mic sharing: macOS/Windows let the browser open the same physical mic that
 * Zoom is already using in another window, so recording here works while the
 * Zoom call is live. We release the track as soon as we stop so we don't hold
 * the device open afterwards.
 */
export default function SpeakRecorder() {
  const [state, setState] = useState<RecState>("idle");
  const [secs, setSecs] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState("");

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const urlRef = useRef<string | null>(null);

  // Tick the on-screen timer while recording.
  useEffect(() => {
    if (state !== "recording") return;
    const t = setInterval(() => setSecs((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [state]);

  // Drop the mic and any blob URL if the step unmounts mid-take.
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    };
  }, []);

  async function start() {
    setError("");
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Recording needs a secure (https) connection.");
      setState("error");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      // Clear any previous take.
      if (urlRef.current) {
        URL.revokeObjectURL(urlRef.current);
        urlRef.current = null;
        setAudioUrl(null);
      }

      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        const url = URL.createObjectURL(blob);
        urlRef.current = url;
        setAudioUrl(url);
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        setState("recorded");
      };
      recorder.start();
      recorderRef.current = recorder;
      setSecs(0);
      setState("recording");
    } catch (err) {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      setError(micError(err));
      setState("error");
    }
  }

  function stop() {
    recorderRef.current?.stop();
  }

  if (state === "recording") {
    return (
      <button type="button" className="ge-mic ge-mic-rec" onClick={stop}>
        <span className="ge-mic-dot" />
        Recording… {fmt(secs)} · tap to stop
      </button>
    );
  }

  if (state === "recorded" && audioUrl) {
    return (
      <div className="ge-mic-result">
        <audio className="ge-mic-audio" src={audioUrl} controls />
        <button type="button" className="ge-mic" onClick={start}>
          <span className="ge-mic-icon">🎙️</span> Record again
        </button>
      </div>
    );
  }

  return (
    <div className="ge-mic-result">
      <button type="button" className="ge-mic" onClick={start}>
        <span className="ge-mic-icon">🎙️</span> Tap to record
      </button>
      {state === "error" && <div className="ge-mic-err">{error}</div>}
    </div>
  );
}
