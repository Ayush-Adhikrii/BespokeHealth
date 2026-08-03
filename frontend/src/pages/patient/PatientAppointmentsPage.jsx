import { format, parseISO } from "date-fns";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import AppointmentService from "../../services/AppointmentService";
import DashboardLayout from "../../components/layouts/DashboardLayout";

const PatientAppointmentsPage = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        setLoading(true);
        const data = await AppointmentService.getPatientAppointments("upcoming");
        setAppointments(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching appointments:", error);
        toast.error("Failed to load appointments");
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, []);

  const formatTime = (timeString) => {
    try {
      const time = parseISO(`2000-01-01T${timeString}`);
      return format(time, "h:mm a");
    } catch {
      return timeString;
    }
  };

  const formatDate = (dateString) => {
    try {
      return format(parseISO(dateString), "EEEE, MMMM d, yyyy");
    } catch {
      return dateString;
    }
  };

  const handleCompletePayment = (appointment) => {
    if (appointment.payment?.id) {
      navigate('/payment', {
        state: {
          appointment_id: appointment.id,
          doctor_name: appointment.doctor.name,
          appointment_date: appointment.date,
          appointment_time: appointment.start_time,
          payment_amount: appointment.amount,
          payment_id: appointment.payment.id
        }
      });
    } else {
      toast.error("Payment information not available");
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          My Appointments
        </h1>

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
              No upcoming appointments
            </h2>
            <p className="text-gray-600">
              You don't have any upcoming appointments scheduled.
            </p>
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
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        appointment.status === 'confirmed' 
                          ? 'bg-green-100 text-green-800' 
                          : appointment.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {appointment.status === 'confirmed' ? 'Confirmed' : 
                         appointment.status === 'pending' ? 'Pending Payment' : 
                         appointment.status}
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
                      <p className={`text-xs ${
                        appointment.payment?.status === 'completed' 
                          ? 'text-green-600' 
                          : appointment.payment?.status === 'pending'
                          ? 'text-yellow-600'
                          : 'text-gray-600'
                      }`}>
                        {appointment.payment?.status === 'completed' ? 'Paid' : 
                         appointment.payment?.status === 'pending' ? 'Pending' : 
                         'Unknown'}
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
                  
                  {appointment.status === 'pending' && appointment.payment?.status === 'pending' && (
                    <div className="border-t border-gray-100 mt-4 pt-4">
                      <button
                        onClick={() => handleCompletePayment(appointment)}
                        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
                      >
                        Complete Payment
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default PatientAppointmentsPage;
