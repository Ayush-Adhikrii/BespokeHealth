
import axios from "axios";
import { createContext, useContext, useEffect, useState } from "react";
import { getOrCreateDeviceId } from "../utils/deviceFingerprint";
import { setCookie, getCookie, removeCookie, clearAllLocalStorage, clearAllSessionStorage } from "../utils/cookie";

const API_URL = import.meta.env.VITE_API_URL || "https://localhost:3000/api";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = getCookie("token");
    const userData = getCookie("user");

    if (token && userData) {
      try {
        setUser(JSON.parse(userData));
        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      } catch {
        logout();
      }
    }

    setLoading(false);
  }, []);

  const sendOtp = async (email) => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.post(`${API_URL}/auth/send-otp`, { email });
      return res.data;
    } catch (err) {
      throw new Error(err?.response?.data?.error || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const verifyEmail = async (email, otp, deviceId) => {
    try {
      setLoading(true);
      setError(null);
      if (!deviceId) {
        throw new Error("Device ID is required for verification");
      }
      const res = await axios.post(
        `${API_URL}/auth/verify-email`,
        { email, otp },
        { headers: { "x-temp-device-id": deviceId } }
      );
      return res.data;
    } catch (err) {
      throw new Error(err?.response?.data?.error || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const signup = async (data) => {
    try {
      setLoading(true);
      setError(null);
      const isFormData = data instanceof FormData;
      const res = await axios.post(`${API_URL}/auth/signup`, data, {
        headers: isFormData ? { "Content-Type": "multipart/form-data" } : undefined,
      });
      return res.data;
    } catch (err) {
      const details = err.response?.data?.details || null;
      throw new Error(
        `${err.response?.data?.error || "Signup failed"}${details ? `: ${JSON.stringify(details)}` : ""}`
      );
    } finally {
      setLoading(false);
    }
  };

  const login = async ({ email, password, deviceId }, rememberMe) => {
    try {
      setLoading(true);
      setError(null);
      if (!deviceId) {
        throw new Error("Device ID is required");
      }
      const res = await axios.post(`${API_URL}/auth/login`, {
        email,
        password,
        deviceId,
        rememberMe,
      });

      const { token, role, kyc_status, requiresOtp, email: responseEmail, remainingAttempts } = res.data;

      if (requiresOtp) {
        return { requiresOtp: true, email: responseEmail, remainingAttempts };
      }

      setCookie("token", token, rememberMe ? 30 : 1);
      setCookie("user", JSON.stringify({ role, kyc_status }), rememberMe ? 30 : 1);
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      setUser({ role, kyc_status });
      return { requiresOtp: false, user: { role, kyc_status }, remainingAttempts };
    } catch (err) {
      throw new Error(
        JSON.stringify({
          error: err?.response?.data?.error || "Login failed",
          remainingAttempts: err?.response?.data?.remainingAttempts,
        })
      );
    } finally {
      setLoading(false);
    }
  };

  const updateUser = (updatedFields) => {
    setUser((prev) => {
      const next = { ...prev, ...updatedFields };
      setCookie("user", JSON.stringify(next), 30);
      return next;
    });
  };

  const logout = () => {
    removeCookie("token");
    removeCookie("user");
    delete axios.defaults.headers.common["Authorization"];
    setUser(null);

    clearAllLocalStorage();
    clearAllSessionStorage();
  };

  const forgotPassword = async (email) => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.post(`${API_URL}/auth/forgot-password`, { email });
      return res.data;
    } catch (err) {
      throw new Error(err?.response?.data?.error || "Password reset failed");
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async (token, newPassword) => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.post(`${API_URL}/auth/set-new-password`, {
        token,
        newPassword,
      });
      return res.data;
    } catch (err) {
      throw new Error(err?.response?.data?.error || "Change password failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        sendOtp,
        signup,
        verifyEmail,
        login,
        logout,
        updateUser,
        forgotPassword,
        changePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
