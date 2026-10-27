import { useState } from "react";
import { ratingService } from "../services/rating.service";

export function useRating(conversationId) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const submitRating = async (score, comment) => {
    setIsLoading(true);
    setError(null);
    try {
      await ratingService.submitRating(conversationId, {
        score,
        comment: comment.trim() || null,
      });
      setSubmitted(true);
      return true;
    } catch (err) {
      const apiError = err.response?.data?.error;
      const details = Array.isArray(apiError?.details)
        ? apiError.details.map((detail) => detail?.message).filter(Boolean)
        : [];
      setError([apiError?.message || err.message || "Failed to submit rating", ...details].join(" "));
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return { submitRating, isLoading, error, submitted };
}
