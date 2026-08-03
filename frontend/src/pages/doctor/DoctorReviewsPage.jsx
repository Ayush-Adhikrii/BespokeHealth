import { useEffect, useState } from "react";
import { toast } from "sonner";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import StarRating from "../../components/common/StarRating";
import ReviewService from "../../services/ReviewService";
import { format, parseISO } from "date-fns";

const DoctorReviewsPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true);
        const result = await ReviewService.getMyReviews(page);
        setData(result);
      } catch (error) {
        toast.error(error.error || "Failed to load reviews");
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, [page]);

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Patient Reviews</h1>
            <p className="text-gray-500 mt-1">Feedback from your patients</p>
          </div>
          {data && (
            <div className="text-right">
              <div className="flex items-center gap-2 justify-end">
                <StarRating value={Math.round(data.avg_rating || 0)} readOnly size="lg" />
                <span className="text-2xl font-bold text-gray-800">
                  {(data.avg_rating || 0).toFixed(1)}
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-1">{data.total || 0} reviews total</p>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-48">
            <svg className="animate-spin h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        ) : !data || data.reviews?.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="w-16 h-16 bg-yellow-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-800">No reviews yet</h2>
            <p className="text-gray-500 mt-2">Patient feedback will appear here after completed appointments.</p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {data.reviews.map((review) => (
                <div key={review.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center text-white font-semibold text-sm">
                        {review.patient?.name?.charAt(0)?.toUpperCase() || "P"}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">{review.patient?.name || "Patient"}</p>
                        <p className="text-xs text-gray-400">
                          {review.created_at
                            ? format(parseISO(review.created_at), "MMM d, yyyy")
                            : ""}
                        </p>
                      </div>
                    </div>
                    <StarRating value={review.score} readOnly size="sm" />
                  </div>
                  {review.feedback && (
                    <p className="mt-4 text-gray-600 text-sm leading-relaxed bg-gray-50 rounded-lg p-3">
                      "{review.feedback}"
                    </p>
                  )}
                </div>
              ))}
            </div>

            {data.totalPages > 1 && (
              <div className="flex justify-center items-center gap-3 mt-8">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-600">
                  Page {page} of {data.totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                  disabled={page === data.totalPages}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DoctorReviewsPage;
