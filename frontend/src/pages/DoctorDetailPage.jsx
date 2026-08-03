import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import Footer from "../components/home/Footer";
import Navbar from "../components/home/Navbar";
import { useAuth } from "../context/AuthContext";
import { getDoctorById } from "../services/DoctorService";
import DoctorAvatar from "../components/common/DoctorAvatar";
import DashboardLayout from "../components/layouts/DashboardLayout";
import StarRating from "../components/common/StarRating";
import ReviewService from "../services/ReviewService";

const DoctorDetailPage = () => {
  const { doctorId } = useParams();
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reviews, setReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState({ avg_rating: 0, rating_count: 0 });
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const { user } = useAuth();

  const isAuthenticated = !!user;

  const Layout = ({ children }) =>
    isAuthenticated ? (
      <DashboardLayout>{children}</DashboardLayout>
    ) : (
      <>
        <Navbar />
        {children}
        <Footer />
      </>
    );

  useEffect(() => {
    const fetchDoctorDetails = async () => {
      try {
        setLoading(true);
        const data = await getDoctorById(doctorId);
        setDoctor(data);
        document.title = `Dr. ${data.name} - ${data.speciality} | Bespoke Health`;
      } catch (err) {
        setError(err.error || "Failed to load doctor details");
        toast.error(err.error || "Failed to load doctor details");
      } finally {
        setLoading(false);
      }
    };

    fetchDoctorDetails();
  }, [doctorId]);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setReviewsLoading(true);
        const data = await ReviewService.getDoctorReviews(doctorId);
        setReviews(data.reviews);
        setReviewStats({ avg_rating: data.avg_rating, rating_count: data.rating_count });
      } catch (err) {
        console.error("Failed to load reviews:", err);
      } finally {
        setReviewsLoading(false);
      }
    };

    fetchReviews();
  }, [doctorId]);

  const formatDate = (dateString) => {
    try {
      return format(parseISO(dateString), "MMM d, yyyy");
    } catch {
      return dateString || "";
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex justify-center items-center bg-gray-50">
          <div className="text-center">
            <svg
              className="animate-spin h-12 w-12 text-blue-600 mx-auto"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              ></path>
            </svg>
            <p className="mt-3 text-gray-600">Loading doctor's profile...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50 p-4">
          <div className="text-red-600 text-xl mb-4">{error}</div>
          <Link to="/" className="text-blue-600 hover:underline">
            Return to Home
          </Link>
        </div>
      </Layout>
    );
  }

  if (!doctor) {
    return (
      <Layout>
        <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50 p-4">
          <div className="text-gray-600 text-xl mb-4">Doctor not found</div>
          <Link to="/" className="text-blue-600 hover:underline">
            Return to Home
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <main className={`bg-gray-50 pb-16 ${isAuthenticated ? "" : "min-h-screen pt-20"}`}>
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <nav className="flex mb-6" aria-label="Breadcrumb">
              <ol className="inline-flex items-center space-x-1 md:space-x-3">
                <li className="inline-flex items-center">
                  <Link
                    to="/"
                    className="text-gray-600 hover:text-blue-600 text-sm font-medium"
                  >
                    Home
                  </Link>
                </li>
                <li>
                  <div className="flex items-center">
                    <svg
                      className="w-5 h-5 text-gray-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                        clipRule="evenodd"
                      ></path>
                    </svg>
                    <Link
                      to="/doctors"
                      className="text-gray-600 hover:text-blue-600 ml-1 text-sm font-medium md:ml-2"
                    >
                      Doctors
                    </Link>
                  </div>
                </li>
                <li aria-current="page">
                  <div className="flex items-center">
                    <svg
                      className="w-5 h-5 text-gray-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                        clipRule="evenodd"
                      ></path>
                    </svg>
                    <span className="text-gray-500 ml-1 text-sm font-medium md:ml-2">
                      Dr. {doctor.user.name}
                    </span>
                  </div>
                </li>
              </ol>
            </nav>

            
            <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
              <div className="relative h-48 bg-gradient-to-r from-blue-500 to-indigo-600">
                <div className="absolute -bottom-16 left-8 md:left-10">
                  <div className="relative border-4 border-white rounded-full shadow-lg">
                    <DoctorAvatar
                      name={doctor?.user.name}
                      imageUrl={doctor.image_url}
                      sizeClass="h-32 w-32"
                      textClass="text-5xl font-bold"
                    />
                    {reviewStats.rating_count > 0 && (
                      <div className="absolute -top-2 -right-2 flex items-center gap-1 bg-yellow-400 text-white text-sm font-semibold px-2 py-1 rounded-full shadow-sm">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        {reviewStats.avg_rating.toFixed(1)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="pt-20 pb-8 px-8 md:px-10">
                <div className="md:flex justify-between items-start">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">
                      Dr. {doctor.user.name}
                    </h1>
                    <p className="text-xl text-blue-600 font-medium mt-1">
                      {doctor.speciality}
                    </p>
                    <p className="mt-2 text-gray-600">
                      {doctor.educational_qualification}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                        {doctor.years_of_experience} Years Experience
                      </span>
                      {doctor.former_organisation && (
                        <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">
                          Former: {doctor.former_organisation}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="mt-6 md:mt-0">
                    {isAuthenticated ? (
                      <div>
                        <Link
                          to={`/appointment/book/${doctor.id}`}
                          className="w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center"
                        >
                          <svg
                            className="w-5 h-5 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                            ></path>
                          </svg>
                          Book Appointment
                        </Link>
                      </div>
                    ) : (
                      <div>
                        <div className="space-y-3">
                          <Link
                            to="/login"
                            className="block w-full py-3 px-4 bg-blue-600 text-white text-center rounded-md hover:bg-blue-700 transition-colors"
                          >
                            Log In to book appointment
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              
              <div className="md:col-span-2">
                <div className="bg-white rounded-xl shadow-md p-8 mb-8">
                  <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                    About Dr. {doctor.user.name}
                  </h2>
                  <p className="text-gray-600 leading-relaxed">
                    Dr. {doctor.user.name} is a highly qualified{" "}
                    {doctor.speciality.toLowerCase()} with{" "}
                    {doctor.years_of_experience} years of experience in
                    diagnosing and treating various medical conditions.
                    {doctor.former_organisation &&
                      ` Previously associated with ${doctor.former_organisation}, `}
                    Dr. {doctor.user.name} is dedicated to providing
                    personalized care and treatment plans tailored to each
                    patient's unique needs.
                  </p>
                </div>

                <div className="bg-white rounded-xl shadow-md p-8 mb-8">
                  <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                    Qualifications & Education
                  </h2>
                  <div className="space-y-4">
                    <div className="flex">
                      <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                        <svg
                          className="w-6 h-6"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M12 14l9-5-9-5-9 5 9 5z"
                          ></path>
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"
                          ></path>
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222"
                          ></path>
                        </svg>
                      </div>
                      <div className="ml-4">
                        <h3 className="text-lg font-medium text-gray-900">
                          Education
                        </h3>
                        <p className="text-gray-600">
                          {doctor.educational_qualification}
                        </p>
                      </div>
                    </div>
                    <div className="flex">
                      <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                        <svg
                          className="w-6 h-6"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                          ></path>
                        </svg>
                      </div>
                      <div className="ml-4">
                        <h3 className="text-lg font-medium text-gray-900">
                          Experience
                        </h3>
                        <p className="text-gray-600">
                          {doctor.years_of_experience} years of clinical
                          experience in {doctor.speciality}
                        </p>
                        {doctor.former_organisation && (
                          <p className="text-gray-600">
                            Formerly with {doctor.former_organisation}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex">
                      <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                        <svg
                          className="w-6 h-6"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                          ></path>
                        </svg>
                      </div>
                      <div className="ml-4">
                        <h3 className="text-lg font-medium text-gray-900">
                          Specialization
                        </h3>
                        <p className="text-gray-600">{doctor.speciality}</p>
                      </div>
                    </div>
                    {doctor.cv_url && (
                      <div className="flex">
                        <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                          <svg
                            className="w-6 h-6"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            ></path>
                          </svg>
                        </div>
                        <div className="ml-4">
                          <h3 className="text-lg font-medium text-gray-900">
                            CV / Resume
                          </h3>
                          <a
                            href={doctor.cv_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            View CV
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-md p-8">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-semibold text-gray-800">Patient Reviews</h2>
                    {reviewStats.rating_count > 0 && (
                      <div className="flex items-center gap-2">
                        <StarRating value={Math.round(reviewStats.avg_rating)} readOnly size="sm" />
                        <span className="text-sm text-gray-600">
                          {reviewStats.avg_rating.toFixed(1)} ({reviewStats.rating_count} review{reviewStats.rating_count === 1 ? "" : "s"})
                        </span>
                      </div>
                    )}
                  </div>

                  {reviewsLoading ? (
                    <div className="flex justify-center py-6">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                  ) : reviews.length === 0 ? (
                    <p className="text-gray-500 text-center py-6">
                      No reviews yet. Be the first to review Dr. {doctor.user.name} after your appointment.
                    </p>
                  ) : (
                    <div className="space-y-5">
                      {reviews.map((review) => (
                        <div key={review.id} className="border-b border-gray-100 last:border-0 pb-5 last:pb-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-gray-900">{review.patient_name}</span>
                            <span className="text-xs text-gray-400">{formatDate(review.created_at)}</span>
                          </div>
                          <StarRating value={review.score} readOnly size="sm" />
                          {review.feedback && (
                            <p className="mt-2 text-gray-600 text-sm">{review.feedback}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>


              <div className="bg-white rounded-xl shadow-md p-8 mb-8">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  Consultation Fees
                </h2>

                {doctor.consultation_fees &&
                doctor.consultation_fees.length > 0 ? (
                  <div className="space-y-3">
                    {doctor.consultation_fees.map((fee) => (
                      <div
                        key={fee.id}
                        className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100"
                      >
                        <div>
                          <span className="font-medium text-gray-800">
                            {fee.consultation_type}
                          </span>
                        </div>
                        <div className="text-xl font-semibold text-blue-600">
                          {fee.currency} {fee.amount}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400 mb-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      ></path>
                    </svg>
                    <p className="text-gray-500">N/A</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </Layout>
  );
};

export default DoctorDetailPage;
