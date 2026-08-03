import { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import PrescriptionService from "../../services/PrescriptionService";
import PrescriptionDetailModal from "../../components/prescriptions/PrescriptionDetailModal";

const HealthRecordsPage = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    pages: 0,
  });
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        setLoading(true);
        const data = await PrescriptionService.getPatientPrescriptions(
          pagination.page,
          pagination.limit
        );
        setRecords(data.prescriptions);
        setPagination(data.pagination);
      } catch (error) {
        toast.error(error.error || "Failed to load health records");
      } finally {
        setLoading(false);
      }
    };

    fetchRecords();
  }, [pagination.page, pagination.limit]);

  const formatDate = (dateString) => {
    try {
      if (!dateString) return "N/A";
      return format(parseISO(dateString), "MMMM d, yyyy");
    } catch {
      return dateString || "N/A";
    }
  };

  const handleViewRecord = (record) => {
    setSelectedRecord(record);
    setDetailModalOpen(true);
  };

  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= pagination.pages) {
      setPagination((prev) => ({ ...prev, page: newPage }));
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Health Records</h1>
          <p className="mt-1 text-gray-600">
            Your consultation history, diagnoses, and prescriptions from every completed visit.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center my-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : records.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              ></path>
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">No health records yet</h3>
            <p className="mt-1 text-gray-500">
              Your medical history will appear here after your first completed appointment.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {records.map((record) => (
                <div
                  key={record.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-sm font-medium text-gray-500">
                          {formatDate(record.appointment_date)}
                        </span>
                        {record.follow_up_needed && (
                          <span className="px-2 py-0.5 text-xs rounded-full bg-yellow-100 text-yellow-800">
                            Follow-up needed
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Dr. {record.doctor.name}
                      </h3>
                      <p className="text-sm text-blue-600 mb-3">{record.doctor.speciality}</p>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Diagnosis</p>
                        <p className="text-gray-800">{record.diagnosis}</p>
                      </div>
                      <div className="mt-3 flex items-center gap-2">
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {record.medication_count} medication{record.medication_count === 1 ? "" : "s"}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleViewRecord(record)}
                      className="self-start px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors whitespace-nowrap"
                    >
                      View Full Record
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {pagination.pages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className={`px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                    pagination.page === 1
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  Previous
                </button>
                <span className="text-sm text-gray-600">
                  Page {pagination.page} of {pagination.pages}
                </span>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.pages}
                  className={`px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                    pagination.page === pagination.pages
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}

        {selectedRecord && (
          <PrescriptionDetailModal
            isOpen={detailModalOpen}
            onClose={() => setDetailModalOpen(false)}
            prescription={selectedRecord}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default HealthRecordsPage;
