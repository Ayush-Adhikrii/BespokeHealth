import { Link } from "react-router-dom";
import Navbar from "../components/home/Navbar";
import Footer from "../components/home/Footer";

const values = [
  {
    title: "Patient First",
    description: "Every decision we make starts with what's best for the people using our platform to get care.",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    ),
  },
  {
    title: "Verified Care",
    description: "Every doctor on Bespoke Health is credential-checked before they can see a single patient.",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    ),
  },
  {
    title: "Always Accessible",
    description: "Book, consult, and manage prescriptions from anywhere, without waiting rooms or queues.",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    ),
  },
];

const AboutPage = () => {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="pt-32 pb-16">
        <section className="bg-gradient-to-br from-blue-50 to-indigo-50 pb-16">
          <div className="container mx-auto px-4 text-center max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
              About <span className="text-blue-600">Bespoke Health</span>
            </h1>
            <p className="mt-6 text-lg text-gray-600">
              We're building the easiest way for patients in Nepal to find, book, and consult
              with qualified doctors online — and for doctors to manage their practice without
              the paperwork.
            </p>
          </div>
        </section>

        <section className="py-16">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Mission</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Healthcare shouldn't depend on how long you can wait in a queue or how close you
              live to a good hospital. Bespoke Health connects patients with verified doctors
              across specialities, so quality care is a booking away — not a day trip.
            </p>
            <p className="text-gray-600 leading-relaxed">
              For doctors, we handle the scheduling, fee management, and patient records, so
              more time goes to patients and less to admin work.
            </p>
          </div>
        </section>

        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">What We Stand For</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {values.map((value) => (
                <div key={value.title} className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
                  <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mb-4">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      {value.icon}
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">{value.title}</h3>
                  <p className="text-gray-600">{value.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to get started?</h2>
            <p className="text-gray-600 mb-8 max-w-xl mx-auto">
              Browse our specialists or create an account to book your first appointment.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link to="/doctors" className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition-colors">
                Find Doctors
              </Link>
              <Link to="/signup" className="px-8 py-3 bg-white text-blue-600 font-semibold rounded-md border border-blue-200 hover:bg-blue-50 transition-colors">
                Create Account
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default AboutPage;
