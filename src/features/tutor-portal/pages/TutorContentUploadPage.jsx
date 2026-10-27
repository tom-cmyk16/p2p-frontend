import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuthContext } from "../../../context/AuthContext";
import ErrorMessage from "../../../components/common/ErrorMessage";
import { useTutorPortal } from "../hooks/useTutorPortal";
import { downloadQuestionCsvTemplate, parseQuestionCsv } from "../../admin/utils/questionImport";

const gradeLevels = [
  { value: "GRADE_8", label: "Grade 8" },
  { value: "GRADE_9", label: "Grade 9" },
  { value: "GRADE_10", label: "Grade 10" },
  { value: "GRADE_11", label: "Grade 11" },
  { value: "GRADE_12", label: "Grade 12" },
];

const createEmptyQuestion = () => ({
  questionText: "",
  options: ["", "", "", ""],
  correctOption: "0",
  explanation: "",
});

export default function TutorContentUploadPage() {
  const { user } = useAuthContext();
  const {
    subjects,
    topics,
    isLoadingSubjects,
    isLoadingTopics,
    isSavingContent,
    error,
    fetchTopics,
    createSubject,
    createTopic,
    createQuestion,
    createBulkQuestions,
  } = useTutorPortal(null);
  const [gradeLevel, setGradeLevel] = useState("GRADE_8");
  const [subjectId, setSubjectId] = useState("");
  const [topicId, setTopicId] = useState("");
  const [subjectName, setSubjectName] = useState("");
  const [topicName, setTopicName] = useState("");
  const [question, setQuestion] = useState(createEmptyQuestion);
  const [statusMessage, setStatusMessage] = useState("");
  const [bulkQuestions, setBulkQuestions] = useState([]);
  const [bulkFileName, setBulkFileName] = useState("");
  const [bulkImportError, setBulkImportError] = useState("");

  useEffect(() => {
    fetchTopics(subjectId);
    setTopicId("");
  }, [subjectId, fetchTopics]);

  if (!["TUTOR", "ADMIN"].includes(user?.role)) {
    return <Navigate to="/" replace />;
  }

  const handleCreateSubject = async (event) => {
    event.preventDefault();
    setStatusMessage("");
    const subject = await createSubject({ name: subjectName.trim() });

    if (subject) {
      setSubjectId(subject.id);
      setSubjectName("");
      setStatusMessage(`Subject "${subject.name}" created.`);
    }
  };

  const handleCreateTopic = async (event) => {
    event.preventDefault();
    setStatusMessage("");
    const topic = await createTopic({
      subjectId,
      name: topicName.trim(),
    });

    if (topic) {
      setTopicId(topic.id);
      setTopicName("");
      setStatusMessage(`Topic "${topic.name}" created.`);
    }
  };

  const handleQuestionSubmit = async (event) => {
    event.preventDefault();
    setStatusMessage("");
    const createdQuestion = await createQuestion({
      subjectId,
      topicId,
      gradeLevel,
      questionText: question.questionText.trim(),
      options: question.options.map((option) => option.trim()),
      correctOption: question.correctOption,
      explanation: question.explanation.trim(),
    });

    if (createdQuestion) {
      setQuestion(createEmptyQuestion());
      setStatusMessage("Question created successfully.");
    }
  };

  const handleQuestionCsv = async (event) => {
    const file = event.target.files?.[0];
    setBulkQuestions([]);
    setBulkFileName("");
    setBulkImportError("");
    if (!file) return;
    try {
      if (!file.name.toLowerCase().endsWith(".csv")) {
        throw new Error("Choose a .csv file. Export Excel sheets as CSV before importing.");
      }
      setBulkQuestions(parseQuestionCsv(await file.text()));
      setBulkFileName(file.name);
    } catch (parseError) {
      setBulkImportError(parseError.message || "Unable to read this CSV file.");
    } finally {
      event.target.value = "";
    }
  };

  const handleBulkImport = async () => {
    if (!subjectId || !topicId) {
      setBulkImportError("Select a subject and topic before importing questions.");
      return;
    }
    setStatusMessage("");
    const result = await createBulkQuestions({
      subjectId,
      topicId,
      gradeLevel,
      questions: bulkQuestions,
    });
    if (result) {
      setBulkQuestions([]);
      setBulkFileName("");
      setBulkImportError("");
      setStatusMessage(`${result.createdCount} questions imported successfully.`);
    }
  };

  const updateOption = (index, value) => {
    setQuestion((current) => ({
      ...current,
      options: current.options.map((option, optionIndex) =>
        optionIndex === index ? value : option
      ),
    }));
  };

  return (
    <main className="min-h-screen bg-white px-4 py-10 text-left sm:px-6">
      <div className="mx-auto max-w-3xl space-y-7">
        <header>
          <Link
            to={user.role === "TUTOR" ? "/tutor-portal" : "/admin"}
            className="text-sm font-semibold text-[#013638] hover:underline"
          >
            ← Back
          </Link>
          <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-[#013638]">
            Tutor portal
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#013638]">
            Quiz content management
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Create subjects, topics, and multiple-choice questions.
          </p>
        </header>

        {error && <ErrorMessage message={error} />}
        {statusMessage && (
          <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {statusMessage}
          </p>
        )}

        <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-xl font-semibold text-[#013638]">Question category</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="contentGradeLevel" className="mb-2 block text-sm font-medium text-slate-700">
                Grade level
              </label>
              <select
                id="contentGradeLevel"
                value={gradeLevel}
                onChange={(event) => setGradeLevel(event.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#013638] focus:ring-2 focus:ring-[#013638]/15"
              >
                {gradeLevels.map((grade) => (
                  <option key={grade.value} value={grade.value}>
                    {grade.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="contentSubject" className="mb-2 block text-sm font-medium text-slate-700">
                Subject
              </label>
              <select
                id="contentSubject"
                required
                value={subjectId}
                onChange={(event) => setSubjectId(event.target.value)}
                disabled={isLoadingSubjects || isSavingContent}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#013638] focus:ring-2 focus:ring-[#013638]/15 disabled:bg-slate-50"
              >
                <option value="">
                  {isLoadingSubjects ? "Loading subjects..." : "Select a subject"}
                </option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </div>

            <form onSubmit={handleCreateSubject} className="flex items-end gap-2">
              <div className="min-w-0 flex-1">
                <label htmlFor="newSubjectName" className="mb-2 block text-sm font-medium text-slate-700">
                  Create subject
                </label>
                <input
                  id="newSubjectName"
                  required
                  maxLength={100}
                  value={subjectName}
                  onChange={(event) => setSubjectName(event.target.value)}
                  placeholder="Subject name"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-[#013638] focus:ring-2 focus:ring-[#013638]/15"
                />
              </div>
              <button
                type="submit"
                disabled={isSavingContent || !subjectName.trim()}
                className="rounded-lg border border-[#013638] px-3 py-2.5 text-sm font-semibold text-[#013638] hover:bg-[#013638]/5 disabled:opacity-50"
              >
                Add
              </button>
            </form>

            <div className="sm:col-span-2">
              <label htmlFor="contentTopic" className="mb-2 block text-sm font-medium text-slate-700">
                Topic
              </label>
              <select
                id="contentTopic"
                required
                value={topicId}
                onChange={(event) => setTopicId(event.target.value)}
                disabled={!subjectId || isLoadingTopics || isSavingContent}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#013638] focus:ring-2 focus:ring-[#013638]/15 disabled:bg-slate-50"
              >
                <option value="">
                  {isLoadingTopics
                    ? "Loading topics..."
                    : subjectId
                      ? "Select a topic"
                      : "Select a subject first"}
                </option>
                {topics.map((topic) => (
                  <option key={topic.id} value={topic.id}>
                    {topic.name}
                  </option>
                ))}
              </select>
            </div>

            <form onSubmit={handleCreateTopic} className="flex items-end gap-2 sm:col-span-2">
              <div className="min-w-0 flex-1">
                <label htmlFor="newTopicName" className="mb-2 block text-sm font-medium text-slate-700">
                  Create topic for selected subject
                </label>
                <input
                  id="newTopicName"
                  required
                  maxLength={100}
                  value={topicName}
                  onChange={(event) => setTopicName(event.target.value)}
                  disabled={!subjectId || isSavingContent}
                  placeholder="Topic name"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-[#013638] focus:ring-2 focus:ring-[#013638]/15 disabled:bg-slate-50"
                />
              </div>
              <button
                type="submit"
                disabled={isSavingContent || !subjectId || !topicName.trim()}
                className="rounded-lg border border-[#013638] px-3 py-2.5 text-sm font-semibold text-[#013638] hover:bg-[#013638]/5 disabled:opacity-50"
              >
                Add
              </button>
            </form>
          </div>
        </section>

        <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-[#013638]">Bulk question import</h2>
              <p className="mt-1 text-sm text-slate-600">
                Import 50–100 questions into the selected subject, topic, and grade.
              </p>
            </div>
            <button type="button" onClick={downloadQuestionCsvTemplate} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              Download CSV template
            </button>
          </div>
          <p className="text-xs leading-5 text-slate-500">
            Required columns: questionText, option1, option2, correctOption, explanation. Optional choices use consecutive columns option3–option6. correctOption is a 1-based number or exact option text. CSV files are limited to 1 MB; export Excel sheets as CSV first.
          </p>
          <label className="block text-sm font-medium text-slate-700">
            CSV file
            <input type="file" accept=".csv,text/csv" onChange={handleQuestionCsv} className="mt-1.5 block w-full rounded-lg border border-slate-300 p-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:font-semibold file:text-slate-700" />
          </label>
          {bulkImportError && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{bulkImportError}</p>}
          {bulkQuestions.length > 0 && (
            <div className="flex flex-col gap-3 rounded-xl bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold text-slate-900">{bulkFileName} · {bulkQuestions.length} questions ready</p>
                <p className="mt-1 text-xs text-slate-600">The whole import is saved atomically; database errors leave the question bank unchanged.</p>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => { setBulkQuestions([]); setBulkFileName(""); }} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700">Clear</button>
                <button type="button" onClick={handleBulkImport} disabled={isSavingContent || !subjectId || !topicId} className="rounded-lg bg-[#013638] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
                  {isSavingContent ? "Importing..." : `Import ${bulkQuestions.length} questions`}
                </button>
              </div>
            </div>
          )}
        </section>

        <form
          onSubmit={handleQuestionSubmit}
          className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
        >
          <div>
            <h2 className="text-xl font-semibold text-[#013638]">Multiple-choice question</h2>
            <p className="mt-1 text-sm text-slate-600">
              Add four answer options and select the correct answer.
            </p>
          </div>

          <section className="space-y-5 border-t border-slate-200 pt-6">
            <div>
              <label htmlFor="questionText" className="mb-2 block text-sm font-medium text-slate-700">
                Question
              </label>
              <textarea
                id="questionText"
                required
                maxLength={5000}
                rows={3}
                value={question.questionText}
                onChange={(event) =>
                  setQuestion((current) => ({
                    ...current,
                    questionText: event.target.value,
                  }))
                }
                className="w-full resize-y rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-[#013638] focus:ring-2 focus:ring-[#013638]/15"
                placeholder="Enter the question"
              />
            </div>

            <fieldset className="space-y-3">
              <legend className="mb-2 text-sm font-medium text-slate-700">
                Answer options
              </legend>
              {question.options.map((option, index) => (
                <div key={index} className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="correctOption"
                    value={index}
                    checked={question.correctOption === String(index)}
                    onChange={(event) =>
                      setQuestion((current) => ({
                        ...current,
                        correctOption: event.target.value,
                      }))
                    }
                    aria-label={`Mark option ${index + 1} as correct`}
                    className="accent-[#013638]"
                  />
                  <label htmlFor={`questionOption${index}`} className="sr-only">
                    Option {index + 1}
                  </label>
                  <input
                    id={`questionOption${index}`}
                    type="text"
                    required
                    maxLength={1000}
                    value={option}
                    onChange={(event) => updateOption(index, event.target.value)}
                    placeholder={`Option ${index + 1}${question.correctOption === String(index) ? " (correct)" : ""}`}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-[#013638] focus:ring-2 focus:ring-[#013638]/15"
                  />
                </div>
              ))}
              <p className="text-xs text-slate-500">
                Select the radio button next to the correct answer.
              </p>
            </fieldset>

            <div>
              <label htmlFor="questionExplanation" className="mb-2 block text-sm font-medium text-slate-700">
                Explanation
              </label>
              <textarea
                id="questionExplanation"
                required
                maxLength={5000}
                rows={3}
                value={question.explanation}
                onChange={(event) =>
                  setQuestion((current) => ({
                    ...current,
                    explanation: event.target.value,
                  }))
                }
                className="w-full resize-y rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-[#013638] focus:ring-2 focus:ring-[#013638]/15"
                placeholder="Explain why the correct answer is right"
              />
            </div>
          </section>

          <div className="flex flex-wrap justify-end gap-3 border-t border-slate-200 pt-5">
            <button
              type="button"
              onClick={() => {
                setQuestion(createEmptyQuestion());
                setStatusMessage("");
              }}
              disabled={isSavingContent}
              className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-[#013638] transition hover:bg-slate-50"
            >
              Clear draft
            </button>
            <button
              type="submit"
              disabled={isSavingContent || !subjectId || !topicId}
              className="rounded-lg bg-[#013638] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#01494b] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSavingContent ? "Saving..." : "Publish question"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
