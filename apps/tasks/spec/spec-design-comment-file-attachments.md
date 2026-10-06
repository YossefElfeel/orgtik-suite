---
title: Support Uploading and Viewing All File Types in Task Comments
version: 1.0
date_created: 2026-05-24
owner: Front-End Architecture Team
tags: [design, components, task-comments, upload, file-viewing]
---

# Introduction

This specification outlines the technical design, requirements, and user experience patterns for expanding task comment attachments from image-only support to **all common file types** (including documents, PDFs, audio, video, code, and compressed archives). It defines the interfaces, UI/UX components, and frontend-backend data contracts required to handle secure file selection, drag-and-drop, real-time upload progress, and rich contextual viewing/previews.

---

## 1. Purpose & Scope

### 1.1 Purpose
Currently, the task comment system (implemented in `CommentInput` and `CommentItem`) is hardcoded to only allow and view image attachments. This specification defines a modular design to enable uploading, managing, and viewing any file format directly in the comment thread. This improves collaboration by allowing users to attach design source files, PDFs, spreadsheets, logs, and video screen recordings directly to task conversations.

### 1.2 Scope
- **Client-side upload mechanics**: Supporting drag-and-drop, multi-file selection, MIME-type classification, and size constraint checking in `CommentInput` and `CommentReplyInput`.
- **Composition previews**: Rendering visual file cards with appropriate icons, progress indicators, and removal options before posting.
- **Render-time attachment viewing**: Displaying attachment cards in `CommentItem` according to file category, and providing immersive lightbox viewers (e.g., PDF viewer, audio/video players, text/code syntax readers) or fallback download controls.
- **TypeScript structures & API payloads**: Defining form data extensions, error handlers, and state mappings.

---

## 2. Definitions

- **Lightbox**: An overlay dialog modal appearing above the main content to view media or documents (replacing or extending `ImageViewer`).
- **MIME Type**: Multipurpose Internet Mail Extensions standard indicating the nature and format of a file (e.g., `application/pdf`, `video/mp4`).
- **FormData**: The Web API standard used to assemble key/value pairs representing form fields and their values, including file uploads, sent via HTTP.
- **BLOCKED_EXTENSIONS**: A safety-first blacklist of executable or scripting file extensions blocked on the client side before triggering network traffic.

---

## 3. Requirements, Constraints & Guidelines

### 3.1 Upload Requirements

- **REQ-001 (Universal Selector)**: The composition input must accept any non-executable file format. The file input must remove `accept="image/*"` and use `accept="*"` or a comprehensive whitelist of valid types.
- **REQ-002 (Drag & Drop Zone)**: The `CommentInput` container must act as a drag-and-drop zone. Dragging files over the editor area must activate a semi-transparent, high-fidelity overlay indicating "Drop files to attach".
- **REQ-003 (Size Constraints)**: Individual files must be capped at **25MB**. Attempting to add a file exceeding this limit must block the addition immediately and dispatch a warning toast using `sonner`.
- **REQ-004 (Visual Upload Cards)**: While composing, files must be rendered in a horizontal list above or inside the editor container with a distinct filetype icon, name, size, and a deletion `[X]` button.

### 3.2 Viewing & Preview Requirements

- **REQ-005 (MIME-Type Aware Rendering)**: In the comment feed, attachments must not be rendered as images by default. Instead, the renderer must categorize files by MIME type and render them using specialized visual cards or players:
  
  | File Category | MIME-Type Pattern | Primary Rendering Strategy |
  | :--- | :--- | :--- |
  | **Images** | `image/*` | Sleek hover-optimized thumbnails with high-resolution image lightbox viewer. |
  | **Video** | `video/*` | Responsive HTML5 player (with play/pause/timeline controls) or overlay cinema lightbox. |
  | **Audio** | `audio/*` | Compact inline custom audio player with playback bar. |
  | **Documents (PDF)** | `application/pdf` | Elegant document preview card showing a PDF icon. Clicking opens an immersive, fullscreen modal utilizing standard iframe/object embedding or a native browser viewer. |
  | **Raw Text / Code** | `text/*`, `application/json`, `application/javascript`, `* + xml` | Document card. Clicking opens a scrollable, syntax-highlighted code viewer/modal. |
  | **Microsoft Office / G-Suite** | `.docx`, `.xlsx`, `.pptx`, `.csv` | High-fidelity file action card showing document metadata, full-width hover state, direct download button, and a "View online" option using Microsoft Office Web Viewer. |
  | **Other (Zip, archives, binary)**| `*` (fallback) | Compact metadata card displaying generic archive/binary icon, filename, file size, and a direct download button. |

