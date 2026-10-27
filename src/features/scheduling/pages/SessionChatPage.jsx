import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { Video, Star, ShieldAlert } from "lucide-react";
import { io } from "socket.io-client";
import { useAuthContext } from "../../../context/AuthContext";
import ErrorMessage from "../../../components/common/ErrorMessage";
import apiClient from "../../../lib/apiClient";
import { schedulingService } from "../services/scheduling.service";
import RateTutorModal from "../../ratings/components/RateTutorModal";
import ReportTutorModal from "../../reports/components/ReportTutorModal";

const supportedFileTypes = ["image/jpeg", "image/png", "application/pdf"];
const maxFileSize = 5 * 1024 * 1024;
const messagePageSize = 50;

const formatDate = (value) =>
  new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));

export default function SessionChatPage() {
  const { sessionId } = useParams();
  const { user } = useAuthContext();
  const [session, setSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [hasOlderMessages, setHasOlderMessages] = useState(false);
  const [messagePage, setMessagePage] = useState(1);
  const [error, setError] = useState(null);
  const [now, setNow] = useState(Date.now());
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [isReportingModalOpen, setIsReportingModalOpen] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setIsLoading(true);
      setError(null);
      setSession(null);
      setMessages([]);
      try {
        const [sessions, history] = await Promise.all([
          schedulingService.getSessions(),
          schedulingService.getSessionMessages(sessionId),
        ]);
        const currentSession = sessions.find((item) => item.id === sessionId);
        if (!currentSession) throw new Error("This session is not available to your account.");
        if (active) {
          setSession(currentSession);
          setMessages((current) => {
            const loadedMessages = [...history.items].reverse();
            const loadedIds = new Set(loadedMessages.map((message) => message.id));
            return [
              ...loadedMessages,
              ...current.filter((message) => !loadedIds.has(message.id)),
            ];
          });
          setHasOlderMessages(history.total > history.items.length);
          setMessagePage(history.page);
        }
      } catch (loadError) {
        if (active) {
          setError(
            loadError.response?.data?.error?.message ||
              loadError.message ||
              "Unable to load this session chat.",
          );
        }
      } finally {
        if (active) setIsLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId) return undefined;
    const socket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:3000", {
      auth: { token: localStorage.getItem("token") },
    });
    const joinSession = () => socket.emit("session:join", sessionId);
    const receiveMessage = (message) => {
      if (message.sessionId !== sessionId) return;
      setMessages((current) =>
        current.some((item) => item.id === message.id) ? current : [...current, message],
      );
    };
    const receiveError = (socketError) => {
      setError(socketError?.message || "Live session chat connection failed.");
    };
    socket.on("connect", joinSession);
    socket.on("session-message:new", receiveMessage);
    socket.on("error", receiveError);
    return () => {
      socket.off("connect", joinSession);
      socket.off("session-message:new", receiveMessage);
      socket.off("error", receiveError);
      if (socket.connected) socket.emit("session:leave", sessionId);
      socket.disconnect();
    };
  }, [sessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 30000);
    return () => window.clearInterval(interval);
  }, []);

  if (user?.role !== "STUDENT" && user?.role !== "TUTOR") return <Navigate to="/" replace />;

  const otherPerson = user.role === "TUTOR"
    ? session?.student?.user?.fullName
    : session?.tutor?.user?.fullName;
  const canSendMessages = session &&
    session.status !== "CANCELLED" &&
    now >= new Date(session.enrollment?.startedAt || 0).getTime() &&
    now < new Date(session.enrollment?.mentorshipExpiresAt || 0).getTime();
  const canJoin = session &&
    session.status === "SCHEDULED" &&
    now >= new Date(session.startsAt).getTime() - 30 * 60 * 1000 &&
    now < new Date(session.endsAt).getTime();

  const submitText = async (event) => {
    event.preventDefault();
    const textContent = text.trim();
    if (!textContent || isSending) return;
    setIsSending(true);
    setError(null);
    try {
      const message = await schedulingService.sendSessionMessage(sessionId, textContent);
      setMessages((current) =>
        current.some((item) => item.id === message.id) ? current : [...current, message],
      );
      setText("");
    } catch (sendError) {
      setError(sendError.response?.data?.error?.message || "Unable to send your message.");
    } finally {
      setIsSending(false);
    }
  };

  const uploadResource = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!supportedFileTypes.includes(file.type)) {
      setError("Choose a JPG, PNG, or PDF academic resource.");
      return;
    }
    if (file.size > maxFileSize) {
      setError("Academic resources must be 5 MB or smaller.");
      return;
    }
    setIsSending(true);
    setError(null);
    try {
      const message = await schedulingService.sendSessionResource(sessionId, file);
      setMessages((current) =>
        current.some((item) => item.id === message.id) ? current : [...current, message],
      );
    } catch (uploadError) {
      setError(uploadError.response?.data?.error?.message || "Unable to share this resource.");
    } finally {
      setIsSending(false);
    }
  };

  const downloadResource = async (message) => {
    try {
      const response = await apiClient.get(message.fileUrl, { responseType: "blob" });
      const objectUrl = URL.createObjectURL(response.data);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = message.fileName || "academic-resource";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    } catch (downloadError) {
      setError(downloadError.response?.data?.error?.message || "Unable to download this resource.");
    }
  };

  const loadOlderMessages = async () => {
    setIsLoadingHistory(true);
    setError(null);
    try {
      const nextPage = messagePage + 1;
      const history = await schedulingService.getSessionMessages(sessionId, { page: nextPage });
      setMessages((current) => {
        const olderMessages = [...history.items].reverse();
        const currentIds = new Set(current.map((message) => message.id));
        return [...olderMessages.filter((message) => !currentIds.has(message.id)), ...current];
      });
      setHasOlderMessages(history.total > nextPage * messagePageSize);
      setMessagePage(nextPage);
    } catch (historyError) {
      setError(historyError.response?.data?.error?.message || "Unable to load older session messages.");
    } finally {
      setIsLoadingHistory(false);
    }
  };

  return (
    <main className="min-h-screen bg-white px-4 py-8 text-left sm:px-6">
      <div className="mx-auto max-w-5xl">
        <Link
          to={user.role === "TUTOR" ? "/tutor-portal/schedule" : "/student/schedule"}
          className="text-sm font-semibold text-[#013638] hover:underline"
        >
          ← Back to schedule
        </Link>
        {isLoading ? (
          <p className="mt-8 text-sm text-slate-500">Loading session chat...</p>
        ) : session ? (
          <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <header className="border-b border-slate-200 bg-slate-50 p-5 sm:p-6">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#013638]">
                Mentorship session
              </p>
              <h1 className="mt-2 text-xl font-bold text-[#013638]">
                {session.course?.subject?.name} · {session.course?.gradeLevel?.replace("_", " ")}
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                {formatDate(session.startsAt)} · {otherPerson || "Mentorship partner"}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {(session.googleMeetLink || session.meetUrl) && (
                  <a
                    href={session.googleMeetLink || session.meetUrl}
                    target="_blank"
                    rel="noreferrer"
                    className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition ${
                      canJoin
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white animate-pulse"
                        : "bg-[#013638] hover:bg-[#024e51] text-white"
                    }`}
                  >
                    <Video className="h-4 w-4" />
                    <span>Join Meeting</span>
                  </a>
                )}
                {session.status !== "SCHEDULED" && (
                  <span className="rounded-lg bg-slate-200 px-3 py-2 text-xs font-semibold text-slate-700">
                    {session.status.toLowerCase()}
                  </span>
                )}
                {user.role === "STUDENT" && (
                  <>
                    <button
                      type="button"
                      onClick={() => setIsRatingModalOpen(true)}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition border ${
                        session.conversation?.rating
                          ? "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <Star
                        className={`h-3.5 w-3.5 ${
                          session.conversation?.rating
                            ? "fill-amber-400 text-amber-500"
                            : "text-amber-500"
                        }`}
                      />
                      <span>
                        {session.conversation?.rating
                          ? `Rated ${session.conversation.rating.score}★`
                          : "Rate Tutor"}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsReportingModalOpen(true)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition"
                      title="Report tutor or session to platform administration"
                    >
                      <ShieldAlert className="h-3.5 w-3.5 text-rose-600" />
                      <span>Report Tutor</span>
                    </button>
                  </>
                )}
              </div>
            </header>

            {error && <div className="px-5 pt-4 sm:px-6"><ErrorMessage message={error} /></div>}

            <div className="flex min-h-[24rem] max-h-[60vh] flex-col gap-3 overflow-y-auto p-5 sm:p-6">
              {hasOlderMessages && (
                <button
                  type="button"
                  onClick={loadOlderMessages}
                  disabled={isLoadingHistory}
                  className="mx-auto rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-[#013638] disabled:opacity-50"
                >
                  {isLoadingHistory ? "Loading older messages..." : "Load older messages"}
                </button>
              )}
              {messages.length ? messages.map((message) => {
                const isMine = message.senderId === user.id;
                return (
                  <article
                    key={message.id}
                    className={`max-w-[85%] rounded-2xl px-4 py-3 sm:max-w-[70%] ${
                      isMine ? "ml-auto bg-[#013638] text-white" : "bg-slate-100 text-slate-800"
                    }`}
                  >
                    {message.textContent && (
                      <p className="whitespace-pre-wrap break-words text-sm leading-6">
                        {message.textContent}
                      </p>
                    )}
                    {message.fileUrl && (
                      <button
                        type="button"
                        onClick={() => downloadResource(message)}
                        className={`mt-1 flex items-center gap-2 text-sm font-semibold underline ${
                          isMine ? "text-white" : "text-[#013638]"
                        }`}
                      >
                        <span aria-hidden="true">↧</span>
                        {message.fileName || "Download shared resource"}
                      </button>
                    )}
                    <time className={`mt-2 block text-[11px] ${isMine ? "text-white/70" : "text-slate-500"}`}>
                      {new Date(message.sentAt).toLocaleString()}
                    </time>
                  </article>
                );
              }) : (
                <p className="m-auto text-center text-sm text-slate-500">
                  No messages yet. Share a question or academic resource to get started.
                </p>
              )}
              <div ref={messagesEndRef} />
            </div>

            {canSendMessages ? (
              <form onSubmit={submitText} className="flex flex-col gap-3 border-t border-slate-200 p-4 sm:flex-row sm:items-end sm:p-5">
                <label className="sr-only" htmlFor="session-message">Write a session message</label>
                <textarea
                  id="session-message"
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                  maxLength={5000}
                  rows={2}
                  placeholder="Ask a question or share a note..."
                  className="min-h-12 flex-1 resize-y rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-[#013638] focus:ring-2 focus:ring-[#013638]/15"
                />
                <label className="cursor-pointer rounded-lg border border-slate-300 px-4 py-2.5 text-center text-sm font-semibold text-[#013638] hover:bg-slate-50">
                  Share file
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf"
                    disabled={isSending}
                    onChange={uploadResource}
                    className="sr-only"
                  />
                </label>
                <button
                  type="submit"
                  disabled={isSending || !text.trim()}
                  className="rounded-lg bg-[#013638] px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSending ? "Sending..." : "Send"}
                </button>
              </form>
            ) : (
              <p className="border-t border-slate-200 bg-slate-50 px-5 py-4 text-sm text-slate-600">
                This session chat is read-only because the session is no longer active.
              </p>
            )}
          </section>
        ) : (
          error && <div className="mt-6"><ErrorMessage message={error} /></div>
        )}
      </div>

      {/* Rate Tutor Modal */}
      {isRatingModalOpen && session?.conversationId && (
        <RateTutorModal
          isOpen={isRatingModalOpen}
          onClose={() => setIsRatingModalOpen(false)}
          conversationId={session.conversationId}
          tutorName={session.tutor?.user?.fullName || otherPerson || "Tutor"}
          courseName={session.course?.subject?.name || "Mentorship Session"}
          initialRating={session.conversation?.rating}
          onRatingSubmitted={(savedRating) => {
            setSession((prev) =>
              prev
                ? {
                    ...prev,
                    conversation: {
                      ...prev.conversation,
                      rating: savedRating,
                    },
                  }
                : prev
            );
          }}
        />
      )}

      {/* Report Tutor Modal */}
      {isReportingModalOpen && (
        <ReportTutorModal
          isOpen={isReportingModalOpen}
          onClose={() => setIsReportingModalOpen(false)}
          tutorId={
            session?.tutor?.userId ||
            session?.tutor?.user?.id ||
            session?.tutorId
          }
          tutorName={session?.tutor?.user?.fullName || otherPerson || "Tutor"}
          courseName={session?.course?.subject?.name || "Mentorship Session"}
          conversationId={session?.conversationId}
        />
      )}
    </main>
  );
}
