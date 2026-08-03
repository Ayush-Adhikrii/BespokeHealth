
import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getOrCreateDeviceId } from "../utils/deviceFingerprint";
import { getAppointmentData, clearAppointmentData } from "../utils/cookie";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [formError, setFormError] = useState("");
  const [showOtpForm, setShowOtpForm] = useState(false);
  const [deviceId, setDeviceId] = useState("");
  const [isDeviceIdReady, setIsDeviceIdReady] = useState(false);
  const [remainingAttempts, setRemainingAttempts] = useState(5);
  const [lockoutMessage, setLockoutMessage] = useState("");
  const { login, sendOtp, verifyEmail, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const deviceId = getOrCreateDeviceId();
    setDeviceId(deviceId);
    setIsDeviceIdReady(true);
  }, []);

  const ensureDeviceId = () => {
    let currentDeviceId = deviceId;
    if (!currentDeviceId) {
      currentDeviceId = getOrCreateDeviceId();
    }
    setDeviceId(currentDeviceId);
    return currentDeviceId;
  };

  const handleSuccessfulLogin = () => {
    const appointmentData = getAppointmentData();
    
    if (appointmentData.doctorId) {
      clearAppointmentData();
      navigate(`/appointment/book/${appointmentData.doctorId}`, { replace: true });
    } else if (location.state?.from) {
      navigate(location.state.from, { replace: true });
    } else {
      navigate("/dashboard", { replace: true });
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setLockoutMessage("");

    if (!email.trim() || !password.trim()) {
      setFormError("Please fill in all fields");
      return;
    }

    if (!isDeviceIdReady) {
      setFormError("Device ID not ready. Please refresh and try again.");
      return;
    }

    const currentDeviceId = ensureDeviceId();
    if (!currentDeviceId) {
      setFormError("Failed to generate device ID. Please refresh and try again.");
      return;
    }

    try {
      const response = await login({ email, password, deviceId: currentDeviceId }, rememberMe);

      if (response.requiresOtp) {
        setShowOtpForm(true);
      } else {
        handleSuccessfulLogin();
      }

      if (response.remainingAttempts !== undefined) {
        setRemainingAttempts(response.remainingAttempts);
      }
    } catch (err) {
      let errorData;
      try {
        errorData = JSON.parse(err.message);
      } catch {
        errorData = { error: err.message };
      }
      const errorMessage = errorData.error || "Login failed. Please try again.";
      if (errorData.remainingAttempts !== undefined) {
        setRemainingAttempts(errorData.remainingAttempts);
        if (errorData.remainingAttempts > 0) {
          setFormError(`Wrong password, ${errorData.remainingAttempts} attempt${errorData.remainingAttempts !== 1 ? "s" : ""} left`);
        }
      }
      if (errorMessage.includes("Account is locked") || errorMessage.includes("Account locked")) {
        setLockoutMessage("Account locked, try again later in a while");
        setRemainingAttempts(0);
      } else if (!errorData.remainingAttempts) {
        setFormError(errorMessage);
      }
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setLockoutMessage("");

    if (!otp.trim()) {
      setFormError("Please enter the OTP");
      return;
    }

    if (!isDeviceIdReady) {
      setFormError("Device ID not ready. Please refresh and try again.");
      return;
    }

    const currentDeviceId = ensureDeviceId();
    if (!currentDeviceId) {
      setFormError("Failed to generate device ID. Please refresh and try again.");
      return;
    }

    try {
      await verifyEmail(email, otp, currentDeviceId);
      setRemainingAttempts(5);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const response = await login({ email, password, deviceId: currentDeviceId }, rememberMe);

      if (!response.requiresOtp) {
        handleSuccessfulLogin();
      } else {
        setFormError("Unexpected OTP requirement after verification. Please try again.");
        setShowOtpForm(false);
      }
    } catch (err) {
      setFormError(err.message || "OTP verification failed. Please check the OTP and try again.");
    }
  };

  const handleResendOtp = async () => {
    setFormError("");
    setLockoutMessage("");
    try {
      await sendOtp(email);
      setFormError("OTP resent to your email.");
    } catch (err) {
      setFormError(err.message || "Failed to resend OTP. Please try again.");
    }
  };

  if (!isDeviceIdReady) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  const isLocked = lockoutMessage.includes("Account locked");

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-6xl flex flex-col lg:flex-row bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="lg:w-1/2 bg-gradient-to-br from-blue-500 to-indigo-600 p-8 lg:p-12 flex flex-col justify-between text-white hidden lg:flex">
          <div>
            <div className="flex items-center space-x-2 mb-12">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              <h1 className="text-2xl font-bold">Bespoke Health</h1>
            </div>
            <h2 className="text-3xl font-bold mb-6">
              Welcome back to Bespoke Healthcare
            </h2>
          </div>
        </div>

        <div className="lg:w-1/2 p-8 sm:p-12">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {showOtpForm ? "Verify OTP" : "Sign in"}
            </h2>
            <div className="lg:hidden flex items-center text-blue-600">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              <span className="font-bold">Bespoke Health</span>
            </div>
          </div>

          {(formError || lockoutMessage) && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-md animate-fadeIn">
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
                  <p className="text-sm text-red-700">{lockoutMessage || formError}</p>
                </div>
              </div>
            </div>
          )}

          {!showOtpForm && (
            <>
              <div className="space-y-2 mb-8">
                <p className="text-gray-600">Don't have an account?</p>
                <Link
                  to="/signup"
                  className="block w-full py-3 px-4 border border-blue-600 text-blue-600 font-medium rounded-lg text-center hover:bg-blue-50 transition-colors duration-300"
                >
                  Create an account
                </Link>
              </div>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">
                    or continue with email
                  </span>
                </div>
              </div>

              <form className="space-y-6" onSubmit={handleLoginSubmit}>
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Email address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    disabled={isLocked}
                    className={`appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-300 ${isLocked ? "opacity-50 cursor-not-allowed" : ""}`}
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label
                      htmlFor="password"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Password
                    </label>
                    <Link
                      to="/forgot-password"
                      className="text-sm font-medium text-blue-600 hover:text-blue-500"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    disabled={isLocked}
                    className={`appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-300 ${isLocked ? "opacity-50 cursor-not-allowed" : ""}`}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    disabled={isLocked}
                    className={`h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded ${isLocked ? "opacity-50 cursor-not-allowed" : ""}`}
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <label
                    htmlFor="remember-me"
                    className="ml-2 block text-sm text-gray-800"
                  >
                    Remember me
                  </label>
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={loading || !isDeviceIdReady || isLocked}
                    className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors duration-300 ${isLocked ? "cursor-not-allowed" : ""}`}
                  >
                    {loading ? (
                      <span className="flex items-center">
                        <svg
                          className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
                        Signing in...
                      </span>
                    ) : (
                      "Sign in"
                    )}
                  </button>
                </div>
              </form>
            </>
          )}

          {showOtpForm && (
            <form className="space-y-6" onSubmit={handleOtpSubmit}>
              <div>
                <label
                  htmlFor="otp"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Enter OTP
                </label>
                <input
                  id="otp"
                  name="otp"
                  type="text"
                  required
                  className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-300"
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                />
              </div>

              <div className="flex justify-between items-center">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={loading}
                  className="text-sm font-medium text-blue-600 hover:text-blue-500 disabled:opacity-50"
                >
                  Resend OTP
                </button>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading || !isDeviceIdReady}
                  className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors duration-300"
                >
                  {loading ? (
                    <span className="flex items-center">
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
                      Verifying...
                    </span>
                  ) : (
                    "Verify OTP"
                  )}
                </button>
              </div>
            </form>
          )}

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              By signing in, you agree to our{" "}
              <a href="#" className="underline">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="#" className="underline">
                Privacy Policy
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;