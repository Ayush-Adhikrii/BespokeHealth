import { format } from "date-fns";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import AdminService from "../../services/AdminService";

const PaymentsPage = () => {
  
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterOptions, setFilterOptions] = useState({
    paymentMethods: [],
    statuses: [],
  });
  const [summary, setSummary] = useState({
    totalAmount: 0,
    totalRefunds: 0,
    netRevenue: 0,
    count: 0,
  });

  
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    hasNext: false,
    hasPrev: false,
  });

  
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    status: "",
    paymentMethod: "",
    minAmount: "",
    maxAmount: "",
  });

  
  const [sortConfig, setSortConfig] = useState({
    sortBy: "created_at",
    sortOrder: "desc",
  });

  
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [refundForm, setRefundForm] = useState({
    amount: "",
    reason: "",
  });

  
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportForm, setReportForm] = useState({
    startDate: format(new Date().setDate(1), "yyyy-MM-dd"), 
    endDate: format(new Date(), "yyyy-MM-dd"), 
    groupBy: "day",
  });
  const [reportData, setReportData] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);

  
  useEffect(() => {
    fetchPayments();
  }, [pagination.currentPage, sortConfig, filters]);

  
  const fetchPayments = async () => {
    try {
      setLoading(true);
      const data = await AdminService.getAllPayments(
        pagination.currentPage,
        20,
        filters,
        sortConfig.sortBy,
        sortConfig.sortOrder
      );

      setPayments(data.payments);
      setFilterOptions(data.filterOptions);
      setSummary(data.summary);
      setPagination(data.pagination);
    } catch (error) {
      toast.error(error.error || "Failed to load payments");
    } finally {
      setLoading(false);
    }
  };

  
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

  
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  
  const applyFilters = (e) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, currentPage: 1 })); 
    fetchPayments();
  };

  
  const resetFilters = () => {
    setFilters({
      startDate: "",
      endDate: "",
      status: "",
      paymentMethod: "",
      minAmount: "",
      maxAmount: "",
    });
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  
  const viewPaymentDetails = async (paymentId) => {
    try {
      setLoading(true);
      const data = await AdminService.getPaymentById(paymentId);
      setSelectedPayment(data.payment);
      setDetailModalOpen(true);
    } catch (error) {
      toast.error(error.error || "Failed to load payment details");
    } finally {
      setLoading(false);
    }
  };

  
  const openRefundModal = (payment) => {
    setSelectedPayment(payment);
    setRefundForm({
      amount: payment.amount,
      reason: "",
    });
    setRefundModalOpen(true);
  };

  
  const handleRefundInputChange = (e) => {
    const { name, value } = e.target;
    setRefundForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  
  const handleProcessRefund = async (e) => {
    e.preventDefault();

    if (!refundForm.amount || parseFloat(refundForm.amount) <= 0) {
      toast.error("Please enter a valid refund amount");
      return;
    }

    try {
      setLoading(true);
      await AdminService.processRefund(selectedPayment.id, refundForm);
      toast.success("Refund processed successfully");
      setRefundModalOpen(false);
      fetchPayments();
    } catch (error) {
      toast.error(error.error || "Failed to process refund");
    } finally {
      setLoading(false);
    }
  };

  
  const handleReportInputChange = (e) => {
    const { name, value } = e.target;
    setReportForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  
  const handleGenerateReport = async (e) => {
    e.preventDefault();

    if (!reportForm.startDate || !reportForm.endDate) {
      toast.error("Start date and end date are required");
      return;
    }

    try {
      setReportLoading(true);
      const data = await AdminService.generatePaymentReport(reportForm);
      setReportData(data);
    } catch (error) {
      toast.error(error.error || "Failed to generate report");
    } finally {
      setReportLoading(false);
    }
  };

  
  const formatCurrency = (amount, currency = "NPR") => {
    return `${currency} ${parseFloat(amount).toFixed(2)}`;
  };

  
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";

    try {
      return format(new Date(dateString), "MMM d, yyyy h:mm a");
    } catch (error) {
      return "Invalid Date";
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto p-4">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          Payment Management
        </h1>

        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-sm font-medium text-gray-500 mb-1">
              Total Revenue
            </p>
            <p className="text-2xl font-semibold text-blue-600">
              {formatCurrency(summary.totalAmount)}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-sm font-medium text-gray-500 mb-1">
              Total Refunds
            </p>
            <p className="text-2xl font-semibold text-red-600">
              {formatCurrency(summary.totalRefunds)}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-sm font-medium text-gray-500 mb-1">
              Net Revenue
            </p>
            <p className="text-2xl font-semibold text-green-600">
              {formatCurrency(summary.netRevenue)}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-sm font-medium text-gray-500 mb-1">
              Total Transactions
            </p>
            <p className="text-2xl font-semibold text-gray-600">
              {summary.count}
            </p>
          </div>
        </div>

        
        <div className="flex justify-end mb-6">
          <button
            onClick={() => setReportModalOpen(true)}
            className="ml-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none"
          >
            Generate Report
          </button>
        </div>

        
        <div className="bg-white p-4 rounded-lg shadow-md mb-6">
          <form onSubmit={applyFilters}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date Range
                </label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    name="startDate"
                    value={filters.startDate}
                    onChange={handleFilterChange}
                    className="w-full p-2 border border-gray-300 rounded"
                  />
                  <span className="self-center">to</span>
                  <input
                    type="date"
                    name="endDate"
                    value={filters.endDate}
                    onChange={handleFilterChange}
                    className="w-full p-2 border border-gray-300 rounded"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  name="status"
                  value={filters.status}
                  onChange={handleFilterChange}
                  className="w-full p-2 border border-gray-300 rounded"
                >
                  <option value="">All Statuses</option>
                  {filterOptions.statuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Method
                </label>
                <select
                  name="paymentMethod"
                  value={filters.paymentMethod}
                  onChange={handleFilterChange}
                  className="w-full p-2 border border-gray-300 rounded"
                >
                  <option value="">All Methods</option>
                  {filterOptions.paymentMethods.map((method) => (
                    <option key={method} value={method}>
                      {method}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount Range
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    name="minAmount"
                    placeholder="Min"
                    value={filters.minAmount}
                    onChange={handleFilterChange}
                    className="w-full p-2 border border-gray-300 rounded"
                  />
                  <span className="self-center">to</span>
                  <input
                    type="number"
                    name="maxAmount"
                    placeholder="Max"
                    value={filters.maxAmount}
                    onChange={handleFilterChange}
                    className="w-full p-2 border border-gray-300 rounded"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={resetFilters}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded hover:bg-gray-100 mr-2"
              >
                Reset
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Apply Filters
              </button>
            </div>
          </form>
        </div>

        
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {loading && payments.length === 0 ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
            </div>
          ) : payments.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-gray-500">
                No payments found matching your criteria.
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
                      onClick={() => handleSort("id")}
                    >
                      <div className="flex items-center">
                        ID
                        {sortConfig.sortBy === "id" && (
                          <span className="ml-1">
                            {sortConfig.sortOrder === "asc" ? "↑" : "↓"}
                          </span>
                        )}
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort("created_at")}
                    >
                      <div className="flex items-center">
                        Date
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
                      Patient / Doctor
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort("amount")}
                    >
                      <div className="flex items-center">
                        Amount
                        {sortConfig.sortBy === "amount" && (
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
                      Method
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Status
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
                  {payments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          #{payment.id}
                        </div>
                        <div className="text-xs text-gray-500">
                          {payment.transactionId
                            ? `${payment.transactionId.substring(0, 12)}...`
                            : "N/A"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatDate(payment.createdAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {payment.appointment.patientName}
                        </div>
                        <div className="text-xs text-gray-500">
                          Dr. {payment.appointment.doctorName} (
                          {payment.appointment.speciality})
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(payment.amount, payment.currency)}
                        </div>
                        {payment.refundAmount && (
                          <div className="text-xs text-red-500">
                            Refund:{" "}
                            {formatCurrency(
                              payment.refundAmount,
                              payment.currency
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {payment.paymentMethod}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            payment.status === "completed"
                              ? "bg-green-100 text-green-800"
                              : payment.status === "refunded"
                              ? "bg-amber-100 text-amber-800"
                              : payment.status === "failed"
                              ? "bg-red-100 text-red-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {payment.status.charAt(0).toUpperCase() +
                            payment.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => viewPaymentDetails(payment.id)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          View
                        </button>
                        {payment.status === "completed" && (
                          <button
                            onClick={() => openRefundModal(payment)}
                            className="text-amber-600 hover:text-amber-900"
                          >
                            Refund
                          </button>
                        )}
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
                    {(pagination.currentPage - 1) * 20 + 1}
                  </span>{" "}
                  to{" "}
                  <span className="font-medium">
                    {Math.min(
                      pagination.currentPage * 20,
                      pagination.totalItems
                    )}
                  </span>{" "}
                  of{" "}
                  <span className="font-medium">{pagination.totalItems}</span>{" "}
                  payments
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

      
      {detailModalOpen && selectedPayment && (
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
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
              <div className="bg-white p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Payment Details #{selectedPayment.id}
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">
                      Payment Information
                    </h4>
                    <div className="bg-gray-50 p-4 rounded-md">
                      <div className="mb-3">
                        <span className="text-xs text-gray-500 block">
                          Transaction ID
                        </span>
                        <span className="text-sm text-gray-900">
                          {selectedPayment.transaction_id}
                        </span>
                      </div>
                      <div className="mb-3">
                        <span className="text-xs text-gray-500 block">
                          Amount
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                          {formatCurrency(
                            selectedPayment.amount,
                            selectedPayment.currency
                          )}
                        </span>
                      </div>
                      <div className="mb-3">
                        <span className="text-xs text-gray-500 block">
                          Status
                        </span>
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            selectedPayment.status === "completed"
                              ? "bg-green-100 text-green-800"
                              : selectedPayment.status === "refunded"
                              ? "bg-amber-100 text-amber-800"
                              : selectedPayment.status === "failed"
                              ? "bg-red-100 text-red-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {selectedPayment.status.charAt(0).toUpperCase() +
                            selectedPayment.status.slice(1)}
                        </span>
                      </div>
                      <div className="mb-3">
                        <span className="text-xs text-gray-500 block">
                          Payment Method
                        </span>
                        <span className="text-sm text-gray-900">
                          {selectedPayment.payment_method}
                        </span>
                      </div>
                      <div className="mb-3">
                        <span className="text-xs text-gray-500 block">
                          Date
                        </span>
                        <span className="text-sm text-gray-900">
                          {formatDate(selectedPayment.created_at)}
                        </span>
                      </div>

                      {selectedPayment.refund_amount && (
                        <>
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <span className="text-xs font-medium text-gray-500 block">
                              Refund Information
                            </span>
                            <div className="mt-2">
                              <div className="mb-2">
                                <span className="text-xs text-gray-500 block">
                                  Refund Amount
                                </span>
                                <span className="text-sm text-red-600 font-medium">
                                  {formatCurrency(
                                    selectedPayment.refund_amount,
                                    selectedPayment.currency
                                  )}
                                </span>
                              </div>
                              <div className="mb-2">
                                <span className="text-xs text-gray-500 block">
                                  Refund Reason
                                </span>
                                <span className="text-sm text-gray-900">
                                  {selectedPayment.refund_reason}
                                </span>
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">
                      Appointment Information
                    </h4>
                    <div className="bg-gray-50 p-4 rounded-md">
                      <div className="mb-3">
                        <span className="text-xs text-gray-500 block">
                          Appointment ID
                        </span>
                        <span className="text-sm text-gray-900">
                          #{selectedPayment.appointment.id}
                        </span>
                      </div>
                      <div className="mb-3">
                        <span className="text-xs text-gray-500 block">
                          Patient
                        </span>
                        <span className="text-sm text-gray-900">
                          {selectedPayment.appointment.patient?.user?.name ||
                            "N/A"}
                        </span>
                      </div>
                      <div className="mb-3">
                        <span className="text-xs text-gray-500 block">
                          Doctor
                        </span>
                        <span className="text-sm text-gray-900">
                          Dr.{" "}
                          {selectedPayment.appointment.doctor?.user?.name ||
                            "N/A"}
                        </span>
                      </div>
                      <div className="mb-3">
                        <span className="text-xs text-gray-500 block">
                          Speciality
                        </span>
                        <span className="text-sm text-gray-900">
                          {selectedPayment.appointment.doctor?.speciality ||
                            "N/A"}
                        </span>
                      </div>
                      {selectedPayment.appointment.time_slot && (
                        <div className="mb-3">
                          <span className="text-xs text-gray-500 block">
                            Appointment Time
                          </span>
                          <span className="text-sm text-gray-900">
                            {formatDate(
                              selectedPayment.appointment.time_slot.start_time
                            )}{" "}
                            -{" "}
                            {format(
                              new Date(
                                selectedPayment.appointment.time_slot.end_time
                              ),
                              "h:mm a"
                            )}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {selectedPayment.metadata && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-500 mb-2">
                      Payment Metadata
                    </h4>
                    <div className="bg-gray-50 p-4 rounded-md overflow-x-auto">
                      <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                        {typeof selectedPayment.metadata === "string"
                          ? JSON.stringify(
                              JSON.parse(selectedPayment.metadata),
                              null,
                              2
                            )
                          : JSON.stringify(selectedPayment.metadata, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                {selectedPayment.status === "completed" && (
                  <button
                    onClick={() => {
                      setDetailModalOpen(false);
                      openRefundModal(selectedPayment);
                    }}
                    type="button"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-amber-600 text-base font-medium text-white hover:bg-amber-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Process Refund
                  </button>
                )}
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

      
      {refundModalOpen && selectedPayment && (
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
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleProcessRefund}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-amber-100 sm:mx-0 sm:h-10 sm:w-10">
                      <svg
                        className="h-6 w-6 text-amber-600"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                      <h3
                        className="text-lg leading-6 font-medium text-gray-900"
                        id="modal-headline"
                      >
                        Process Refund
                      </h3>
                      <div className="mt-4 space-y-4">
                        <div>
                          <label
                            htmlFor="amount"
                            className="block text-sm font-medium text-gray-700"
                          >
                            Refund Amount
                          </label>
                          <div className="mt-1 relative rounded-md shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <span className="text-gray-500 sm:text-sm">
                                {selectedPayment.currency}
                              </span>
                            </div>
                            <input
                              type="number"
                              name="amount"
                              id="amount"
                              min="0.01"
                              max={selectedPayment.amount}
                              step="0.01"
                              required
                              value={refundForm.amount}
                              onChange={handleRefundInputChange}
                              className="mt-1 block w-full pl-12 pr-12 border border-gray-300 rounded-md py-2 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            />
                          </div>
                          <p className="mt-1 text-xs text-gray-500">
                            Maximum refund amount:{" "}
                            {formatCurrency(
                              selectedPayment.amount,
                              selectedPayment.currency
                            )}
                          </p>
                        </div>

                        <div>
                          <label
                            htmlFor="reason"
                            className="block text-sm font-medium text-gray-700"
                          >
                            Reason for Refund
                          </label>
                          <textarea
                            name="reason"
                            id="reason"
                            rows={3}
                            required
                            value={refundForm.reason}
                            onChange={handleRefundInputChange}
                            placeholder="Please provide a reason for this refund"
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
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-amber-600 text-base font-medium text-white hover:bg-amber-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm"
                    disabled={loading}
                  >
                    {loading ? "Processing..." : "Process Refund"}
                  </button>
                  <button
                    onClick={() => setRefundModalOpen(false)}
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

      
      {reportModalOpen && (
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
                    Payment Report
                  </h3>
                  <button
                    onClick={() => {
                      setReportModalOpen(false);
                      setReportData(null);
                    }}
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

                <form onSubmit={handleGenerateReport} className="mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Start Date
                      </label>
                      <input
                        type="date"
                        name="startDate"
                        value={reportForm.startDate}
                        onChange={handleReportInputChange}
                        required
                        className="w-full p-2 border border-gray-300 rounded"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        End Date
                      </label>
                      <input
                        type="date"
                        name="endDate"
                        value={reportForm.endDate}
                        onChange={handleReportInputChange}
                        required
                        className="w-full p-2 border border-gray-300 rounded"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Group By
                      </label>
                      <select
                        name="groupBy"
                        value={reportForm.groupBy}
                        onChange={handleReportInputChange}
                        className="w-full p-2 border border-gray-300 rounded"
                      >
                        <option value="day">Day</option>
                        <option value="month">Month</option>
                        <option value="year">Year</option>
                      </select>
                    </div>
                  </div>

                  <div className="mt-4 flex justify-end">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                      disabled={reportLoading}
                    >
                      {reportLoading ? (
                        <span className="flex items-center">
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
                          Generating...
                        </span>
                      ) : (
                        "Generate Report"
                      )}
                    </button>
                  </div>
                </form>

                {reportData && (
                  <div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm font-medium text-gray-500 mb-1">
                          Total Payments
                        </p>
                        <p className="text-2xl font-semibold text-blue-600">
                          {reportData.summary.totalPayments}
                        </p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm font-medium text-gray-500 mb-1">
                          Total Amount
                        </p>
                        <p className="text-2xl font-semibold text-green-600">
                          {formatCurrency(reportData.summary.totalAmount)}
                        </p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm font-medium text-gray-500 mb-1">
                          Total Refunds
                        </p>
                        <p className="text-2xl font-semibold text-red-600">
                          {formatCurrency(reportData.summary.totalRefunds)}
                        </p>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Date
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Transactions
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Amount
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Refunds
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Net
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {reportData.report.map((item) => (
                            <tr key={item.date} className="hover:bg-gray-50">
                              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                                {item.date}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-gray-500">
                                {item.count}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-green-600">
                                {formatCurrency(item.totalAmount)}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-red-600">
                                {formatCurrency(item.refundAmount)}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                                {formatCurrency(item.netAmount)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    
                  </div>
                )}
              </div>

              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  onClick={() => {
                    setReportModalOpen(false);
                    setReportData(null);
                  }}
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
    </DashboardLayout>
  );
};

export default PaymentsPage;
