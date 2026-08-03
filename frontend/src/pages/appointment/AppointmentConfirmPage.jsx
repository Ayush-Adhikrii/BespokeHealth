import { format, parseISO } from "date-fns";
import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import Footer from "../../components/home/Footer";
import Navbar from "../../components/home/Navbar";
import { useAuth } from "../../context/AuthContext";
import AppointmentService from "../../services/AppointmentService";

const AppointmentConfirmPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { doctorId } = useParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    symptoms: "",
    notes: "",
  });

  const appointmentDetails = location.state;

  useEffect(() => {
    if (!user) {
      toast.error("Please log in to book an appointment");
      navigate("/login", {
        state: {
          from: `/appointment/confirm/${doctorId}`,
          message: "Please login to book an appointment",
        },
      });
    }
    console.log(user);
  }, [user, navigate, doctorId]);

  useEffect(() => {
    if (!appointmentDetails) {
      toast.error("Missing appointment details");
      navigate(`/appointment/book/${doctorId}`);
    }
  }, [appointmentDetails, navigate, doctorId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const formatTime = (timeString) => {
    try {
      const time = parseISO(`2000-01-01T${timeString}`);
      return format(time, "h:mm a");
    } catch {
      return timeString;
    }
  };

  const handleBookAppointment = async (e) => {
    e.preventDefault();

    if (!appointmentDetails) {
      toast.error("Missing appointment details");
      return;
    }

    if (!formData.symptoms.trim()) {
      toast.error("Please describe your symptoms");
      return;
    }

    try {
      setLoading(true);

      const appointmentData = {
        doctor_id: parseInt(doctorId),
        time_slot_id: appointmentDetails.slotId,
        consultation_type: appointmentDetails.consultationType,
        symptoms: formData.symptoms,
        notes: formData.notes,
      };

      console.log("Booking appointment with data:", appointmentData);

      const bookingResponse = await AppointmentService.bookAppointment(appointmentData);
      console.log("Booking response:", bookingResponse);

      if (!bookingResponse || !bookingResponse.appointment_id) {
        throw new Error(
          "Invalid booking response. Missing appointment information."
        );
      }

      navigate('/payment', {
        state: {
          appointment_id: bookingResponse.appointment_id,
          doctor_name: bookingResponse.doctor_name,
          appointment_date: bookingResponse.appointment_date,
          appointment_time: bookingResponse.appointment_time,
          payment_amount: bookingResponse.payment_amount,
          payment_id: bookingResponse.payment_id
        }
      });
    } catch (error) {
      console.error("Error in appointment booking flow:", error);
      toast.error(error.message || "Failed to process appointment booking");
    } finally {
      setLoading(false);
    }
  };

  if (!appointmentDetails) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gray-50 pt-20 pb-10">
          <div className="text-center py-10">
            <p>Loading appointment details...</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 pt-20 pb-10">
        <div className="max-w-3xl mx-auto px-4 py-8">

          <nav className="flex mb-8" aria-label="Breadcrumb">
            <ol className="inline-flex items-center space-x-1 md:space-x-3">
              <li className="inline-flex items-center">
                <button
                  onClick={() => navigate(-1)}
                  className="inline-flex items-center text-gray-600 hover:text-blue-600"
                >
                  <svg
                    className="w-5 h-5 mr-1"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    ></path>
                  </svg>
                  Back to Time Selection
                </button>
              </li>
            </ol>
          </nav>

          <div className="bg-white shadow-md rounded-lg overflow-hidden">

            <div className="p-6 bg-blue-600 text-white">
              <h1 className="text-2xl font-bold">Confirm Your Appointment</h1>
              <p className="text-blue-100 mt-1">
                Review the details and provide health information
              </p>
            </div>

            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Appointment Details
              </h2>

              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Doctor</p>
                    <p className="font-medium">
                      Dr. {appointmentDetails.doctorName}
                    </p>
                    <p className="text-sm text-blue-600">
                      {appointmentDetails.doctorSpeciality}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">Date & Time</p>
                    <p className="font-medium">
                      {format(
                        parseISO(appointmentDetails.slotDate),
                        "EEEE, MMMM d, yyyy"
                      )}
                    </p>
                    <p className="text-sm">
                      {formatTime(appointmentDetails.slotTime)}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">Consultation Type</p>
                    <p className="font-medium">
                      {appointmentDetails.consultationType}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">Fee</p>
                    <p className="font-medium text-blue-600">
                      {appointmentDetails.fee.currency}{" "}
                      {appointmentDetails.fee.amount}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <form onSubmit={handleBookAppointment} className="p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Health Information
              </h2>

              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="symptoms"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Symptoms <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="symptoms"
                    name="symptoms"
                    rows="3"
                    required
                    placeholder="Please describe your symptoms or reason for visit"
                    value={formData.symptoms}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  ></textarea>
                </div>

                <div>
                  <label
                    htmlFor="notes"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Additional Notes (Optional)
                  </label>
                  <textarea
                    id="notes"
                    name="notes"
                    rows="2"
                    placeholder="Any additional information you'd like the doctor to know"
                    value={formData.notes}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  ></textarea>
                </div>
              </div>

              <div className="mt-6 bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-800 mb-2">
                  Confirmation
                </h3>
                <p className="text-sm text-gray-600 mb-2">
                  After confirming, your appointment will be automatically confirmed and payment will be processed.
                </p>
                <div className="flex items-center mt-2">
                  <svg
                    className="w-5 h-5 text-green-500 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="text-sm text-green-600">Payment will be processed automatically</span>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors flex items-center disabled:bg-blue-400 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                      Confirming...
                    </>
                  ) : (
                    <>
                      Confirm Appointment
                      <svg
                        className="ml-2 w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M14 5l7 7m0 0l-7 7m7-7H3"
                        ></path>
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default AppointmentConfirmPage;
