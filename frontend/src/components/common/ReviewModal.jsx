import { useState } from "react";
import { toast } from "sonner";
import StarRating from "./StarRating";
import ReviewService from "../../services/ReviewService";

const ReviewModal = ({ appointment, onClose, onSubmitted }) => {
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (score === 0) {
      toast.error("Please select a star rating");
      return;
    }

    try {
      setLoading(true);
      await ReviewService.submitReview(appointment.id, { score, feedback: feedback.trim() || undefined });
      toast.success("Review submitted successfully!");
      onSubmitted(appointment.id);
      onClose();
    } catch (error) {
      toast.error(error.error || "Failed to submit review");
    } finally {
      setLoading(false);
    }
  };

  const labels = ["", "Poor", "Fair", "Good", "Very Good", "Excellent"];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Rate Your Experience</h3>
            <button
              onClick={onClose}
              className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Appointment with <span className="font-medium text-gray-700">Dr. {appointment.doctor?.name}</span>
          </p>
        </div>

        <div className="p-6 space-y-5">
          <div className="text-center">
            <p className="text-sm font-medium text-gray-700 mb-3">How would you rate this consultation?</p>
            <div className="flex justify-center mb-2">
              <StarRating value={score} onChange={setScore} size="lg" />
            </div>
            {score > 0 && (
              <p className="text-sm font-semibold text-yellow-600">{labels[score]}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Share your experience <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              maxLength={1000}
              rows={4}
              placeholder="Tell others about your experience with this doctor..."
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
            <p className="text-xs text-gray-400 mt-1 text-right">{feedback.length}/1000</p>
          </div>
        </div>

        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || score === 0}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Submitting..." : "Submit Review"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReviewModal;
