import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import API from "../../utils/axios";


const AnalyticsService = {
  getAnalyticsOverview: async () => {
    try {
      const response = await API.get("/analytics/overview");
      return response.data;
    } catch (error) {
      console.error("Error fetching analytics overview:", error);
      throw error;
    }
  },

  getUserAnalytics: async () => {
    try {
      const response = await API.get("/analytics/users");
      return response.data;
    } catch (error) {
      console.error("Error fetching user analytics:", error);
      throw error;
    }
  },

  getDoctorAnalytics: async () => {
    try {
      const response = await API.get("/analytics/doctors");
      return response.data;
    } catch (error) {
      console.error("Error fetching doctor analytics:", error);
      throw error;
    }
  },

  getPatientAnalytics: async () => {
    try {
      const response = await API.get("/analytics/patients");
      return response.data;
    } catch (error) {
      console.error("Error fetching patient analytics:", error);
      throw error;
    }
  },

  getAppointmentAnalytics: async () => {
    try {
      const response = await API.get("/analytics/appointments");
      return response.data;
    } catch (error) {
      console.error("Error fetching appointment analytics:", error);
      throw error;
    }
  },

  getRevenueAnalytics: async () => {
    try {
      const response = await API.get("/analytics/revenue");
      return response.data;
    } catch (error) {
      console.error("Error fetching revenue analytics:", error);
      throw error;
    }
  },
};


const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884D8",
  "#82CA9D",
];

