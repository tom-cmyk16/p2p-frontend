import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import {
  MessageSquare,
  Paperclip,
  Send,
  User,
  AlertCircle,
  GraduationCap,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { useAuthContext } from "../../../context/AuthContext";
import ErrorMessage from "../../../components/common/ErrorMessage";
import { useTutorChat } from "../hooks/useTutorChat";
import { CHAT_FILE_TYPES, MAX_CHAT_FILE_SIZE } from "../services/tutorChat.service";
import ChatMessageBubble from "../../chat/components/ChatMessageBubble";

const getPartnerInfo = (conversation) => {
  if (!conversation) return { name: "Student", role: "STUDENT" };
  return {
    name:
      conversation.student?.user?.fullName ||
      `Student ${conversation.studentId?.slice(-6) || ""}`,
    role: "STUDENT",
    email: conversation.student?.user?.phoneOrEmail,
    courseName: conversation.packageEnrollment?.course?.subject?.name,
  };
};

export default function TutorChatPage() {
  const { conversationId } = useParams();
  const { user } = useAuthContext();
  const {
    conversations,
    messages,
    isLoadingConversations,
    isLoadingMessages,
    isSending,
    error,
    sendText,
    sendFile,
  } = useTutorChat(conversationId, user?.id);

  const [text, setText] = useState("");
  const [uploadError, setUploadError] = useState(null);
  const [now, setNow] = useState(Date.now());
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (user?.role !== "TUTOR") {
    return <Navigate to="/" replace />;
  }

  const activeConversation = conversations.find(
    (conversation) => conversation.id === conversationId
  );
  const isClosed = activeConversation?.status === "CLOSED";
  const mentorshipActive =
    activeConversation?.packageEnrollment &&
    new Date(activeConversation.packageEnrollment.startedAt).getTime() <= now &&
    new Date(activeConversation.packageEnrollment.mentorshipExpiresAt).getTime() > now;

  const partner = getPartnerInfo(activeConversation);

  const handleSendMessage = async (event) => {
    event.preventDefault();
    if (!text.trim() || isSending || isClosed) return;

    try {
      await sendText(text);
      setText("");
      setUploadError(null);
    } catch {
      // Handled in hook
    }
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !conversationId) return;

    setUploadError(null);

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      setUploadError("Choose a JPG, PNG, WEBP, or PDF file.");
      event.target.value = "";
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadError("Files must be 10 MB or smaller.");
      event.target.value = "";
      return;
    }

    try {
      await sendFile(file);
    } catch (err) {
      setUploadError(err.message || "Failed to upload file attachment.");
    } finally {
      event.target.value = "";
    }
  };

  return (
    <main className="min-h-[calc(100vh-2rem)] bg-slate-50/50 p-4 text-left sm:p-6">
      <div className="mx-auto grid h-[calc(100vh-4rem)] max-w-6xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm md:grid-cols-[300px_1fr]">
        {/* Left Pane: Student Conversations List */}
        <aside className="hidden border-r border-slate-200 bg-white md:flex md:flex-col">
          <header className="border-b border-slate-200 p-5">
            <Link
              to="/tutor-portal"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#013638] hover:underline"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Tutor Dashboard</span>
            </Link>
            <h1 className="mt-3 text-2xl font-black text-[#013638]">Student Inbox</h1>
            <p className="mt-1 text-xs text-slate-500">Active student sessions and messages</p>
          </header>

          <nav className="flex-1 overflow-y-auto p-3 space-y-1" aria-label="Student conversations">
            {isLoadingConversations ? (
              <p className="px-3 py-4 text-xs text-slate-500">Loading conversations...</p>
            ) : conversations.length ? (
              conversations.map((conversation) => {
                const convPartner = getPartnerInfo(conversation);
                const isSelected = conversation.id === conversationId;

                return (
                  <Link
                    key={conversation.id}
                    to={`/tutor-portal/chat/${conversation.id}`}
                    className={`flex items-center gap-3 rounded-2xl p-3 transition ${
                      isSelected
                        ? "bg-[#013638]/5 text-[#013638] ring-1 ring-[#013638]/15"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#013638] text-white font-bold text-sm shadow-xs">
                      {convPartner.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="truncate text-xs font-bold text-slate-900">
                          {convPartner.name}
                        </span>
                        <span className="text-[10px] font-semibold text-teal-700">
                          {convPartner.role}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-[11px] text-slate-500">
                        {convPartner.courseName || conversation.status}
                      </p>
                    </div>
                  </Link>
                );
              })
            ) : (
              <p className="px-3 py-4 text-xs text-slate-500">
                {error || "You have no student conversations yet."}
              </p>
            )}
          </nav>
        </aside>

        {/* Right Pane: Active Chat Room */}
        <section className="flex min-h-0 flex-col bg-white">
          {/* Room Header */}
          <header className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#013638] text-white font-bold text-base shadow-xs">
                {partner.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="truncate text-base font-bold text-slate-900">
                    {partner.name}
                  </h2>
                  <span className="rounded-md bg-teal-50 px-2 py-0.5 text-[10px] font-bold text-teal-700 border border-teal-200">
                    {partner.role}
                  </span>
                </div>
                <p className="truncate text-xs text-slate-500">
                  {partner.courseName ? `${partner.courseName} · ` : ""}
                  {mentorshipActive ? "Active Mentorship" : "Mentorship Session"}
                </p>
              </div>
            </div>

            {activeConversation && (
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ${
                  isClosed
                    ? "bg-slate-100 text-slate-600"
                    : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                }`}
              >
                {activeConversation.status}
              </span>
            )}
          </header>

          {/* Messages Area */}
          <div className="flex-1 space-y-4 overflow-y-auto bg-slate-50/40 p-4 sm:p-6">
            {(error || uploadError) && (
              <ErrorMessage message={uploadError || error} />
            )}
            {!conversationId ? (
              <div className="flex h-full flex-col items-center justify-center text-center p-8 text-slate-400 space-y-2">
                <div className="rounded-full bg-slate-100 p-3 text-slate-500">
                  <MessageSquare className="h-6 w-6" />
                </div>
                <p className="text-sm font-bold text-slate-700">Select a Conversation</p>
                <p className="text-xs text-slate-500 max-w-sm">
                  Choose a student from the inbox on the left to review messages and provide study guidance.
                </p>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center p-8 text-slate-400 space-y-2">
                <div className="rounded-full bg-slate-100 p-3 text-slate-500">
                  <MessageSquare className="h-6 w-6" />
                </div>
                <p className="text-sm font-bold text-slate-700">No messages in this session yet</p>
                <p className="text-xs text-slate-500 max-w-sm">
                  Send a welcome message to {partner.name}. You can share notes, links, photos, and PDF study guides.
                </p>
              </div>
            ) : (
              messages.map((message) => (
                <ChatMessageBubble
                  key={message.id}
                  message={message}
                  currentUserId={user?.id}
                  partnerName={partner.name}
                  partnerRole={partner.role}
                />
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          {isClosed ? (
            <p className="border-t border-slate-200 bg-white px-4 py-4 text-center text-xs text-slate-500">
              This session is closed and can no longer receive messages.
            </p>
          ) : !mentorshipActive && conversationId ? (
            <p className="border-t border-slate-200 bg-white px-4 py-4 text-center text-xs text-slate-500">
              Mentorship access duration has expired. Conversation history remains available.
            </p>
          ) : (
            <form
              onSubmit={handleSendMessage}
              className="flex items-center gap-2 border-t border-slate-200 bg-white p-3 sm:gap-3 sm:p-4"
            >
              <input
                type="file"
                ref={fileInputRef}
                accept="image/jpeg,image/png,image/webp,application/pdf"
                onChange={handleFileChange}
                disabled={isSending || !conversationId}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isSending || !conversationId}
                title="Attach Photo or PDF Document"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-100 hover:text-[#013638] disabled:opacity-50"
              >
                <Paperclip className="h-4 w-4" />
              </button>

              <input
                type="text"
                value={text}
                onChange={(event) => setText(event.target.value)}
                placeholder={conversationId ? `Message ${partner.name}...` : "Select a conversation first..."}
                disabled={isSending || !conversationId}
                className="min-w-0 flex-1 rounded-xl border border-slate-300 px-4 py-2.5 text-xs sm:text-sm text-slate-900 outline-none transition focus:border-[#013638] focus:ring-2 focus:ring-[#013638]/15"
              />

              <button
                type="submit"
                disabled={isSending || !text.trim() || !conversationId}
                className="flex h-10 w-10 sm:w-auto sm:px-5 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#013638] text-white text-xs font-bold transition hover:bg-[#024e51] disabled:opacity-50 shadow-xs"
              >
                {isSending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <span className="hidden sm:inline">Send</span>
                    <Send className="h-3.5 w-3.5" />
                  </>
                )}
              </button>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}
