"use client";

/**
 * SOMION HQ - AVATAR + PRESENCE MARK
 *
 * The atomic unit of presence across the whole suite. This component is the one
 * the design plan says ships to the shared design system so the same dot can
 * appear on an assignee in Task Manager and a contact in the CRM.
 *
 * Sizes 20 / 28 / 40 / 56 as specified. Six states, each with its own MARK
 * SHAPE as well as its own hue, so status never depends on colour alone.
 */

import {Avatar as LibAvatar,AvatarGroup} from "@orgtik/ui";
import { memo } from "react";
import type { Status } from "@/entities";
import { STATUS_META, tintFor } from "@/lib/presence";
import { useT } from "@/lib/i18n";

export type AvatarSize = 20 | 28 | 40 | 56;

interface AvatarProps {
  name: string;
  initials: string;
  tint: number;
  status?: Status;
  size?: AvatarSize;
  /** Draws the concentric speaking ring. Only true while audio is flowing. */
  speaking?: boolean;
  /** Guests get a dashed outline so they are never mistaken for colleagues. */
  guest?: boolean;
  /** Hides the presence mark - used inside lists that show status as text. */
  hideStatus?: boolean;
  className?: string;
}

const MARK_SIZE: Record<AvatarSize, number> = { 20: 7, 28: 9, 40: 12, 56: 16 };
const FONT_SIZE: Record<AvatarSize, string> = {
  20: "9px",
  28: "11px",
  40: "14px",
  56: "19px",
};

/**
 * The six marks. Drawn rather than imported because no icon library ships a
 * presence vocabulary, and these are data marks, not decorative icons.
 * Every shape is legible at 7px, which is the real constraint.
 */
export function PresenceMark({ status, px }: { status: Status; px: number }) {
  const meta = STATUS_META[status];
  const c = meta.color;
  const half = px / 2;

  return (
    <svg
      width={px}
      height={px}
      viewBox="0 0 16 16"
      aria-hidden="true"
      className={"ch-display-2a1b75"} 
    >
      {/* A ground disc so the mark reads on any surface it lands on. */}
      <circle cx="8" cy="8" r="8" fill="var(--color-surface)" />
      {meta.mark === "solid" && <circle cx="8" cy="8" r="5.5" fill={c} />}

      {meta.mark === "ring" && (
        <circle cx="8" cy="8" r="4.2" fill="none" stroke={c} strokeWidth="2.6" />
      )}

      {meta.mark === "dot-in-ring" && (
        <>
          <circle cx="8" cy="8" r="5.5" fill="none" stroke={c} strokeWidth="1.6" />
          <circle cx="8" cy="8" r="2.2" fill={c} />
        </>
      )}

      {meta.mark === "half" && (
        <>
          <circle cx="8" cy="8" r="5.5" fill="none" stroke={c} strokeWidth="1.6" />
          <path d="M8 2.5 A5.5 5.5 0 0 1 8 13.5 Z" fill={c} />
        </>
      )}

      {meta.mark === "slash" && (
        <>
          <circle cx="8" cy="8" r="5.5" fill="none" stroke={c} strokeWidth="1.6" />
          <path d="M4.6 11.4 L11.4 4.6" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
        </>
      )}

      {/* Offline is hollow. A pale fill could never reach 3:1, so absence is
          drawn as an empty outline instead of a faint colour. */}
      {meta.mark === "hollow" && (
        <circle cx="8" cy="8" r="5" fill="none" stroke={c} strokeWidth="1.5" />
      )}
      {half > 0 && null}
    </svg>
  );
}

function AvatarBase({name,status,size=40,speaking=false,guest=false,hideStatus=false,className=''}:AvatarProps){const t=useT(),meta=status?STATUS_META[status]:null,named=meta?name+' · '+t('status.'+meta.id,meta.label):name;return <span className={['relative inline-flex shrink-0',speaking?'hq-speaking-ring':'',guest?'rounded-pill outline-dashed outline-1 outline-line-strong':'',className].join(' ')} title={named}><LibAvatar name={name} size={size===20?'xs':size===28?'sm':size===56?'lg':'md'} className={status==='offline'?'opacity-60':undefined}/>{status&&!hideStatus?<span className='absolute -bottom-px -end-px leading-none' aria-hidden><PresenceMark status={status} px={MARK_SIZE[size]}/></span>:null}</span>;}
export const Avatar=memo(AvatarBase);export function AvatarStack({people,size=20,max=4}:{people:{name:string;initials:string;tint:number}[];size?:AvatarSize;max?:number}){const t=useT();return <AvatarGroup people={people.map((p,i)=>({id:String(i),name:p.name}))} max={max} size={size===56?'lg':size===40?'md':'sm'} label={t('v3.participants','Participants')}/>;}
