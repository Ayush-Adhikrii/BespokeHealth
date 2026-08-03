import { format } from "date-fns";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import AdminService from "../../services/AdminService";
import DoctorAvatar from "../../components/common/DoctorAvatar";

const DoctorsManagementPage = () => {
  const [doctors, setDoctors] = useState([]);
  const [specialities, setSpecialities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpeciality, setSelectedSpeciality] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("Inactive");
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [sortConfig, setSortConfig] = useState({
    sortBy: "created_at",
    sortOrder: "desc",
  });
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedMetrics, setSelectedMetrics] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);

  const [emailForm, setEmailForm] = useState({
    subject: "",
    message: "",
  });
  const [debounceTimeout, setDebounceTimeout] = useState(null);

  
  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const data = await AdminService.getAllDoctors(
        pagination.currentPage,
        10,
        searchQuery,
        
        selectedSpeciality,
        sortConfig.sortBy,
        sortConfig.sortOrder
      );

      setDoctors(data.doctors);
      setSpecialities(data.specialities || []);
      setPagination({
        currentPage: data.pagination.currentPage,
        totalPages: data.pagination.totalPages,
        totalItems: data.pagination.totalItems,
        hasNext: data.pagination.hasNext,
        hasPrev: data.pagination.hasPrev,
      });
    } catch (error) {
      toast.error(error.error || "Failed to load doctors");
    } finally {
      setLoading(false);
    }
  };

  
  useEffect(() => {
    fetchDoctors();
  }, [pagination.currentPage, sortConfig, selectedSpeciality]);

  
  useEffect(() => {
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }

    const timeout = setTimeout(() => {
      setPagination((prev) => ({ ...prev, currentPage: 1 })); 
      fetchDoctors();
    }, 500);

    setDebounceTimeout(timeout);

    return () => {
      if (debounceTimeout) clearTimeout(debounceTimeout);
    };
  }, [searchQuery]);

  
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination((prev) => ({ ...prev, currentPage: newPage }));
    }
  };

  
  const handleSort = (field) => {
    setSortConfig({
      sortBy: field,
      sortOrder:
        sortConfig.sortBy === field && sortConfig.sortOrder === "asc"
          ? "desc"
          : "asc",
    });
  };

  
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";

    try {
      const date = new Date(dateString);
      return format(date, "MMM d, yyyy");
    } catch (error) {
      return "Invalid Date";
    }
  };

  
  const openDoctorDetails = async (doctorId) => {
    try {
      setLoading(true);
      const data = await AdminService.getDoctorById(doctorId);
      setSelectedDoctor(data.doctor);
      setSelectedMetrics(data.metrics);
      setDetailModalOpen(true);
    } catch (error) {
      toast.error(error.error || "Failed to load doctor details");
    } finally {
      setLoading(false);
    }
  };

  
  const openDeleteModal = (doctor) => {
    setSelectedDoctor(doctor);
    setDeleteModalOpen(true);
  };

  
  const openEmailModal = (doctor) => {
    setSelectedDoctor(doctor);
    setEmailForm({
      subject: "",
      message: "",
    });
    setEmailModalOpen(true);
  };

  
  const handleEmailInputChange = (e) => {
    const { name, value } = e.target;
    setEmailForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  
  const handleDeleteDoctor = async () => {
    try {
      setLoading(true);
      await AdminService.deleteDoctor(selectedDoctor.id);
      toast.success("Doctor deleted successfully");
      setDeleteModalOpen(false);
      fetchDoctors(); 
    } catch (error) {
      toast.error(error.error || "Failed to delete doctor");
    } finally {
      setLoading(false);
    }
  };

  
  const handleSendEmail = async (e) => {
    e.preventDefault();

    if (!emailForm.subject || !emailForm.message) {
      toast.error("Subject and message are required");
      return;
    }

    try {
      setLoading(true);
      await AdminService.sendEmailToDoctor(selectedDoctor.id, emailForm);
      toast.success("Email sent successfully");
      setEmailModalOpen(false);
    } catch (error) {
      toast.error(error.error || "Failed to send email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto p-4">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          Doctor Management
        </h1>

        
        <div className="bg-white p-4 rounded-lg shadow-md mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search doctors by name, email, or NMC number..."
                className="w-full p-3 pl-10 rounded-md border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <div className="absolute left-3 top-3 text-gray-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4">
              <div className="w-full md:w-48">
                <select
                  className="w-full p-3 rounded-md border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                  value={selectedSpeciality}
                  onChange={(e) => setSelectedSpeciality(e.target.value)}
                >
                  <option value="">All Specialities</option>
                  {specialities.map((speciality) => (
                    <option key={speciality} value={speciality}>
                      {speciality}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {loading && doctors.length === 0 ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
            </div>
          ) : doctors.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-gray-500">
                No doctors found matching your search criteria.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort("name")}
                    >
                      <div className="flex items-center">
                        Name
                        {sortConfig.sortBy === "name" && (
                          <span className="ml-1">
                            {sortConfig.sortOrder === "asc" ? "↑" : "↓"}
                          </span>
                        )}
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Email
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Speciality
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort("created_at")}
                    >
                      <div className="flex items-center">
                        Joined
                        {sortConfig.sortBy === "created_at" && (
                          <span className="ml-1">
                            {sortConfig.sortOrder === "asc" ? "↑" : "↓"}
                          </span>
                        )}
                      </div>
                    </th>

                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Appointments
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {doctors.map((doctor) => (
                    <tr key={doctor.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <DoctorAvatar
                            name={doctor.user.name}
                            imageUrl={doctor.image_url}
                            sizeClass="h-10 w-10"
                            textClass="text-sm"
                          />
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {doctor.user.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              NMC: {doctor.nmc_number || "N/A"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {doctor.user.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {doctor.speciality}
                        </div>
                        <div className="text-xs text-gray-500">
                          {doctor.educational_qualification || "N/A"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {formatDate(doctor.user.created_at)}
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {doctor._count.appointments}
                        </div>
                        <div className="text-xs text-gray-500">
                          {doctor._count.time_slots} time slots
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => openDoctorDetails(doctor.id)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          View
                        </button>

                        <button
                          onClick={() => openEmailModal(doctor)}
                          className="text-green-600 hover:text-green-900 mr-3"
                        >
                          Email
                        </button>
                        <button
                          onClick={() => openDeleteModal(doctor)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          
          {pagination.totalPages > 1 && (
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing{" "}
                  <span className="font-medium">
                    {(pagination.currentPage - 1) * 10 + 1}
                  </span>{" "}
                  to{" "}
                  <span className="font-medium">
                    {Math.min(
                      pagination.currentPage * 10,
                      pagination.totalItems
                    )}
                  </span>{" "}
                  of{" "}
                  <span className="font-medium">{pagination.totalItems}</span>{" "}
                  doctors
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={!pagination.hasPrev}
                  className={`relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-md
                    ${
                      !pagination.hasPrev
                        ? "text-gray-300 bg-gray-50 cursor-not-allowed"
                        : "text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
                    }`}
                >
                  Previous
                </button>
                <button
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={!pagination.hasNext}
                  className={`relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-md
                    ${
                      !pagination.hasNext
                        ? "text-gray-300 bg-gray-50 cursor-not-allowed"
                        : "text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
                    }`}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      
      {detailModalOpen && selectedDoctor && (
        <div className="fixed inset-0 z-20 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity"
              aria-hidden="true"
            >
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span
              className="hidden sm:inline-block sm:align-middle sm:h-screen"
              aria-hidden="true"
            >
              &#8203;
            </span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-5xl sm:w-full">
              <div className="bg-white p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Doctor Details
                  </h3>
                  <button
                    onClick={() => setDetailModalOpen(false)}
                    className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
                  >
                    <svg
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                <div className="border-b border-gray-200 mb-6 pb-6">
                  <div className="flex items-center mb-4">
                    <DoctorAvatar
                      name={selectedDoctor.user.name}
                      imageUrl={selectedDoctor.image_url}
                      sizeClass="h-24 w-24"
                      textClass="text-3xl font-bold"
                    />
                    <div className="ml-4">
                      <h2 className="text-xl font-bold text-gray-900">
                        {selectedDoctor.user.name}
                      </h2>
                      <div className="flex space-x-2 text-sm text-gray-500">
                        <span>NMC #{selectedDoctor.nmc_number}</span>
                        <span>•</span>
                        <span>{selectedDoctor.speciality}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">
                        Email Address
                      </h3>
                      <p className="mt-1 text-sm text-gray-900">
                        {selectedDoctor.user.email}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">
                        Speciality
                      </h3>
                      <p className="mt-1 text-sm text-gray-900">
                        {selectedDoctor.speciality}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">
                        Qualifications
                      </h3>
                      <p className="mt-1 text-sm text-gray-900">
                        {selectedDoctor.educational_qualification || "N/A"}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">
                        Experience
                      </h3>
                      <p className="mt-1 text-sm text-gray-900">
                        {selectedDoctor.years_of_experience} years
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">
                        Former Organization
                      </h3>
                      <p className="mt-1 text-sm text-gray-900">
                        {selectedDoctor.former_organisation || "N/A"}
                      </p>
                    </div>
                  </div>

                  {selectedDoctor.admin_notes && (
                    <div className="mt-6 p-4 bg-gray-50 rounded-md">
                      <h3 className="text-sm font-medium text-gray-500">
                        Admin Notes
                      </h3>
                      <p className="mt-1 text-sm text-gray-900">
                        {selectedDoctor.admin_notes}
                      </p>
                    </div>
                  )}
                </div>

                
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Performance Metrics
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-sm font-medium text-gray-500">
                        Total Appointments
                      </p>
                      <p className="text-2xl font-semibold text-blue-600">
                        {selectedDoctor._count.appointments}
                      </p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <p className="text-sm font-medium text-gray-500">
                        Completion Rate
                      </p>
                      <p className="text-2xl font-semibold text-green-600">
                        {selectedMetrics?.completionRate ?? 0}%
                      </p>
                    </div>
                    <div className="bg-amber-50 p-4 rounded-lg">
                      <p className="text-sm font-medium text-gray-500">
                        Available Time Slots
                      </p>
                      <p className="text-2xl font-semibold text-amber-600">
                        {selectedDoctor._count.time_slots}
                      </p>
                    </div>
                  </div>
                </div>

                
                {selectedDoctor.appointments &&
                  selectedDoctor.appointments.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">
                        Recent Appointments
                      </h3>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Date
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Patient
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Payment
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {selectedDoctor.appointments.map((appointment) => {
                              const appointmentDate = appointment.time_slot
                                ?.date
                                ? new Date(appointment.time_slot.date)
                                : new Date(appointment.created_at);

                              return (
                                <tr key={appointment.id}>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                    {formatDate(appointmentDate)}
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                    {appointment.patient?.user?.name || "N/A"}
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap">
                                    <span
                                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                        appointment.status === "completed"
                                          ? "bg-green-100 text-green-800"
                                          : appointment.status === "confirmed"
                                          ? "bg-blue-100 text-blue-800"
                                          : appointment.status === "cancelled"
                                          ? "bg-red-100 text-red-800"
                                          : "bg-yellow-100 text-yellow-800"
                                      }`}
                                    >
                                      {appointment.status
                                        .charAt(0)
                                        .toUpperCase() +
                                        appointment.status.slice(1)}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap">
                                    {appointment.payment ? (
                                      <div>
                                        <span
                                          className={
                                            appointment.payment.status ===
                                            "completed"
                                              ? "text-green-600"
                                              : "text-amber-600"
                                          }
                                        >
                                          {appointment.payment.currency}{" "}
                                          {appointment.payment.amount}
                                        </span>
                                      </div>
                                    ) : (
                                      <span className="text-gray-500">
                                        Not paid
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  onClick={() => setDetailModalOpen(false)}
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      
      {deleteModalOpen && selectedDoctor && (
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity"
              aria-hidden="true"
            >
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span
              className="hidden sm:inline-block sm:align-middle sm:h-screen"
              aria-hidden="true"
            >
              &#8203;
            </span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <svg
                      className="h-6 w-6 text-red-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3
                      className="text-lg leading-6 font-medium text-gray-900"
                      id="modal-headline"
                    >
                      Delete Doctor
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to delete the account for{" "}
                        <strong>{selectedDoctor.user.name}</strong>? This action
                        cannot be undone and will remove all doctor data, time
                        slots, and mark related appointments as cancelled.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  onClick={handleDeleteDoctor}
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm"
                  disabled={loading}
                >
                  {loading ? "Deleting..." : "Delete Doctor"}
                </button>
                <button
                  onClick={() => setDeleteModalOpen(false)}
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      
      {emailModalOpen && selectedDoctor && (
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity"
              aria-hidden="true"
            >
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span
              className="hidden sm:inline-block sm:align-middle sm:h-screen"
              aria-hidden="true"
            >
              &#8203;
            </span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleSendEmail}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                      <h3
                        className="text-lg leading-6 font-medium text-gray-900"
                        id="modal-headline"
                      >
                        Send Email to {selectedDoctor.user.name}
                      </h3>
                      <div className="mt-4 space-y-4">
                        <div>
                          <label
                            htmlFor="subject"
                            className="block text-sm font-medium text-gray-700"
                          >
                            Subject
                          </label>
                          <input
                            type="text"
                            name="subject"
                            id="subject"
                            required
                            value={emailForm.subject}
                            onChange={handleEmailInputChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          />
                        </div>

                        <div>
                          <label
                            htmlFor="message"
                            className="block text-sm font-medium text-gray-700"
                          >
                            Message
                          </label>
                          <textarea
                            name="message"
                            id="message"
                            required
                            rows={5}
                            value={emailForm.message}
                            onChange={handleEmailInputChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          ></textarea>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm"
                    disabled={loading}
                  >
                    {loading ? "Sending..." : "Send Email"}
                  </button>
                  <button
                    onClick={() => setEmailModalOpen(false)}
                    type="button"
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default DoctorsManagementPage;
