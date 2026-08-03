import { format, parseISO } from "date-fns";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import AppointmentService from "../../services/AppointmentService";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import ReviewModal from "../../components/common/ReviewModal";
import ReviewService from "../../services/ReviewService";

const MyAppointmentsPage = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("upcoming");
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelLoading, setCancelLoading] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewAppointment, setReviewAppointment] = useState(null);
  const [reviewedIds, setReviewedIds] = useState(new Set());

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        setLoading(true);
        const status =
          activeTab === "upcoming"
            ? "upcoming"
            : activeTab === "completed"
            ? "completed"
            : activeTab === "cancelled"
            ? "cancelled"
            : null;

        const data = await AppointmentService.getPatientAppointments(status);
        console.log("Raw API response:", data);

        const appointmentsData = Array.isArray(data)
          ? data
          : data.appointments || [];
        setAppointments(appointmentsData);

        if (activeTab === "completed" && appointmentsData.length > 0) {
          const reviewChecks = await Promise.allSettled(
            appointmentsData.map((a) => ReviewService.getAppointmentReview(a.id))
          );
          const reviewed = new Set();
          reviewChecks.forEach((res, i) => {
            if (res.status === "fulfilled" && res.value?.reviewed) {
              reviewed.add(appointmentsData[i].id);
            }
          });
          setReviewedIds(reviewed);
        }

        console.log("Fetched appointments:", appointmentsData);
      } catch (error) {
        console.error("Error fetching appointments:", error);
        toast.error(error.error || "Failed to load appointments");
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [activeTab]);

  const openCancelModal = (appointment) => {
    setSelectedAppointment(appointment);
    setCancelReason("");
    setCancelModalOpen(true);
  };

  const closeCancelModal = () => {
    setCancelModalOpen(false);
    setSelectedAppointment(null);
  };

  const handleCancelAppointment = async () => {
    if (!selectedAppointment) return;

    if (!cancelReason.trim()) {
      toast.error("Please provide a cancellation reason");
      return;
    }

    try {
      setCancelLoading(true);
      await AppointmentService.cancelAppointment(
        selectedAppointment.id,
        cancelReason
      );

      setAppointments(
        appointments.map((app) =>
          app.id === selectedAppointment.id
            ? { ...app, status: "Cancelled" }
            : app
        )
      );

      toast.success("Appointment cancelled successfully");
      closeCancelModal();
    } catch (error) {
      console.error("Error cancelling appointment:", error);
      toast.error(error.error || "Failed to cancel appointment");
    } finally {
      setCancelLoading(false);
    }
  };

  const formatTime = (timeString) => {
    try {
      const time = parseISO(`2000-01-01T${timeString}`);
      return format(time, "h:mm a");
    } catch (error) {
      return timeString;
    }
  };

  const formatDate = (dateString) => {
    try {
      return format(parseISO(dateString), "EEEE, MMMM d, yyyy");
    } catch (error) {
      return dateString;
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          My Appointments
        </h1>

        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab("upcoming")}
              className={`${
                activeTab === "upcoming"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Upcoming
            </button>
            <button
              onClick={() => setActiveTab("completed")}
              className={`${
                activeTab === "completed"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Completed
            </button>
            <button
              onClick={() => setActiveTab("cancelled")}
              className={`${
                activeTab === "cancelled"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Cancelled
            </button>
          </nav>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="flex flex-col items-center">
              <svg
                className="animate-spin h-10 w-10 text-blue-600 mb-4"
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
              <p className="text-gray-600">Loading appointments...</p>
            </div>
          </div>
        ) : appointments.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <svg
              className="h-16 w-16 text-gray-400 mx-auto mb-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              ></path>
            </svg>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              No {activeTab} appointments
            </h2>
            <p className="text-gray-600 mb-6">
              {activeTab === "upcoming"
                ? "You don't have any upcoming appointments scheduled."
                : activeTab === "completed"
                ? "You haven't completed any appointments yet."
                : "You don't have any cancelled appointments."}
            </p>
            {activeTab === "upcoming" && (
              <Link
                to="/doctors"
                className="inline-flex items-center justify-center px-5 py-2 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Find a Doctor
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {appointments.map((appointment) => (
              <div
                key={appointment.id}
                className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div className="mb-4 md:mb-0">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium text-xl">
                          {appointment.doctor.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-3">
                          <h3 className="text-lg font-semibold text-gray-800">
                            Dr. {appointment.doctor.name}
                          </h3>
                          <p className="text-sm text-blue-600">
                            {appointment.doctor.speciality}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800`}
                      >
                        Confirmed
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-gray-100 mt-4 pt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-gray-500">Date & Time</p>
                      <p className="text-sm font-medium text-gray-900">
                        {formatDate(appointment.date)}
                      </p>
                      <p className="text-sm font-medium text-gray-900">
                        {formatTime(appointment.start_time)} to{" "}
                        {formatTime(appointment.end_time)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Amount</p>
                      <p className="text-sm font-medium text-gray-900">
                        NPR {appointment.amount}
                      </p>
                      <p className={`text-xs text-green-600`}>
                        Paid
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Booked On</p>
                      <p className="text-sm font-medium text-gray-900">
                        {format(
                          new Date(appointment.created_at),
                          "MMMM d, yyyy"
                        )}
                      </p>
                    </div>
                  </div>

                  {activeTab === "upcoming" && (
                    <div className="mt-5 flex flex-col sm:flex-row gap-2">
                      {appointment.status === "confirmed" && (
                        <button
                          onClick={() => openCancelModal(appointment)}
                          className="inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-100 bg-red-700 hover:bg-red-500"
                        >
                          Cancel Appointment
                        </button>
                      )}
                    </div>
                  )}

                  {activeTab === "completed" && (
                    <div className="mt-5">
                      {reviewedIds.has(appointment.id) ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 rounded-full">
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          Review submitted
                        </span>
                      ) : (
                        <button
                          onClick={() => { setReviewAppointment(appointment); setReviewModalOpen(true); }}
                          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          Leave a Review
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {reviewModalOpen && reviewAppointment && (
          <ReviewModal
            appointment={reviewAppointment}
            onClose={() => { setReviewModalOpen(false); setReviewAppointment(null); }}
            onSubmitted={(id) => setReviewedIds((prev) => new Set([...prev, id]))}
          />
        )}

        {cancelModalOpen && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Cancel Appointment
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  Please provide a reason for cancelling this appointment:
                </p>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  rows="3"
                  placeholder="Enter cancellation reason..."
                />
                <div className="flex justify-end space-x-3 mt-4">
                  <button
                    onClick={closeCancelModal}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCancelAppointment}
                    disabled={cancelLoading}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
                  >
                    {cancelLoading ? "Cancelling..." : "Confirm Cancellation"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default MyAppointmentsPage;
