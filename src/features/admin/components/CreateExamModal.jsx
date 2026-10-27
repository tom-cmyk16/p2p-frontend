import { useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Download,
  FileSpreadsheet,
  FileText,
  HelpCircle,
  Plus,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import Button from "../../../components/common/Button";
import {
  downloadQuestionCsvTemplate,
  downloadQuestionWordTemplate,
  parseUniversalQuestionFile,
  parseQuestionWordText,
} from "../utils/questionImport";

const gradeLevels = [
  { value: "GRADE_8", label: "Grade 8" },
  { value: "GRADE_9", label: "Grade 9" },
  { value: "GRADE_10", label: "Grade 10" },
  { value: "GRADE_11", label: "Grade 11" },
  { value: "GRADE_12", label: "Grade 12" },
];

const emptyQuestionForm = () => ({
  questionText: "",
  options: ["", "", "", ""],
  correctOption: 0,
  explanation: "",
  topicId: "",
});

export default function CreateExamModal({
  isOpen,
  onClose,
  subjects = [],
  topics = [],
  onLoadTopics,
  onSaveExam,
  isSaving = false,
}) {
  const [title, setTitle] = useState("");
  const [gradeLevel, setGradeLevel] = useState("GRADE_9");
  const [subjectId, setSubjectId] = useState("");
  const [selectedTopicIds, setSelectedTopicIds] = useState([]);
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [passingScore, setPassingScore] = useState(60);
  const [instructions, setInstructions] = useState(
    "Answer all questions. Each question has four options with only one correct answer."
  );
  const [isPublished, setIsPublished] = useState(true);

  // Question Creation Mode: "manual" vs "bulk"
  const [creationMode, setCreationMode] = useState("manual");

  // Manual questions collection
  const [examQuestions, setExamQuestions] = useState([]);
  const [currentManualQ, setCurrentManualQ] = useState(emptyQuestionForm());

  // Bulk import state
  const [bulkFileName, setBulkFileName] = useState("");
  const [bulkQuestions, setBulkQuestions] = useState([]);
  const [bulkError, setBulkError] = useState("");
  const [bulkPastedText, setBulkPastedText] = useState("");
  const [showPasteBox, setShowPasteBox] = useState(false);

  // Validation / form error
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (subjects.length && !subjectId) {
      setSubjectId(subjects[0].id);
    }
  }, [subjects, subjectId]);

  useEffect(() => {
    if (subjectId) {
      onLoadTopics?.(subjectId);
      setSelectedTopicIds([]);
    }
  }, [subjectId, onLoadTopics]);

  if (!isOpen) return null;

  const handleToggleTopic = (topicId) => {
    setSelectedTopicIds((prev) =>
      prev.includes(topicId)
        ? prev.filter((id) => id !== topicId)
        : [...prev, topicId]
    );
  };

  const handleSelectAllTopics = () => {
    if (selectedTopicIds.length === topics.length) {
      setSelectedTopicIds([]);
    } else {
      setSelectedTopicIds(topics.map((t) => t.id));
    }
  };

  const handleAddManualQuestion = (e) => {
    e.preventDefault();
    setFormError("");

    if (!currentManualQ.questionText.trim()) {
      setFormError("Question text cannot be blank.");
      return;
    }
    const cleanOptions = currentManualQ.options
      .map((opt) => opt.trim())
      .filter(Boolean);
    if (cleanOptions.length < 2) {
      setFormError("At least 2 options are required.");
      return;
    }

    const newQ = {
      id: `temp_${Date.now()}_${Math.random()}`,
      questionText: currentManualQ.questionText.trim(),
      options: cleanOptions,
      correctOption: currentManualQ.correctOption,
      explanation: currentManualQ.explanation.trim() || "Standard explanation.",
      topicId: currentManualQ.topicId || (selectedTopicIds[0] || null),
    };

    setExamQuestions((prev) => [...prev, newQ]);
    setCurrentManualQ(emptyQuestionForm());
  };

  const handleRemoveQuestion = (index) => {
    setExamQuestions((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    setBulkError("");
    setBulkQuestions([]);
    setBulkFileName("");
    if (!file) return;

    try {
      const parsed = await parseUniversalQuestionFile(file);
      setBulkQuestions(parsed);
      setBulkFileName(file.name);
    } catch (err) {
      setBulkError(err.message || "Unable to parse this questions file.");
    } finally {
      e.target.value = "";
    }
  };

  const handleParsePastedText = () => {
    setBulkError("");
    if (!bulkPastedText.trim()) {
      setBulkError("Please paste formatted questions first.");
      return;
    }
    try {
      const parsed = parseQuestionWordText(bulkPastedText);
      setBulkQuestions(parsed);
      setBulkFileName("Pasted Word/Text Content");
      setShowPasteBox(false);
    } catch (err) {
      setBulkError(err.message || "Failed to parse pasted text.");
    }
  };

  const handleSubmitExam = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!title.trim()) {
      setFormError("Exam title is required.");
      return;
    }
    if (!subjectId) {
      setFormError("Please select a subject.");
      return;
    }

    // Determine final questions list
    let finalQuestions = [];
    if (creationMode === "manual") {
      finalQuestions = examQuestions;
    } else {
      finalQuestions = bulkQuestions;
    }

    if (!finalQuestions.length) {
      setFormError(
        creationMode === "manual"
          ? "Please add at least one question to the exam."
          : "Please upload or paste questions before saving the exam."
      );
      return;
    }

    const payload = {
      title: title.trim(),
      gradeLevel,
      subjectId,
      topicIds: selectedTopicIds.length ? selectedTopicIds : topics.map((t) => t.id),
      durationMinutes: Number(durationMinutes) || 60,
      passingScore: Number(passingScore) || 60,
      instructions: instructions.trim(),
      isPublished,
      questions: finalQuestions,
    };

    await onSaveExam(payload);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative my-8 w-full max-w-4xl rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-6 py-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#013638]">
              Assessment Creator
            </span>
            <h2 className="text-xl font-bold text-slate-900">Create New Exam</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmitExam} className="flex-1 overflow-y-auto p-6 space-y-6">
          {formError && (
            <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Section 1: Exam Metadata */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Exam Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Grade 9 Mathematics Midterm Mock Exam"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-[#013638] focus:ring-2 focus:ring-[#013638]/20 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Grade Level *
              </label>
              <select
                value={gradeLevel}
                onChange={(e) => setGradeLevel(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-[#013638] focus:ring-2 focus:ring-[#013638]/20 outline-none"
              >
                {gradeLevels.map((g) => (
                  <option key={g.value} value={g.value}>
                    {g.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Subject *
              </label>
              <select
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-[#013638] focus:ring-2 focus:ring-[#013638]/20 outline-none"
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Timer / Duration (Minutes) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="5"
                  max="360"
                  required
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-[#013638] focus:ring-2 focus:ring-[#013638]/20 outline-none pr-12"
                />
                <span className="absolute right-3.5 top-2.5 text-xs font-semibold text-slate-400">
                  MINS
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Passing Score (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={passingScore}
                  onChange={(e) => setPassingScore(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-[#013638] focus:ring-2 focus:ring-[#013638]/20 outline-none pr-8"
                />
                <span className="absolute right-3.5 top-2.5 text-xs font-semibold text-slate-400">
                  %
                </span>
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Exam Status
              </label>
              <div className="flex items-center gap-4 mt-2">
                <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700">
                  <input
                    type="radio"
                    name="isPublished"
                    checked={isPublished === true}
                    onChange={() => setIsPublished(true)}
                    className="accent-[#013638]"
                  />
                  <span>Published (Active for students)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700">
                  <input
                    type="radio"
                    name="isPublished"
                    checked={isPublished === false}
                    onChange={() => setIsPublished(false)}
                    className="accent-[#013638]"
                  />
                  <span>Draft (Hidden from students)</span>
                </label>
              </div>
            </div>
          </div>

          {/* Topics Covered Multi-select */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                Topics Covered ({selectedTopicIds.length} of {topics.length} selected)
              </label>
              <button
                type="button"
                onClick={handleSelectAllTopics}
                className="text-xs font-semibold text-[#013638] hover:underline"
              >
                {selectedTopicIds.length === topics.length ? "Deselect All" : "Select All Topics"}
              </button>
            </div>
            {topics.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No topics found for this subject.</p>
            ) : (
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto pt-1">
                {topics.map((t) => {
                  const isChecked = selectedTopicIds.includes(t.id);
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => handleToggleTopic(t.id)}
                      className={`rounded-full px-3 py-1 text-xs font-medium border transition ${
                        isChecked
                          ? "border-[#013638] bg-[#013638] text-white"
                          : "border-slate-300 bg-white text-slate-700 hover:border-slate-400"
                      }`}
                    >
                      {t.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 2: Question Addition Choice (Manual vs Bulk Import) */}
          <div className="border-t border-slate-200 pt-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Add Questions</h3>
                <p className="text-xs text-slate-500">
                  Choose between adding questions one-by-one or uploading 50–100 questions in bulk.
                </p>
              </div>

              {/* Mode Toggle */}
              <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200">
                <button
                  type="button"
                  onClick={() => setCreationMode("manual")}
                  className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
                    creationMode === "manual"
                      ? "bg-white text-[#013638] shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Manual Creation
                </button>
                <button
                  type="button"
                  onClick={() => setCreationMode("bulk")}
                  className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
                    creationMode === "bulk"
                      ? "bg-white text-[#013638] shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Bulk Import (Excel/Word/CSV)
                </button>
              </div>
            </div>

            {/* Sub-Panel: Manual Creation */}
            {creationMode === "manual" && (
              <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Question Text *
                  </label>
                  <textarea
                    rows={2}
                    value={currentManualQ.questionText}
                    onChange={(e) =>
                      setCurrentManualQ((prev) => ({ ...prev, questionText: e.target.value }))
                    }
                    placeholder="Enter the question prompt here..."
                    className="w-full rounded-xl border border-slate-300 p-3 text-sm text-slate-900 focus:border-[#013638] focus:ring-2 focus:ring-[#013638]/20 outline-none"
                  />
                </div>

                {/* Options grid */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-700">
                    Answer Options (Select the radio of the correct answer)
                  </label>
                  {currentManualQ.options.map((opt, optIndex) => (
                    <div key={optIndex} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="manualCorrectOption"
                        checked={currentManualQ.correctOption === optIndex}
                        onChange={() =>
                          setCurrentManualQ((prev) => ({ ...prev, correctOption: optIndex }))
                        }
                        className="accent-[#013638] h-4 w-4"
                        title="Mark as correct answer"
                      />
                      <span className="text-xs font-bold text-slate-500 w-5">
                        {String.fromCharCode(65 + optIndex)})
                      </span>
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => {
                          const updated = [...currentManualQ.options];
                          updated[optIndex] = e.target.value;
                          setCurrentManualQ((prev) => ({ ...prev, options: updated }));
                        }}
                        placeholder={`Option ${String.fromCharCode(65 + optIndex)}`}
                        className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-900 focus:border-[#013638] outline-none"
                      />
                    </div>
                  ))}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Explanation / Solution
                  </label>
                  <input
                    type="text"
                    value={currentManualQ.explanation}
                    onChange={(e) =>
                      setCurrentManualQ((prev) => ({ ...prev, explanation: e.target.value }))
                    }
                    placeholder="Explain why this option is correct"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-[#013638] outline-none"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    type="button"
                    onClick={handleAddManualQuestion}
                    className="flex items-center gap-1.5 text-xs px-4 py-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Question to Exam</span>
                  </Button>
                </div>

                {/* Added questions list preview */}
                {examQuestions.length > 0 && (
                  <div className="mt-4 border-t border-slate-100 pt-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                      Questions added ({examQuestions.length})
                    </p>
                    <div className="space-y-2 max-h-44 overflow-y-auto">
                      {examQuestions.map((q, idx) => (
                        <div
                          key={q.id}
                          className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3 text-xs"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-slate-900 truncate">
                              {idx + 1}. {q.questionText}
                            </p>
                            <p className="text-emerald-700 mt-0.5">
                              Correct: {q.options[q.correctOption]}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveQuestion(idx)}
                            className="text-rose-600 hover:text-rose-800 p-1"
                            title="Remove question"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Sub-Panel: Bulk Import */}
            {creationMode === "bulk" && (
              <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-xs font-bold text-slate-800">
                      Upload Question Files (Excel, CSV, Word text)
                    </span>
                    <p className="text-xs text-slate-500">
                      Target: 50–100 questions per formal examination.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={downloadQuestionCsvTemplate}
                      className="flex items-center gap-1 text-xs font-semibold text-[#013638] hover:underline"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>CSV/Excel Template</span>
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={downloadQuestionWordTemplate}
                      className="flex items-center gap-1 text-xs font-semibold text-[#013638] hover:underline"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Word/Text Template</span>
                    </button>
                  </div>
                </div>

                {bulkError && (
                  <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-800">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{bulkError}</span>
                  </div>
                )}

                {/* Upload drag/click area */}
                <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 p-6 text-center hover:border-[#013638] transition bg-slate-50/50">
                  <Upload className="h-8 w-8 text-[#013638] mb-2" />
                  <p className="text-sm font-semibold text-slate-800">
                    Click to browse or drop your questions file
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Accepts .csv, .xlsx exports, or .txt/.docx text files
                  </p>
                  <label className="mt-3 cursor-pointer rounded-xl bg-[#013638] px-4 py-2 text-xs font-semibold text-white hover:bg-[#024e51] transition">
                    Choose File
                    <input
                      type="file"
                      accept=".csv,.txt,.doc,.docx"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Paste Option */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">
                    Or directly paste question text from Word or Excel
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowPasteBox(!showPasteBox)}
                    className="text-xs font-semibold text-[#013638] hover:underline"
                  >
                    {showPasteBox ? "Hide paste box" : "Paste questions text"}
                  </button>
                </div>

                {showPasteBox && (
                  <div className="space-y-2">
                    <textarea
                      rows={6}
                      value={bulkPastedText}
                      onChange={(e) => setBulkPastedText(e.target.value)}
                      placeholder="1. What is the speed of light?&#10;A) 3x10^8 m/s&#10;B) 2x10^8 m/s&#10;Answer: A&#10;Explanation: Measured in vacuum."
                      className="w-full rounded-xl border border-slate-300 p-3 font-mono text-xs text-slate-800 focus:border-[#013638] outline-none"
                    />
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        onClick={handleParsePastedText}
                        className="text-xs px-3 py-1.5"
                      >
                        Parse Pasted Questions
                      </Button>
                    </div>
                  </div>
                )}

                {/* Parsed questions status banner */}
                {bulkQuestions.length > 0 && (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-emerald-900 font-semibold text-sm">
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                        <span>
                          {bulkQuestions.length} Questions successfully loaded from {bulkFileName}
                        </span>
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                          bulkQuestions.length >= 50 && bulkQuestions.length <= 100
                            ? "bg-emerald-200 text-emerald-900"
                            : "bg-amber-100 text-amber-900"
                        }`}
                      >
                        {bulkQuestions.length >= 50 && bulkQuestions.length <= 100
                          ? "Standard 50–100 Range"
                          : `${bulkQuestions.length} Questions`}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition"
            >
              Cancel
            </button>
            <Button
              type="submit"
              disabled={
                isSaving ||
                (creationMode === "manual" && examQuestions.length === 0) ||
                (creationMode === "bulk" && bulkQuestions.length === 0)
              }
              className="px-6 py-2.5 text-sm"
            >
              {isSaving
                ? "Saving Exam..."
                : `Save & Create Exam (${
                    creationMode === "manual" ? examQuestions.length : bulkQuestions.length
                  } Questions)`}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
