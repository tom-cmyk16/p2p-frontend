import { useCallback, useEffect, useState } from "react";
import { tutorService } from "../services/tutor.service";
import { chatService } from "../../chat/services/chat.service";

const getErrorMessage = (error, fallback) => {
  const apiError = error.response?.data?.error;
  const details = Array.isArray(apiError?.details)
    ? apiError.details
        .map((detail) => detail?.message)
        .filter(Boolean)
    : [];

  return [apiError?.message || error.message || fallback, ...details].join(" ");
};

export function useTutors(initialFilters = {}) {
  const [tutors, setTutors] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [filters, setFilters] = useState(initialFilters);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(true);
  const [isBooking, setIsBooking] = useState(false);
  const [error, setError] = useState(null);

  const fetchTutors = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const results = await tutorService.getTutors(filters);
      setTutors(results);
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Failed to load tutors"));
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  const fetchSubjects = useCallback(async () => {
    setIsLoadingSubjects(true);

    try {
      const results = await tutorService.getSubjects();
      setSubjects(results);
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Failed to load subjects"));
    } finally {
      setIsLoadingSubjects(false);
    }
  }, []);

  const getTutor = useCallback(async (tutorId) => {
    setError(null);

    try {
      return await tutorService.getTutorById(tutorId);
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Failed to load tutor details"));
      return null;
    }
  }, []);

  const requestSession = useCallback(async (tutorId) => {
    setIsBooking(true);
    setError(null);

    try {
      return await chatService.getOrCreateConversation(tutorId);
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Failed to request a tutoring session"));
      return null;
    } finally {
      setIsBooking(false);
    }
  }, []);

  useEffect(() => {
    fetchTutors();
  }, [fetchTutors]);

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  const normalizedSearch = search.trim().toLocaleLowerCase();
  const visibleTutors = normalizedSearch
    ? tutors.filter((tutor) => {
        const searchText = [
          tutor.user?.fullName,
          tutor.bio,
          tutor.institutionName,
          tutor.fieldOfStudy,
          ...((tutor.subjects || []).map((subject) => {
            const matchingSubject = subjects.find(
              (item) => item.id === subject.subjectId
            );
            return matchingSubject?.name;
          })),
        ]
          .filter(Boolean)
          .join(" ")
          .toLocaleLowerCase();

        return searchText.includes(normalizedSearch);
      })
    : tutors;

  return {
    tutors: visibleTutors,
    subjects,
    filters,
    setFilters,
    search,
    setSearch,
    isLoading,
    isLoadingSubjects,
    isBooking,
    error,
    fetchTutors,
    getTutor,
    requestSession,
  };
}
