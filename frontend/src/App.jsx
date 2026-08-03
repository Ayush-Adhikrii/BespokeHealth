import React from "react";
import { Navigate, Route, BrowserRouter as Router, Routes } from "react-router-dom";
import { Toaster } from "sonner";
import DashboardRouter from "./components/routers/DashboardRouter";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import ActivityLogPage from "./pages/admin/ActivityLogPage";
import AdminReviewsPage from "./pages/admin/AdminReviewsPage";
import CustomersPage from "./pages/admin/CustomersPage";
import DoctorsManagementPage from "./pages/admin/DoctorsManagementPage";
import KYCRequestsPage from "./pages/admin/KYCRequestsPage";
import MedicineManagementPage from "./pages/admin/MedicineManagementPage";
import MedicineOrdersManagementPage from "./pages/admin/MedicineOrdersManagementPage";
import PaymentsPage from "./pages/admin/PaymentsPage";
import SystemAnalyticsPage from "./pages/admin/SystemAnalyticsPage";
import AppointmentConfirmPage from "./pages/appointment/AppointmentConfirmPage";
import TimeSlotSelectionPage from "./pages/appointment/TimeSlotSelectionPage";
import BookAppointmentPage from "./pages/appointments/BookAppointmentPage";
import MyAppointmentsPage from "./pages/appointments/MyAppointmentsPage";
import AdminDashboard from "./pages/dashboards/AdminDashboard";
import DoctorDashboard from "./pages/dashboards/DoctorDashboard";
import PatientDashboard from "./pages/dashboards/PatientDashboard";
import DoctorConsultationsPage from "./pages/doctor/DoctorConsultationsPage";
import DoctorPatientsPage from "./pages/doctor/DoctorPatientsPage";
import DoctorReviewsPage from "./pages/doctor/DoctorReviewsPage";
import DoctorSchedulePage from "./pages/doctor/DoctorSchedulePage";
import MyAvailabilityPage from "./pages/doctor/MyAvailabilityPage";
import PatientDetailPage from "./pages/doctor/PatientDetailPage";
import DoctorDetailPage from "./pages/DoctorDetailPage";
import DoctorsPage from "./pages/DoctorsPage";
import KYCSubmissionPage from "./pages/KYCSubmissionPage";
import KYCStatusPage from "./pages/KYCStatusPage";
import AboutPage from "./pages/AboutPage";
import ServicesPage from "./pages/ServicesPage";
import ContactPage from "./pages/ContactPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import MedicineDetailPage from "./pages/MedicineDetailPage";
import MedicineStorePage from "./pages/MedicineStorePage";
import OtpVerificationPage from "./pages/OtpVerificationPage";
import PatientPrescriptionsPage from "./pages/patient/PatientPrescriptionsPage";
import HealthRecordsPage from "./pages/patient/HealthRecordsPage";
import MedicineOrdersPage from "./pages/patient/MedicineOrdersPage";
import PaymentCallbackPage from "./pages/payment/PaymentCallbackPage";
import PaymentPage from "./pages/payment/PaymentPage";
import MedicineCheckoutPage from "./pages/payment/MedicineCheckoutPage";
import MedicineOrderSuccessPage from "./pages/payment/MedicineOrderSuccessPage";
import ProfilePage from "./pages/ProfilePage";  
import ResetPasswordPage from "./pages/ResetPasswordPage";
import ResetPassword from "./pages/ResetPassword";
import SignupPage from "./pages/SignupPage";
import { clearAllLocalStorage, clearAllSessionStorage } from "./utils/cookie";

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

function App() {
  React.useEffect(() => {
    clearAllLocalStorage();
    clearAllSessionStorage();
  }, []);

  return (
    <Router>
      <AuthProvider>
        <CartProvider>
        <Toaster richColors position="top-right" />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/verify-email" element={<OtpVerificationPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/set-new-password" element={<ResetPassword />} />
          <Route path="/doctors" element={<DoctorsPage />} />
          <Route path="/doctors/:doctorId" element={<DoctorDetailPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardRouter />
              </ProtectedRoute>
            }
          />
          <Route
            path="/appointment/book/:doctorId"
            element={
              <ProtectedRoute>
                <TimeSlotSelectionPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/appointment/confirm/:doctorId"
            element={
              <ProtectedRoute>
                <AppointmentConfirmPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/appointment/success"
            element={
              <ProtectedRoute>
                <PaymentCallbackPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/admin/medicines"
            element={
              <ProtectedRoute>
                <MedicineManagementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/medicines"
            element={
              <ProtectedRoute>
                <MedicineStorePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/medicine/:id"
            element={
              <ProtectedRoute>
                <MedicineDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/admin/medicine-orders"
            element={
              <ProtectedRoute>
                <MedicineOrdersManagementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/medicine-orders"
            element={
              <ProtectedRoute>
                <MedicineOrdersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/medicine-checkout"
            element={
              <ProtectedRoute>
                <MedicineCheckoutPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/medicine-order-success"
            element={
              <ProtectedRoute>
                <MedicineOrderSuccessPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/appointment/book/:doctorId"
            element={
              <ProtectedRoute>
                <BookAppointmentPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/payment"
            element={
              <ProtectedRoute>
                <PaymentPage />
              </ProtectedRoute>
            }
          />
          <Route path="/payment-callback" element={<PaymentCallbackPage />} />
          <Route
            path="/dashboard/appointments"
            element={
              <ProtectedRoute>
                <MyAppointmentsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/prescriptions"
            element={
              <ProtectedRoute>
                <PatientPrescriptionsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/health-records"
            element={
              <ProtectedRoute>
                <HealthRecordsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/patient"
            element={
              <ProtectedRoute>
                <PatientDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/doctor"
            element={
              <ProtectedRoute>
                <DoctorDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/admin"
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/reviews"
            element={
              <ProtectedRoute>
                <DoctorReviewsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/admin/reviews"
            element={
              <ProtectedRoute>
                <AdminReviewsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/customers"
            element={
              <ProtectedRoute>
                <CustomersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/doctors"
            element={
              <ProtectedRoute>
                <DoctorsManagementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/payments"
            element={
              <ProtectedRoute>
                <PaymentsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/analytics"
            element={
              <ProtectedRoute>
                <SystemAnalyticsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/availability"
            element={
              <ProtectedRoute>
                <MyAvailabilityPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/kyc-submission"
            element={
              <ProtectedRoute>
                <KYCSubmissionPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/kyc-status"
            element={
              <ProtectedRoute>
                <KYCStatusPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/admin/kyc-requests"
            element={
              <ProtectedRoute>
                <KYCRequestsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/schedule"
            element={
              <ProtectedRoute>
                <DoctorSchedulePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/patients"
            element={
              <ProtectedRoute>
                <DoctorPatientsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/consultations"
            element={
              <ProtectedRoute>
                <DoctorConsultationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/patients/:patientId"
            element={
              <ProtectedRoute>
                <PatientDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/activity-log"
            element={
              <ProtectedRoute>
                <ActivityLogPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;