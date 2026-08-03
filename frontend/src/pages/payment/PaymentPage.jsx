import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { initiateKhaltiPayment } from "../../services/PaymentService";
import { setCookie } from "../../utils/cookie";
import Navbar from "../../components/home/Navbar";
import Footer from "../../components/home/Footer";
import { format, parseISO } from "date-fns";

const PaymentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    appointment_id,
    doctor_name,
    appointment_date,
    appointment_time,
    payment_amount,
    payment_id,
  } = location.state || {};

  const storeTransactionInfo = (transactionId) => {
    setCookie("bspokehealth_transaction", JSON.stringify({
      appointment_id,
      transaction_id: transactionId,
      payment_id,
      doctor_name,
      appointment_date,
      appointment_time,
    }), 1);
  };

  const handleKhaltiPayment = async () => {
    try {
      setLoading(true);
      setShowConfirm(false);
      const response = await initiateKhaltiPayment(payment_id);
      storeTransactionInfo(response.transaction_id);
      window.location.href = response.payment_url;
    } catch (error) {
      toast.error(error.error || "Failed to initiate payment");
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!payment_id || !appointment_id) {
      toast.error("Missing payment information");
      navigate("/dashboard");
    }
  }, [payment_id, appointment_id, navigate]);

  const formatTime = (timeString) => {
    try {
      const time = parseISO(`2000-01-01T${timeString}`);
      return format(time, "h:mm a");
    } catch {
      return timeString;
    }
  };

  if (!payment_id || !appointment_id) return null;

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 pt-20 pb-10">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="p-6 bg-blue-600 text-white">
              <h1 className="text-2xl font-bold">Complete Your Payment</h1>
              <p className="text-blue-100 mt-1">
                Review your appointment and confirm payment
              </p>
            </div>

            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Appointment Summary
              </h2>
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Doctor:</span>
                    <span className="font-medium text-gray-800">
                      Dr. {doctor_name}
                    </span>
                  </div>
                  {appointment_date && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Date:</span>
                      <span className="font-medium text-gray-800">
                        {format(parseISO(appointment_date), "EEEE, MMMM d, yyyy")}
                      </span>
                    </div>
                  )}
                  {appointment_time && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Time:</span>
                      <span className="font-medium text-gray-800">
                        {formatTime(appointment_time)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-gray-200">
                    <span className="text-gray-600">Total Amount:</span>
                    <span className="font-semibold text-lg text-blue-600">
                      NPR {payment_amount}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Select Payment Method</h2>
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="flex items-center">
                  <input id="khalti" name="payment_method" type="radio" checked={true} readOnly className="h-4 w-4 text-blue-600 focus:ring-blue-500" />
                  <label htmlFor="khalti" className="ml-3 flex items-center">
                    <img src="https://khalti.com/static/images/khalti-logo.svg" alt="Khalti" className="h-8 mr-2" />
                    <span className="text-gray-800">Pay with Khalti</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="p-6 bg-gray-50">
              <div className="space-y-4">
                <button
                  onClick={() => setShowConfirm(true)}
                  disabled={loading}
                  className="w-full px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-400 flex items-center justify-center font-medium"
                >
                  {loading ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                      Processing...
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-5 h-5 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                        />
                      </svg>
                      Confirm &amp; Pay NPR {payment_amount}
                    </>
                  )}
                </button>

                <div className="flex items-center justify-center text-sm text-gray-500">
                  <svg
                    className="h-5 w-5 text-gray-400 mr-1.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                  Your payment is secure and encrypted
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full mx-4 p-6">
            <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mx-auto mb-4">
              <svg
                className="w-6 h-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>

            <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
              Confirm Payment
            </h3>
            <p className="text-gray-600 text-center text-sm mb-1">
              Are you sure you want to pay
            </p>
            <p className="text-2xl font-bold text-blue-600 text-center mb-1">
              NPR {payment_amount}
            </p>
            <p className="text-gray-500 text-center text-sm mb-6">
              for your appointment with Dr. {doctor_name}?
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleKhaltiPayment}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Yes, Pay Now
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
};

export default PaymentPage;
