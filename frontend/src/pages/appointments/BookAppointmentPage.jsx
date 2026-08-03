import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { format, parseISO, addDays } from "date-fns";
import { toast } from "sonner";
import { useAuth } from "../../context/AuthContext";
import { getDoctorById } from "../../services/DoctorService";
import  getDoctorTimeSlots  from "../../services/AppointmentService";
import bookAppointment from "../../services/AppointmentService";
import { setAppointmentData, clearAppointmentData } from "../../utils/cookie";
import Navbar from "../../components/home/Navbar";
import Footer from "../../components/home/Footer";

const BookAppointmentPage = () => {
  const { doctorId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [doctor, setDoctor] = useState(null);
  const [selectedDate, setSelectedDate] = useState(format(addDays(new Date(), 1), 'yyyy-MM-dd'));
  const [timeSlots, setTimeSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedFee, setSelectedFee] = useState(null);
  const [bookingData, setBookingData] = useState({
    symptoms: "",
    notes: ""
  });

  useEffect(() => {
    const fetchDoctor = async () => {
      try {
        setLoading(true);
        const data = await getDoctorById(doctorId);
        setDoctor(data);

        if (data.consultation_fees && data.consultation_fees.length > 0) {

          const firstVisitFee = data.consultation_fees.find(fee =>
            fee.consultation_type.toLowerCase().includes("first") ||
            fee.consultation_type.toLowerCase().includes("video")
          ) || data.consultation_fees[0];

          setSelectedFee(firstVisitFee);
        }
      } catch (error) {
        console.error("Error fetching doctor:", error);
        toast.error(error.error || "Failed to load doctor information");
        navigate("/doctors");
      } finally {
        setLoading(false);
      }
    };

    fetchDoctor();
  }, [doctorId, navigate]);

  useEffect(() => {
    const fetchTimeSlots = async () => {
      if (!doctorId || !selectedDate) return;

      try {
        setLoading(true);
        const data = await getDoctorTimeSlots(doctorId, selectedDate);
        setTimeSlots(data.time_slots || []);
      } catch (error) {
        console.error("Error fetching time slots:", error);
        toast.error(error.error || "Failed to load available time slots");
      } finally {
        setLoading(false);
      }
    };

    fetchTimeSlots();
  }, [doctorId, selectedDate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setBookingData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFeeChange = (e) => {
    const feeId = parseInt(e.target.value);
    const fee = doctor.consultation_fees.find(f => f.id === feeId);
    setSelectedFee(fee);
  };

  const formatTime = (timeString) => {
    try {
      const time = parseISO(`2000-01-01T${timeString}`);
      return format(time, 'h:mm a');
    } catch {
      return timeString;
    }
  };

  const handleBookAppointment = async (e) => {
    e.preventDefault();

    if (!user) {
      setAppointmentData(doctorId, selectedDate, selectedSlot?.id);
      navigate('/login', { state: { from: `/appointment/book/${doctorId}`, message: "Please login to book an appointment" } });
      return;
    }

    if (!selectedSlot) {
      toast.error("Please select a time slot");
      return;
    }

    if (!selectedFee) {
      toast.error("Please select a consultation type");
      return;
    }

    try {
      setBookingLoading(true);

      const appointmentData = {
        doctor_id: parseInt(doctorId),
        time_slot_id: selectedSlot.id,
        consultation_type: selectedFee.consultation_type,
        symptoms: bookingData.symptoms,
        notes: bookingData.notes
      };

      const response = await bookAppointment(appointmentData);

      clearAppointmentData();

      navigate('/payment', {
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
      console.error("Error booking appointment:", error);
      toast.error(error.error || "Failed to book appointment");
    } finally {
      setBookingLoading(false);
    }
  };

  const generateDateOptions = () => {
    const options = [];
    const today = new Date();

    for (let i = 1; i <= 30; i++) {
      const date = addDays(today, i);
      options.push({
        value: format(date, 'yyyy-MM-dd'),
        label: format(date, 'EEEE, MMMM d, yyyy')
      });
    }

    return options;
  };

  if (loading && !doctor) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex justify-center items-center bg-gray-50 pt-20">
          <div className="text-center">
            <svg className="animate-spin h-12 w-12 text-blue-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
            </svg>
            <p className="mt-3 text-gray-600">Loading appointment scheduler...</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 pt-20 pb-16">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">

            <nav className="flex mb-6" aria-label="Breadcrumb">
              <ol className="inline-flex items-center space-x-1 md:space-x-3">
                <li className="inline-flex items-center">
                  <a href="/" className="text-gray-600 hover:text-blue-600 text-sm font-medium">
                    Home
                  </a>
                </li>
                <li>
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
                    </svg>
                    <a href="/doctors" className="text-gray-600 hover:text-blue-600 ml-1 text-sm font-medium md:ml-2">
                      Doctors
                    </a>
                  </div>
                </li>
                <li>
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
                    </svg>
                    <a href={`/doctors/${doctorId}`} className="text-gray-600 hover:text-blue-600 ml-1 text-sm font-medium md:ml-2">
                      Dr. {doctor?.name}
                    </a>
                  </div>
                </li>
                <li aria-current="page">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
                    </svg>
                    <span className="text-gray-500 ml-1 text-sm font-medium md:ml-2">
                      Book Appointment
                    </span>
                  </div>
                </li>
              </ol>
            </nav>

            <h1 className="text-2xl font-bold text-gray-800 mb-6">
              Book an Appointment with Dr. {doctor?.name}
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

              <div className="md:col-span-1">
                <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                  <div className="flex items-center mb-4">
                    <div className="h-14 w-14 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium text-xl">
                      {doctor?.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-semibold text-gray-800">Dr. {doctor?.name}</h3>
                      <p className="text-blue-600">{doctor?.speciality}</p>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">
                    <p>{doctor?.educational_qualification}</p>
                    <p>{doctor?.years_of_experience} years experience</p>
                    {doctor?.former_organisation && (
                      <p className="text-gray-500">Former: {doctor.former_organisation}</p>
                    )}
                  </div>
                </div>

                {doctor?.consultation_fees && doctor.consultation_fees.length > 0 && (
                  <div className="bg-white rounded-xl shadow-md p-6">
                    <h3 className="text-md font-semibold text-gray-800 mb-3">Consultation Fees</h3>
                    <div className="space-y-2">
                      {doctor.consultation_fees.map(fee => (
                        <div key={fee.id} className="flex justify-between items-center p-2 rounded-md hover:bg-gray-50">
                          <span className="text-sm text-gray-700">{fee.consultation_type}</span>
                          <span className="font-semibold text-blue-600">{fee.currency} {fee.amount}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="md:col-span-2">
                <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                  <form onSubmit={handleBookAppointment}>

                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-3">1. Select Date</h3>
                      <select
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      >
                        {generateDateOptions().map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-3">2. Select Time Slot</h3>

                      {loading ? (
                        <div className="text-center py-4">
                          <svg className="animate-spin h-6 w-6 text-blue-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                          </svg>
                          <p className="mt-2 text-sm text-gray-500">Loading available time slots...</p>
                        </div>
                      ) : timeSlots.length === 0 ? (
                        <div className="text-center py-4 bg-gray-50 rounded-md">
                          <svg className="h-12 w-12 text-gray-400 mx-auto mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <p className="text-gray-600">No time slots available for this date</p>
                          <p className="text-sm text-gray-500 mt-1">Please select a different date</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                          {timeSlots.map(slot => (
                            <div key={slot.id}>
                              <button
                                type="button"
                                onClick={() => setSelectedSlot(slot)}
                                className={`w-full py-2 px-3 text-sm rounded-md transition-colors ${
                                  selectedSlot?.id === slot.id
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                                }`}
                              >
                                {formatTime(slot.start_time)}
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {doctor?.consultation_fees && doctor.consultation_fees.length > 0 && (
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-3">3. Select Consultation Type</h3>
                        <div className="space-y-2">
                          {doctor.consultation_fees.map(fee => (
                            <label key={fee.id} className="flex items-center p-3 border rounded-md cursor-pointer hover:bg-gray-50">
                              <input
                                type="radio"
                                name="consultation_fee"
                                value={fee.id}
                                checked={selectedFee?.id === fee.id}
                                onChange={handleFeeChange}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                              />
                              <div className="ml-3 flex-1">
                                <span className="block font-medium text-gray-700">{fee.consultation_type}</span>
                                <span className="block text-sm text-gray-500">
                                  {fee.consultation_type.toLowerCase().includes('video')
                                    ? 'Online consultation via video call'
                                    : fee.consultation_type.toLowerCase().includes('follow')
                                      ? 'Short follow-up consultation'
                                      : 'Standard consultation with the doctor'
                                  }
                                </span>
                              </div>
                              <span className="text-blue-600 font-semibold">{fee.currency} {fee.amount}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-3">4. Provide Details</h3>

                      <div className="mb-4">
                        <label htmlFor="symptoms" className="block text-sm font-medium text-gray-700 mb-1">
                          Symptoms
                        </label>
                        <textarea
                          id="symptoms"
                          name="symptoms"
                          rows="3"
                          placeholder="Describe your symptoms or reason for visit"
                          value={bookingData.symptoms}
                          onChange={handleInputChange}
                          className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        ></textarea>
                      </div>

                      <div>
                        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                          Additional Notes (Optional)
                        </label>
                        <textarea
                          id="notes"
                          name="notes"
                          rows="2"
                          placeholder="Any additional information you'd like to share"
                          value={bookingData.notes}
                          onChange={handleInputChange}
                          className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        ></textarea>
                      </div>
                    </div>

                    <div className="mb-6 bg-gray-50 p-4 rounded-md">
                      <p className="text-sm text-gray-600">
                        By booking this appointment, you agree to our cancellation policy. Appointments can be cancelled up to 12 hours before the scheduled time for a full refund.
                      </p>
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={bookingLoading || !selectedSlot || !selectedFee}
                        className="px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors flex items-center disabled:bg-blue-300 disabled:cursor-not-allowed"
                      >
                        {bookingLoading ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                            </svg>
                            Processing...
                          </>
                        ) : (
                          <>
                            Proceed to Payment
                            <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                            </svg>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default BookAppointmentPage;