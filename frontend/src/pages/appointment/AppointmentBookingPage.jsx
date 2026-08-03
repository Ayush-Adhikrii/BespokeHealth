import { useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import  bookAppointment  from "../../services/AppointmentService";
import { useAuth } from "../../context/AuthContext";
import Navbar from "../../components/home/Navbar";
import Footer from "../../components/home/Footer";
import { format, parseISO } from "date-fns";

const AppointmentBookingPage = () => {
  const { doctorId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  
  
  const {
    doctorName,
    doctorSpeciality,
    slotId,
    slotDate,
    slotTime,
    consultationType,
    fee
  } = location.state || {};

  
  const [formData, setFormData] = useState({
    symptoms: "",
    notes: ""
  });

  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
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

  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      toast.error("You must be logged in to book an appointment");
      navigate("/login");
      return;
    }
    
    try {
      setLoading(true);
      
      const bookingData = {
        doctor_id: parseInt(doctorId),
        time_slot_id: slotId,
        consultation_type: consultationType,
        symptoms: formData.symptoms,
        notes: formData.notes
      };
      
      const response = await bookAppointment(bookingData);
      
      
      navigate("/payment", {
        state: {
          appointment_id: response.appointment_id,
          doctor_name: response.doctor_name,
          appointment_date: response.appointment_date,
          appointment_time: response.appointment_time,
          payment_amount: response.payment_amount,
          payment_id: response.payment_id
        }
      });
      
    } catch (error) {
      toast.error(error.error || "Failed to book appointment");
    } finally {
      setLoading(false);
    }
  };

  
  if (!doctorName || !slotId || !slotDate || !slotTime) {
    toast.error("Missing appointment information");
    navigate(`/appointment/book/${doctorId}`);
    return null;
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 pt-20 pb-10">
        <div className="max-w-4xl mx-auto px-4 py-8">
          
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
                Please provide some additional information
              </p>
            </div>
            
            <form onSubmit={handleSubmit}>
              
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900 mb-4">
                  Appointment Details
                </h2>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Doctor</p>
                      <p className="font-medium text-gray-800">Dr. {doctorName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Speciality</p>
                      <p className="font-medium text-gray-800">{doctorSpeciality}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Date</p>
                      <p className="font-medium text-gray-800">
                        {format(parseISO(slotDate), "EEEE, MMMM d, yyyy")}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Time</p>
                      <p className="font-medium text-gray-800">{formatTime(slotTime)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Consultation Type</p>
                      <p className="font-medium text-gray-800">{consultationType}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Fee</p>
                      <p className="font-medium text-gray-800">
                        {fee?.currency} {fee?.amount}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900 mb-4">
                  Additional Information
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label htmlFor="symptoms" className="block text-sm font-medium text-gray-700 mb-1">
                      Symptoms or Health Concerns
                    </label>
                    <textarea
                      id="symptoms"
                      name="symptoms"
                      value={formData.symptoms}
                      onChange={handleChange}
                      rows={3}
                      className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Please describe your symptoms or health concerns..."
                      required
                    ></textarea>
                  </div>
                  
                  <div>
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                      Additional Notes (Optional)
                    </label>
                    <textarea
                      id="notes"
                      name="notes"
                      value={formData.notes}
                      onChange={handleChange}
                      rows={2}
                      className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Any additional information you'd like the doctor to know..."
                    ></textarea>
                  </div>
                </div>
              </div>

              
              <div className="p-6 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    By proceeding, you agree to our{" "}
                    <a href="/terms" className="text-blue-600 hover:underline">
                      Terms of Service
                    </a>{" "}
                    and{" "}
                    <a href="/privacy" className="text-blue-600 hover:underline">
                      Privacy Policy
                    </a>.
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-400 flex items-center"
                  >
                    {loading ? (
                      <>
                        <svg
                          className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                        Processing...
                      </>
                    ) : (
                      "Proceed to Payment"
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default AppointmentBookingPage;