import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  CheckCircle,
  Clock,
  FileSpreadsheet,
  FileText,
  Filter,
  GraduationCap,
  Layers,
  Plus,
  Search,
  Sparkles,
} from "lucide-react";
import { adminService } from "../services/admin.service";
import Button from "../../../components/common/Button";
import ErrorMessage from "../../../components/common/ErrorMessage";
import Loader from "../../../components/common/Loader";
import CreateExamModal from "../components/CreateExamModal";
import ExamCard from "../components/ExamCard";
import ExamDetailModal from "../components/ExamDetailModal";

const gradeLevels = [
  { value: "ALL", label: "All Grades" },
  { value: "GRADE_8", label: "Grade 8" },
  { value: "GRADE_9", label: "Grade 9" },
  { value: "GRADE_10", label: "Grade 10" },
  { value: "GRADE_11", label: "Grade 11" },
  { value: "GRADE_12", label: "Grade 12" },
];

const getErrorMessage = (error, fallback) =>
  error.response?.data?.error?.message ||
  error.response?.data?.message ||
  error.message ||
  fallback;

export default function AdminContentManagementPage() {
  const [activeTab, setActiveTab] = useState("exams"); // "exams" | "subjects" | "materials" | "attempts"

  // Data states
  const [exams, setExams] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);
  const [courses, setCourses] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [quizAttempts, setQuizAttempts] = useState([]);

  // Exam Modals State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Filters for Exams
  const [examSearch, setExamSearch] = useState("");
  const [filterGrade, setFilterGrade] = useState("ALL");
  const [filterSubject, setFilterSubject] = useState("ALL");

  // Subject / Topic management states
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [newSubjectName, setNewSubjectName] = useState("");
  const [newTopicName, setNewTopicName] = useState("");

  // Material management states
  const [materialForm, setMaterialForm] = useState({
    courseId: "",
    topicId: "",
    title: "",
    description: "",
    url: "",
    isPublished: true,
  });
  const [editingMaterialId, setEditingMaterialId] = useState(null);

  // UI status
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [examList, subjectList, courseList, materialList, attemptList] =
        await Promise.all([
          adminService.getExams().catch(() => []),
          adminService.getSubjects().catch(() => []),
          adminService.getLearningCourses().catch(() => []),
          adminService.getManagedLearningMaterials().catch(() => []),
          adminService.getManagedAttempts().catch(() => []),
        ]);

      setExams(examList);
      setSubjects(subjectList);
      setCourses(courseList);
      setMaterials(materialList);
      setQuizAttempts(attemptList);

      if (subjectList.length > 0 && !selectedSubjectId) {
        setSelectedSubjectId(subjectList[0].id);
      }
      if (courseList.length > 0 && !materialForm.courseId) {
        setMaterialForm((prev) => ({ ...prev, courseId: courseList[0].id }));
      }
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load content management data."));
    } finally {
      setIsLoading(false);
    }
  }, [selectedSubjectId, materialForm.courseId]);

  const loadTopics = useCallback(async (subId) => {
    if (!subId) {
      setTopics([]);
      return;
    }
    try {
      const res = await adminService.getTopics(subId);
      setTopics(res);
    } catch {
      setTopics([]);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (selectedSubjectId) {
      loadTopics(selectedSubjectId);
    }
  }, [selectedSubjectId, loadTopics]);

  // Exam Actions
  const handleOpenExamDetails = async (exam) => {
    try {
      const fullExam = await adminService.getExam(exam.id);
      setSelectedExam(fullExam);
      setIsDetailModalOpen(true);
    } catch {
      setSelectedExam(exam);
      setIsDetailModalOpen(true);
    }
  };

  const handleSaveNewExam = async (payload) => {
    setIsSaving(true);
    setError(null);
    try {
      const created = await adminService.createExam(payload);
      setExams((prev) => [created, ...prev]);
      setIsCreateModalOpen(false);
      setSuccessMessage(`Exam "${created.title}" successfully created with ${created.questionsCount || 0} questions.`);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to create exam."));
    } finally {
      setIsSaving(false);
    }
  };

  const handleTogglePublished = async (exam) => {
    try {
      const updated = await adminService.updateExam(exam.id, {
        isPublished: !exam.isPublished,
      });
      setExams((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
      setSuccessMessage(
        `Exam marked as ${updated.isPublished ? "Published" : "Draft"}.`
      );
    } catch (err) {
      setError(getErrorMessage(err, "Failed to update exam status."));
    }
  };

  const handleDeleteExam = async (exam) => {
    if (!window.confirm(`Are you sure you want to delete exam "${exam.title}"?`)) return;
    try {
      await adminService.deleteExam(exam.id);
      setExams((prev) => prev.filter((e) => e.id !== exam.id));
      setSuccessMessage(`Exam "${exam.title}" was deleted.`);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to delete exam."));
    }
  };

  // Exam Details Modal Handlers
  const handleUpdateExam = async (examId, payload) => {
    const updated = await adminService.updateExam(examId, payload);
    setSelectedExam(updated);
    setExams((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
    return updated;
  };

  const handleAddQuestionToExam = async (examId, questionData) => {
    const newQ = await adminService.addExamQuestion(examId, questionData);
    const refreshed = await adminService.getExam(examId);
    setSelectedExam(refreshed);
    setExams((prev) => prev.map((e) => (e.id === refreshed.id ? refreshed : e)));
    return newQ;
  };

  const handleUpdateExamQuestion = async (examId, questionId, questionData) => {
    const updatedQ = await adminService.updateExamQuestion(examId, questionId, questionData);
    const refreshed = await adminService.getExam(examId);
    setSelectedExam(refreshed);
    setExams((prev) => prev.map((e) => (e.id === refreshed.id ? refreshed : e)));
    return updatedQ;
  };

  const handleDeleteExamQuestion = async (examId, questionId) => {
    await adminService.deleteExamQuestion(examId, questionId);
    const refreshed = await adminService.getExam(examId);
    setSelectedExam(refreshed);
    setExams((prev) => prev.map((e) => (e.id === refreshed.id ? refreshed : e)));
  };

  const handleBulkAddQuestions = async (examId, questions) => {
    await adminService.bulkAddExamQuestions(examId, questions);
    const refreshed = await adminService.getExam(examId);
    setSelectedExam(refreshed);
    setExams((prev) => prev.map((e) => (e.id === refreshed.id ? refreshed : e)));
  };

  // Subject / Topic Handlers
  const handleCreateSubject = async (e) => {
    e.preventDefault();
    if (!newSubjectName.trim()) return;
    try {
      const created = await adminService.createSubject({ name: newSubjectName.trim() });
      setSubjects((prev) => [...prev, created]);
      setSelectedSubjectId(created.id);
      setNewSubjectName("");
      setSuccessMessage("Subject created.");
    } catch (err) {
      setError(getErrorMessage(err, "Failed to create subject."));
    }
  };

  const handleCreateTopic = async (e) => {
    e.preventDefault();
    if (!newTopicName.trim() || !selectedSubjectId) return;
    try {
      const created = await adminService.createTopic({
        subjectId: selectedSubjectId,
        name: newTopicName.trim(),
      });
      setTopics((prev) => [...prev, created]);
      setNewTopicName("");
      setSuccessMessage("Topic added.");
    } catch (err) {
      setError(getErrorMessage(err, "Failed to create topic."));
    }
  };

  // Filtered Exams
  const filteredExams = exams.filter((exam) => {
    const matchesSearch =
      exam.title?.toLowerCase().includes(examSearch.toLowerCase()) ||
      exam.subjectName?.toLowerCase().includes(examSearch.toLowerCase());
    const matchesGrade = filterGrade === "ALL" || exam.gradeLevel === filterGrade;
    const matchesSubject = filterSubject === "ALL" || exam.subjectId === filterSubject;
    return matchesSearch && matchesGrade && matchesSubject;
  });

  return (
    <main className="min-h-screen bg-slate-50/50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Top Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              to="/admin"
              className="text-xs font-bold uppercase tracking-wider text-[#013638] hover:underline"
            >
              ← Back to Admin Dashboard
            </Link>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">
              Exam & Content Management
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Create structured exams, import question batches, organize subjects, and manage learning resources.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2 rounded-2xl bg-[#013638] px-5 py-3 text-sm font-bold text-white shadow-lg hover:bg-[#024e51] hover:shadow-xl transition"
            >
              <Plus className="h-5 w-5" />
              <span>Create Exam</span>
            </Button>
          </div>
        </div>

        {/* Global Notifications */}
        {error && <ErrorMessage message={error} />}
        {successMessage && (
          <div className="flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800">
            <span>{successMessage}</span>
            <button
              type="button"
              onClick={() => setSuccessMessage("")}
              className="font-bold text-emerald-900 hover:opacity-75"
            >
              ✕
            </button>
          </div>
        )}

        {/* Overview Stats Bar */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
              <span>Total Exams</span>
              <FileSpreadsheet className="h-4 w-4 text-[#013638]" />
            </div>
            <p className="mt-2 text-2xl font-black text-slate-900">{exams.length}</p>
          </div>

          <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
              <span>Subjects</span>
              <BookOpen className="h-4 w-4 text-emerald-600" />
            </div>
            <p className="mt-2 text-2xl font-black text-slate-900">{subjects.length}</p>
          </div>

          <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
              <span>Materials</span>
              <Layers className="h-4 w-4 text-purple-600" />
            </div>
            <p className="mt-2 text-2xl font-black text-slate-900">{materials.length}</p>
          </div>

          <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
              <span>Quiz Attempts</span>
              <CheckCircle className="h-4 w-4 text-blue-600" />
            </div>
            <p className="mt-2 text-2xl font-black text-slate-900">{quizAttempts.length}</p>
          </div>
        </div>

        {/* Main Tab Navigation */}
        <div className="border-b border-slate-200">
          <nav className="flex space-x-8">
            <button
              type="button"
              onClick={() => setActiveTab("exams")}
              className={`border-b-2 py-4 text-sm font-bold transition flex items-center gap-2 ${
                activeTab === "exams"
                  ? "border-[#013638] text-[#013638]"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span>Exams & Quizzes ({exams.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("subjects")}
              className={`border-b-2 py-4 text-sm font-bold transition flex items-center gap-2 ${
                activeTab === "subjects"
                  ? "border-[#013638] text-[#013638]"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <BookOpen className="h-4 w-4" />
              <span>Subjects & Topics</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("materials")}
              className={`border-b-2 py-4 text-sm font-bold transition flex items-center gap-2 ${
                activeTab === "materials"
                  ? "border-[#013638] text-[#013638]"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <Layers className="h-4 w-4" />
              <span>Learning Materials</span>
            </button>
          </nav>
        </div>

        {/* TAB 1: EXAMS & ASSESSMENTS */}
        {activeTab === "exams" && (
          <div className="space-y-6">
            {/* Filter Bar */}
            <div className="flex flex-col gap-3 rounded-3xl border border-slate-200/80 bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={examSearch}
                  onChange={(e) => setExamSearch(e.target.value)}
                  placeholder="Search exams by title or subject..."
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-2 text-sm text-slate-800 focus:border-[#013638] focus:bg-white outline-none"
                />
              </div>

              <div className="flex items-center gap-3">
                <select
                  value={filterGrade}
                  onChange={(e) => setFilterGrade(e.target.value)}
                  className="rounded-2xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 outline-none"
                >
                  {gradeLevels.map((g) => (
                    <option key={g.value} value={g.value}>
                      {g.label}
                    </option>
                  ))}
                </select>

                <select
                  value={filterSubject}
                  onChange={(e) => setFilterSubject(e.target.value)}
                  className="rounded-2xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 outline-none"
                >
                  <option value="ALL">All Subjects</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Exams Cards Grid */}
            {isLoading ? (
              <Loader label="Loading structured exams..." />
            ) : filteredExams.length === 0 ? (
              <div className="rounded-3xl border-2 border-dashed border-slate-200 bg-white p-12 text-center">
                <FileSpreadsheet className="mx-auto h-12 w-12 text-slate-300" />
                <h3 className="mt-3 text-lg font-bold text-slate-800">No exams found</h3>
                <p className="mt-1 text-sm text-slate-500 max-w-sm mx-auto">
                  Click "Create Exam" to launch the modal creator and add questions manually or via 50–100 question bulk import.
                </p>
                <Button
                  type="button"
                  onClick={() => setIsCreateModalOpen(true)}
                  className="mt-5 text-sm px-5 py-2.5"
                >
                  Create Your First Exam
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredExams.map((exam) => (
                  <ExamCard
                    key={exam.id}
                    exam={exam}
                    onOpenDetails={handleOpenExamDetails}
                    onTogglePublished={handleTogglePublished}
                    onDelete={handleDeleteExam}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: SUBJECTS & TOPICS */}
        {activeTab === "subjects" && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Subjects Column */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
              <h2 className="text-lg font-bold text-slate-900">Subjects</h2>
              <p className="text-xs text-slate-500">
                Manage curriculum subjects for courses and exams.
              </p>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {subjects.map((sub) => (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => setSelectedSubjectId(sub.id)}
                    className={`w-full flex items-center justify-between rounded-2xl px-4 py-3 text-left text-sm font-semibold transition ${
                      selectedSubjectId === sub.id
                        ? "bg-[#013638] text-white shadow-xs"
                        : "bg-slate-50 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <span>{sub.name}</span>
                    <span className="text-xs opacity-75">Select →</span>
                  </button>
                ))}
              </div>

              <form onSubmit={handleCreateSubject} className="pt-3 border-t border-slate-100 flex gap-2">
                <input
                  type="text"
                  required
                  value={newSubjectName}
                  onChange={(e) => setNewSubjectName(e.target.value)}
                  placeholder="New subject name"
                  className="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 outline-none"
                />
                <Button type="submit" className="text-xs px-3 py-2">
                  Add
                </Button>
              </form>
            </div>

            {/* Topics Column */}
            <div className="lg:col-span-2 rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Topics for {subjects.find((s) => s.id === selectedSubjectId)?.name || "Selected Subject"}
                  </h2>
                  <p className="text-xs text-slate-500">
                    Topics organize questions and allow granular syllabus coverage.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                {topics.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No topics created for this subject yet.</p>
                ) : (
                  topics.map((t) => (
                    <span
                      key={t.id}
                      className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700"
                    >
                      {t.name}
                    </span>
                  ))
                )}
              </div>

              <form onSubmit={handleCreateTopic} className="pt-4 border-t border-slate-100 flex gap-2 max-w-md">
                <input
                  type="text"
                  required
                  value={newTopicName}
                  onChange={(e) => setNewTopicName(e.target.value)}
                  placeholder="New topic name"
                  className="flex-1 rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-900 outline-none"
                />
                <Button type="submit" className="text-xs px-4 py-2">
                  Add Topic
                </Button>
              </form>
            </div>
          </div>
        )}

        {/* TAB 3: LEARNING MATERIALS */}
        {activeTab === "materials" && (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Learning Materials & Handouts</h2>
              <p className="text-xs text-slate-500">
                Upload and link videos, notes, and study PDFs to courses.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {materials.map((mat) => (
                <div
                  key={mat.id}
                  className="rounded-2xl border border-slate-200 p-4 space-y-2 bg-slate-50/50"
                >
                  <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                    {mat.course?.gradeLevel?.replace("_", " ")} · {mat.course?.subject?.name}
                  </span>
                  <h4 className="text-sm font-bold text-slate-900 line-clamp-1">{mat.title}</h4>
                  {mat.description && (
                    <p className="text-xs text-slate-500 line-clamp-2">{mat.description}</p>
                  )}
                  <a
                    href={mat.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block text-xs font-semibold text-[#013638] hover:underline pt-1"
                  >
                    Open Resource ↗
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MODAL 1: Create Exam & Question Creator Modal */}
        <CreateExamModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          subjects={subjects}
          topics={topics}
          onLoadTopics={loadTopics}
          onSaveExam={handleSaveNewExam}
          isSaving={isSaving}
        />

        {/* MODAL 2: Review, Edit, Update & Delete Questions Modal */}
        <ExamDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedExam(null);
          }}
          exam={selectedExam}
          onUpdateExam={handleUpdateExam}
          onAddQuestion={handleAddQuestionToExam}
          onUpdateQuestion={handleUpdateExamQuestion}
          onDeleteQuestion={handleDeleteExamQuestion}
          onBulkAddQuestions={handleBulkAddQuestions}
        />
      </div>
    </main>
  );
}
