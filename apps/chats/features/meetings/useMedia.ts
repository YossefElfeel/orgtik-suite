"use client";

/**
 * SOMION HQ - REAL DEVICE MEDIA
 *
 * The camera and the screen share are genuinely real. They are the two moments
 * in the demo where a viewer can tell instantly whether they are looking at a
 * picture of a product or a product, so faking them would defeat the purpose.
 *
 * There is still NO WebRTC here: nothing is transmitted anywhere. Local
 * capture only. Remote participants are represented as audio-first tiles,
 * which is also what the product does by default - rooms are audio-first and
 * the camera is optional.
 *
 * Every failure path is handled, because a permission prompt getting declined
 * in front of a founder must not end the demo.
 */

import { useCallback, useEffect, useRef, useState } from "react";

export type MediaError = "denied" | "missing" | "unsupported" | null;

export function useCamera() {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<MediaError>(null);
  const [starting, setStarting] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setStream(null);
  }, []);

  const start = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setError("unsupported");
      return;
    }
    setStarting(true);
    setError(null);
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      streamRef.current = s;
      setStream(s);
    } catch (e) {
      const name = e instanceof DOMException ? e.name : "";
      setError(name === "NotFoundError" || name === "OverconstrainedError" ? "missing" : "denied");
    } finally {
      setStarting(false);
    }
  }, []);

  /* Tracks are released on unmount, always. A camera light left on after
     leaving a call is the fastest way to lose a user's trust. */
  useEffect(() => stop, [stop]);

  return { stream, error, starting, start, stop };
}

export function useScreenShare() {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<MediaError>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setStream(null);
  }, []);

  const start = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getDisplayMedia) {
      setError("unsupported");
      return;
    }
    setError(null);
    try {
      const s = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      streamRef.current = s;
      setStream(s);
      /* Stopping from the browser's own share bar must end it here too. */
      s.getVideoTracks()[0]?.addEventListener("ended", () => {
        streamRef.current = null;
        setStream(null);
      });
    } catch {
      setError("denied");
    }
  }, []);

  useEffect(() => stop, [stop]);

  return { stream, error, start, stop };
}

/** Attaches a MediaStream to a video element and keeps them in sync. */
export function useStreamRef(stream: MediaStream | null) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.srcObject = stream;
    if (stream) void el.play().catch(() => undefined);
  }, [stream]);
  return ref;
}

/** Live microphone level, 0 to 1, for the pre-join meter. Real, not simulated. */
export function useMicLevel(active: boolean) {
  const [level, setLevel] = useState(0);
  const [error, setError] = useState<MediaError>(null);

  useEffect(() => {
    if (!active) {
      setLevel(0);
      return;
    }
    let ctx: AudioContext | null = null;
    let raf = 0;
    let stream: MediaStream | null = null;
    let cancelled = false;

    const run = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        ctx = new AudioContext();
        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 512;
        source.connect(analyser);
        const data = new Uint8Array(analyser.frequencyBinCount);

        const tick = () => {
          analyser.getByteTimeDomainData(data);
          let peak = 0;
          for (let i = 0; i < data.length; i++) {
            peak = Math.max(peak, Math.abs((data[i] ?? 128) - 128) / 128);
          }
          setLevel((prev) => prev * 0.7 + peak * 0.3);
          raf = requestAnimationFrame(tick);
        };
        tick();
      } catch {
        setError("denied");
      }
    };
    void run();

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
      void ctx?.close();
    };
  }, [active]);

  return { level, error };
}
