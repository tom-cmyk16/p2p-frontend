import apiClient from "../../../lib/apiClient";

const getConversationMessages = async (conversationId, tutorId) => {
  const firstPage = await apiClient.get(
    `/conversations/${encodeURIComponent(conversationId)}/messages`,
    { params: { page: 1, limit: 100 } }
  );

  const firstResult = firstPage.data;
  const messages = [...(firstResult.items || [])];
  const pageCount = Math.ceil((firstResult.total || 0) / 100);

  for (let page = 2; page <= pageCount; page += 1) {
    const response = await apiClient.get(
      `/conversations/${encodeURIComponent(conversationId)}/messages`,
      { params: { page, limit: 100 } }
    );
    messages.push(...(response.data.items || []));
  }

  return messages.filter(
    (message) => message.senderId !== tutorId && message.type === "TEXT"
  ).length;
};

export const tutorPortalService = {
  async getDashboardSummary(tutorId) {
    const [tutorResponse, conversationsResponse] = await Promise.all([
      apiClient.get(`/tutors/${encodeURIComponent(tutorId)}`),
      apiClient.get("/conversations"),
    ]);
    const conversations = conversationsResponse.data;
    const tutorConversations = conversations.filter(
      (conversation) => conversation.tutorId === tutorId
    );
    const inquiryCounts = await Promise.all(
      tutorConversations.map((conversation) =>
        getConversationMessages(conversation.id, tutorId)
      )
    );
    const ratings = tutorResponse.data.ratingsReceived || [];
    const feedbackCount = ratings.filter((rating) => rating.comment?.trim()).length;

    return {
      activeSessions: tutorConversations.filter(
        (conversation) => conversation.status === "ACTIVE"
      ).length,
      studentQuestionsHandled: inquiryCounts.reduce(
        (total, count) => total + count,
        0
      ),
      averageRating:
        ratings.length > 0
          ? Number(
              (
                ratings.reduce((total, rating) => total + rating.score, 0) /
                ratings.length
              ).toFixed(1)
            )
          : null,
      totalRatings: ratings.length,
      feedbackCount,
      feedback: ratings.filter((rating) => rating.comment?.trim()),
    };
  },
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
};
