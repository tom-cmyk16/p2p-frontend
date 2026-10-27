import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ErrorMessage from "../../../components/common/ErrorMessage";
import { useRating } from "../hooks/useRating";

export default function RatingModal({ conversationId, onClose }) {
  const navigate = useNavigate();
  const [score, setScore] = useState(5);
  const [comment, setComment] = useState("");
  const { submitRating, isLoading, error, submitted } = useRating(conversationId);

  const handleSubmit = async (event) => {
    event.preventDefault();
    await submitRating(score, comment);
  };

  const close = () => {
    if (onClose) {
      onClose();
    } else {
      navigate("/student");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 py-8"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isLoading) {
          close();
        }
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="ratingTitle"
        className="w-full max-w-lg rounded-2xl bg-white p-6 text-left shadow-xl sm:p-8"
      >
        {submitted ? (
          <div className="py-4 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#013638]/5 text-2xl font-bold text-[#013638]">
              ✓
            </div>
            <h1 id="ratingTitle" className="mt-4 text-2xl font-bold text-[#013638]">
              Thank you for your feedback
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Your rating has been submitted.
            </p>
            <button
              type="button"
              onClick={close}
              className="mt-6 rounded-lg bg-[#013638] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#01494b]"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#013638]">
                  Completed session
                </p>
                <h1 id="ratingTitle" className="mt-2 text-2xl font-bold text-[#013638]">
                  Rate your tutor
                </h1>
                <p className="mt-2 text-sm text-slate-600">
                  Your feedback helps other students choose a tutor.
                </p>
              </div>
              <button
                type="button"
                onClick={close}
                disabled={isLoading}
                aria-label="Close rating"
                className="rounded-md px-2 py-1 text-xl leading-none text-slate-500 hover:bg-slate-100 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                ×
              </button>
            </div>

            {error && <div className="mt-5"><ErrorMessage message={error} /></div>}

            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              <fieldset>
                <legend className="mb-2 text-sm font-medium text-slate-700">
                  Your rating
                </legend>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      type="button"
                      key={value}
                      onClick={() => setScore(value)}
                      aria-pressed={score === value}
                      aria-label={`${value} ${value === 1 ? "star" : "stars"}`}
                      className={`flex-1 rounded-lg border py-3 text-sm font-semibold transition ${
                        score === value
                          ? "border-[#013638] bg-[#013638] text-white"
                          : "border-slate-200 bg-white text-slate-700 hover:border-[#013638]/40"
                      }`}
                    >
                      {value} ★
                    </button>
                  ))}
                </div>
              </fieldset>

              <div>
                <label htmlFor="ratingComment" className="mb-2 block text-sm font-medium text-slate-700">
                  Feedback <span className="font-normal text-slate-500">(optional)</span>
                </label>
                <textarea
                  id="ratingComment"
                  rows={4}
                  maxLength={1000}
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  placeholder="Share what went well in your session"
                  className="w-full resize-y rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-[#013638] focus:ring-2 focus:ring-[#013638]/15"
                />
                <p className="mt-1 text-right text-xs text-slate-500">{comment.length}/1000</p>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-lg bg-[#013638] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#01494b] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading ? "Submitting..." : "Submit rating"}
              </button>
            </form>
          </>
        )}
      </section>
    </div>
  );
}
