import { useState } from "react";
import {
  ExternalLink,
  FileText,
  Image as ImageIcon,
  Download,
  X,
  Maximize2,
} from "lucide-react";

/**
 * Resolves a full, accessible URL for any uploaded file attachment.
 */
export const resolveFileUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  const backendBase = (
    import.meta.env.VITE_API_URL
      ? import.meta.env.VITE_API_URL.replace(/\/api\/v1\/?$/, "")
      : "http://localhost:3000"
  ).replace(/\/+$/, "");

  const cleanPath = url.startsWith("/") ? url : `/${url}`;
  return `${backendBase}${cleanPath}`;
};

/**
 * Parses message text and renders clickable web links while preserving whitespace.
 */
export const renderFormattedText = (text, isMe) => {
  if (!text) return null;

  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;
  const parts = text.split(urlRegex);

  return (
    <span className="whitespace-pre-wrap break-words leading-relaxed text-sm">
      {parts.map((part, index) => {
        if (part.match(urlRegex)) {
          const href = part.startsWith("http") ? part : `https://${part}`;
          return (
            <a
              key={index}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-1 font-semibold underline underline-offset-2 transition ${
                isMe ? "text-emerald-200 hover:text-white" : "text-blue-600 hover:text-blue-800"
              }`}
            >
              <span>{part}</span>
              <ExternalLink className="h-3 w-3 inline shrink-0" />
            </a>
          );
        }
        return part;
      })}
    </span>
  );
};

export default function ChatMessageBubble({
  message,
  currentUserId,
  partnerName,
  partnerRole,
}) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const isMe = message.senderId === currentUserId;

  const senderDisplayName = isMe
    ? "You"
    : message.sender?.fullName || partnerName || (partnerRole === "TUTOR" ? "Tutor" : "Student");

  const formattedTime = message.sentAt
    ? new Date(message.sentAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  const resolvedUrl = resolveFileUrl(message.fileUrl);

  const handleAttachmentClick = (e) => {
    e.preventDefault();
    setIsPreviewOpen(true);
  };

  return (
    <>
      <div className={`flex flex-col ${isMe ? "items-end" : "items-start"} space-y-1`}>
        {/* Sender Name & Role Label */}
        <div className="flex items-center gap-1.5 px-1 text-[11px] font-semibold text-slate-500">
          <span className={isMe ? "text-[#013638] font-bold" : "text-slate-700"}>
            {senderDisplayName}
          </span>
          {partnerRole && !isMe && (
            <span className="rounded-md bg-slate-100 px-1.5 py-0.2 text-[10px] text-slate-600 font-bold uppercase tracking-wider">
              {partnerRole}
            </span>
          )}
        </div>

        {/* Bubble Container */}
        <article
          className={`max-w-[85%] sm:max-w-md rounded-2xl p-4 shadow-xs transition ${
            isMe
              ? "bg-[#013638] text-white rounded-tr-xs"
              : "border border-slate-200 bg-white text-slate-900 rounded-tl-xs"
          }`}
        >
          {/* TEXT CONTENT */}
          {message.type === "TEXT" && renderFormattedText(message.textContent, isMe)}

          {/* IMAGE / PHOTO ATTACHMENT */}
          {message.type === "IMAGE" && (
            <div className="space-y-2">
              <button
                type="button"
                onClick={handleAttachmentClick}
                className="group relative block w-full overflow-hidden rounded-xl border border-black/10 bg-slate-900/5 text-left cursor-pointer"
              >
                <img
                  src={resolvedUrl}
                  alt={message.fileName || "Shared photo"}
                  className="max-h-80 w-auto rounded-xl object-contain transition group-hover:scale-102"
                  loading="lazy"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition text-white text-xs font-bold gap-1.5 backdrop-blur-xs">
                  <Maximize2 className="h-4 w-4" />
                  <span>Click to Preview</span>
                </div>
              </button>
              <div className="flex items-center justify-between gap-2 pt-1 text-[11px]">
                <span className={`truncate max-w-[200px] ${isMe ? "text-slate-200" : "text-slate-500"}`}>
                  {message.fileName || "Photo"}
                </span>
                <a
                  href={resolvedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center gap-1 font-semibold hover:underline ${
                    isMe ? "text-emerald-200" : "text-[#013638]"
                  }`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink className="h-3 w-3" />
                  <span>Open tab</span>
                </a>
              </div>
            </div>
          )}

          {/* PDF / DOCUMENT ATTACHMENT */}
          {message.type === "DOCUMENT" && (
            <div className="space-y-1">
              <div
                onClick={handleAttachmentClick}
                className={`flex items-center gap-3 rounded-xl p-3 transition cursor-pointer ${
                  isMe
                    ? "bg-white/10 hover:bg-white/20 text-white border border-white/15"
                    : "bg-slate-50 hover:bg-slate-100 text-slate-900 border border-slate-200"
                }`}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-rose-500/20 text-rose-600 font-extrabold text-xs">
                  PDF
                </div>
                <div className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-bold">
                    {message.fileName || "Document.pdf"}
                  </span>
                  <span
                    className={`mt-0.5 flex items-center gap-1 text-[11px] ${
                      isMe ? "text-white/70" : "text-slate-500"
                    }`}
                  >
                    <span>Click to view PDF</span>
                    <Maximize2 className="h-3 w-3 inline" />
                  </span>
                </div>
              </div>
              <div className="flex justify-end pr-1">
                <a
                  href={resolvedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center gap-1 text-[11px] font-semibold hover:underline ${
                    isMe ? "text-emerald-200" : "text-[#013638]"
                  }`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink className="h-3 w-3" />
                  <span>Open in new tab</span>
                </a>
              </div>
            </div>
          )}

          {/* Timestamp */}
          <p
            className={`mt-1.5 text-right text-[10px] ${
              isMe ? "text-white/70" : "text-slate-400"
            }`}
          >
            {formattedTime}
          </p>
        </article>
      </div>

      {/* MODAL ATTACHMENT PREVIEW */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="relative flex max-h-[92vh] w-full max-w-4xl flex-col rounded-3xl bg-white shadow-2xl overflow-hidden text-left">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50">
              <div className="flex items-center gap-2 max-w-[80%]">
                <FileText className="h-5 w-5 text-[#013638] shrink-0" />
                <span className="text-sm font-bold text-slate-900 truncate">
                  {message.fileName || "Attachment Preview"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={resolvedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-[#013638] hover:bg-slate-50 shadow-xs transition"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>Open in Tab</span>
                </a>
                <button
                  type="button"
                  onClick={() => setIsPreviewOpen(false)}
                  className="rounded-full p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition"
                  title="Close preview"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Modal Body Preview Content */}
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-slate-900/5 min-h-[400px]">
              {message.type === "IMAGE" ? (
                <img
                  src={resolvedUrl}
                  alt={message.fileName || "Full preview"}
                  className="max-h-[75vh] w-auto max-w-full rounded-2xl object-contain shadow-lg"
                />
              ) : (
                <iframe
                  src={resolvedUrl}
                  title={message.fileName || "PDF Document"}
                  className="h-[75vh] w-full rounded-2xl border border-slate-200 bg-white shadow-xs"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
