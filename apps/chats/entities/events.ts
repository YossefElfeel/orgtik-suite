/**
 * SOMION HQ - SERVER EVENT CONTRACT
 *
 * Every change to workspace state arrives as one of these events and is applied
 * by a single reducer, `applyEvent`. Today the simulator emits them; in
 * production the WebSocket gateway emits exactly the same shapes. That is the
 * whole reason the UI survives the backend arriving: the simulator and the real
 * server speak one language.
 *
 * Store actions are named for the endpoints that will replace them:
 *   sendMessage, joinRoom, leaveRoom, knock, setStatus, scheduleMeeting.
 */

import type {
  FileRef,
  Id,
  IsoDateTime,
  Knock,
  NotifyLevel,
  KnockState,
  Meeting,
  Message,
  FloorTemplate,
  Notification,
  Room,
  Status,
} from "./index";

export type CreatedMessage = Omit<Message,"poll"> & {poll?:{question:string;options:string[]}};
export type ServerEvent =
  | {type:"knock.ended";knockId:Id}
  | { type:'settings.updated';patch:Partial<import('./index').WorkspaceSettings> }
  | { type:'channel.joined';channelId:Id }
  | { type:'channel.typing';channelId:Id;active:boolean }
  | { type:'message.saved_toggled'|'message.reminder_delivered'|'message.schedule_sent'|'message.schedule_cancelled'|'message.poll_closed';messageId:Id }
  | { type:'message.reminder_set';messageId:Id;at:string }
  | { type:'message.poll_voted';messageId:Id;optionId:number }
  | { type:'message.task_linked';messageId:Id;taskId:number }

  /* ------------------------------------------------------------- presence */
  | {
      type: "presence.status_changed";
      userId: Id;
      status: Status;
      customText?: string;
      focusUntil?: IsoDateTime;
      focusMinutes?: number;
    }
  | { type: "presence.moved"; userId: Id; position: { x: number; y: number } }
  | { type: "presence.room_changed"; userId: Id; roomId?: Id }
  | { type: "presence.speaking"; userId: Id; speaking: boolean }
  /* ----------------------------------------------------------------- chat */
  | { type: "message.created"; message: CreatedMessage }
  | { type: "message.edited"; messageId: Id; text: string; editedAt: IsoDateTime }
  | { type: "message.deleted"; messageId: Id; deletedAt: IsoDateTime }
  | {
      type: "message.reaction_toggled";
      messageId: Id;
      emoji: string;
      userId: Id;
    }
  | { type: "message.pin_toggled"; messageId: Id }
  | { type: "channel.read"; channelId: Id }
  | { type: "channel.all_read" }
  | {
      type: "channel.created";
      channel: {
        id: Id;
        name: string;
        kind: "public" | "private" | "dm" | "group";
        topic?: string;
        memberIds: Id[];
      };
    }
  | {
      type: "channel.updated";
      channelId: Id;
      patch: { name?: string; topic?: string; notify?: NotifyLevel; archived?: boolean };
    }
  | { type: "channel.members_added"; channelId: Id; userIds: Id[] }
  | { type: "channel.member_removed"; channelId: Id; userId: Id }
  | { type: "channel.left"; channelId: Id }
  /* A moderator cut a microphone, or what a person hears. */
  | { type: "presence.muted"; userId: Id; muted: boolean }
  | { type: "presence.deafened"; userId: Id; deafened: boolean }
  /* ---------------------------------------------------------------- knock */
  | { type: "knock.sent"; knockId: Id; fromId: Id; toId: Id; reason?: string }
  | { type: "knock.answered"; knockId: Id; state: KnockState }
  /* A knock held during Focus is delivered afterwards, never dropped. */
  | { type: "knock.delivered"; knock: Knock }
  /* -------------------------------------------------------------- session */
  | { type: "session.signed_out"; userId: Id; reason: "inactive" | "manual"; at: IsoDateTime; idleMinutes?: number; scope?: "computer" | "page" }
  | { type: "session.signed_in"; userId: Id; at: IsoDateTime }
  /* ---------------------------------------------------------------- rooms */
  | {
      type: "room.updated";
      roomId: Id;
      patch: Partial<Omit<Room, "id">>;
    }
  | { type: "room.added"; room: Room }
  /* Removing a room puts anyone in it back on the open floor. */
  | { type: "room.removed"; roomId: Id }
  /* A template is a whole layout. People in rooms that survive stay in them. */
  | { type: "floor.template_changed"; template: FloorTemplate; rooms: Room[] }
  /* ------------------------------------------------------------- meetings */
  | { type: "meeting.scheduled"; meeting: Meeting }
  | { type: "meeting.chat_opened"; meetingId: Id; channelId: Id }
  /* Recording moves through consent rather than starting on a click. */
  | { type: "meeting.recording_requested"; meetingId: Id }
  | { type: "meeting.recording_started"; meetingId: Id }
  | { type: "meeting.recording_declined"; meetingId: Id }
  | { type: "meeting.recording_stopped"; meetingId: Id }
  | { type: "meeting.recording_ready"; meetingId: Id; file: FileRef }
  /* An invited guest is found by their address. Someone who came by the
     shared link was never invited, so the event carries the name they gave
     and they are added to the meeting as they reach the lobby. */
  | { type: "meeting.guest_arrived"; meetingId: Id; guestEmail: string; name?: string }
  | { type: "meeting.guest_declined"; meetingId: Id; guestEmail: string }
  /* The guest closed the call, or the tab, from their side. */
  | { type: "meeting.guest_left"; meetingId: Id; guestEmail: string }
  | { type: "meeting.guest_link_reset"; meetingId: Id; guestKey?: string }
  | { type: "meeting.share_changed"; meetingId: Id; userId?: Id }
  | {
      type: "meeting.guest_admitted";
      meetingId: Id;
      guestEmail: string;
    }
  | { type: "meeting.ended"; meetingId: Id; endedAt: IsoDateTime; attendedIds: Id[] }
  /* -------------------------------------------------------- notifications */
  | { type: "notification.created"; notification: Notification }
  | { type: "notification.read"; notificationId: Id }
  | { type: "notification.all_read" }
  /* ----------------------------------------------------------- demo only --
     The accelerable clock exists so a 90-minute Focus can be shown in ten
     seconds. It is listed here so it is obvious what to delete later. */
  | { type: "demo.clock_advanced"; minutes: number }
  | { type: "demo.reset" };
