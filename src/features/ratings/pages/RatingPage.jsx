import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import ErrorMessage from "../../../components/common/ErrorMessage";
import Loader from "../../../components/common/Loader";
import { chatService } from "../../chat/services/chat.service";
import RatingModal from "./RatingModal";

export default function RatingPage() {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const [conversation, setConversation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;

    chatService
      .getConversations()
      .then((conversations) => {
        if (!active) {
          return;
        }

        const currentConversation = conversations.find(
          (item) => item.id === conversationId
        );
        if (!currentConversation) {
          setError("Tutoring session not found.");
        } else if (currentConversation.status !== "CLOSED") {
          setError("You can rate this tutor after the session is completed.");
        } else {
          setConversation(currentConversation);
        }
      })
      .catch((requestError) => {
        if (active) {
          setError(
            requestError.response?.data?.error?.message ||
              requestError.message ||
              "Failed to verify this tutoring session"
          );
        }
      })
      .finally(() => {
        if (active) {
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [conversationId]);

  const closeModal = () => navigate(`/chat/${conversationId}`);

  if (isLoading) {
    return <Loader label="Checking tutoring session..." />;
  }

  if (!conversation) {
    return (
      <main className="min-h-screen bg-white px-4 py-10 text-left">
        <div className="mx-auto max-w-xl space-y-5">
          <ErrorMessage message={error} />
          <Link
            to="/student"
            className="text-sm font-semibold text-[#013638] hover:underline"
          >
            Browse tutors
          </Link>
        </div>
      </main>
    );
  }

  return <RatingModal conversationId={conversationId} onClose={closeModal} />;
}
