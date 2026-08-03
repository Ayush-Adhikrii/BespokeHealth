import { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import { getKYCStatus } from "../services/KycService";
import DashboardLayout from "../components/layouts/DashboardLayout";

const KYCStatusPage = () => {
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [kycData, setKycData] = useState(null);
  const [error, setError] = useState("");
  
  
  const successMessage = location.state?.message || "";

  useEffect(() => {
    const fetchKYCStatus = async () => {
      try {
        setLoading(true);
        const data = await getKYCStatus();
        setKycData(data);
      } catch (err) {
        setError(err.error || "Failed to retrieve KYC status");
      } finally {
        setLoading(false);
      }
    };

    fetchKYCStatus();
  }, []);

  
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">KYC Verification Status</h1>
        
        {successMessage && (
          <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded-md animate-fadeIn">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700">{successMessage}</p>
              </div>
            </div>
          </div>
        )}
        
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}
        
        {loading ? (
          <div className="bg-white shadow-md rounded-lg p-8 text-center">
            <svg className="animate-spin h-10 w-10 text-blue-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
            </svg>
            <p className="text-gray-600">Loading KYC status...</p>
          </div>
        ) : (
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            
            <div className={`p-6 ${getStatusColorClass(kycData?.status).bg}`}>
              <div className="flex items-center">
                {getStatusIcon(kycData?.status)}
                <div className="ml-4">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Status: {kycData?.status || "Not Submitted"}
                  </h2>
                  {kycData?.status === "In-Review" && (
                    <p className="text-sm text-gray-600">
                      Your verification is in progress. This typically takes 1-2 business days.
                    </p>
                  )}
                  {kycData?.status === "Approved" && (
                    <p className="text-sm text-gray-600">
                      Your identity has been verified. You now have full access to all features.
                    </p>
                  )}
                  {kycData?.status === "Rejected" && (
                    <p className="text-sm text-gray-600">
                      Unfortunately, your verification was not approved. Please check the feedback below.
                    </p>
                  )}
                  {kycData?.status === "Not Submitted" && (
                    <p className="text-sm text-gray-600">
                      You haven't submitted your KYC information yet.
                    </p>
                  )}
                </div>
              </div>
            </div>
            
            
            {kycData?.status && kycData.status !== "Not Submitted" && (
              <div className="p-6 border-t border-gray-200">
                <h3 className="text-md font-medium text-gray-900 mb-4">Verification Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Submitted On:</p>
                    <p className="text-sm font-medium text-gray-900">{formatDate(kycData.submitted_at)}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500">Last Updated:</p>
                    <p className="text-sm font-medium text-gray-900">{formatDate(kycData.updated_at)}</p>
                  </div>
                  
                  {kycData.status === "Rejected" && kycData.review_notes && (
                    <div className="col-span-2 mt-2">
                      <p className="text-sm text-gray-500">Rejection Reason:</p>
                      <div className="mt-1 p-3 bg-red-50 text-sm text-red-700 rounded-md">
                        {kycData.review_notes}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            
            <div className="p-6 bg-gray-50 border-t border-gray-200">
              {kycData?.status === "Not Submitted" && (
                <Link
                  to="/dashboard/kyc-submission"
                  className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Submit KYC Information
                </Link>
              )}
              
              {kycData?.status === "Rejected" && (
                <Link
                  to="/dashboard/kyc-submission"
                  className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Update and Resubmit
                </Link>
              )}
              
              {kycData?.status === "In-Review" && (
                <div className="text-sm text-gray-600">
                  <p>Your verification is currently being reviewed. You'll be notified when the process is complete.</p>
                </div>
              )}
              
              {kycData?.status === "Approved" && (
                <div className="text-sm text-green-700">
                  <p>Your account is fully verified. You have access to all platform features.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};


const getStatusColorClass = (status) => {
  switch (status) {
    case "Approved":
      return { bg: "bg-green-50", text: "text-green-800", icon: "text-green-500" };
    case "Rejected":
      return { bg: "bg-red-50", text: "text-red-800", icon: "text-red-500" };
    case "In-Review":
      return { bg: "bg-yellow-50", text: "text-yellow-800", icon: "text-yellow-500" };
    default:
      return { bg: "bg-gray-50", text: "text-gray-800", icon: "text-gray-500" };
  }
};

const getStatusIcon = (status) => {
  switch (status) {
    case "Approved":
      return (
        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
          <svg className="w-6 h-6 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      );
    case "Rejected":
      return (
        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
          <svg className="w-6 h-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
      );
    case "In-Review":
      return (
        <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
          <svg className="w-6 h-6 text-yellow-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      );
    default:
      return (
        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
          <svg className="w-6 h-6 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
      );
  }
};

export default KYCStatusPage;