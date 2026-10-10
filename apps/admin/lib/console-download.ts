import type { ConsoleDownload } from '@/types/console';
export function downloadConsoleFile(file: ConsoleDownload) {
  const bytes = file.base64 ? Uint8Array.from(atob(file.base64), character => character.charCodeAt(0)) : file.content || '';
  const url = URL.createObjectURL(new Blob([bytes], { type: file.mimetype })), link = document.createElement('a');
  link.href = url; link.download = file.filename || file.name || 'OrgTik-document'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
