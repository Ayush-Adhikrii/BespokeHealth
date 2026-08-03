import { addDays, format, isTomorrow, parseISO } from "date-fns";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import Footer from "../../components/home/Footer";
import Navbar from "../../components/home/Navbar";
import { useAuth } from "../../context/AuthContext";
import AppointmentService from "../../services/AppointmentService";
import { getDoctorById } from "../../services/DoctorService";

const TimeSlotSelectionPage = () => {
  const { doctorId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [doctor, setDoctor] = useState(null);
  const [selectedDate, setSelectedDate] = useState(
    format(new Date(), "yyyy-MM-dd")
  );
  const [timeSlots, setTimeSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedConsultationType, setSelectedConsultationType] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) {
      toast.error("Please log in to book an appointment");
      navigate("/login", {
        state: {
          from: `/appointment/book/${doctorId}`,
          message: "Please login to book an appointment",
        },
      });
    }
  }, [user, navigate, doctorId]);

  useEffect(() => {
    const fetchDoctorDetails = async () => {
      try {
        setLoading(true);
        const data = await getDoctorById(doctorId);
        setDoctor(data);

        if (data.consultation_fees && data.consultation_fees.length > 0) {
          setSelectedConsultationType(
            data.consultation_fees[0].consultation_type
          );
        }

        document.title = `Book Appointment with Dr. ${data.name} | Bespoke Health`;
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
    const fetchTimeSlots = async () => {
      if (!selectedDate) return;

      try {
        setLoadingSlots(true);
        const data = await AppointmentService.getDoctorTimeSlots(
          doctorId,
          selectedDate
        );
        setTimeSlots(data.time_slots || []);
      } catch (err) {
        toast.error(err.error || "Failed to load time slots");
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchTimeSlots();
  }, [doctorId, selectedDate]);

  const dateOptions = [];
  const today = new Date();
  for (let i = 0; i < 14; i++) {
    const date = addDays(today, i);
    const formattedDate = format(date, "yyyy-MM-dd");
    dateOptions.push({
      value: formattedDate,
      label: isTomorrow(date) ? "Tomorrow" : format(date, "EEEE, MMM d"),
    });
  }

  const getSelectedFee = () => {
    if (!doctor?.consultation_fees || !selectedConsultationType) return null;

    return doctor.consultation_fees.find(
      (fee) => fee.consultation_type === selectedConsultationType
    );
  };

  const selectedFee = getSelectedFee();

  const formatTime = (timeString) => {
    try {
      const time = parseISO(`2000-01-01T${timeString}`);
      return format(time, "h:mm a").replace(/am|pm/i, (match) =>
        match.toLowerCase() === "am" ? "pm" : "am"
      );
    } catch {
      return timeString;
    }
  };

  const handleSlotSelect = (slot) => {
    setSelectedSlot(slot);
  };

  const handleProceedToBooking = () => {
    if (!selectedSlot) {
      toast.error("Please select a time slot");
      return;
    }

    if (!selectedConsultationType) {
      toast.error("Please select a consultation type");
      return;
    }
    console.log("Should take to confirm page");

    navigate(`/appointment/confirm/${doctorId}`, {
      state: {
        doctorName: doctor.name,
        doctorSpeciality: doctor.speciality,
        slotId: selectedSlot.id,
        slotDate: selectedSlot.date,
        slotTime: selectedSlot.start_time,
        consultationType: selectedConsultationType,
        fee: selectedFee,
      },
    });
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gray-50 pt-20 pb-10">
          <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
            </div>
            <p className="text-center mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gray-50 pt-20 pb-10">
          <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="text-center">
              <p className="text-red-600 text-lg">{error}</p>
              <button
                onClick={() => navigate(-1)}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md"
              >
                Go Back
              </button>
            </div>
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
                  Back to Doctor
                </button>
              </li>
            </ol>
          </nav>

          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="p-6 bg-blue-600 text-white">
              <h1 className="text-2xl font-bold">Book Appointment</h1>
              <p className="text-blue-100 mt-1">
                Select a convenient time for your appointment with Dr.{" "}
                {doctor?.name}
              </p>
            </div>

            <div className="p-6 border-b border-gray-200">
              <div className="flex items-start">
                <div className="h-14 w-14 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium text-xl mr-4 flex-shrink-0">
                  {doctor.user?.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-800">
                    Dr. {doctor.user?.name}
                  </h2>
                  <p className="text-blue-600">{doctor?.speciality}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    {doctor?.years_of_experience} years experience
                    {doctor?.former_organisation
                      ? ` • ${doctor.former_organisation}`
                      : ""}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 border-b border-gray-200">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Date
                </label>
                <select
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  {dateOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Consultation Type
                </label>
                <select
                  value={selectedConsultationType}
                  onChange={(e) => setSelectedConsultationType(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  {doctor?.consultation_fees?.map((fee) => (
                    <option
                      key={fee.consultation_type}
                      value={fee.consultation_type}
                    >
                      {fee.consultation_type} - {fee.currency} {fee.amount}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Available Time Slots
              </h3>

              {loadingSlots ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
                  <p className="mt-2 text-gray-600">Loading time slots...</p>
                </div>
              ) : timeSlots.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <p className="mt-2 text-gray-500">
                    No time slots available for this date. Please select another
                    date.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {timeSlots.map((slot) => (
                    <button
                      key={slot.id}
                      onClick={() => handleSlotSelect(slot)}
                      className={`py-3 px-4 rounded-md text-center transition-colors ${
                        selectedSlot?.id === slot.id
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                      }`}
                    >
                      {formatTime(slot.start_time)}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {selectedSlot && (
              <div className="p-6 bg-blue-50">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Selected Appointment
                </h3>
                <div className="flex flex-col md:flex-row md:items-center justify-between">
                  <div>
                    <p className="text-gray-800">
                      <span className="font-medium">Date:</span>{" "}
                      {format(
                        parseISO(selectedSlot.date),
                        "EEEE, MMMM d, yyyy"
                      )}
                    </p>
                    <p className="text-gray-800">
                      <span className="font-medium">Time:</span>{" "}
                      {formatTime(selectedSlot.start_time)} to{" "}
                      {formatTime(selectedSlot.end_time)}
                    </p>
                    {selectedFee && (
                      <p className="text-gray-800">
                        <span className="font-medium">Fee:</span>{" "}
                        {selectedFee.currency} {selectedFee.amount}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={handleProceedToBooking}
                    className="mt-4 md:mt-0 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Continue to Book
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default TimeSlotSelectionPage;
