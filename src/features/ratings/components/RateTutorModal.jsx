import { useEffect, useState } from "react";
import { CheckCircle2, MessageSquare, Sparkles, Star, X } from "lucide-react";
import Button from "../../../components/common/Button";
import ErrorMessage from "../../../components/common/ErrorMessage";
import { ratingService } from "../services/rating.service";

const RATING_DESCRIPTIONS = {
  1: "Poor — Did not meet expectations",
  2: "Fair — Needs improvement",
  3: "Good — Satisfactory session",
  4: "Very Good — Highly helpful & clear",
  5: "Excellent — Outstanding mentorship!",
};

const QUICK_TAGS = [
  "Clear Explanations",
  "Patient & Encouraging",
  "Punctual & Prepared",
  "Great Exam Prep Tips",
  "Helped Solve Hard Problems",
];

export default function RateTutorModal({
  isOpen,
  onClose,
  conversationId,
  tutorName,
  courseName,
  sessionDate,
  existingRating,
  initialRating,
  onRatingSubmitted,
}) {
  const currentRating = existingRating || initialRating;
  const [score, setScore] = useState(5);
  const [hoverScore, setHoverScore] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (currentRating) {
      setScore(currentRating.score || 5);
      setComment(currentRating.comment || "");
    } else {
      setScore(5);
      setComment("");
    }
    setError(null);
    setIsSuccess(false);
  }, [currentRating, isOpen]);

  if (!isOpen) return null;

  const handleTagClick = (tag) => {
    if (comment.includes(tag)) return;
    setComment((prev) => (prev ? `${prev.trim()}, ${tag}` : tag));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!conversationId) {
      setError("Conversation identifier is missing for this session.");
      return;
    }
    if (!score || score < 1 || score > 5) {
      setError("Please select a rating between 1 and 5 stars.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await ratingService.submitRating(conversationId, {
        score,
        comment: comment.trim() || undefined,
      });
      setIsSuccess(true);
      if (onRatingSubmitted) {
        onRatingSubmitted(result);
      }
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
          err.message ||
          "Unable to submit your rating. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeScore = hoverScore || score;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4 overflow-y-auto animate-fadeIn"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-lg rounded-3xl bg-white shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 p-6 bg-gradient-to-r from-teal-50/50 via-white to-slate-50">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-teal-100/70 px-3 py-0.5 text-xs font-bold text-teal-800">
              <Sparkles className="h-3.5 w-3.5 text-teal-700" />
              <span>Session Feedback</span>
            </div>
            <h3 className="mt-2 text-xl font-extrabold text-slate-900">
              Rate your mentorship with {tutorName || "Tutor"}
            </h3>
            {courseName && (
              <p className="mt-0.5 text-xs text-slate-500 font-medium">
                {courseName} {sessionDate ? `· ${sessionDate}` : ""}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {isSuccess ? (
          <div className="p-8 text-center space-y-3">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h4 className="text-lg font-bold text-slate-900">Thank you for your feedback!</h4>
            <p className="text-sm text-slate-600">
              Your rating has been saved and will help maintain top-quality mentorship on P2P Exam Prep.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {error && <ErrorMessage message={error} />}

            {/* Star Rating Section */}
            <div className="text-center space-y-2 py-2">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Overall Session Rating
              </p>
              <div
                className="flex items-center justify-center gap-2"
                onMouseLeave={() => setHoverScore(0)}
              >
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setScore(star)}
                    onMouseEnter={() => setHoverScore(star)}
                    className="p-1 transition-transform hover:scale-125 focus:outline-none"
                    aria-label={`${star} star`}
                  >
                    <Star
                      className={`h-9 w-9 transition-colors ${
                        star <= activeScore
                          ? "fill-amber-400 text-amber-400 drop-shadow-xs"
                          : "fill-transparent text-slate-300"
                      }`}
                    />
                  </button>
                ))}
              </div>
              <p className="text-sm font-semibold text-teal-900 min-h-[1.25rem]">
                {RATING_DESCRIPTIONS[activeScore]}
              </p>
            </div>

            {/* Quick tags */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                What went well? (Optional quick tags)
              </label>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_TAGS.map((tag) => {
                  const isSelected = comment.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleTagClick(tag)}
                      className={`rounded-xl border px-2.5 py-1 text-xs font-medium transition ${
                        isSelected
                          ? "border-teal-500 bg-teal-50 font-bold text-teal-800"
                          : "border-slate-200 bg-slate-50/50 text-slate-600 hover:border-slate-300 hover:bg-slate-100"
                      }`}
                    >
                      {isSelected ? "✓ " : "+ "}
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Written feedback */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="rate-comment"
                  className="flex items-center gap-1.5 text-xs font-bold text-slate-700"
                >
                  <MessageSquare className="h-3.5 w-3.5 text-slate-400" />
                  <span>Written Feedback for Tutor (Optional)</span>
                </label>
                <span className="text-[11px] text-slate-400">{comment.length}/1000</span>
              </div>
              <textarea
                id="rate-comment"
                rows={3}
                maxLength={1000}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share helpful comments about how the session went, clarity of explanations, or suggestions for next time..."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/40 p-3 text-xs outline-none transition placeholder:text-slate-400 focus:border-[#013638] focus:bg-white focus:ring-2 focus:ring-[#013638]/10"
              />
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="text-xs font-bold px-5 py-2.5 rounded-xl shadow-sm"
              >
                {isSubmitting ? "Submitting..." : existingRating ? "Update Rating" : "Submit Feedback"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
