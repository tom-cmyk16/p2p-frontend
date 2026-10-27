import { useCallback, useEffect, useRef, useState } from "react";
import { quizService } from "../services/quiz.service";

const getErrorMessage = (error, fallback) => {
  const apiError = error.response?.data?.error;
  const details = Array.isArray(apiError?.details)
    ? apiError.details
        .map((detail) =>
          detail?.field && detail?.message
            ? `${detail.field}: ${detail.message}`
            : detail?.message
        )
        .filter(Boolean)
    : [];

  return [apiError?.message || error.message || fallback, ...details].join(" ");
};

export function useQuiz() {
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [weakTopics, setWeakTopics] = useState([]);
  const [attemptHistory, setAttemptHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(true);
  const [isLoadingTopics, setIsLoadingTopics] = useState(false);
  const [error, setError] = useState(null);
  const topicsRequestId = useRef(0);

  const fetchSubjects = useCallback(async () => {
    setIsLoadingSubjects(true);
    setError(null);

    try {
      const subjectList = await quizService.getSubjects();
      setSubjects(subjectList);
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Failed to load subjects"));
    } finally {
      setIsLoadingSubjects(false);
    }
  }, []);

  const fetchWeakTopics = useCallback(async () => {
    try {
      const weakTopicList = await quizService.getWeakTopics();
      setWeakTopics(weakTopicList);
      return weakTopicList;
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Failed to load weak topics"));
      return [];
    }
  }, []);

  const fetchAttemptHistory = useCallback(async () => {
    try {
      const history = await quizService.getAttemptHistory();
      setAttemptHistory(history);
      return history;
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Failed to load quiz history"));
      return [];
    }
  }, []);

  const fetchTopics = useCallback(async (subjectId) => {
    const requestId = ++topicsRequestId.current;

    if (!subjectId) {
      setTopics([]);
      setIsLoadingTopics(false);
      return [];
    }

    setIsLoadingTopics(true);
    setError(null);

    try {
      const topicList = await quizService.getTopics(subjectId);
      if (requestId === topicsRequestId.current) {
        setTopics(topicList);
      }
      return topicList;
    } catch (requestError) {
      if (requestId === topicsRequestId.current) {
        setTopics([]);
        setError(getErrorMessage(requestError, "Failed to load topics"));
      }
      return [];
    } finally {
      if (requestId === topicsRequestId.current) {
        setIsLoadingTopics(false);
      }
    }
  }, []);

  const startQuiz = useCallback(async (subjectId, gradeLevel, topicId) => {
    setIsLoading(true);
    setError(null);
    setQuestions([]);
    setAnswers({});

    try {
      const questionList = await quizService.getQuestions({
        subjectId,
        gradeLevel,
        ...(topicId ? { topicId } : {}),
      });
      setQuestions(questionList);
      return questionList;
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Failed to load quiz questions"));
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const selectAnswer = useCallback((questionId, selectedOptionId) => {
    setAnswers((currentAnswers) => ({
      ...currentAnswers,
      [questionId]: selectedOptionId,
    }));
  }, []);

  const submitQuiz = useCallback(
    async (subjectId, gradeLevel) => {
      const submittedAnswers = Object.entries(answers).map(
        ([questionId, selectedOptionId]) => ({
          questionId,
          selectedOptionId,
        })
      );

      if (submittedAnswers.length !== questions.length) {
        setError("Please answer every question before submitting.");
        return null;
      }

      setIsLoading(true);
      setError(null);

      try {
        return await quizService.submitAttempt({
          subjectId,
          gradeLevel,
          answers: submittedAnswers,
        });
      } catch (requestError) {
        setError(getErrorMessage(requestError, "Failed to submit quiz"));
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [answers, questions.length]
  );

  useEffect(() => {
    fetchSubjects();
    fetchWeakTopics();
    fetchAttemptHistory();
  }, [fetchSubjects, fetchWeakTopics, fetchAttemptHistory]);

  return {
    subjects,
    topics,
    questions,
    answers,
    weakTopics,
    attemptHistory,
    isLoading,
    isLoadingSubjects,
    isLoadingTopics,
    error,
    fetchSubjects,
    fetchTopics,
    fetchWeakTopics,
    startQuiz,
    selectAnswer,
    submitQuiz,
  };
}
