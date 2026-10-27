import { useCallback, useEffect, useState } from "react";
import { tutorRatingsService } from "../services/tutorRatings.service";

const getErrorMessage = (error) =>
  error.response?.data?.error?.message ||
  error.message ||
  "Failed to load tutor ratings";

export function useTutorRatings(tutorId) {
  const [ratings, setRatings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRatings = useCallback(async () => {
    if (!tutorId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const tutor = await tutorRatingsService.getRatings(tutorId);
      setRatings(tutor.ratingsReceived || []);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsLoading(false);
    }
  }, [tutorId]);

  useEffect(() => {
    fetchRatings();
  }, [fetchRatings]);

  const distribution = [5, 4, 3, 2, 1].map((score) => ({
    score,
    count: ratings.filter((rating) => rating.score === score).length,
  }));
  const averageRating = ratings.length
    ? Number(
        (
          ratings.reduce((total, rating) => total + rating.score, 0) /
          ratings.length
        ).toFixed(1)
      )
    : null;

  return {
    ratings,
    distribution,
    averageRating,
    totalRatings: ratings.length,
    writtenReviewCount: ratings.filter((rating) => rating.comment?.trim()).length,
    isLoading,
    error,
    fetchRatings,
  };
}
