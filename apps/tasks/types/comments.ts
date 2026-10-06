import { CommentReactionEnum } from "@/constants/emojies";

export interface AddCommentDto {
  id: number;
  content: string;
  parentCommentId: number | string | null;
}

export interface IReaction {
  reaction: CommentReactionEnum;
  count: number;
  users: { id: number; firstName: string; lastName: string }[];
}

export interface IComment {
  id: number;
  content: string;
  author: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    avatar: string | null;
  };
  reactions: IReaction[];
  replies: IComment[];
  attachments: ICommentAttachment[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ICommentAttachment {
  id: number;
  fileUrl: string;
  filename: string;
  mimetype: string;
  originalName: string;
  createdAt: Date;
  size: number;
}

export interface IPendingAttachment {
  id: string;          // Client-side unique temporary ID
  file: File;          // Raw File object
  previewUrl: string;  // Image data URL or object URL (for images/videos) or empty for raw files
  type: string;        // E.g. "image" | "video" | "audio" | "document" | "code" | "archive" | "generic"
  size: number;
}