const SystemAnalyticsPage = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [overview, setOverview] = useState(null);
  const [userData, setUserData] = useState(null);
  const [doctorData, setDoctorData] = useState(null);
  const [patientData, setPatientData] = useState(null);
  const [appointmentData, setAppointmentData] = useState(null);
  const [revenueData, setRevenueData] = useState(null);

  useEffect(() => {
    fetchOverviewData();
  }, []);

  useEffect(() => {
    fetchTabData(activeTab);
  }, [activeTab]);

  const fetchOverviewData = async () => {
    try {
      setLoading(true);
      const data = await AnalyticsService.getAnalyticsOverview();
      setOverview(data);
      setLoading(false);
    } catch {
      toast.error("Failed to load analytics overview");
      setLoading(false);
    }
  };

  const fetchTabData = async (tab) => {
    if (tab === "overview" && overview) {
      return; 
    }

    try {
      setLoading(true);

      switch (tab) {
        case "users":
          if (!userData) {
            const data = await AnalyticsService.getUserAnalytics();
            setUserData(data);
          }
          break;

        case "doctors":
          if (!doctorData) {
            const data = await AnalyticsService.getDoctorAnalytics();
            setDoctorData(data);
          }
          break;

        case "patients":
          if (!patientData) {
            const data = await AnalyticsService.getPatientAnalytics();
            setPatientData(data);
          }
          break;

        case "appointments":
          if (!appointmentData) {
            const data = await AnalyticsService.getAppointmentAnalytics();
            setAppointmentData(data);
          }
          break;

        case "revenue":
          if (!revenueData) {
            const data = await AnalyticsService.getRevenueAnalytics();
            setRevenueData(data);
          }
          break;

        default:
          break;
      }

      setLoading(false);
    } catch {
      toast.error(`Failed to load ${tab} analytics`);
      setLoading(false);
    }
  };

  const renderMetricCard = (
    title,
    value,
    change,
    changeLabel = "from last month",
    isPercentage = false
  ) => {
    const isPositive = change >= 0;
    const formattedValue = isPercentage ? `${value}%` : value;

    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <p className="mt-2 text-3xl font-bold text-gray-900">
          {formattedValue}
        </p>
        {change !== undefined && (
          <div className="mt-1 flex items-center">
            <span
              className={`text-xs font-medium ${
                isPositive ? "text-green-600" : "text-red-600"
              }`}
            >
              {isPositive ? "↑" : "↓"} {Math.abs(change)}%
            </span>
            <span className="text-xs text-gray-500 ml-1">{changeLabel}</span>
          </div>
        )}
      </div>
    );
  };

  const renderOverviewTab = () => {
    if (!overview) return null;

    
    const users = Number(overview.counts.users);
    const doctors = Number(overview.counts.doctors);
    const patients = Number(overview.counts.patients);
    const appointments = Number(overview.counts.appointments);
    const completionRate = Number(overview.counts.completionRate);
    const revenue = Number(overview.counts.revenue);

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {renderMetricCard(
            "Total Users",
            users,
            null 
          )}
          {renderMetricCard("Total Doctors", doctors, null)}
          {renderMetricCard("Total Patients", patients, null)}
          {renderMetricCard("Total Appointments", appointments, null)}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {renderMetricCard(
            "Completion Rate",
            completionRate,
            null,
            "of appointments",
            true
          )}
          {renderMetricCard(
            "Total Revenue",
            `Rs. ${revenue.toLocaleString()}`,
            null
          )}
        </div>

        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-4">Recent Users</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joined
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {overview.recentActivity.users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {user.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-4">Recent Appointments</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Patient
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Doctor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {overview.recentActivity.appointments.map((appointment) => (
                  <tr key={appointment.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{appointment.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {appointment.patient}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {appointment.doctor}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(appointment.date).toLocaleDateString()}{" "}
                      {new Date(appointment.date).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-4">User Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={[
                  { name: "Doctors", value: doctors },
                  { name: "Patients", value: patients },
                  { name: "Admins", value: users - (doctors + patients) },
                ]}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
                label={({ name, percent }) =>
                  `${name}: ${(percent * 100).toFixed(0)}%`
                }
              >
                {[
                  { name: "Doctors", value: doctors },
                  { name: "Patients", value: patients },
                  { name: "Admins", value: users - (doctors + patients) },
                ].map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip formatter={(value, name) => [value, name]} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-4">
            Appointment Status Distribution
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={(() => {
                  
                  const statusCounts =
                    overview.recentActivity.appointments.reduce(
                      (acc, appointment) => {
                        acc[appointment.status] =
                          (acc[appointment.status] || 0) + 1;
                        return acc;
                      },
                      {}
                    );

                  
                  return Object.entries(statusCounts).map(
                    ([status, count]) => ({
                      status: status.charAt(0).toUpperCase() + status.slice(1),
                      value: count,
                    })
                  );
                })()}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
                nameKey="status"
                label={({ status, percent }) =>
                  `${status}: ${(percent * 100).toFixed(0)}%`
                }
              >
                {(() => {
                  const statusCounts =
                    overview.recentActivity.appointments.reduce(
                      (acc, appointment) => {
                        acc[appointment.status] =
                          (acc[appointment.status] || 0) + 1;
                        return acc;
                      },
                      {}
                    );

                  return Object.entries(statusCounts).map(
                    ([status], index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          status === "completed"
                            ? "#4F46E5"
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
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  const renderUsersTab = () => {
    if (!userData) return null;

    
    const userGrowthChartData = userData.growth.data.map((item) => ({
      name: new Date(item.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      users: item.count,
    }));


    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {renderMetricCard("Total Users", userData.overview.totalUsers, null)}
          {renderMetricCard(
            "Total Doctors",
            userData.overview.totalDoctors,
            null
          )}
          {renderMetricCard(
            "Total Patients",
            userData.overview.totalPatients,
            null
          )}
        </div>

        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-4">User Growth Trend</h2>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart
              data={userGrowthChartData}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area
                type="monotone"
                dataKey="users"
                name="New Users"
                stroke="#4F46E5"
                fill="#4F46E5"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold mb-4">
              User Roles Distribution
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={userData.roleDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                  nameKey="role"
                  label={({ role, percentage }) => `${role}: ${percentage}%`}
                >
                  {userData.roleDistribution.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name, props) => {
                    const item = props.payload;
                    return [`${item.count} (${item.percentage}%)`, item.role];
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold mb-4">
              KYC Status Distribution
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={userData.kycMetrics.statusDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                  nameKey="status"
                  label={({ status, percentage }) =>
                    `${status}: ${percentage}%`
                  }
                >
                  {userData.kycMetrics.statusDistribution.map(
                    (entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          entry.status === "Approved"
                            ? "#10B981"
                            : entry.status === "Rejected"
                            ? "#EF4444"
                            : "#FBBF24"
                        }
                      />
                    )
                  )}
                </Pie>
                <Tooltip
                  formatter={(value, name, props) => {
                    const item = props.payload;
                    return [`${item.count} (${item.percentage}%)`, item.status];
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

       
      </div>
    );
  };

  const renderDoctorsTab = () => {
    if (!doctorData) return null;


   
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {renderMetricCard(
            "Total Doctors",
            doctorData.topActiveDoctors.length,
            null
          )}
         
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold mb-4">
              Speciality Distribution
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={doctorData.specialityDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                  nameKey="speciality"
                  label={({ speciality, percentage }) =>
                    `${speciality}: ${percentage}%`
                  }
                >
                  {doctorData.specialityDistribution.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name, props) => {
                    const item = props.payload;
                    return [
                      `${item.count} (${item.percentage}%)`,
                      item.speciality,
                    ];
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-4">KYC Metrics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              {renderMetricCard(
                "Total KYC Submissions",
                doctorData.kycMetrics.totalSubmissions,
                null
              )}
            </div>
            <div className="flex items-center justify-center h-full">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={doctorData.kycMetrics.statusDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                    nameKey="status"
                    label={({ status, percentage }) =>
                      `${status}: ${percentage}%`
                    }
                  >
                    {doctorData.kycMetrics.statusDistribution.map(
                      (entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            entry.status === "Approved"
                              ? "#10B981"
                              : entry.status === "Rejected"
                              ? "#EF4444"
                              : "#FBBF24"
                          }
                        />
                      )
                    )}
                  </Pie>
                  <Tooltip
                    formatter={(value, name, props) => {
                      const item = props.payload;
                      return [
                        `${item.count} (${item.percentage}%)`,
                        item.status,
                      ];
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-4">Top Active Doctors</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Doctor Name
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Speciality
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Email
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Appointments
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {doctorData.topActiveDoctors.map((doctor) => (
                  <tr key={doctor.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {doctor.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {doctor.speciality}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {doctor.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {doctor.appointmentCount}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    );
  };

  const renderPatientsTab = () => {
    if (!patientData) return null;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {renderMetricCard("Total Patients", patientData.totalPatients, null)}
          {renderMetricCard(
            "Most Active Patient",
            patientData.topActivePatients[0]?.name || "N/A",
            null
          )}
          {renderMetricCard(
            "Total Appointments",
            patientData.topActivePatients.reduce(
              (sum, patient) => sum + patient.appointmentCount,
              0
            ),
            null
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold mb-4">Gender Distribution</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={patientData.demographics.gender}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                  nameKey="gender"
                  label={({ gender, percentage }) =>
                    `${gender}: ${percentage}%`
                  }
                >
                  {patientData.demographics.gender.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={index === 0 ? "#4F46E5" : "#FF8042"}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name, props) => {
                    const item = props.payload;
                    return [`${item.count} (${item.percentage}%)`, item.gender];
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold mb-4">Age Distribution</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={patientData.demographics.ageGroups}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="group" />
                <YAxis />
                <Tooltip
                  formatter={(value, name, props) => {
                    const item = props.payload;
                    return [`${value} (${item.percentage}%)`, "Patients"];
                  }}
                />
                <Bar dataKey="count" fill="#4F46E5" name="Patients" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-4">Top Active Patients</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Patient Name
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Email
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Appointments
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {patientData.topActivePatients.map((patient) => (
                  <tr key={patient.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {patient.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {patient.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {patient.appointmentCount}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderAppointmentsTab = () => {
    if (!appointmentData) return null;

    const appointmentTrendsData = appointmentData.trends.data.map((item) => ({
      name: new Date(item.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      appointments: item.count,
    }));

    const peakHoursData = appointmentData.peakTimes.byHour.map((item) => ({
      hour:
        item.hour > 12
          ? `${item.hour - 12}:00 PM`
          : item.hour === 12
          ? "12:00 PM"
          : item.hour === 0
          ? "12:00 AM"
          : `${item.hour}:00 AM`,
      count: item.count,
      percentage: item.percentage,
    }));

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {renderMetricCard(
            "Total Appointments",
            appointmentData.overview.totalAppointments,
            null
          )}
          {renderMetricCard(
            "Cancellation Rate",
            `${appointmentData.cancellations.cancellationRate}%`,
            null,
            "",
            true
          )}
          {renderMetricCard(
            "Peak Day",
            appointmentData.peakTimes.byDay[0]?.dayName || "N/A",
            null,
            `${
              appointmentData.peakTimes.byDay[0]?.percentage || 0
            }% of appointments`
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-4">Appointment Trends</h2>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart
              data={appointmentTrendsData}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area
                type="monotone"
                dataKey="appointments"
                name="Appointments"
                stroke="#4F46E5"
                fill="#4F46E5"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold mb-4">Status Distribution</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={appointmentData.overview.statusDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                  nameKey="status"
                  label={({ status, percentage }) =>
                    `${
                      status.charAt(0).toUpperCase() + status.slice(1)
                    }: ${percentage}%`
                  }
                >
                  {appointmentData.overview.statusDistribution.map(
                    (entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          entry.status === "completed"
                            ? "#10B981"
                            : entry.status === "confirmed"
                            ? "#3B82F6"
                            : entry.status === "cancelled"
                            ? "#EF4444"
                            : "#FBBF24" 
                        }
                      />
                    )
                  )}
                </Pie>
                <Tooltip
                  formatter={(value, name, props) => {
                    const item = props.payload;
                    return [
                      `${item.count} (${item.percentage}%)`,
                      item.status.charAt(0).toUpperCase() +
                        item.status.slice(1),
                    ];
                  }}
                />
                <Legend
                  formatter={(value) =>
                    value.charAt(0).toUpperCase() + value.slice(1)
                  }
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold mb-4">Appointments by Day</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={appointmentData.peakTimes.byDay}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="dayName" />
                <YAxis />
                <Tooltip
                  formatter={(value, name, props) => {
                    const item = props.payload;
                    return [`${value} (${item.percentage}%)`, "Appointments"];
                  }}
                />
                <Bar dataKey="count" fill="#4F46E5" name="Appointments" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold mb-4">Appointments by Hour</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={peakHoursData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip
                  formatter={(value, name, props) => {
                    const item = props.payload;
                    return [`${value} (${item.percentage}%)`, "Appointments"];
                  }}
                />
                <Bar dataKey="count" fill="#4F46E5" name="Appointments" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold mb-4">Cancellation Reasons</h2>
            {appointmentData.cancellations.reasonBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={appointmentData.cancellations.reasonBreakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                    nameKey="reason"
                    label={({ reason, percentage }) =>
                      `${reason}: ${percentage}%`
                    }
                  >
                    {appointmentData.cancellations.reasonBreakdown.map(
                      (entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      )
                    )}
                  </Pie>
                  <Tooltip
                    formatter={(value, name, props) => {
                      const item = props.payload;
                      return [
                        `${item.count} (${item.percentage}%)`,
                        item.reason,
                      ];
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">
                <p>No cancellation data available</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderRevenueTab = () => {
    if (!revenueData) return null;

    
    const parseRevenue = (value) => {
      if (!value) return 0;

      
      if (typeof value === "number") return value;

      
      
      const cleanValue = String(value);

      
      if (cleanValue.length > 10) {
        
        
        return Number(cleanValue.substring(0, 5));
      }

      
      const parsed = Number(cleanValue);
      if (!isFinite(parsed) || parsed > 1e12) return 500; 
      return parsed;
    };

    
    const totalRevenue = parseRevenue(revenueData.overview.totalRevenue);

    
    const revenueTrends = revenueData.trends.data.map((item) => ({
      name: new Date(item.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      revenue: parseRevenue(item.amount),
    }));

    
    const specialtyData = revenueData.bySpeciality.map((item) => ({
      ...item,
      amount: parseRevenue(item.amount),
      percentage: Number(item.percentage) > 100 ? "100.00" : item.percentage,
    }));

    
    const paymentMethodData = revenueData.paymentMethods.map((item) => ({
      method: item.method.charAt(0).toUpperCase() + item.method.slice(1),
      value: parseRevenue(item.amount),
      count: item.count,
    }));

    
    const growthRate = Number(revenueData.forecast.growthRate) || 0;
    const forecastValue =
      isFinite(revenueData.forecast.nextMonth) &&
      revenueData.forecast.nextMonth < 1e12
        ? revenueData.forecast.nextMonth
        : totalRevenue * (1 + growthRate / 100);

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {renderMetricCard(
            "Total Revenue",
            `Rs. ${totalRevenue.toLocaleString()}`,
            null,
            "All time"
          )}
          {renderMetricCard(
            "Forecasted Next Month",
            `Rs. ${forecastValue.toLocaleString()}`,
            growthRate,
            "projected growth"
          )}
          {renderMetricCard(
            "Payment Methods",
            revenueData.paymentMethods.length,
            null,
            "available options"
          )}
        </div>

        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-4">Revenue Trends</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={revenueTrends}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip
                formatter={(value) => [
                  `Rs. ${value.toLocaleString()}`,
                  "Revenue",
                ]}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="revenue"
                name="Revenue"
                stroke="#4F46E5"
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold mb-4">Revenue by Specialty</h2>
            {specialtyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={specialtyData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="amount"
                    nameKey="speciality"
                    label={({ speciality }) => speciality}
                  >
                    {specialtyData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [
                      `Rs. ${value.toLocaleString()}`,
                      "Amount",
                    ]}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">
                <p>No specialty data available</p>
              </div>
            )}
          </div>

          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold mb-4">
              Payment Method Distribution
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={paymentMethodData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="method"
                  label={({ method }) => method}
                >
                  {paymentMethodData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [
                    `Rs. ${value.toLocaleString()}`,
                    "Amount",
                  ]}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-4">Top Earning Doctors</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Doctor Name
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Specialty
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Revenue
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Appointments
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {revenueData.topEarningDoctors.map((doctor) => (
                  <tr key={doctor.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {doctor.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {doctor.speciality}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {" Rs. "}{" "}
                        {parseRevenue(doctor.revenue).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {doctor.appointmentCount}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case "overview":
        return renderOverviewTab();
      case "users":
        return renderUsersTab();
      case "doctors":
        return renderDoctorsTab();
      case "patients":
        return renderPatientsTab();
      case "appointments":
        return renderAppointmentsTab();
      case "revenue":
        return renderRevenueTab();
      default:
        return null;
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto p-4">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          System Analytics
        </h1>

        
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 overflow-x-auto">
            {[
              "overview",
              "users",
              "doctors",
              "patients",
              "appointments",
              "revenue",
            ].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab
                    ? "border-indigo-500 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </div>

        {loading ? (
          <div className="bg-white shadow-md rounded-lg p-8 flex justify-center">
            <svg
              className="animate-spin h-10 w-10 text-blue-600"
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
          </div>
        ) : !overview && activeTab === "overview" ? (
          <div className="bg-white shadow-md rounded-lg p-8 text-center">
            <div className="text-gray-500">
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
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              <h2 className="text-xl font-medium text-gray-700 mb-2">
                No Analytics Data Available
              </h2>
              <p className="mb-4">
                There was an issue loading the analytics data. Please try again
                later.
              </p>
              <button
                onClick={fetchOverviewData}
                className="mt-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Retry
              </button>
            </div>
          </div>
        ) : (
          renderActiveTab()
        )}
      </div>
    </DashboardLayout>
  );
};

export default SystemAnalyticsPage;
