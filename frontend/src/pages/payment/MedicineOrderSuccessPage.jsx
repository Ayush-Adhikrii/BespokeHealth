import { useNavigate, useLocation } from "react-router-dom";
import DashboardLayout from "../../components/layouts/DashboardLayout";

const MedicineOrderSuccessPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const { order_id, total_amount } = location.state || {};

  return (
    <DashboardLayout>
      <div className="max-w-md mx-auto px-4 py-12">
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="p-8 text-center">
            <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <svg className="h-10 w-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <h2 className="text-2xl font-semibold text-gray-800 mb-2">Order Placed!</h2>
            <p className="text-gray-600 mb-6">Your medicine order has been confirmed.</p>

            <div className="mb-6 bg-gray-50 p-4 rounded-lg text-left space-y-3">
              {order_id && (
                <div>
                  <p className="text-sm text-gray-500">Order ID</p>
                  <p className="font-medium text-gray-800">#{order_id}</p>
                </div>
              )}
              {total_amount && (
                <div>
                  <p className="text-sm text-gray-500">Amount Paid</p>
                  <p className="font-medium text-gray-800">Rs. {total_amount}</p>
                </div>
              )}
            </div>

            <button
              onClick={() => navigate("/dashboard")}
              className="w-full px-6 py-3 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default MedicineOrderSuccessPage;
