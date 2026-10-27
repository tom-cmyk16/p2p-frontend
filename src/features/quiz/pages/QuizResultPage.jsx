import { Link, useLocation, useNavigate } from "react-router-dom";
import Button from "../../../components/common/Button";

const gradeLabels = {
  GRADE_8: "Grade 8",
  GRADE_9: "Grade 9",
  GRADE_10: "Grade 10",
  GRADE_11: "Grade 11",
  GRADE_12: "Grade 12",
};

export default function QuizResultPage() {
  const { state } = useLocation();
  const navigate = useNavigate();

  if (!state?.result || !Array.isArray(state.questions)) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white px-4 py-12">
        <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-[#013638]">Result unavailable</h1>
          <p className="mt-2 text-sm text-slate-600">
            Complete a practice quiz to view your detailed results.
          </p>
          <Link
            to="/quiz"
            className="mt-5 inline-block text-sm font-semibold text-[#013638] hover:underline"
          >
            Return to practice quiz
          </Link>
        </section>
      </main>
    );
  }

  const { result, questions, weakTopics = [], subjectName, gradeLevel } = state;
  const answerResults = result.answers || [];
  const correctCount = answerResults.filter((answer) => answer.isCorrect).length;
  const answerById = new Map(
    answerResults.map((answer) => [answer.questionId, answer])
  );

  return (
    <main className="min-h-screen bg-white px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-3xl space-y-8">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm sm:p-10">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#013638]">
            {subjectName}
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#013638]">
            Practice complete
          </h1>
          <p className="mt-2 text-sm text-slate-600">{gradeLabels[gradeLevel]}</p>
          <div className="mx-auto mt-7 flex h-32 w-32 flex-col items-center justify-center rounded-full border-8 border-[#013638]/10">
            <span className="text-3xl font-bold text-[#013638]">{result.score}%</span>
            <span className="text-xs text-slate-500">score</span>
          </div>
          <p className="mt-4 text-sm text-slate-700">
            You answered {correctCount} of {answerResults.length} questions correctly.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button type="button" onClick={() => navigate("/quiz")} className="py-3 text-sm">
              Practice again
            </Button>
            <Link
              to="/profile"
              className="inline-flex items-center justify-center rounded-md border border-slate-300 px-4 py-3 text-sm font-medium text-[#013638] transition hover:bg-slate-50"
            >
              View profile
            </Link>
          </div>
        </section>

        {weakTopics.length > 0 && (
          <section className="rounded-2xl border border-amber-200 bg-amber-50/60 p-6 sm:p-8">
            <h2 className="text-xl font-semibold text-[#013638]">Topics to review</h2>
            <p className="mt-1 text-sm text-slate-600">
              These topics have an average score below 60% across your attempts.
            </p>
            <ul className="mt-4 divide-y divide-amber-200">
              {weakTopics.map((topic) => (
                <li
                  key={topic.topicId}
                  className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
                >
                  <span className="text-sm font-medium text-slate-800">
                    {topic.topicName}
                  </span>
                  <span className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-[#013638]">
                    {topic.averageScore}%
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-[#013638]">Answer review</h2>
          {questions.map((question, index) => {
            const answer = answerById.get(question.id);
            const correctOptionId = answer?.correctOptionId;
            const selectedOptionId = answer?.selectedOptionId;
            const correctOption = question.options.find(
              (option) => option.id === correctOptionId
            );
            const selectedOption = question.options.find(
              (option) => option.id === selectedOptionId
            );

            return (
              <article
                key={question.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <h3 className="text-sm font-semibold leading-6 text-slate-900">
                    <span className="mr-2 text-[#013638]">Question {index + 1}</span>
                    {question.questionText}
                  </h3>
                  <span
                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                      answer?.isCorrect
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-red-50 text-red-700"
                    }`}
                  >
                    {answer?.isCorrect ? "Correct" : "Incorrect"}
                  </span>
                </div>
                <div className="mt-4 space-y-2 text-sm">
                  {selectedOption && (
                    <p className={answer?.isCorrect ? "text-emerald-700" : "text-red-700"}>
                      Your answer: {selectedOption.optionText}
                    </p>
                  )}
                  {correctOption && !answer?.isCorrect && (
                    <p className="text-emerald-700">
                      Correct answer: {correctOption.optionText}
                    </p>
                  )}
                  {!selectedOption && (
                    <p className="text-red-700">No answer was recorded.</p>
                  )}
                </div>
              </article>
            );
          })}
          {questions.length === 0 && (
            <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
              No question details are available for review.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
