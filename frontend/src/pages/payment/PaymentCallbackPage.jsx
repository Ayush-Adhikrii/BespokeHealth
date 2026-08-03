import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { format, parseISO } from "date-fns";
import Navbar from "../../components/home/Navbar";
import Footer from "../../components/home/Footer";
import { verifyKhaltiPayment } from "../../services/PaymentService";
import { getCookie, removeCookie } from "../../utils/cookie";

const PaymentCallbackPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("verifying");
  const [errorMessage, setErrorMessage] = useState("");
  const [result, setResult] = useState({});

  useEffect(() => {
    const pidx = searchParams.get("pidx");

    let stored = {};
    try {
      stored = JSON.parse(getCookie("bspokehealth_transaction") || "{}");
    } catch {
      stored = {};
    }

    if (!pidx) {
      setStatus("failed");
      setErrorMessage(
        "Missing payment reference from Khalti. If you completed a payment, please check My Appointments before trying again."
      );
      return;
    }

    const transactionId = stored.transaction_id || searchParams.get("purchase_order_id");

    verifyKhaltiPayment(pidx, transactionId)
      .then((data) => {
        setResult({
          appointment_id: data.appointment_id,
          appointment_date: data.appointment_date,
          appointment_time: data.appointment_time,
          doctor_name: stored.doctor_name,
        });
        setStatus("success");
        removeCookie("bspokehealth_transaction");
      })
      .catch((error) => {
        setStatus("failed");
        setErrorMessage(
          error.message || "Payment verification failed. Please contact support if you were charged."
        );
      });
  }, [searchParams]);

  const formatTime = (timeString) => {
    try {
      return format(parseISO(`2000-01-01T${timeString}`), "h:mm a");
    } catch {
      return timeString || "";
    }
  };

  const formatDate = (dateString) => {
    try {
      return format(parseISO(dateString), "MMMM d, yyyy");
    } catch {
      return dateString || "";
    }
  };

  const { appointment_id, appointment_date, appointment_time, doctor_name } = result;

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 pt-20 pb-10">
        <div className="max-w-md mx-auto px-4 py-12">
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="p-8 text-center">
              {status === "verifying" && (
                <>
                  <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
                  </div>
                  <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                    Verifying your payment...
                  </h2>
                  <p className="text-gray-600">
                    Please wait while we confirm your payment with Khalti.
                  </p>
                </>
              )}

              {status === "success" && (
                <>
                  <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                    <svg
                      className="h-10 w-10 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>

                  <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                    Payment Successful!
                  </h2>
                  <p className="text-gray-600 mb-6">
                    Your appointment has been confirmed.
                  </p>

                  <div className="mb-6 bg-gray-50 p-4 rounded-lg text-left space-y-3">
                    {appointment_id && (
                      <div>
                        <p className="text-sm text-gray-500">Appointment ID</p>
                        <p className="font-medium text-gray-800">#{appointment_id}</p>
                      </div>
                    )}
                    {doctor_name && (
                      <div>
                        <p className="text-sm text-gray-500">Doctor</p>
                        <p className="font-medium text-gray-800">Dr. {doctor_name}</p>
                      </div>
                    )}
                    {(appointment_date || appointment_time) && (
                      <div>
                        <p className="text-sm text-gray-500">Date &amp; Time</p>
                        <p className="font-medium text-gray-800">
                          {appointment_date && formatDate(appointment_date)}
                          {appointment_date && appointment_time && " at "}
                          {appointment_time && formatTime(appointment_time)}
                        </p>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => navigate("/dashboard")}
                    className="w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Go to Dashboard
                  </button>
                </>
              )}

              {status === "failed" && (
                <>
                  <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                    <svg
                      className="h-10 w-10 text-red-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </div>

                  <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                    Payment Not Confirmed
                  </h2>
                  <p className="text-gray-600 mb-6">{errorMessage}</p>

                  <button
                    onClick={() => navigate("/dashboard")}
                    className="w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Go to Dashboard
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default PaymentCallbackPage;
