import { useEffect, useState } from "react";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import StarRating from "../../components/common/StarRating";
import ReviewService from "../../services/ReviewService";

const AdminReviewsPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true);
        const result = await ReviewService.getAllReviews(page);
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
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">All Reviews</h1>
          <p className="text-gray-500 mt-1">
            {data ? `${data.pagination?.total || 0} reviews across the platform` : "Platform-wide patient feedback"}
          </p>
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
            <p className="text-gray-500">No reviews have been submitted yet.</p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Patient</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Doctor</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Rating</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Feedback</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {data.reviews.map((review) => (
                    <tr key={review.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-400 to-indigo-400 flex items-center justify-center text-white font-medium text-xs">
                            {review.patient_name?.charAt(0)?.toUpperCase() || "P"}
                          </div>
                          <span className="font-medium text-gray-800">{review.patient_name || "—"}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-800">Dr. {review.doctor_name || "—"}</p>
                          <p className="text-xs text-blue-600">{review.doctor_speciality || ""}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <StarRating value={review.score} readOnly size="sm" />
                      </td>
                      <td className="px-6 py-4 max-w-xs">
                        {review.feedback ? (
                          <p className="text-gray-600 truncate" title={review.feedback}>
                            {review.feedback}
                          </p>
                        ) : (
                          <span className="text-gray-400 italic">No comment</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                        {review.created_at ? format(parseISO(review.created_at), "MMM d, yyyy") : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {data.pagination?.pages > 1 && (
              <div className="flex justify-center items-center gap-3 mt-6">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-600">
                  Page {page} of {data.pagination?.pages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(data.pagination?.pages, p + 1))}
                  disabled={page === data.pagination?.pages}
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

export default AdminReviewsPage;
