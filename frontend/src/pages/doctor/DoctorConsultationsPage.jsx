import { useState, useEffect, Fragment } from "react";
import { format, parseISO } from "date-fns";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import ConsultationService from "../../services/ConsultationService";
import { toast } from "sonner";
import { Dialog, Transition } from "@headlessui/react";

const DoctorConsultationsPage = () => {
  const [loading, setLoading] = useState(true);
  const [consultations, setConsultations] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedDate, setSelectedDate] = useState("");
  
  
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState(false);
  const [isViewPrescriptionModalOpen, setIsViewPrescriptionModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  
  
  const [notes, setNotes] = useState("");
  const [cancellationReason, setCancellationReason] = useState("");
  const [prescription, setPrescription] = useState({
    diagnosis: "",
    doctor_notes: "",
    follow_up_needed: false,
    follow_up_date: "",
    medications: [{ name: "", dosage: "", frequency: "", duration: "", instructions: "" }]
  });
  const [viewPrescription, setViewPrescription] = useState(null);
  
  
  const fetchConsultations = async () => {
    try {
      setLoading(true);
      const filters = {
        page: currentPage,
        limit: 10
      };
      
      if (activeTab !== "all") {
        filters.status = activeTab === "scheduled" ? "confirmed" : activeTab;
      }
      
      if (selectedDate) {
        filters.date = selectedDate;
      }
      
      const data = await ConsultationService.getDoctorAppointments(filters);
      setConsultations(data.appointments);
      setTotalPages(data.pagination.pages);
    } catch (error) {
      toast.error("Failed to load consultations");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchConsultations();
  }, [activeTab, currentPage, selectedDate]);

  
  const formatDate = (dateString) => {
    try {
      return format(parseISO(dateString), "MMMM d, yyyy");
    } catch (error) {
      return dateString;
    }
  };
  
  
  const formatTime = (timeString) => {
    if (!timeString) return "";
    
    
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12;
    
    return `${formattedHour}:${minutes} ${ampm}`;
  };
  
  
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };
  
  
  const handleCompleteAppointment = async () => {
    try {
      await ConsultationService.completeAppointment(selectedAppointment.id, notes);
      toast.success("Appointment marked as completed");
      setIsCompleteModalOpen(false);
      setNotes("");
      fetchConsultations();
    } catch (error) {
      const msg = error?.response?.data?.error || "Failed to complete appointment";
      toast.error(msg);
      if (error?.response?.status === 400) {
        setIsCompleteModalOpen(false);
        openPrescriptionModal(selectedAppointment);
      }
    }
  };
  
  
  const handleCancelAppointment = async () => {
    try {
      await ConsultationService.cancelAppointment(selectedAppointment.id, cancellationReason);
      toast.success("Appointment cancelled successfully");
      setIsCancelModalOpen(false);
      setCancellationReason("");
      fetchConsultations();
    } catch (error) {
      toast.error("Failed to cancel appointment");
    }
  };
  
  
  const handleAddMedication = () => {
    setPrescription({
      ...prescription,
      medications: [
        ...prescription.medications,
        { name: "", dosage: "", frequency: "", duration: "", instructions: "" }
      ]
    });
  };
  
  const handleRemoveMedication = (index) => {
    const updatedMedications = [...prescription.medications];
    updatedMedications.splice(index, 1);
    setPrescription({
      ...prescription,
      medications: updatedMedications
    });
  };
  
  
  const handleMedicationChange = (index, field, value) => {
    const updatedMedications = [...prescription.medications];
    updatedMedications[index][field] = value;
    setPrescription({
      ...prescription,
      medications: updatedMedications
    });
  };
  
  
  const handlePrescriptionSubmit = async () => {
    try {
      await ConsultationService.createOrUpdatePrescription(
        selectedAppointment.id,
        prescription
      );
      toast.success("Prescription saved successfully");
      setIsPrescriptionModalOpen(false);
      setPrescription({
        diagnosis: "",
        doctor_notes: "",
        follow_up_needed: false,
        follow_up_date: "",
        medications: [{ name: "", dosage: "", frequency: "", duration: "", instructions: "" }]
      });
      fetchConsultations();
    } catch (error) {
      const msg = error?.response?.data?.error || error?.message || "Failed to save prescription";
      toast.error(msg);
    }
  };
  
  
  const handleViewPrescription = async (appointmentId) => {
    try {
      setLoading(true);
      const data = await ConsultationService.getPrescription(appointmentId);
      setViewPrescription(data);
      setIsViewPrescriptionModalOpen(true);
    } catch (error) {
      if (error.response?.status === 404) {
        toast.error("No prescription found for this appointment");
      } else {
        toast.error("Failed to fetch prescription");
      }
    } finally {
      setLoading(false);
    }
  };
  
  
  const openPrescriptionModal = async (appointment) => {
    setSelectedAppointment(appointment);
    
    try {
      
      const data = await ConsultationService.getPrescription(appointment.id);
      
      
      setPrescription({
        diagnosis: data.diagnosis || "",
        doctor_notes: data.doctor_notes || "",
        follow_up_needed: data.follow_up.needed || false,
        follow_up_date: data.follow_up.date ? format(new Date(data.follow_up.date), "yyyy-MM-dd") : "",
        medications: data.medications.length > 0 ? data.medications.map(med => ({
          name: med.name,
          dosage: med.dosage,
          frequency: med.frequency,
          duration: med.duration,
          instructions: med.instructions || ""
        })) : [{ name: "", dosage: "", frequency: "", duration: "", instructions: "" }]
      });
    } catch (error) {
      
      setPrescription({
        diagnosis: "",
        doctor_notes: "",
        follow_up_needed: false,
        follow_up_date: "",
        medications: [{ name: "", dosage: "", frequency: "", duration: "", instructions: "" }]
      });
    }
    
    setIsPrescriptionModalOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Consultations</h1>

        
        <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between">
          
          <div className="border-b border-gray-200 w-full sm:w-auto mb-4 sm:mb-0">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => { setActiveTab("all"); setCurrentPage(1); }}
                className={`${
                  activeTab === "all"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                All Consultations
              </button>
              <button
                onClick={() => { setActiveTab("scheduled"); setCurrentPage(1); }}
                className={`${
                  activeTab === "scheduled"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Scheduled
              </button>
              <button
                onClick={() => { setActiveTab("completed"); setCurrentPage(1); }}
                className={`${
                  activeTab === "completed"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Completed
              </button>
              <button
                onClick={() => { setActiveTab("cancelled"); setCurrentPage(1); }}
                className={`${
                  activeTab === "cancelled"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Cancelled
              </button>
            </nav>
          </div>
          
          
          <div className="flex items-center">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => { setSelectedDate(e.target.value); setCurrentPage(1); }}
              className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            {selectedDate && (
              <button
                onClick={() => { setSelectedDate(""); setCurrentPage(1); }}
                className="ml-2 text-sm text-gray-500 hover:text-gray-700"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {consultations.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-6 text-center">
                <p className="text-gray-500">No consultations found.</p>
              </div>
            ) : (
              <>
                {consultations.map(consultation => (
                  <div key={consultation.id} className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="p-6">
                      
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center mb-4 md:mb-0">
                          <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-medium text-lg">
                            {consultation.patient.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div className="ml-4">
                            <h3 className="text-lg font-semibold text-gray-900">{consultation.patient.name}</h3>
                            <p className="text-sm text-gray-500">
                              Patient ID: {consultation.patient.id}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end">
                          <div className="flex items-center mb-1">
                            {consultation.status === "completed" ? (
                              <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                                Completed
                              </span>
                            ) : consultation.status === "cancelled" ? (
                              <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
                                Cancelled
                              </span>
                            ) : (
                              <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                                Scheduled
                              </span>
                            )}
                            
                            <span className="ml-2 px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
                              Payment: {consultation.payment_status.charAt(0).toUpperCase() + consultation.payment_status.slice(1)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500">
                            {formatDate(consultation.date)} • {formatTime(consultation.time.start)} - {formatTime(consultation.time.end)}
                          </p>
                        </div>
                      </div>

                      
                      <div className="mt-4 border-t border-gray-200 pt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="text-sm font-medium text-gray-500">Symptoms</h4>
                            <p className="text-gray-900">{consultation.symptoms || "No symptoms recorded"}</p>
                          </div>
                          
                          {consultation.has_notes && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-500">Notes Available</h4>
                              <button 
                                onClick={() => {
                                  setSelectedAppointment(consultation);
                                  ConsultationService.getConsultationNotes(consultation.id)
                                    .then(data => {
                                      setNotes(data.notes);
                                      setIsCompleteModalOpen(true);
                                    })
                                    .catch(() => {
                                      setNotes("");
                                      setIsCompleteModalOpen(true);
                                    });
                                }}
                                className="text-blue-600 text-sm hover:underline"
                              >
                                View/Edit Notes
                              </button>
                            </div>
                          )}
                          
                          {consultation.has_prescription && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-500">Prescription Available</h4>
                              <button 
                                onClick={() => handleViewPrescription(consultation.id)}
                                className="text-blue-600 text-sm hover:underline"
                              >
                                View Prescription
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      
                      <div className="mt-6 flex justify-end space-x-3">
                        {consultation.status === "confirmed" ? (
                          <>
                            <button 
                              onClick={() => {
                                setSelectedAppointment(consultation);
                                setIsCancelModalOpen(true);
                              }}
                              className="px-4 py-2 border border-red-600 text-red-600 rounded-md hover:bg-red-50"
                            >
                              Cancel
                            </button>
                            <button 
                              onClick={() => {
                                setSelectedAppointment(consultation);
                                setNotes("");
                                setIsCompleteModalOpen(true);
                              }}
                              className="px-4 py-2 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50"
                            >
                              Add Notes
                            </button>
                            <button 
                              onClick={() => openPrescriptionModal(consultation)}
                              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                            >
                              Write Prescription
                            </button>
                          </>
                        ) : consultation.status === "completed" ? (
                          <>
                            <button 
                              onClick={() => {
                                setSelectedAppointment(consultation);
                                ConsultationService.getConsultationNotes(consultation.id)
                                  .then(data => {
                                    setNotes(data.notes);
                                    setIsCompleteModalOpen(true);
                                  })
                                  .catch(() => {
                                    setNotes("");
                                    setIsCompleteModalOpen(true);
                                  });
                              }}
                              className="px-4 py-2 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50"
                            >
                              View/Edit Notes
                            </button>
                            <button 
                              onClick={() => openPrescriptionModal(consultation)}
                              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                            >
                              {consultation.has_prescription ? "Edit Prescription" : "Write Prescription"}
                            </button>
                          </>
                        ) : (
                          <button 
                            onClick={() => {
                              setSelectedAppointment(consultation);
                              ConsultationService.getConsultationNotes(consultation.id)
                                .then(data => {
                                  setNotes(data.notes);
                                  setIsCompleteModalOpen(true);
                                })
                                .catch(() => {
                                  setNotes("");
                                  setIsCompleteModalOpen(true);
                                });
                            }}
                            className="px-4 py-2 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50"
                          >
                            View Details
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                
                
                {totalPages > 1 && (
                  <div className="flex justify-center mt-6">
                    <nav className="flex items-center">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className={`px-2 py-1 rounded-md mr-2 ${
                          currentPage === 1
                            ? "text-gray-400 cursor-not-allowed"
                            : "text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        Previous
                      </button>
                      
                      {[...Array(totalPages)].map((_, i) => (
                        <button
                          key={i}
                          onClick={() => handlePageChange(i + 1)}
                          className={`px-3 py-1 rounded-md mx-1 ${
                            currentPage === i + 1
                              ? "bg-blue-600 text-white"
                              : "text-gray-700 hover:bg-gray-100"
                          }`}
                        >
                          {i + 1}
                        </button>
                      ))}
                      
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className={`px-2 py-1 rounded-md ml-2 ${
                          currentPage === totalPages
                            ? "text-gray-400 cursor-not-allowed"
                            : "text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        Next
                      </button>
                    </nav>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
      
      
      <Transition appear show={isCompleteModalOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-10"
          onClose={() => setIsCompleteModalOpen(false)}
        >
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900"
                  >
                    {selectedAppointment?.status === "completed" 
                      ? "Consultation Notes" 
                      : "Complete Consultation"}
                  </Dialog.Title>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500 mb-4">
                      {selectedAppointment?.status === "completed"
                        ? "Review or update consultation notes for this appointment."
                        : "Add consultation notes and mark this appointment as completed."}
                    </p>
                    <div className="mt-4">
                      <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                        Consultation Notes
                      </label>
                      <textarea
                        id="notes"
                        rows={5}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        placeholder="Enter detailed notes about the consultation..."
                      />
                    </div>
                  </div>

                  <div className="mt-4 flex justify-end space-x-3">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-gray-100 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-200"
                      onClick={() => setIsCompleteModalOpen(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                      onClick={async () => {
                        if (selectedAppointment?.status === "completed") {
                          
                          try {
                            await ConsultationService.updateConsultationNotes(selectedAppointment.id, notes);
                            toast.success("Notes updated successfully");
                            setIsCompleteModalOpen(false);
                            fetchConsultations();
                          } catch (error) {
                            toast.error("Failed to update notes");
                          }
                        } else {
                          
                          handleCompleteAppointment();
                        }
                      }}
                    >
                      {selectedAppointment?.status === "completed" ? "Update Notes" : "Complete & Save"}
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
      
      
      <Transition appear show={isCancelModalOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-10"
          onClose={() => setIsCancelModalOpen(false)}
        >
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900"
                  >
                    Cancel Appointment
                  </Dialog.Title>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500 mb-4">
                      Are you sure you want to cancel this appointment? This action cannot be undone.
                    </p>
                    <div className="mt-4">
                      <label htmlFor="cancellationReason" className="block text-sm font-medium text-gray-700">
                        Reason for Cancellation <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        id="cancellationReason"
                        rows={3}
                        value={cancellationReason}
                        onChange={(e) => setCancellationReason(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        placeholder="Please provide a reason for cancellation..."
                        required
                      />
                    </div>
                  </div>

                  <div className="mt-4 flex justify-end space-x-3">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-gray-100 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-200"
                      onClick={() => setIsCancelModalOpen(false)}
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                      onClick={handleCancelAppointment}
                      disabled={!cancellationReason.trim()}
                    >
                      Cancel Appointment
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
      
      
      <Transition appear show={isPrescriptionModalOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-10"
          onClose={() => setIsPrescriptionModalOpen(false)}
        >
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900"
                  >
                    Write Prescription
                  </Dialog.Title>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500 mb-4">
                      Create a prescription for {selectedAppointment?.patient?.name}.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label htmlFor="diagnosis" className="block text-sm font-medium text-gray-700">
                          Diagnosis <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="diagnosis"
                          value={prescription.diagnosis}
                          onChange={(e) => setPrescription({...prescription, diagnosis: e.target.value})}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          placeholder="Primary diagnosis"
                          required
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="doctor_notes" className="block text-sm font-medium text-gray-700">
                          Doctor's Notes
                        </label>
                        <input
                          type="text"
                          id="doctor_notes"
                          value={prescription.doctor_notes}
                          onChange={(e) => setPrescription({...prescription, doctor_notes: e.target.value})}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          placeholder="Additional notes"
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center mb-4">
                      <input
                        type="checkbox"
                        id="follow_up_needed"
                        checked={prescription.follow_up_needed}
                        onChange={(e) => setPrescription({...prescription, follow_up_needed: e.target.checked})}
                        className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      />
                      <label htmlFor="follow_up_needed" className="ml-2 block text-sm text-gray-700">
                        Follow-up appointment needed
                      </label>
                    </div>
                    
                    {prescription.follow_up_needed && (
                      <div className="mb-4">
                        <label htmlFor="follow_up_date" className="block text-sm font-medium text-gray-700">
                          Follow-up Date
                        </label>
                        <input
                          type="date"
                          id="follow_up_date"
                          value={prescription.follow_up_date}
                          onChange={(e) => setPrescription({...prescription, follow_up_date: e.target.value})}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                    )}
                    
                    <div className="mt-6">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-md font-medium text-gray-900">Medications</h4>
                        <button
                          type="button"
                          onClick={handleAddMedication}
                          className="px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100"
                        >
                          + Add Medication
                        </button>
                      </div>
                      
                      {prescription.medications.map((medication, index) => (
                        <div key={index} className="border p-4 rounded-md mb-3">
                          <div className="flex justify-between mb-2">
                            <h5 className="text-sm font-medium">Medication #{index + 1}</h5>
                            {prescription.medications.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveMedication(index)}
                                className="text-red-600 text-sm hover:text-red-800"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <label htmlFor={`med_name_${index}`} className="block text-xs font-medium text-gray-700">
                                Medication Name <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                id={`med_name_${index}`}
                                value={medication.name}
                                onChange={(e) => handleMedicationChange(index, 'name', e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                                placeholder="Medication name"
                                required
                              />
                            </div>
                            
                            <div>
                              <label htmlFor={`med_dosage_${index}`} className="block text-xs font-medium text-gray-700">
                                Dosage <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                id={`med_dosage_${index}`}
                                value={medication.dosage}
                                onChange={(e) => handleMedicationChange(index, 'dosage', e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                                placeholder="e.g., 500mg"
                                required
                              />
                            </div>
                            
                            <div>
                              <label htmlFor={`med_frequency_${index}`} className="block text-xs font-medium text-gray-700">
                                Frequency <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                id={`med_frequency_${index}`}
                                value={medication.frequency}
                                onChange={(e) => handleMedicationChange(index, 'frequency', e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                                placeholder="e.g., Twice daily"
                                required
                              />
                            </div>
                            
                            <div>
                              <label htmlFor={`med_duration_${index}`} className="block text-xs font-medium text-gray-700">
                                Duration <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                id={`med_duration_${index}`}
                                value={medication.duration}
                                onChange={(e) => handleMedicationChange(index, 'duration', e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                                placeholder="e.g., 7 days"
                                required
                              />
                            </div>
                            
                            <div className="md:col-span-2">
                              <label htmlFor={`med_instructions_${index}`} className="block text-xs font-medium text-gray-700">
                                Special Instructions
                              </label>
                              <input
                                type="text"
                                id={`med_instructions_${index}`}
                                value={medication.instructions}
                                onChange={(e) => handleMedicationChange(index, 'instructions', e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                                placeholder="e.g., Take after meals"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {(() => {
                    const missingDiagnosis = !prescription.diagnosis.trim();
                    const badMeds = prescription.medications.some(
                      (med) => !med.name || !med.dosage || !med.frequency || !med.duration
                    );
                    const isDisabled = missingDiagnosis || badMeds;
                    return (
                      <>
                        {isDisabled && (
                          <p className="mt-4 text-sm text-red-500">
                            {missingDiagnosis
                              ? "Diagnosis is required."
                              : "All medication fields (Name, Dosage, Frequency, Duration) are required."}
                          </p>
                        )}
                        <div className="mt-3 flex justify-end space-x-3">
                          <button
                            type="button"
                            className="inline-flex justify-center rounded-md border border-transparent bg-gray-100 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-200"
                            onClick={() => setIsPrescriptionModalOpen(false)}
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            className={`inline-flex justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-white transition-colors ${
                              isDisabled
                                ? "bg-gray-400 cursor-not-allowed"
                                : "bg-blue-600 hover:bg-blue-700"
                            }`}
                            onClick={isDisabled ? undefined : handlePrescriptionSubmit}
                            disabled={isDisabled}
                          >
                            Save Prescription
                          </button>
                        </div>
                      </>
                    );
                  })()}
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
      
      
      <Transition appear show={isViewPrescriptionModalOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-10"
          onClose={() => setIsViewPrescriptionModalOpen(false)}
        >
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  {viewPrescription && (
                    <>
                      <Dialog.Title
                        as="h3"
                        className="text-lg font-medium leading-6 text-gray-900"
                      >
                        Prescription
                      </Dialog.Title>
                      
                      <div className="mt-4 border-t border-b py-4">
                        <div className="flex justify-between mb-4">
                          <div>
                            <p className="text-sm text-gray-500">Patient</p>
                            <p className="font-medium">{viewPrescription.patient.name}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Date</p>
                            <p className="font-medium">{formatDate(viewPrescription.appointment_date)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Doctor</p>
                            <p className="font-medium">Dr. {viewPrescription.doctor.name}</p>
                          </div>
                        </div>
                        
                        <div className="mb-4">
                          <p className="text-sm text-gray-500">Diagnosis</p>
                          <p className="font-medium">{viewPrescription.diagnosis}</p>
                        </div>
                        
                        {viewPrescription.doctor_notes && (
                          <div className="mb-4">
                            <p className="text-sm text-gray-500">Doctor's Notes</p>
                            <p>{viewPrescription.doctor_notes}</p>
                          </div>
                        )}
                      </div>
                      
                      <div className="my-4">
                        <h4 className="font-medium mb-2">Medications</h4>
                        <ul className="border rounded-md divide-y">
                          {viewPrescription.medications.map((medication) => (
                            <li key={medication.id} className="p-3">
                              <div className="flex justify-between">
                                <span className="font-medium">{medication.name}</span>
                                <span>{medication.dosage}</span>
                              </div>
                              <p className="text-sm text-gray-600">
                                {medication.frequency}, for {medication.duration}
                              </p>
                              {medication.instructions && (
                                <p className="text-sm text-gray-600 mt-1">
                                  Instructions: {medication.instructions}
                                </p>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      {viewPrescription.follow_up.needed && (
                        <div className="my-4 bg-blue-50 p-3 rounded-md">
                          <p className="text-sm text-blue-700">
                            <span className="font-medium">Follow-up appointment recommended:</span> {" "}
                            {viewPrescription.follow_up.date && formatDate(viewPrescription.follow_up.date)}
                          </p>
                        </div>
                      )}
                      
                      <div className="mt-4 flex justify-end">
                        <button
                          type="button"
                          className="inline-flex justify-center rounded-md border border-transparent bg-blue-100 px-4 py-2 text-sm font-medium text-blue-900 hover:bg-blue-200"
                          onClick={() => setIsViewPrescriptionModalOpen(false)}
                        >
                          Close
                        </button>
                      </div>
                    </>
                  )}
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </DashboardLayout>
  );
};

export default DoctorConsultationsPage;