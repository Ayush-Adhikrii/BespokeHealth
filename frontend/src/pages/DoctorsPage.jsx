import Navbar from "../components/home/Navbar";
import Footer from "../components/home/Footer";
import DoctorBrowser from "../components/home/DoctorBrowser";

const DoctorsPage = () => {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="pt-32 pb-16">
        <DoctorBrowser />
      </main>
      <Footer />
    </div>
  );
};

export default DoctorsPage;