- **REQ-006 (One-Click Actions)**: Every file card must provide a quick-access direct download button that fetches and downloads the attachment without opening a viewer modal.

### 3.3 Constraints & Security

- **CON-001 (Executable Blacklist)**: To prevent malware distribution, files with extensions matching the following blacklist must be blocked before starting any upload:
  `*.exe`, `*.bat`, `*.sh`, `*.cmd`, `*.msi`, `*.com`, `*.scr`, `*.vbs`, `*.jar`, `*.bin`.
- **CON-002 (CORS & Download Fallback)**: Client-side download handlers must support CORS fallbacks by checking response statuses and automatically falling back to `window.open(fileUrl, "_blank")` if direct BLOB conversion is blocked.
- **CON-003 (Tailwind Consistency)**: Styling must utilize CSS variables compatible with TailwindCSS v4 and reuse established Radix dialog schemas.

---

## 4. Interfaces & Data Contracts

### 4.1 TypeScript Types (`types/comments.ts`)

We will reuse and build upon the existing models. The `ICommentAttachment` remains compatible but the rendering layers will strictly utilize its metadata.

```typescript
// Existing/Extended models
export interface ICommentAttachment {
  id: number;
  fileUrl: string;
  filename: string;
  mimetype: string;
  originalName: string;
  size: number;
  createdAt: Date;
}

// Composition UI state interface supporting any file type
export interface IPendingAttachment {
  id: string;          // Client-side unique temporary ID
  file: File;          // Raw File object
  previewUrl: string;  // Image data URL or object URL (for images/videos) or empty for raw files
  type: "image" | "video" | "audio" | "document" | "code" | "archive" | "generic";
  size: number;
}
```

### 4.2 Network Request Contract

When submitting a comment containing attachments, the request payload must be sent as `multipart/form-data`:

```http
POST /api/tasks/{taskId}/comments
Content-Type: multipart/form-data

Headers:
Authorization: Bearer <token>

Form Fields:
- id: "105" (Task ID)
- content: "Here are the files you requested @[42]"
- parentCommentId: null (or numeric reply ID)
- attachments: [Binary File 1]
- attachments: [Binary File 2]
```

### 4.3 Response Payload Contract

Upon successful upload, the server returns the updated comment resource matching `IComment` containing the full attachment records:

```json
{
  "id": 890,
  "content": "Here are the files you requested @[42]",
  "author": {
    "id": 12,
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@company.com",
    "avatar": "https://avatars.company.com/johndoe.png"
  },
  "reactions": [],
  "replies": [],
  "attachments": [
    {
      "id": 1054,
      "fileUrl": "https://storage.company.com/attachments/spec_final_1054.pdf",
      "filename": "spec_final_1054.pdf",
      "mimetype": "application/pdf",
      "originalName": "spec_final.pdf",
      "size": 4194304,
      "createdAt": "2026-05-24T11:00:00Z"
    },
    {
      "id": 1055,
      "fileUrl": "https://storage.company.com/attachments/demo_screen_1055.mp4",
      "filename": "demo_screen_1055.mp4",
      "mimetype": "video/mp4",
      "originalName": "demo_screen.mp4",
      "size": 15728640,
      "createdAt": "2026-05-24T11:00:05Z"
    }
  ],
  "createdAt": "2026-05-24T11:00:05Z",
  "updatedAt": "2026-05-24T11:00:05Z"
}
```

---

## 5. Acceptance Criteria

- **AC-001 (Drag and Drop Visual Indicator)**
  - *Given* a user has hovered a file over the comments tab area:
  - *When* the file enters the window boundary,
  - *Then* a beautiful, dynamic glassmorphic dropzone overlay must fade in with an animation indicating: "Drop your files here".

- **AC-002 (Dynamic Icon Mapping)**
  - *Given* a user attaches a spreadsheet (`.xlsx`), a text log (`.txt`), and a zip folder (`.zip`):
  - *When* the files appear in the preview list before posting,
  - *Then* the spreadsheet must show a green sheet icon, the text file must show a document/code icon, and the zip folder must show a folder/zip archive icon, along with correct filenames and formatted sizes.

