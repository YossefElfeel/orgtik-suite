import { IUser } from "./user";

export type IType = "text" | "voice" | "image" | "file";

export interface IAttachment {
  id: number;
  filename: string;
  originalName: string;
  filePath: string;
  fileSize: number;
}

export interface ILinkPreview {
  id: number;
  url: string;
  title: string | null;
}

export interface IMessage {
  id: number;
  type: IType;
  content: string;
  status: "sent" | "delivered" | "read";
  voiceFilePath?: string | null;
  voiceDuration?: number | null;
  sender: {
    id: number;
    email: string;
    username: string;
    firstName: string;
    lastName: string;
    avatar: string | null;
  };
  senderId: number;
  conversationId: number;
  createdAt: string;
  deletedAt: string | null;
  attachments: IAttachment[];
  links: ILinkPreview[];
}

export interface IContactnfo {
  partner: {
    id: string;
    firstName: string;
    lastName: string;
    avatar: string;
    email: string;
  };

  mediaByPeriod: {
    date: string;
    count: string;
    items: {
      id: string;
      filename: string;
      originalName: string;
      filePath: string;
      fileSize: string;
      mimeType: string;
      type: string;
      messageId: string;
      createdAt: string;
    }[];
    documents: {
      id: string;
      filename: string;
      originalName: string;
      filePath: string;
      fileSize: string;
      mimeType: string;
      type: string;
      messageId: string;
      createdAt: string;
    }[];
    links: {
      id: string;
      url: string;
      title: string;
      description: string;
      imageUrl: string;
      domain: string;
      isPreviewFetched: boolean;
      messageId: string;
      createdAt: string;
    }[];
  }[];
}

export interface IConversations {
  id: number;
  lastActivityAt: string;
  unreadCount: number;

  participant: {
    lastSeenAt: string;
    unreadCount: number;
    user: IUser;
  };
  lastMessage: IMessage;
}

export interface IUsers {
  id: number;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  avatar: string | null;
  userType?: string;
}
