import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import { useAuth } from "../../context/AuthContext";
import AnalyticsService from "../../services/AnalyticsService";
import { getKYCsForReview } from "../../services/KycService";

const AdminDashboard = () => {
  const { user } = useAuth();
  const [pendingKYCs, setPendingKYCs] = useState({ totalCount: 0, kycs: [] });
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState(null);

  
  const COLORS = [
    "#0088FE",
    "#00C49F",
    "#FFBB28",
    "#FF8042",
    "#8884D8",
    "#82CA9D",
  ];

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      const [kycResult, analyticsResult] = await Promise.allSettled([
        getKYCsForReview(1, 5),
        AnalyticsService.getAnalyticsOverview(),
      ]);

      if (kycResult.status === "fulfilled") {
        setPendingKYCs(kycResult.value);
      } else {
        console.error("Error fetching pending KYCs:", kycResult.reason);
      }

      if (analyticsResult.status === "fulfilled") {
        setAnalyticsData(analyticsResult.value);
      } else {
        console.error("Error fetching analytics overview:", analyticsResult.reason);
      }

      if (kycResult.status === "rejected" || analyticsResult.status === "rejected") {
        toast.error("Failed to load some dashboard data");
      }

      setLoading(false);
    };

    fetchData();
  }, []);

  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          Admin Dashboard
        </h1>

        
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">
            Welcome, {user?.name || "Admin"}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-800">Total Users</h3>
              {loading ? (
                <div className="h-8 w-20 bg-blue-100 animate-pulse rounded mt-1"></div>
              ) : (
                <p className="text-2xl font-bold text-blue-600">
                  {analyticsData?.counts?.users || "0"}
                </p>
              )}
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-green-800">
                Verified Doctors
              </h3>
              {loading ? (
                <div className="h-8 w-20 bg-green-100 animate-pulse rounded mt-1"></div>
              ) : (
                <p className="text-2xl font-bold text-green-600">
                  {analyticsData?.counts?.doctors || "0"}
                </p>
              )}
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-purple-800">
                Active Patients
              </h3>
              {loading ? (
                <div className="h-8 w-20 bg-purple-100 animate-pulse rounded mt-1"></div>
              ) : (
                <p className="text-2xl font-bold text-purple-600">
                  {analyticsData?.counts?.patients || "0"}
                </p>
              )}
            </div>
          </div>
        </div>

        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-4">
            <h3 className="text-sm font-medium text-gray-600 mb-2">
              Total Appointments
            </h3>
            {loading ? (
              <div className="h-8 w-20 bg-gray-100 animate-pulse rounded mt-1"></div>
            ) : (
              <p className="text-2xl font-bold text-gray-800">
                {analyticsData?.counts?.appointments || "0"}
              </p>
            )}
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <h3 className="text-sm font-medium text-gray-600 mb-2">
              Completion Rate
            </h3>
            {loading ? (
              <div className="h-8 w-20 bg-gray-100 animate-pulse rounded mt-1"></div>
            ) : (
              <p className="text-2xl font-bold text-gray-800">
                {analyticsData?.counts?.completionRate || "0"}%
              </p>
            )}
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <h3 className="text-sm font-medium text-gray-600 mb-2">
              Total Revenue
            </h3>
            {loading ? (
              <div className="h-8 w-20 bg-gray-100 animate-pulse rounded mt-1"></div>
            ) : (
              <p className="text-2xl font-bold text-gray-800">
                Rs.{" "}
                {Number(analyticsData?.counts?.revenue || 0).toLocaleString()}
              </p>
            )}
          </div>
        </div>

         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link
            to="/admin/doctors-management"
            className="bg-white rounded-lg shadow-md p-5 hover:shadow-lg transition duration-200"
          >
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-full">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-blue-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">
                  Manage Doctors
                </h3>
                <p className="text-lg font-semibold text-gray-900">
                  View &rarr;
                </p>
              </div>
            </div>
          </Link>

          <Link
            to="/admin/activity-log"
            className="bg-white rounded-lg shadow-md p-5 hover:shadow-lg transition duration-200"
          >
            <div className="flex items-center">
              <div className="bg-yellow-100 p-3 rounded-full">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-yellow-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 17v-2a4 4 0 018 0v2M5 10V7a7 7 0 0114 0v3M5 10a7 7 0 0014 0"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">
                  Activity Log
                </h3>
                <p className="text-lg font-semibold text-gray-900">
                  View &rarr;
                </p>
              </div>
            </div>
          </Link>

          <Link
            to="/admin/patients-management"
            className="bg-white rounded-lg shadow-md p-5 hover:shadow-lg transition duration-200"
          >
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-full">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">
                  Manage Patients
                </h3>
                <p className="text-lg font-semibold text-gray-900">
                  View &rarr;
                </p>
              </div>
            </div>
          </Link>

          <Link
            to="/admin/payments"
            className="bg-white rounded-lg shadow-md p-5 hover:shadow-lg transition duration-200"
          >
            <div className="flex items-center">
              <div className="bg-yellow-100 p-3 rounded-full">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-yellow-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Payments</h3>
                <p className="text-lg font-semibold text-gray-900">
                  View &rarr;
                </p>
              </div>
            </div>
          </Link>

          <Link
            to="/admin/system-analytics"
            className="bg-white rounded-lg shadow-md p-5 hover:shadow-lg transition duration-200"
          >
            <div className="flex items-center">
              <div className="bg-indigo-100 p-3 rounded-full">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-indigo-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">
                  Detailed Analytics
                </h3>
                <p className="text-lg font-semibold text-gray-900">
                  View &rarr;
                </p>
              </div>
            </div>
          </Link>
        </div>

        
        <div className="bg-white rounded-lg shadow-md p-6 mb-8 mt-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">
              Pending Doctor Verifications
            </h2>
            <Link
              to="/admin/kyc-verification"
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              View all
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-gray-50 p-3 rounded animate-pulse">
                  <div className="h-5 w-1/3 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 w-1/4 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : pendingKYCs.kycs.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Doctor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Speciality
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Submitted
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pendingKYCs.kycs.map((kyc) => (
                    <tr key={kyc.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {kyc.doctorName}
                        </div>
                        <div className="text-sm text-gray-500">{kyc.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {kyc.speciality}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(kyc.submittedAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link
                          to={`/admin/kyc-verification/${kyc.id}`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Review
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <p className="text-gray-500">
                No pending verifications at the moment.
              </p>
            </div>
          )}
        </div>

        
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Dashboard Insights
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
        

            
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-medium text-gray-800 mb-2">
                Appointment Status
              </h3>
              {loading || !analyticsData?.recentActivity?.appointments ? (
                <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg border border-gray-200">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={(() => {
                        
                        const statusCounts =
                          analyticsData.recentActivity.appointments.reduce(
                            (acc, appointment) => {
                              acc[appointment.status] =
                                (acc[appointment.status] || 0) + 1;
                              return acc;
                            },
                            {}
                          );

                        
                        return Object.entries(statusCounts).map(
                          ([status, count]) => ({
                            status:
                              status.charAt(0).toUpperCase() + status.slice(1),
                            value: count,
                          })
                        );
                      })()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="status"
                      label={({ status, percent }) =>
                        `${status}: ${(percent * 100).toFixed(0)}%`
                      }
                    >
                      {(() => {
                        const statusCounts =
                          analyticsData.recentActivity.appointments.reduce(
                            (acc, appointment) => {
                              acc[appointment.status] =
                                (acc[appointment.status] || 0) + 1;
                              return acc;
                            },
                            {}
                          );

                        return Object.entries(statusCounts).map(
                          ([status, count], index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={
                                status === "completed"
                                  ? "#10B981"
                                  : status === "confirmed"
                                  ? "#3B82F6"
                                  : status === "cancelled"
                                  ? "#EF4444"
                                  : "#FBBF24"
                              }
                            />
                          )
                        );
                      })()}
                    </Pie>
                    <Tooltip
                      formatter={(value, name, props) => [
                        `${value} appointments`,
                        props.payload.status,
                      ]}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Recent Users</h2>
              <Link
                to="/dashboard/customers"
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                View all
              </Link>
            </div>

            {loading || !analyticsData?.recentActivity?.users ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-gray-50 p-3 rounded animate-pulse">
                    <div className="h-5 w-1/3 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 w-1/4 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Joined
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {analyticsData.recentActivity.users
                      .slice(0, 5)
                      .map((user) => (
                        <tr key={user.id}>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-medium">
                                {user.name.charAt(0)}
                              </div>
                              <div className="ml-3">
                                <div className="text-sm font-medium text-gray-900">
                                  {user.name}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {user.email}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                user.role === "Doctor"
                                  ? "bg-green-100 text-green-800"
                                  : user.role === "Admin"
                                  ? "bg-purple-100 text-purple-800"
                                  : "bg-blue-100 text-blue-800"
                              }`}
                            >
                              {user.role}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                            {new Date(user.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Recent Appointments</h2>
            
            </div>

            {loading || !analyticsData?.recentActivity?.appointments ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-gray-50 p-3 rounded animate-pulse">
                    <div className="h-5 w-1/3 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 w-1/4 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Patient
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Doctor
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {analyticsData.recentActivity.appointments
                      .slice(0, 5)
                      .map((appointment) => (
                        <tr key={appointment.id}>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {appointment.patient}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {appointment.doctor}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                appointment.status === "completed"
                                  ? "bg-green-100 text-green-800"
                                  : appointment.status === "confirmed"
                                  ? "bg-blue-100 text-blue-800"
                                  : appointment.status === "cancelled"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              {appointment.status.charAt(0).toUpperCase() +
                                appointment.status.slice(1)}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                            {new Date(appointment.date).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

      
       
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
