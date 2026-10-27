import apiClient from "../../../lib/apiClient";
import { learningService } from "../../learning/services/learning.service";

export const adminService = {
  getDashboardOverview: () =>
    apiClient.get("/admin/dashboard").then((res) => res.data),

  getPendingApplications: (status = "SUBMITTED") =>
    apiClient
      .get(`/admin/tutor-applications?status=${status}`)
      .then((res) => res.data),

  approveApplication: (applicationId) =>
    apiClient
      .patch(`/admin/tutor-applications/${applicationId}/approve`)
      .then((res) => res.data),

  getTutorDocument: (applicationId, documentId) =>
    apiClient
      .get(
        `/admin/tutor-applications/${applicationId}/documents/${documentId}`,
        { responseType: "blob" },
      )
      .then((res) => res.data),

  rejectApplication: (applicationId, rejectionReason) =>
    apiClient
      .patch(`/admin/tutor-applications/${applicationId}/reject`, {
        rejectionReason,
      })
      .then((res) => res.data),

  getOpenReports: (status = "PENDING") =>
    apiClient.get(`/admin/reports?status=${status}`).then((res) => res.data),

  getReportById: (reportId) =>
    apiClient.get(`/admin/reports/${encodeURIComponent(reportId)}`).then((res) => res.data),

  resolveReport: (reportId, status) =>
    apiClient
      .patch(`/admin/reports/${reportId}`, { status })
      .then((res) => res.data),

  getReplacementTutors: (reportId) =>
    apiClient
      .get(`/admin/reports/${encodeURIComponent(reportId)}/replacement-tutors`)
      .then((res) => res.data),

  reassignReportTutor: (reportId, newTutorId, notes) =>
    apiClient
      .post(`/admin/reports/${encodeURIComponent(reportId)}/reassign-tutor`, { newTutorId, notes })
      .then((res) => res.data),

  getUsers: (params) =>
    apiClient.get("/admin/users", { params }).then((res) => res.data),

  verifyTutorCall: (userId) =>
    apiClient
      .patch(`/admin/users/${encodeURIComponent(userId)}/verify-call`)
      .then((res) => res.data),

  updateUserStatus: (userId, status) =>
    apiClient
      .patch(`/admin/users/${encodeURIComponent(userId)}/status`, { status })
      .then((res) => res.data),

  getSubjects: () =>
    apiClient.get("/subjects").then((response) => response.data),

  getTopics: (subjectId) =>
    apiClient
      .get(`/subjects/${encodeURIComponent(subjectId)}/topics`)
      .then((response) => response.data),

  createSubject: (payload) =>
    apiClient.post("/quiz/subjects", payload).then((response) => response.data),

  createTopic: (payload) =>
    apiClient.post("/quiz/topics", payload).then((response) => response.data),

  createQuestion: (payload) =>
    apiClient.post("/quiz/questions", payload).then((response) => response.data),
  bulkCreateQuestions: (payload) =>
    apiClient.post("/quiz/questions/bulk", payload).then((response) => response.data),
  updateSubject: (subjectId, payload) =>
    apiClient.patch(`/quiz/subjects/${encodeURIComponent(subjectId)}`, payload).then((response) => response.data),
  deleteSubject: (subjectId) =>
    apiClient.delete(`/quiz/subjects/${encodeURIComponent(subjectId)}`),
  updateTopic: (topicId, payload) =>
    apiClient.patch(`/quiz/topics/${encodeURIComponent(topicId)}`, payload).then((response) => response.data),
  deleteTopic: (topicId) =>
    apiClient.delete(`/quiz/topics/${encodeURIComponent(topicId)}`),
  getManagedQuestions: (params = {}) =>
    apiClient.get("/quiz/manage/questions", { params }).then((response) => response.data),
  updateQuestion: (questionId, payload) =>
    apiClient.patch(`/quiz/questions/${encodeURIComponent(questionId)}`, payload).then((response) => response.data),
  setQuestionPublished: (questionId, isPublished) =>
    apiClient.patch(`/quiz/questions/${encodeURIComponent(questionId)}/publish`, { isPublished }).then((response) => response.data),
  archiveQuestion: (questionId) =>
    apiClient.delete(`/quiz/questions/${encodeURIComponent(questionId)}`).then((response) => response.data),
  getManagedAttempts: () =>
    apiClient.get("/quiz/manage/attempts").then((response) => response.data),
  getLearningCourses: learningService.getCourses,
  createLearningCourse: learningService.createCourse,
  updateLearningCourse: (courseId, payload) =>
    apiClient.patch(`/learning/courses/${encodeURIComponent(courseId)}`, payload).then((response) => response.data),
  deleteLearningCourse: (courseId) =>
    apiClient.delete(`/learning/courses/${encodeURIComponent(courseId)}`),
  getManagedLearningMaterials: () =>
    apiClient.get("/learning/materials/manage").then((response) => response.data),
  createLearningMaterial: (payload) =>
    apiClient.post("/learning/materials", payload).then((response) => response.data),
  updateLearningMaterial: (materialId, payload) =>
    apiClient.patch(`/learning/materials/${encodeURIComponent(materialId)}`, payload).then((response) => response.data),
  deleteLearningMaterial: (materialId) =>
    apiClient.delete(`/learning/materials/${encodeURIComponent(materialId)}`),
  provisionLearningPackage: learningService.provisionPackage,
  setCourseCompletion: learningService.setCourseCompletion,
  // Exam Management
  getExams: (params = {}) =>
    apiClient.get("/quiz/exams", { params }).then((response) => response.data),
  getExam: (examId) =>
    apiClient.get(`/quiz/exams/${encodeURIComponent(examId)}`).then((response) => response.data),
  createExam: (payload) =>
    apiClient.post("/quiz/exams", payload).then((response) => response.data),
  updateExam: (examId, payload) =>
    apiClient.patch(`/quiz/exams/${encodeURIComponent(examId)}`, payload).then((response) => response.data),
  deleteExam: (examId) =>
    apiClient.delete(`/quiz/exams/${encodeURIComponent(examId)}`).then((response) => response.data),
  addExamQuestion: (examId, payload) =>
    apiClient.post(`/quiz/exams/${encodeURIComponent(examId)}/questions`, payload).then((response) => response.data),
  updateExamQuestion: (examId, questionId, payload) =>
    apiClient.patch(`/quiz/exams/${encodeURIComponent(examId)}/questions/${encodeURIComponent(questionId)}`, payload).then((response) => response.data),
  deleteExamQuestion: (examId, questionId) =>
    apiClient.delete(`/quiz/exams/${encodeURIComponent(examId)}/questions/${encodeURIComponent(questionId)}`).then((response) => response.data),
  bulkAddExamQuestions: (examId, questions) =>
    apiClient.post(`/quiz/exams/${encodeURIComponent(examId)}/questions/bulk`, { questions }).then((response) => response.data),
};