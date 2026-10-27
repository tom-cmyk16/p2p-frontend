import apiClient from "../../../lib/apiClient";

export const quizService = {
  getSubjects: () =>
    apiClient.get("/subjects").then((response) => response.data),
  getTopics: (subjectId) =>
    apiClient
      .get(`/subjects/${encodeURIComponent(subjectId)}/topics`)
      .then((response) => response.data),
  getQuestions: (params) =>
    apiClient.get("/quiz/questions", { params }).then((response) => response.data),
  submitAttempt: (payload) =>
    apiClient.post("/quiz/attempts", payload).then((response) => response.data),
  getAttemptHistory: () =>
    apiClient.get("/quiz/attempts").then((response) => response.data),
  getWeakTopics: () =>
    apiClient.get("/quiz/weak-topics").then((response) => response.data),
  getExams: (params = {}) =>
    apiClient.get("/quiz/exams", { params }).then((response) => response.data),
  getExam: (examId) =>
    apiClient.get(`/quiz/exams/${encodeURIComponent(examId)}`).then((response) => response.data),
  submitExamAttempt: (examId, answers) =>
    apiClient.post(`/quiz/exams/${encodeURIComponent(examId)}/submit`, { answers }).then((response) => response.data),
};
