import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
// eslint-disable-next-line no-unused-vars -- motion.div is used in JSX below; this rule doesn't detect that pattern
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import DashboardLayout from "../components/layouts/DashboardLayout";
import API from "../utils/axios";
import CorsImage from "../components/common/CorsImage";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import MedicineOrderService from "../services/MedicineOrderService";

const MedicineStorePage = () => {
  const { addItem } = useCart();
  const { user } = useAuth();
  const [medicines, setMedicines] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showInStock, setShowInStock] = useState(false);
  const [eligibleMedicineIds, setEligibleMedicineIds] = useState(new Set());
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    pages: 1,
  });


  useEffect(() => {
    if (user?.role !== "Patient") return;
    MedicineOrderService.getPrescriptionEligibility()
      .then((data) => setEligibleMedicineIds(new Set(data.eligible_medicine_ids)))
      .catch((error) => console.error("Error fetching prescription eligibility:", error));
  }, [user?.role]);

  
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await API.get("/medicines/categories");
        setCategories(response.data || []);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };

    fetchCategories();
  }, []);

  
  useEffect(() => {
    const fetchMedicines = async () => {
      try {
        setLoading(true);

        
        const params = {
          page: pagination.page,
          limit: 12,
          search: searchTerm,
          category: selectedCategory,
        };

        if (showInStock) {
          params.in_stock = true;
        }

        const response = await API.get("/medicines", { params });

        console.log("Medicine data received:", response.data.medicines);
        setMedicines(response.data.medicines);
        setPagination({
          total: response.data.pagination.total,
          page: response.data.pagination.page,
          pages: response.data.pagination.pages,
        });
      } catch (error) {
        toast.error("Failed to load medicines");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchMedicines();
  }, [pagination.page, searchTerm, selectedCategory, showInStock]);

  
  const handleSearch = (e) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  
  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      setPagination((prev) => ({ ...prev, page: newPage }));
    }
  };

  
  const calculateDiscount = (original, discounted) => {
    if (!discounted || discounted >= original) return null;
    return Math.round(((original - discounted) / original) * 100);
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6">
        
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl p-6 mb-8 shadow-lg relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <svg
              className="w-full h-full"
              viewBox="0 0 100 100"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M10,30 Q50,10 90,30 T90,60 T50,90 T10,60 T50,30"
                stroke="white"
                fill="none"
                strokeWidth="0.5"
              />
              <circle cx="20" cy="20" r="1" fill="white" />
              <circle cx="80" cy="30" r="1" fill="white" />
              <circle cx="50" cy="70" r="1" fill="white" />
            </svg>
          </div>

          <div className="relative z-10 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Medicine Store
              </h1>
              <p className="text-indigo-100 max-w-xl">
                Browse our selection of high-quality medicines and healthcare
                products
              </p>
            </div>
            <div className="hidden md:block">
              <div className="w-24 h-24 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
                <svg
                  className="h-12 w-12 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.5"
                    d="M19.364 12.364a9 9 0 1 1-12.728-12.728 9 9 0 0 1 12.728 12.728Z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.5"
                    d="M12 8v4l3 3"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        
        <div className="bg-white rounded-xl shadow-md p-4 mb-8">
          <form
            onSubmit={handleSearch}
            className="grid grid-cols-1 md:grid-cols-4 gap-4"
          >
            <div className="md:col-span-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search medicines..."
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <div className="absolute left-3 top-2.5 text-gray-400">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div>
              <select
                className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                value={selectedCategory}
                onChange={handleCategoryChange}
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center bg-gray-50 rounded-xl px-4 py-2 border border-gray-300">
                <input
                  type="checkbox"
                  id="inStock"
                  checked={showInStock}
                  onChange={() => setShowInStock(!showInStock)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="inStock" className="ml-2 text-gray-700">
                  In Stock Only
                </label>
              </div>
            </div>
          </form>
        </div>

        
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <>
            {medicines.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl shadow-md">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No medicines found
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Try changing your search criteria or check back later.
                </p>
              </div>
            ) : (
              <motion.div
                layout
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              >
                <AnimatePresence>
                  {medicines.map((medicine) => (
                    <motion.div
                      key={medicine.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow duration-300"
                    >
                      <div className="relative h-48 bg-gray-200">
                        {medicine.image_url ? (
                          <CorsImage
                            src={medicine.image_url}
                            alt={medicine.name}
                            className="w-full h-full object-cover"
                            onError={() => {
                              console.log("Failed to load image:", medicine.image_url);
                            }}
                            onLoad={() => {
                              console.log("Image loaded successfully:", medicine.image_url);
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-indigo-50">
                            <svg
                              className="h-16 w-16 text-indigo-300"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="1.5"
                                d="M19.364 12.364a9 9 0 1 1-12.728-12.728 9 9 0 0 1 12.728 12.728Z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="1.5"
                                d="M12 8v4l3 3"
                              />
                            </svg>
                          </div>
                        )}

                        {medicine.discount_price && (
                          <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                            {calculateDiscount(
                              medicine.price,
                              medicine.discount_price
                            )}
                            % OFF
                          </div>
                        )}

                        {medicine.prescription_required && (
                          <div className="absolute bottom-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                            Prescription Required
                          </div>
                        )}

                        {!medicine.in_stock && (
                          <div className="absolute inset-0 bg-gray-900 bg-opacity-70 flex items-center justify-center">
                            <span className="text-white font-bold px-3 py-1 rounded-full bg-red-500">
                              Out of Stock
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold text-gray-800 text-lg leading-tight">
                            {medicine.name}
                          </h3>
                          <div className="flex items-center space-x-1">
                            {medicine.in_stock ? (
                              <span className="h-2 w-2 bg-green-500 rounded-full"></span>
                            ) : (
                              <span className="h-2 w-2 bg-red-500 rounded-full"></span>
                            )}
                          </div>
                        </div>

                        <p className="text-sm text-gray-500 mb-2 line-clamp-2">
                          {medicine.description || "No description available"}
                        </p>

                        <div className="text-sm mb-2">
                          <span className="text-gray-600">Manufacturer:</span>{" "}
                          <span className="font-medium">
                            {medicine.manufacturer || "Unknown"}
                          </span>
                        </div>

                        <div className="flex items-end justify-between">
                          <div>
                            {medicine.discount_price ? (
                              <div className="flex items-center">
                                <span className="text-lg font-bold text-indigo-600">
                                  Rs. {medicine.discount_price}
                                </span>
                                <span className="ml-2 text-sm text-gray-500 line-through">
                                  Rs. {medicine.price}
                                </span>
                              </div>
                            ) : (
                              <span className="text-lg font-bold text-indigo-600">
                                Rs. {medicine.price}
                              </span>
                            )}
                          </div>

                          <Link
                            to={`/dashboard/medicine/${medicine.id}`}
                            className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium hover:bg-indigo-200 transition-colors"
                          >
                            Details
                          </Link>
                        </div>

                        {medicine.prescription_required && !eligibleMedicineIds.has(medicine.id) ? (
                          <Link
                            to="/dashboard/prescriptions"
                            className="mt-3 flex items-center justify-center w-full px-3 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                          >
                            Requires a doctor's prescription
                          </Link>
                        ) : (
                          <button
                            type="button"
                            disabled={!medicine.in_stock}
                            onClick={() => {
                              addItem(medicine, 1);
                              toast.success(`${medicine.name} added to cart`);
                            }}
                            className="mt-3 w-full px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {medicine.in_stock ? "Add to Cart" : "Out of Stock"}
                          </button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            )}

            
            {pagination.pages > 1 && (
              <div className="mt-8 flex justify-center">
                <nav
                  className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                  aria-label="Pagination"
                >
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                      pagination.page === 1
                        ? "text-gray-300 cursor-not-allowed"
                        : "text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    <span className="sr-only">Previous</span>
                    <svg
                      className="h-5 w-5"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>

                  {[...Array(pagination.pages)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => handlePageChange(i + 1)}
                      className={`relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium ${
                        pagination.page === i + 1
                          ? "z-10 bg-indigo-50 border-indigo-500 text-indigo-600"
                          : "text-gray-500 hover:bg-gray-50"
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}

                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.pages}
                    className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                      pagination.page === pagination.pages
                        ? "text-gray-300 cursor-not-allowed"
                        : "text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    <span className="sr-only">Next</span>
                    <svg
                      className="h-5 w-5"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </nav>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default MedicineStorePage;
