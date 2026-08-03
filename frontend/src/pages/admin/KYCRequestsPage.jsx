import { useEffect, useState } from "react";
import { toast } from "sonner";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import { getKYCsForReview, reviewKYC } from "../../services/KycService";


const getImageUrl = (filePath) => {
  if (!filePath) return "";

  
  const filename = filePath.split("/").pop();

  
  
  return `${
    import.meta.env.VITE_API_URL || "https://localhost:3000/api"
  }/uploads/kyc/${filename}`;
};

const KYCRequestsPage = () => {
  const [kycs, setKycs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
  });
  const [filters, setFilters] = useState({
    status: "In-Review",
    role: "all", 
  });
  const [selectedKYC, setSelectedKYC] = useState(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewData, setReviewData] = useState({
    status: "Approved",
    review_notes: "",
  });
  const [reviewLoading, setReviewLoading] = useState(false);

  
  const fetchKYCs = async (page = 1) => {
    try {
      setLoading(true);
      setError("");

      const data = await getKYCsForReview(page, 10, filters.status);

      
      let filteredKycs = data.kycs;
      if (filters.role !== "all") {
        filteredKycs = data.kycs.filter(
          (kyc) => kyc.user.role === filters.role
        );
      }

      setKycs(filteredKycs);
      setPagination({
        currentPage: data.currentPage,
        totalPages: data.totalPages,
        totalCount:
          filters.role === "all" ? data.totalCount : filteredKycs.length,
      });
    } catch (err) {
      setError(err.error || "Failed to retrieve KYCs for review");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKYCs(1);
  }, [filters]);

  
  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    fetchKYCs(newPage);
  };

  
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
    
    setPagination((prev) => ({
      ...prev,
      currentPage: 1,
    }));
  };

  
  const openReviewModal = (kyc) => {
    setSelectedKYC(kyc);
    setReviewData({
      status: "Approved",
      review_notes: "",
    });
    setReviewModalOpen(true);
  };

  
  const closeReviewModal = () => {
    setReviewModalOpen(false);
    setSelectedKYC(null);
  };

  
  const handleReviewChange = (e) => {
    const { name, value } = e.target;
    setReviewData({
      ...reviewData,
      [name]: value,
    });
  };

  
  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setReviewLoading(true);

    try {
      await reviewKYC(selectedKYC.id, reviewData);

      
      toast.success(
        `${
          selectedKYC.user.name
        }'s KYC ${reviewData.status.toLowerCase()} successfully`
      );

      
      closeReviewModal();
      fetchKYCs(pagination.currentPage);
    } catch (err) {
      toast.error(err.error || "Failed to update KYC status");
    } finally {
      setReviewLoading(false);
    }
  };

  
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">
            KYC Verification Management
          </h1>

          <div className="mt-4 md:mt-0 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="block w-full md:w-auto px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="In-Review">Pending Review</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>

            
            <select
              name="role"
              value={filters.role}
              onChange={handleFilterChange}
              className="block w-full md:w-auto px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="all">All Users</option>
              <option value="Patient">Patients Only</option>
              <option value="Doctor">Doctors Only</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-500"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <svg
                className="animate-spin h-10 w-10 text-blue-600 mx-auto mb-4"
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
              <p className="text-gray-600">Loading KYC submissions...</p>
            </div>
          ) : kycs.length === 0 ? (
            <div className="p-8 text-center">
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
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p className="text-gray-600 text-lg font-medium">
                No KYC Submissions Found
              </p>
              <p className="text-gray-500 mt-1">
                {filters.status === "In-Review"
                  ? `There are no pending KYC submissions to review${
                      filters.role !== "all" ? ` for ${filters.role}s` : ""
                    }.`
                  : `No ${filters.status.toLowerCase()} KYC submissions found${
                      filters.role !== "all" ? ` for ${filters.role}s` : ""
                    }.`}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        User
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Role
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Submitted On
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Status
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {kycs.map((kyc) => (
                      <tr key={kyc.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium">
                              {kyc.user.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {kyc.user.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {kyc.user.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              kyc.user.role === "Doctor"
                                ? "bg-purple-100 text-purple-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {kyc.user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(kyc.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              kyc.status === "Approved"
                                ? "bg-green-100 text-green-800"
                                : kyc.status === "Rejected"
                                ? "bg-red-100 text-red-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {kyc.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {kyc.status === "In-Review" ? (
                            <button
                              onClick={() => openReviewModal(kyc)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              Review
                            </button>
                          ) : (
                            <button
                              onClick={() => openReviewModal(kyc)}
                              className="text-gray-600 hover:text-gray-900"
                            >
                              View Details
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing <span className="font-medium">{kycs.length}</span>{" "}
                      results
                      {pagination.totalCount > 0 && (
                        <>
                          {" "}
                          of{" "}
                          <span className="font-medium">
                            {pagination.totalCount}
                          </span>{" "}
                          total
                        </>
                      )}
                    </p>
                  </div>
                  <div>
                    <nav
                      className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                      aria-label="Pagination"
                    >
                      <button
                        onClick={() =>
                          handlePageChange(pagination.currentPage - 1)
                        }
                        disabled={pagination.currentPage === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="sr-only">Previous</span>
                        <svg
                          className="h-5 w-5"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>

                      
                      {[...Array(pagination.totalPages).keys()].map(
                        (number) => (
                          <button
                            key={number}
                            onClick={() => handlePageChange(number + 1)}
                            className={`relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium ${
                              pagination.currentPage === number + 1
                                ? "text-blue-600 bg-blue-50"
                                : "text-gray-700 hover:bg-gray-50"
                            }`}
                          >
                            {number + 1}
                          </button>
                        )
                      )}

                      <button
                        onClick={() =>
                          handlePageChange(pagination.currentPage + 1)
                        }
                        disabled={
                          pagination.currentPage === pagination.totalPages ||
                          pagination.totalPages === 0
                        }
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="sr-only">Next</span>
                        <svg
                          className="h-5 w-5"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      
      {reviewModalOpen && selectedKYC && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto"
          aria-labelledby="modal-title"
          role="dialog"
          aria-modal="true"
        >
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              aria-hidden="true"
              onClick={closeReviewModal}
            ></div>

            <span
              className="hidden sm:inline-block sm:align-middle sm:h-screen"
              aria-hidden="true"
            >
              &#8203;
            </span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    <h3
                      className="text-lg leading-6 font-medium text-gray-900"
                      id="modal-title"
                    >
                      {selectedKYC.status === "In-Review"
                        ? "Review KYC Submission"
                        : "KYC Submission Details"}
                    </h3>

                    <div className="mt-4 border-t border-gray-200 pt-4">
                      <div className="flex flex-col md:flex-row justify-between">
                        <div className="mb-4 md:mb-0">
                          <p className="text-sm text-gray-500 mb-2">
                            User Information
                          </p>
                          <div className="flex items-center">
                            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium text-xl">
                              {selectedKYC.user.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="ml-3">
                              <p className="text-sm font-medium text-gray-900">
                                {selectedKYC.user.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {selectedKYC.user.email}
                              </p>
                              <span
                                className={`mt-1 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  selectedKYC.user.role === "Doctor"
                                    ? "bg-purple-100 text-purple-800"
                                    : "bg-blue-100 text-blue-800"
                                }`}
                              >
                                {selectedKYC.user.role}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-500 mb-1">
                              Submitted
                            </p>
                            <p className="text-sm font-medium text-gray-900">
                              {formatDate(selectedKYC.created_at)}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500 mb-1">Status</p>
                            <span
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                selectedKYC.status === "Approved"
                                  ? "bg-green-100 text-green-800"
                                  : selectedKYC.status === "Rejected"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              {selectedKYC.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 border-t border-gray-200 pt-4">
                      <p className="text-sm font-medium text-gray-900 mb-2">
                        Documents
                      </p>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">
                            Citizenship Front
                          </p>
                          <img
                            src={getImageUrl(selectedKYC.citizenship_front)}
                            alt="Citizenship Front"
                            className="w-full h-48 object-contain bg-gray-50 rounded-md border border-gray-300"
                            onClick={() =>
                              window.open(
                                getImageUrl(selectedKYC.citizenship_front),
                                "_blank"
                              )
                            }
                            style={{ cursor: "pointer" }}
                          />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">
                            Citizenship Back
                          </p>
                          <img
                            src={getImageUrl(selectedKYC.citizenship_back)}
                            alt="Citizenship Back"
                            className="w-full h-48 object-contain bg-gray-50 rounded-md border border-gray-300"
                            onClick={() =>
                              window.open(
                                getImageUrl(selectedKYC.citizenship_back),
                                "_blank"
                              )
                            }
                            style={{ cursor: "pointer" }}
                          />
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-2 italic text-center">
                        Click on images to view in full size
                      </p>
                    </div>

                    <div className="mt-4 border-t border-gray-200 pt-4">
                      <p className="text-sm font-medium text-gray-900 mb-2">
                        Address Information
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">
                            Permanent Address
                          </p>
                          <div className="text-sm text-gray-700 p-3 bg-gray-50 rounded-md h-full">
                            {(() => {
                              try {
                                
                                const addressObj =
                                  typeof selectedKYC.permanent_address ===
                                  "string"
                                    ? JSON.parse(selectedKYC.permanent_address)
                                    : selectedKYC.permanent_address;

                                if (
                                  typeof addressObj === "object" &&
                                  addressObj !== null
                                ) {
                                  return (
                                    <div className="space-y-1">
                                      {addressObj.street && (
                                        <p>{addressObj.street}</p>
                                      )}
                                      {addressObj.city && (
                                        <p>
                                          {addressObj.city}
                                          {addressObj.state &&
                                            `, ${addressObj.state}`}
                                          {addressObj.postalCode &&
                                            ` ${addressObj.postalCode}`}
                                        </p>
                                      )}
                                      {addressObj.country && (
                                        <p>{addressObj.country}</p>
                                      )}
                                    </div>
                                  );
                                }
                                return selectedKYC.permanent_address;
                              } catch {
                                
                                return selectedKYC.permanent_address;
                              }
                            })()}
                          </div>
                        </div>

                        {selectedKYC.temporary_address && (
                          <div>
                            <p className="text-xs text-gray-500 mb-1">
                              Temporary Address
                            </p>
                            <div className="text-sm text-gray-700 p-3 bg-gray-50 rounded-md h-full">
                              {(() => {
                                try {
                                  
                                  const addressObj =
                                    typeof selectedKYC.temporary_address ===
                                    "string"
                                      ? JSON.parse(
                                          selectedKYC.temporary_address
                                        )
                                      : selectedKYC.temporary_address;

                                  if (
                                    typeof addressObj === "object" &&
                                    addressObj !== null
                                  ) {
                                    return (
                                      <div className="space-y-1">
                                        {addressObj.street && (
                                          <p>{addressObj.street}</p>
                                        )}
                                        {addressObj.city && (
                                          <p>
                                            {addressObj.city}
                                            {addressObj.state &&
                                              `, ${addressObj.state}`}
                                            {addressObj.postalCode &&
                                              ` ${addressObj.postalCode}`}
                                          </p>
                                        )}
                                        {addressObj.country && (
                                          <p>{addressObj.country}</p>
                                        )}
                                      </div>
                                    );
                                  }
                                  return selectedKYC.temporary_address;
                                } catch {
                                  
                                  return selectedKYC.temporary_address;
                                }
                              })()}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {selectedKYC.review_notes && (
                      <div className="mt-4 border-t border-gray-200 pt-4">
                        <p className="text-sm font-medium text-gray-900 mb-1">
                          Review Notes
                        </p>
                        <p className="text-sm text-gray-700 p-2 bg-gray-50 rounded-md">
                          {selectedKYC.review_notes}
                        </p>
                      </div>
                    )}

                    
                    {selectedKYC.status === "In-Review" && (
                      <form
                        onSubmit={handleReviewSubmit}
                        className="mt-4 border-t border-gray-200 pt-4"
                      >
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Decision
                          </label>
                          <div className="flex space-x-4">
                            <label className="inline-flex items-center">
                              <input
                                type="radio"
                                name="status"
                                value="Approved"
                                checked={reviewData.status === "Approved"}
                                onChange={handleReviewChange}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                              <span className="ml-2 text-sm text-gray-700">
                                Approve
                              </span>
                            </label>
                            <label className="inline-flex items-center">
                              <input
                                type="radio"
                                name="status"
                                value="Rejected"
                                checked={reviewData.status === "Rejected"}
                                onChange={handleReviewChange}
                                className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                              />
                              <span className="ml-2 text-sm text-gray-700">
                                Reject
                              </span>
                            </label>
                          </div>
                        </div>

                        <div className="mb-4">
                          <label
                            htmlFor="review_notes"
                            className="block text-sm font-medium text-gray-700 mb-1"
                          >
                            Notes{" "}
                            {reviewData.status === "Rejected" && (
                              <span className="text-red-500">*</span>
                            )}
                          </label>
                          <textarea
                            id="review_notes"
                            name="review_notes"
                            rows="3"
                            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                            placeholder={
                              reviewData.status === "Rejected"
                                ? "Please provide a reason for rejection"
                                : "Additional notes (optional)"
                            }
                            value={reviewData.review_notes}
                            onChange={handleReviewChange}
                            required={reviewData.status === "Rejected"}
                          ></textarea>
                        </div>
                      </form>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                {selectedKYC.status === "In-Review" ? (
                  <>
                    <button
                      type="button"
                      onClick={handleReviewSubmit}
                      disabled={
                        reviewLoading ||
                        (reviewData.status === "Rejected" &&
                          !reviewData.review_notes)
                      }
                      className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white sm:ml-3 sm:w-auto sm:text-sm
                        ${
                          reviewData.status === "Approved"
                            ? "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500"
                            : "bg-red-600 hover:bg-red-700 focus:ring-red-500"
                        } focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {reviewLoading ? (
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
                      ) : reviewData.status === "Approved" ? (
                        "Approve"
                      ) : (
                        "Reject"
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={closeReviewModal}
                      disabled={reviewLoading}
                      className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={closeReviewModal}
                    className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Close
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default KYCRequestsPage;
