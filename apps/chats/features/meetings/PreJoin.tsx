"use client";
import {geometryClass} from "@/lib/geometry";

/**
 * SOMION HQ - PRE-JOIN
 *
 * The device check before a call. The microphone meter is a real analyser on a
 * real input, because "is my mic working" is the question this screen exists to
 * answer and a fake bar answers it wrongly.
 *
 * Every failure is recoverable: blocked camera, no camera, blocked microphone.
 * None of them prevent joining, because audio-first is the product's default
 * and a declined permission must never be a dead end.
 */

import { useState } from "react";
import { VideoCamera, VideoCameraSlash, Warning } from "@phosphor-icons/react";
import { Avatar } from "@/components/ui/Avatar";
import { Button, Field } from "@/components/ui/Primitives";
import { useCamera, useMicLevel, useStreamRef } from "./useMedia";
import { useMe } from "@/store/hooks";
import { useT } from "@/lib/i18n";

interface PreJoinProps {
  title: string;
  subtitle?: string;
  /** Guests type a name; members already have one. */
  askForName?: boolean;
  recordingNotice?: boolean;
  /** The name a guest typed, and the devices the person chose here, which the call keeps. */
  onJoin: (name?: string, devices?: { mic: boolean; camera: boolean }) => void;
  joinLabel: string;
}

export function PreJoin({
  title,
  subtitle,
  askForName,
  recordingNotice,
  onJoin,
  joinLabel,
}: PreJoinProps) {
  const camera = useCamera();
  const videoRef = useStreamRef(camera.stream);
  const [micOn, setMicOn] = useState(true);
  const { level, error: micError } = useMicLevel(micOn);
  const me = useMe();
  const t = useT();
  const [name, setName] = useState("");

  const canJoin = !askForName || name.trim().length > 1;

  return (
    <div className="mx-auto w-full max-w-[720px] px-5 py-8">
      <h1 className={"text-title-sm font-semibold tracking-[-0.02em] "+("ch-color-var---color-ink")} >
        {title}
      </h1>
      {subtitle && (
        <p className={"mt-1 text-body-sm "+("ch-color-var---color-ink-muted")} >
          {subtitle}
        </p>
      )}

      <div className="mt-5 grid gap-5 md:grid-cols-[1fr_240px]">
        <div
          className={"relative aspect-[4/3] overflow-hidden "+("ch-background-var---color-paper-800"+' '+"ch-border-radius-var---radius-card")}

        >
          {camera.stream ? (
            <video
              ref={videoRef}
              muted
              playsInline
              className={"h-full w-full object-cover "+("ch-transform-scaleX--1")}

              aria-label={t("call.yourCamera", "Your camera")}
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-3">
              <Avatar
                name={askForName ? name || "Guest" : me.name}
                initials={askForName ? initialsOf(name) : me.initials}
                tint={askForName ? 3 : me.tint}
                size={56}
                hideStatus
                guest={askForName}
              />
              <p className={"max-w-[240px] px-4 text-center text-body-sm "+("ch-color-var---color-paper-500")} >
                {camera.error === "denied"
                  ? t("prejoin.cameraDenied", "Your browser blocked the camera. You can still join with audio.")
                  : camera.error === "missing"
                    ? t("prejoin.cameraMissing", "No camera found. You can still join with audio.")
                    : t("prejoin.cameraOff", "Camera is off. Meetings here are audio-first.")}
              </p>
            </div>
          )}

          <div className="absolute bottom-3 start-3 flex gap-1.5">
            <Button
              size="sm"
              onClick={() => (camera.stream ? camera.stop() : void camera.start())}
              className={"ch-background-var---color-paper-900"+' '+"ch-color-var---color-paper-100"+' '+"ch-border-color-transparent"}
            >
              {camera.stream ? (
                <>
                  <VideoCamera size={13} weight="fill" aria-hidden="true" />
                  {t("prejoin.cameraOnLabel", "Camera on")}
                </>
              ) : (
                <>
                  <VideoCameraSlash size={13} aria-hidden="true" />
                  {t("prejoin.turnOnCamera", "Turn on camera")}
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {askForName && (
            <Field
              label={t("prejoin.yourName", "Your name")}
              hint={t("prejoin.nameHint", "Shown to everyone in the meeting")}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("prejoin.namePlaceholder", "First and last name")}
              autoFocus
            />
          )}

          <div className="flex flex-col gap-2">
            <span className={"text-body-sm font-medium "+("ch-color-var---color-ink")} >
              {t("prejoin.microphone", "Microphone")}
            </span>

            {micError ? (
              <p className={"flex items-start gap-1.5 text-caption "+("ch-color-var---color-ink-muted")} >
                <Warning size={13} aria-hidden="true" className={"ch-margin-top-2px"+' '+"ch-flex-shrink-0"}  />
                {t("prejoin.micDenied", "Microphone blocked. Others will not hear you until you allow it.")}
              </p>
            ) : (
              <>
                {/* A real meter on a real input. Speak and it moves. */}
                <div
                  className={"flex h-2 w-full overflow-hidden "+("ch-background-var---color-surface-sunken"+' '+"ch-border-radius-var---radius-chip")}

                  role="meter"
                  aria-label={t("prejoin.micLevel", "Microphone level")}
                  aria-valuenow={Math.round(level * 100)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <span
                    className={("w-full origin-left rtl:origin-right ch-background-var---color-presence-available"+' '+"ch-transition-transform-90ms-linear")+" "+(geometryClass({transform:`scaleX(${Math.min(1, level * 1.8)})`}))}
                  />
                </div>
                <p className={"text-caption "+("ch-color-var---color-ink-subtle")} >
                  {t("prejoin.saySomething", "Say something to check the level.")}
                </p>
              </>
            )}

            <Button size="sm" onClick={() => setMicOn((m) => !m)} aria-pressed={micOn}>
              {micOn ? t("prejoin.micOn", "Microphone on") : t("prejoin.micOff", "Microphone off")}
            </Button>
          </div>

          {recordingNotice && (
            <p
              className={"px-2.5 py-2 text-caption "+("ch-background-var---color-surface-sunken"+' '+"ch-border-radius-var---radius-control"+' '+"ch-color-var---color-ink-muted")}

            >
              {t("prejoin.recordingNotice", "This meeting may be recorded. You will be asked before it starts.")}
            </p>
          )}

          <Button
            variant="primary"
            onClick={() => onJoin(askForName ? name.trim() : undefined, { mic: micOn, camera: Boolean(camera.stream) })}
            disabled={!canJoin}
          >
            {joinLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

function initialsOf(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "G";
  return trimmed
    .split(" ")
    .map((p) => p[0] ?? "")
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
