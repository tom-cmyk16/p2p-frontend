import apiClient from "../../../lib/apiClient";

export const learningService = {
  getMyAccess: () =>
    apiClient.get("/learning/access").then((response) => response.data),
  getCourseMaterials: (courseId) =>
    apiClient
      .get("/learning/materials", { params: { courseId } })
      .then((response) => response.data),
  getCourses: () =>
    apiClient.get("/learning/courses").then((response) => response.data),
  createCourse: (payload) =>
    apiClient.post("/learning/courses", payload).then((response) => response.data),
  provisionPackage: (payload) =>
    apiClient.post("/learning/packages", payload).then((response) => response.data),
  setCourseCompletion: (studentId, courseId, completed) =>
    apiClient
      .patch(
        `/learning/students/${encodeURIComponent(studentId)}/courses/${encodeURIComponent(courseId)}/completion`,
        { completed },
      )
      .then((response) => response.data),
};
