import { useCallback, useEffect, useState } from "react";
import { tutorPortalService } from "../services/tutorPortal.service";

const getErrorMessage = (error, fallback) =>
  error.response?.data?.error?.message ||
  error.message ||
  fallback;

export function useTutorPortal(tutorId) {
  const [summary, setSummary] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);
  const [isLoadingSummary, setIsLoadingSummary] = useState(true);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(true);
  const [isLoadingTopics, setIsLoadingTopics] = useState(false);
  const [isSavingContent, setIsSavingContent] = useState(false);
  const [error, setError] = useState(null);

  const fetchSummary = useCallback(async () => {
    if (!tutorId) {
      setIsLoadingSummary(false);
      return;
    }

    setIsLoadingSummary(true);
    setError(null);

    try {
      const result = await tutorPortalService.getDashboardSummary(tutorId);
      setSummary(result);
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Failed to load tutor dashboard"));
    } finally {
      setIsLoadingSummary(false);
    }
  }, [tutorId]);

  const fetchSubjects = useCallback(async () => {
    setIsLoadingSubjects(true);

    try {
      const result = await tutorPortalService.getSubjects();
      setSubjects(result);
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Failed to load subjects"));
    } finally {
      setIsLoadingSubjects(false);
    }
  }, []);

  const fetchTopics = useCallback(async (subjectId) => {
    if (!subjectId) {
      setTopics([]);
      return [];
    }

    setIsLoadingTopics(true);
    setError(null);

    try {
      const result = await tutorPortalService.getTopics(subjectId);
      setTopics(result);
      return result;
    } catch (requestError) {
      setTopics([]);
      setError(getErrorMessage(requestError, "Failed to load topics"));
      return [];
    } finally {
      setIsLoadingTopics(false);
    }
  }, []);

  const createSubject = useCallback(async (payload) => {
    setIsSavingContent(true);
    setError(null);

    try {
      const createdSubject = await tutorPortalService.createSubject(payload);
      await fetchSubjects();
      return createdSubject;
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Failed to create subject"));
      return null;
    } finally {
      setIsSavingContent(false);
    }
  }, [fetchSubjects]);

  const createTopic = useCallback(async (payload) => {
    setIsSavingContent(true);
    setError(null);

    try {
      const createdTopic = await tutorPortalService.createTopic(payload);
      await fetchTopics(payload.subjectId);
      return createdTopic;
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Failed to create topic"));
      return null;
    } finally {
      setIsSavingContent(false);
    }
  }, [fetchTopics]);

  const createQuestion = useCallback(async (payload) => {
    setIsSavingContent(true);
    setError(null);

    try {
      return await tutorPortalService.createQuestion(payload);
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Failed to create question"));
      return null;
    } finally {
      setIsSavingContent(false);
    }
  }, []);

  const createBulkQuestions = useCallback(async (payload) => {
    setIsSavingContent(true);
    setError(null);

    try {
      return await tutorPortalService.bulkCreateQuestions(payload);
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Failed to import questions"));
      return null;
    } finally {
      setIsSavingContent(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  return {
    summary,
    subjects,
    topics,
    isLoadingSummary,
    isLoadingSubjects,
    isLoadingTopics,
    isSavingContent,
    error,
    fetchSummary,
    fetchSubjects,
    fetchTopics,
    createSubject,
    createTopic,
    createQuestion,
    createBulkQuestions,
  };
}
