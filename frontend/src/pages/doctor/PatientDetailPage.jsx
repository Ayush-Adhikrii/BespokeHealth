import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import PatientService from "../../services/PatientService";
import { toast } from "sonner";

const PatientDetailPage = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [patient, setPatient] = useState(null);
  
  useEffect(() => {
    const fetchPatientDetails = async () => {
      try {
        setLoading(true);
        const data = await PatientService.getPatientDetails(patientId);
        setPatient(data);
      } catch (error) {
        console.error(error);
        if (error.response?.status === 403) {
          toast.error("You don't have permission to view this patient's details");
          navigate("/dashboard/patients");
        } else if (error.response?.status === 404) {
          toast.error("Patient not found");
          navigate("/dashboard/patients");
        } else {
          toast.error("Failed to load patient details");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPatientDetails();
  }, [patientId, navigate]);

  
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    
    try {
      const date = new Date(dateString);
      return format(date, "MMMM d, yyyy");
    } catch {
      return "Invalid Date";
    }
  };
  
  
  const formatTime = (timeString) => {
    if (!timeString) return "";
    
    
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12;
    
    return `${formattedHour}:${minutes} ${ampm}`;
  };

  
  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return "N/A";
    
    try {
      const birthDate = new Date(dateOfBirth);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      return age;
    } catch {
      return "N/A";
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        
        <div className="mb-6">
          <Link
            to="/dashboard/patients"
            className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            <svg className="mr-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Patients
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
          </div>
        ) : patient ? (
          <>
            
            <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
              <div className="p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center mb-4 md:mb-0">
                    <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xl">
                      {patient.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="ml-4">
                      <h1 className="text-2xl font-bold text-gray-900">{patient.name}</h1>
                      <p className="text-gray-600">Patient #{patient.id}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                      {patient.appointment_count} {patient.appointment_count === 1 ? 'Visit' : 'Visits'}
                    </span>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                      {patient.gender || "Gender not specified"}
                    </span>
                  </div>
                </div>
                
                
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Email Address</h3>
                    <p className="mt-1 text-sm text-gray-900">{patient.email}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Phone Number</h3>
                    <p className="mt-1 text-sm text-gray-900">{patient.phone || "Not provided"}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Date of Birth</h3>
                    <p className="mt-1 text-sm text-gray-900">
                      {patient.date_of_birth ? (
                        <>
                          {formatDate(patient.date_of_birth)} <span className="text-gray-500">({calculateAge(patient.date_of_birth)} years)</span>
                        </>
                      ) : (
                        "Not provided"
                      )}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Gender</h3>
                    <p className="mt-1 text-sm text-gray-900">{patient.gender || "Not specified"}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Member Since</h3>
                    <p className="mt-1 text-sm text-gray-900">{formatDate(patient.member_since)}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Last Appointment</h3>
                    <p className="mt-1 text-sm text-gray-900">
                      {patient.last_appointment ? formatDate(patient.last_appointment.date) : "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Appointment History</h2>
              </div>
              
              {patient.appointment_history.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="text-gray-500">No appointment history found.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Symptoms</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {patient.appointment_history.map(appointment => (
                        <tr key={appointment.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{formatDate(appointment.date)}</div>
                            <div className="text-sm text-gray-500">
                              {formatTime(appointment.start_time)} - {formatTime(appointment.end_time)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                              ${appointment.status === 'completed' ? 'bg-green-100 text-green-800' : 
                                appointment.status === 'cancelled' ? 'bg-red-100 text-red-800' : 
                                'bg-blue-100 text-blue-800'}`}
                            >
                              {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                              ${appointment.payment_status === 'paid' ? 'bg-green-100 text-green-800' : 
                                'bg-yellow-100 text-yellow-800'}`}
                            >
                              {appointment.payment_status.charAt(0).toUpperCase() + appointment.payment_status.slice(1)}
                              {appointment.amount ? ` - $${appointment.amount}` : ''}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 max-w-md truncate">
                              {appointment.symptoms || "No symptoms recorded"}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 max-w-md truncate">
                              {appointment.notes || "No notes recorded"}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <Link to={`/dashboard/consultations/${appointment.id}`} className="text-blue-600 hover:text-blue-900">
                              View Details
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <p className="text-gray-500">Patient not found or you don't have permission to view this patient.</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default PatientDetailPage;