- **AC-003 (Size Limiter & File Blocking)**
  - *Given* a user attempts to attach a file of `32MB` size or a file named `malicious.exe`:
  - *When* the file is dropped or selected,
  - *Then* the system must reject the file, show an error toast stating "File too large (Max 25MB)" or "File format blocked for security reasons", and must NOT add the file to the composition array or execute network calls.

- **AC-004 (Lightbox Attachment Modal)**
  - *Given* a comment containing a PDF document is rendered:
  - *When* the user clicks the PDF file card,
  - *Then* a full-screen or large dialog modal must open, embedding the PDF viewer smoothly with functional download and close options.

- **AC-005 (Universal Inline Actions)**
  - *Given* a document card is rendered in the comment item:
  - *When* the user clicks the inline Download button,
  - *Then* the browser must directly download the file with its original filename without opening the modal.

---

## 6. Test Automation Strategy

### 6.1 Unit & Component Tests (Jest / React Testing Library)
- **File Validation Tests**: Validate helper function `validateAttachment(file)` to verify it accurately checks size limits and the extension blacklist.
- **Icon Mapping Tests**: Ensure helper function `getFileCategory(mimetype)` correctly resolves `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` to a document card category.
- **Visual Regression / Render checks**: Verify `CommentItem` renders specific sub-components (`ImageCard`, `MediaCard`, `DocumentCard`) depending on attachments' MIME types.

### 6.2 End-to-End Tests (Playwright / Cypress)
- **Upload Flow Integration**: Simulate selecting multiple file formats, mocking network API responses, and checking that files are appended in the FormData payload correctly.
- **Drag & Drop Simulation**: Simulate dragging files into the dropzone to ensure drop listeners trigger visual updates and parse dropped files.

---

## 7. Rationale & Context

- **Why replace direct Image components?**: Directly rendering non-image files inside Next.js `Image` or standard HTML `img` elements results in rendering failure. Creating a modular file component avoids broken images and provides clear, accessible UI patterns.
- **Why MS Office/Google Web Viewer integrations?**: Users prefer viewing spreadsheets and documents directly in the app without having to download them. Utilizing lightweight embedding or online web previewers ensures optimal productivity.
- **Why a client-side blocklist?**: Even though servers should validate uploads, a client-side blocker prevents useless server traffic and immediate, responsive feedback.

---

## 8. Dependencies & External Integrations

### 8.1 UI & Component Libraries
- **lucide-react**: Core icon library providing specific icons for file types (`FileText`, `FileSpreadsheet`, `Video`, `Music`, `FolderArchive`, `FileDown`, `Play`, `FileCode`).
- **framer-motion**: For smooth fade-in dropzone transitions and list insertions.

### 8.2 Backend/Infrastructure Capabilities
- **Storage Service (e.g., AWS S3 or MinIO)**: Storage system generating accessible download URLs with correct `Content-Disposition` headers so files download with their original name instead of randomized server hashes.

---

## 9. Examples & Edge Cases

### 9.1 Attachment Categorization Utility

```typescript
// lib/attachments.ts
export type AttachmentCategory = "image" | "video" | "audio" | "document" | "code" | "archive" | "generic";

export function getAttachmentCategory(mimetype: string, filename: string): AttachmentCategory {
  const mimeLower = mimetype.toLowerCase();
  const ext = filename.split(".").pop()?.toLowerCase() || "";

  if (mimeLower.startsWith("image/")) return "image";
  if (mimeLower.startsWith("video/")) return "video";
  if (mimeLower.startsWith("audio/")) return "audio";
  
  if (
    mimeLower.startsWith("text/") || 
    ["json", "js", "ts", "tsx", "jsx", "html", "css", "py", "sh", "yml", "yaml", "md"].includes(ext)
  ) {
    return "code";
  }

  if (
    [
      "application/pdf", 
      "application/msword", 
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation"
    ].includes(mimeLower) ||
    ["pdf", "docx", "doc", "xlsx", "xls", "pptx", "ppt", "csv"].includes(ext)
  ) {
    return "document";
  }

  if (
    [
      "application/zip",
      "application/x-zip-compressed",
      "application/x-tar",
      "application/x-rar-compressed",
      "application/x-7z-compressed"
    ].includes(mimeLower) ||
    ["zip", "rar", "tar", "gz", "7z"].includes(ext)
  ) {
    return "archive";
  }

  return "generic";
}

export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}
```

### 9.2 Custom Multi-Format File Viewer Card Component

