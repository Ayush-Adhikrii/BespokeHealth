import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getAllDoctors, getAllSpecialties } from "../../services/DoctorService";
import { toast } from "sonner";
import DoctorAvatar from "../common/DoctorAvatar";

const DoctorBrowser = () => {
  const [doctors, setDoctors] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
  });

  
  const [filters, setFilters] = useState({
    search: "",
    speciality: "",
    minExperience: "",
    sortBy: "name",
    sortOrder: "asc",
  });

  
  useEffect(() => {
    const fetchSpecialties = async () => {
      try {
        const data = await getAllSpecialties();
        setSpecialties(data);
      } catch (err) {
        console.error("Error fetching specialties:", err);
      }
    };

    fetchSpecialties();
  }, []);

  
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setLoading(true);
        setError("");

        
        const params = {
          page: pagination.currentPage,
          limit: 6, 
          ...filters,
        };

        
        Object.keys(params).forEach(
          (key) => !params[key] && delete params[key]
        );

        const data = await getAllDoctors(params);
        setDoctors(data.doctors);
        setPagination({
          currentPage: data.currentPage,
          totalPages: data.totalPages,
          totalCount: data.totalCount,
        });
      } catch (err) {
        setError(err.error || "Failed to load doctors");
        toast.error(err.error || "Failed to load doctors");
      } finally {
        setLoading(false);
      }
    };

    fetchDoctors();
  }, [pagination.currentPage, filters]);

  
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
    
    setPagination((prev) => ({
      ...prev,
      currentPage: 1,
    }));
  };

  
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    
  };

  
  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    setPagination((prev) => ({
      ...prev,
      currentPage: newPage,
    }));
  };

  return (
    <section className="py-12 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            Browse Our Specialists
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Find experienced, qualified doctors across various specialties.
            Connect with healthcare professionals who can provide the care you need.
          </p>
        </div>

        
        <div className="mb-8 bg-white p-4 rounded-lg shadow-sm">
          <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                name="search"
                placeholder="Search by name or specialty"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                value={filters.search}
                onChange={handleFilterChange}
              />
            </div>
            
            <div className="md:w-56">
              <select
                name="speciality"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white"
                value={filters.speciality}
                onChange={handleFilterChange}
              >
                <option value="">All Specialties</option>
                {specialties.map((specialty) => (
                  <option key={specialty} value={specialty}>
                    {specialty}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="md:w-56">
              <select
                name="minExperience"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white"
                value={filters.minExperience}
                onChange={handleFilterChange}
              >
                <option value="">Any Experience</option>
                <option value="1">1+ Years</option>
                <option value="3">3+ Years</option>
                <option value="5">5+ Years</option>
                <option value="10">10+ Years</option>
              </select>
            </div>
            
            <div className="md:w-56">
              <select
                name="sortBy"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white"
                value={filters.sortBy}
                onChange={handleFilterChange}
              >
                <option value="name">Sort by Name</option>
                <option value="years_of_experience">Sort by Experience</option>
              </select>
            </div>
            
            <div className="md:w-40">
              <select
                name="sortOrder"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white"
                value={filters.sortOrder}
                onChange={handleFilterChange}
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </div>
          </form>
        </div>

        
        {loading ? (
          <div className="flex justify-center py-8">
            <svg className="animate-spin h-10 w-10 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
            </svg>
          </div>
        ) : error ? (
          <div className="text-center py-8 bg-red-50 rounded-lg">
            <p className="text-red-600">{error}</p>
          </div>
        ) : doctors.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-600">No doctors found matching your criteria.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {doctors.map((doctor) => {
                
                const lowestFee = doctor.consultation_fees && doctor.consultation_fees.length > 0
                  ? {
                      amount: Math.min(...doctor.consultation_fees.map(fee => Number(fee.amount))),
                      currency: doctor.consultation_fees[0].currency
                    }
                  : null;
                  
                return (
                  <div key={doctor.id} className="bg-white rounded-lg shadow-md overflow-hidden transition-all hover:shadow-lg relative">
                    
                    {lowestFee && (
                      <div className="absolute top-4 right-4">
                        <div className="bg-blue-600 text-white font-medium px-3 py-1 rounded-full shadow-sm text-sm flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {lowestFee.currency} {lowestFee.amount}
                        </div>
                      </div>
                    )}

                    <div className="p-6">
                      <div className="flex items-start">
                        <div className="relative flex-shrink-0">
                          <DoctorAvatar name={doctor.name} imageUrl={doctor.image_url} />
                          {doctor.rating_count > 0 && (
                            <div className="absolute -top-2 -right-2 flex items-center gap-0.5 bg-yellow-400 text-white text-xs font-semibold px-1.5 py-0.5 rounded-full shadow-sm">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                              {doctor.avg_rating.toFixed(1)}
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <h3 className="text-lg font-semibold text-gray-800">{doctor.name}</h3>
                          <p className="text-blue-600 font-medium">{doctor.speciality}</p>
                          <div className="mt-1 text-sm text-gray-600">
                            <p>{doctor.educational_qualification}</p>
                            <p>{doctor.years_of_experience} years experience</p>
                            {doctor.former_organisation && (
                              <p className="text-gray-500">Former: {doctor.former_organisation}</p>
                            )}
                          </div>
                          
                          
                          {lowestFee && (
                            <div className="mt-2 inline-block">
                              <span className="text-sm text-gray-700 font-medium">
                                Starting from <span className="text-green-600">{lowestFee.currency} {lowestFee.amount}</span>
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <Link 
                          to={`/doctors/${doctor.id}`} 
                          className="inline-block w-full text-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                        >
                          View Profile
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            
            {pagination.totalPages > 1 && (
              <div className="flex justify-center mt-8">
                <nav className="inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={pagination.currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Previous</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                  
                  {[...Array(pagination.totalPages).keys()].map((number) => (
                    <button
                      key={number}
                      onClick={() => handlePageChange(number + 1)}
                      className={`relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium ${
                        pagination.currentPage === number + 1
                          ? "text-blue-600 bg-blue-50"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {number + 1}
                    </button>
                  ))}
                  
                  <button
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={pagination.currentPage === pagination.totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Next</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                </nav>
              </div>
            )}
          </>
        )}

        
        <div className="text-center mt-8">
          <Link to="/doctors" className="inline-flex items-center text-blue-600 hover:text-blue-800">
            View all doctors
            <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default DoctorBrowser;