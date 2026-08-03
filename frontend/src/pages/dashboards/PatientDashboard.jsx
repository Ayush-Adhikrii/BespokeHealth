import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import { useAuth } from "../../context/AuthContext";
import { getAllDoctors, getAllSpecialties } from "../../services/DoctorService";
import PatientService from "../../services/PatientService";
import DoctorBrowser from "../../components/home/DoctorBrowser";

const quickLinks = [
  {
    title: "Health Records",
    description: "Review your past consultations, diagnoses, and prescriptions.",
    to: "/dashboard/health-records",
    cta: "View Health Records",
    gradient: "from-purple-500 to-indigo-600",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    ),
  },
  {
    title: "Prescriptions",
    description: "See medications and instructions from your doctors.",
    to: "/dashboard/prescriptions",
    cta: "View Prescriptions",
    gradient: "from-blue-500 to-cyan-600",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    ),
  },
  {
    title: "Medicine Store",
    description: "Order medicines from your prescriptions online.",
    to: "/dashboard/medicines",
    cta: "Browse Medicines",
    gradient: "from-emerald-500 to-teal-600",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
    ),
  },
  {
    title: "My Appointments",
    description: "View upcoming and past appointments with your doctors.",
    to: "/dashboard/appointments",
    cta: "View Appointments",
    gradient: "from-amber-500 to-orange-600",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    ),
  },
];

const PatientDashboard = () => {
  const { user } = useAuth();
    const doctorBrowserRef = useRef(null);



    const scrollToDoctorBrowser = () => {
    doctorBrowserRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  };

  return (
    <DashboardLayout>
      <div className="p-4 max-w-7xl mx-auto">
        
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl shadow-lg p-6 mb-8 text-white">
          <h1 className="text-2xl font-bold mb-2">
            Welcome back, {user?.name?.split(" ")[0] || "Patient"}!
          </h1>
          <p className="opacity-90 mb-4">
            Your health is our priority. Book appointments, consult with
            specialists, and manage your health journey all in one place.
          </p>
          <Link
           onClick={scrollToDoctorBrowser}
            className="inline-block px-4 py-2 bg-white text-blue-700 font-medium rounded-lg shadow hover:bg-blue-50 transition duration-150"
          >
            Book an Appointment
          </Link>
        </div>


        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {quickLinks.map((link) => (
            <div
              key={link.title}
              className={`bg-gradient-to-r ${link.gradient} rounded-xl shadow-md p-6 text-white flex flex-col`}
            >
              <div className="flex items-center mb-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  {link.icon}
                </svg>
                <h3 className="font-bold text-lg">{link.title}</h3>
              </div>
              <p className="mb-3 opacity-90 flex-1">{link.description}</p>
              <Link
                to={link.to}
                className="inline-block px-3 py-1 bg-white bg-opacity-20 text-white text-sm font-medium rounded hover:bg-opacity-30 transition duration-150 self-start"
              >
                {link.cta}
              </Link>
            </div>
          ))}
        </div>

    <div ref={doctorBrowserRef} className="mt-8">
        <DoctorBrowser />
        </div>

      </div>
    </DashboardLayout>
  );
};

export default PatientDashboard;