```tsx
// components/shared/comments/AttachmentCard/index.tsx
import React from "react";
import { 
  FileText, FileSpreadsheet, Video, Music, 
  FolderArchive, File, FileCode, Download, Eye 
} from "lucide-react";
import { ICommentAttachment } from "@/types/comments";
import { getAttachmentCategory, formatBytes } from "@/lib/attachments";
import { Button } from "@/components/ui/button";
import { UniversalAttachmentViewer } from "../UniversalAttachmentViewer";

interface AttachmentCardProps {
  attachment: ICommentAttachment;
}

export function AttachmentCard({ attachment }: AttachmentCardProps) {
  const category = getAttachmentCategory(attachment.mimetype, attachment.originalName);
  
  // Resolve visual indicators and colors
  const getIconAndStyle = () => {
    switch (category) {
      case "image":
        return { icon: <FileText className="size-5 text-sky-500" />, bg: "bg-sky-50 border-sky-100" };
      case "video":
        return { icon: <Video className="size-5 text-indigo-500" />, bg: "bg-indigo-50 border-indigo-100" };
      case "audio":
        return { icon: <Music className="size-5 text-pink-500" />, bg: "bg-pink-50 border-pink-100" };
      case "code":
        return { icon: <FileCode className="size-5 text-amber-500" />, bg: "bg-amber-50 border-amber-100" };
      case "document":
        if (attachment.originalName.endsWith(".pdf")) {
          return { icon: <FileText className="size-5 text-rose-500" />, bg: "bg-rose-50 border-rose-100" };
        }
        return { icon: <FileSpreadsheet className="size-5 text-emerald-500" />, bg: "bg-emerald-50 border-emerald-100" };
      case "archive":
        return { icon: <FolderArchive className="size-5 text-amber-600" />, bg: "bg-amber-50 border-amber-100" };
      default:
        return { icon: <File className="size-5 text-gray-500" />, bg: "bg-gray-50 border-gray-100" };
    }
  };

  const { icon, bg } = getIconAndStyle();

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid opening lightbox/preview
    try {
      const response = await fetch(attachment.fileUrl);
      if (!response.ok) throw new Error("Fallback to window.open");
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = attachment.originalName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(attachment.fileUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <UniversalAttachmentViewer
      attachment={attachment}
      category={category}
      trigger={
        <div className={`flex items-center gap-3 p-3 rounded-xl border ${bg} hover:shadow-sm hover:opacity-95 transition-all duration-200 cursor-pointer w-64 max-w-sm`}>
          <div className="p-2 bg-white rounded-lg shadow-sm">{icon}</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate" title={attachment.originalName}>
              {attachment.originalName}
            </p>
            <p className="text-xs text-gray-500">
              {formatBytes(attachment.size)}
            </p>
          </div>
          <div className="flex gap-1">
            <Button
              size="icon"
              variant="ghost"
              onClick={handleDownload}
              className="size-7 p-0 hover:bg-white/80 rounded-md"
            >
              <Download className="size-3.5 opacity-60 hover:opacity-100 text-gray-700" />
            </Button>
          </div>
        </div>
      }
    />
  );
}
```

### 9.3 Client-Side Upload Validator Utility

```typescript
// lib/validators.ts
import { toast } from "sonner";

const BLOCKED_EXTENSIONS = ["exe", "bat", "sh", "cmd", "msi", "com", "scr", "vbs", "jar", "bin"];
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

export function validateAttachment(file: File): boolean {
  const extension = file.name.split(".").pop()?.toLowerCase();
  
  if (extension && BLOCKED_EXTENSIONS.includes(extension)) {
    toast.error(`File "${file.name}" blocked. Executable files are not allowed.`);
    return false;
  }
  
  if (file.size > MAX_FILE_SIZE) {
    toast.error(`File "${file.name}" is too large. Max allowed size is 25MB.`);
    return false;
  }
  
  return true;
}
```

---

## 10. Validation Criteria

- **MIME Verification**: All test files (PNG, MP4, MP3, PDF, DOCX, ZIP, TXT) must resolve correctly to their categories and display custom card colors and icons.
- **Boundary Verification**: Trigger upload of 26MB and executable `.exe` file to verify both block immediately, and the client displays the toast alert.
- **Lightbox Verification**: Ensure clicking a PDF displays a clean dialog displaying the document; clicking a video displays a player in an overlay cinema container.

---

## 11. Related Specifications / Further Reading

- [NextJS File Upload Strategies](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [CORS Handling in Cloud Storage Buckets](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [Radix UI Dialog Integrations](https://www.radix-ui.com/primitives/docs/components/dialog)
