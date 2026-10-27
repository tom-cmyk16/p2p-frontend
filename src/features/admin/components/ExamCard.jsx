import { BookOpen, CheckCircle, Clock, Eye, FileText, MoreVertical, Trash2 } from "lucide-react";

const gradeLabels = {
  GRADE_8: "Grade 8",
  GRADE_9: "Grade 9",
  GRADE_10: "Grade 10",
  GRADE_11: "Grade 11",
  GRADE_12: "Grade 12",
};

export default function ExamCard({
  exam,
  onOpenDetails,
  onTogglePublished,
  onDelete,
}) {
  return (
    <div
      onClick={() => onOpenDetails(exam)}
      className="group relative flex flex-col justify-between rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs hover:shadow-xl hover:border-[#013638]/40 transition-all duration-300 cursor-pointer overflow-hidden"
    >
      {/* Top accent bar */}
      <div
        className={`absolute top-0 left-0 right-0 h-1.5 transition-colors ${
          exam.isPublished ? "bg-[#013638]" : "bg-amber-400"
        }`}
      />

      <div>
        {/* Badges row */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-[#013638]/10 px-3 py-1 text-xs font-bold text-[#013638]">
              {gradeLabels[exam.gradeLevel] || exam.gradeLevel}
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
              {exam.subjectName || "Subject"}
            </span>
          </div>

          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold tracking-wide ${
              exam.isPublished
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-amber-50 text-amber-700 border border-amber-200"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                exam.isPublished ? "bg-emerald-600" : "bg-amber-500"
              }`}
            />
            {exam.isPublished ? "Published" : "Draft"}
          </span>
        </div>

        {/* Exam Title */}
        <h3 className="text-lg font-bold text-slate-900 group-hover:text-[#013638] transition line-clamp-2">
          {exam.title}
        </h3>

        {exam.instructions && (
          <p className="mt-2 text-xs text-slate-500 line-clamp-2 leading-relaxed">
            {exam.instructions}
          </p>
        )}

        {/* Stats Metrics Grid */}
        <div className="mt-5 grid grid-cols-3 gap-2 border-y border-slate-100 py-3 text-center">
          <div className="px-2">
            <div className="flex items-center justify-center gap-1 text-slate-400">
              <Clock className="h-3.5 w-3.5" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Timer</span>
            </div>
            <p className="mt-1 text-sm font-bold text-slate-900">
              {exam.durationMinutes || 60}m
            </p>
          </div>

          <div className="border-x border-slate-100 px-2">
            <div className="flex items-center justify-center gap-1 text-slate-400">
              <FileText className="h-3.5 w-3.5" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Questions</span>
            </div>
            <p className="mt-1 text-sm font-bold text-slate-900">
              {exam.questionsCount ?? (exam.questions ? exam.questions.length : 0)}
            </p>
          </div>

          <div className="px-2">
            <div className="flex items-center justify-center gap-1 text-slate-400">
              <CheckCircle className="h-3.5 w-3.5" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Pass %</span>
            </div>
            <p className="mt-1 text-sm font-bold text-slate-900">
              {exam.passingScore || 60}%
            </p>
          </div>
        </div>
      </div>

      {/* Footer / Actions */}
      <div className="mt-5 flex items-center justify-between pt-2">
        <span className="text-xs font-semibold text-[#013638] flex items-center gap-1 group-hover:underline">
          <Eye className="h-3.5 w-3.5" />
          <span>Review & Edit Questions →</span>
        </span>

        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => onTogglePublished(exam)}
            className="rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
            title="Toggle published status"
          >
            {exam.isPublished ? "Set Draft" : "Publish"}
          </button>
          <button
            type="button"
            onClick={() => onDelete(exam)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
            title="Delete Exam"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
