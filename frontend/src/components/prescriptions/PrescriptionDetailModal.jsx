import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { format, parseISO } from "date-fns";

const PrescriptionDetailModal = ({ isOpen, onClose, prescription }) => {
  
  const formatDate = (dateString) => {
    try {
      if (!dateString) return "N/A";
      return format(parseISO(dateString), "MMMM d, yyyy");
    } catch {
      return dateString || "N/A";
    }
  };

  if (!prescription) return null;

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
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
                <div className="flex justify-between items-start">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900"
                  >
                    Prescription Details
                  </Dialog.Title>
                  <button
                    type="button"
                    className="text-gray-400 hover:text-gray-500"
                    onClick={onClose}
                  >
                    <span className="sr-only">Close</span>
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

                <div className="mt-4">
                  
                  <div className="bg-blue-50 p-4 rounded-lg mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Doctor</p>
                        <p className="font-medium text-gray-900">
                          {prescription.doctor.name}
                        </p>
                        <p className="text-sm text-blue-600">
                          {prescription.doctor.speciality}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Appointment Date</p>
                        <p className="font-medium">
                          {formatDate(prescription.appointment_date)}
                        </p>
                      </div>
                    </div>
                  </div>

                  
                  <div className="mb-6">
                    <h4 className="text-md font-medium text-gray-900 mb-2">
                      Diagnosis
                    </h4>
                    <p className="text-gray-700 bg-gray-50 p-3 rounded-md">
                      {prescription.diagnosis}
                    </p>
                  </div>

                  
                  <div className="mb-6">
                    <h4 className="text-md font-medium text-gray-900 mb-2">
                      Medications ({prescription.medication_count})
                    </h4>
                    <div className="border rounded-md overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th
                              scope="col"
                              className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase"
                            >
                              Medication
                            </th>
                            <th
                              scope="col"
                              className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase"
                            >
                              Dosage
                            </th>
                            <th
                              scope="col"
                              className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase"
                            >
                              Frequency
                            </th>
                            <th
                              scope="col"
                              className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase"
                            >
                              Duration
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {prescription.medications.map((med, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                {med.name}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-500">
                                {med.dosage}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-500">
                                {med.frequency}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-500">
                                {med.duration}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-2">
                      Follow-up Information
                    </h4>
                    {prescription.follow_up_needed ? (
                      <div className="bg-yellow-50 p-4 rounded-md border-l-4 border-yellow-400">
                        <div className="flex">
                          <svg
                            className="h-6 w-6 text-yellow-500 mr-2"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          <div>
                            <p className="text-sm font-medium text-yellow-800">
                              Follow-up Recommended
                            </p>
                            <p className="text-sm text-yellow-700 mt-1">
                              Please schedule a follow-up appointment for{" "}
                              <strong>{formatDate(prescription.follow_up_date)}</strong>
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">
                        No follow-up appointment is needed at this time.
                      </p>
                    )}
                  </div>

                  
                  <div className="mt-6 text-right text-sm text-gray-500">
                    Issued on: {format(new Date(prescription.created_at), "MMMM d, yyyy 'at' h:mm a")}
                  </div>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md border border-transparent bg-blue-100 px-4 py-2 text-sm font-medium text-blue-900 hover:bg-blue-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                    onClick={() => window.print()}
                  >
                    Print Prescription
                  </button>
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                    onClick={onClose}
                  >
                    Close
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default PrescriptionDetailModal;