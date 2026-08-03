import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import API from "../../utils/axios";
import ConfirmModal from "../../components/common/ConfirmModal";

const MedicineManagementPage = () => {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    pages: 1,
  });
  const emptyFormData = {
    name: "",
    description: "",
    manufacturer: "",
    price: "",
    discount_price: "",
    category: "",
    in_stock: true,
    quantity: "0",
    prescription_required: false,
  };
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState(null);
  const [formData, setFormData] = useState(emptyFormData);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchMedicines = async (page = pagination.page) => {
    try {
      setLoading(true);
      const response = await API.get("/medicines/admin/all", {
        params: { page, limit: 10 },
      });

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

  useEffect(() => {
    fetchMedicines(pagination.page);

  }, [pagination.page]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
      if (!allowedTypes.includes(file.type)) {
        toast.error("Only images (JPEG, PNG, JPG) are allowed");
        setImageFile(null);
        setImagePreview(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        return;
      }
      setImageFile(file);

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setImageFile(null);
      setImagePreview(null);
    }
  };

  const handleClearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const openAddModal = () => {
    setEditingMedicine(null);
    setFormData(emptyFormData);
    setImageFile(null);
    setImagePreview(null);
    setIsModalOpen(true);
  };

  const openEditModal = (medicine) => {
    setEditingMedicine(medicine);
    setFormData({
      name: medicine.name || "",
      description: medicine.description || "",
      manufacturer: medicine.manufacturer || "",
      price: medicine.price ?? "",
      discount_price: medicine.discount_price ?? "",
      category: medicine.category || "",
      in_stock: medicine.in_stock,
      quantity: String(medicine.quantity ?? "0"),
      prescription_required: medicine.prescription_required,
    });
    setImageFile(null);
    setImagePreview(medicine.image_url || null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setIsSubmitting(true);

      if (!formData.name || !formData.price) {
        toast.error("Name and price are required");
        return;
      }

      const medicineFormData = new FormData();

      Object.keys(formData).forEach((key) => {
        if (key === "in_stock" || key === "prescription_required") {
          medicineFormData.append(key, formData[key] ? "true" : "false");
        } else if (
          key === "price" ||
          key === "discount_price" ||
          key === "quantity"
        ) {
          if (formData[key]) {
            medicineFormData.append(key, formData[key]);
          }
        } else if (formData[key]) {
          medicineFormData.append(key, formData[key]);
        }
      });

      if (imageFile) {
        medicineFormData.append("image", imageFile);
      }

      if (editingMedicine) {
        await API.put(`/medicines/${editingMedicine.id}`, medicineFormData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("Medicine updated successfully");
      } else {
        await API.post("/medicines/add", medicineFormData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("Medicine added successfully");
      }

      setIsModalOpen(false);
      setEditingMedicine(null);
      setFormData(emptyFormData);
      setImageFile(null);
      setImagePreview(null);

      await fetchMedicines(editingMedicine ? pagination.page : 1);
    } catch (error) {
      toast.error(editingMedicine ? "Failed to update medicine" : "Failed to add medicine");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMedicine = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      await API.delete(`/medicines/${deleteTarget.id}`);
      toast.success("Medicine deleted successfully");
      setDeleteTarget(null);
      await fetchMedicines(pagination.page);
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to delete medicine");
      console.error(error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      setPagination((prev) => ({ ...prev, page: newPage }));
    }
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">
            Medicine Management
          </h1>
          <button
            onClick={openAddModal}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            Add New Medicine
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <>
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Name
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Category
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Price
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Stock
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Prescription
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {medicines.length === 0 ? (
                      <tr>
                        <td
                          colSpan="6"
                          className="px-6 py-4 text-center text-sm text-gray-500"
                        >
                          No medicines found
                        </td>
                      </tr>
                    ) : (
                      medicines.map((medicine) => (
                        <tr key={medicine.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                {medicine.image_url ? (
                                  <img
                                    className="h-10 w-10 rounded-full object-cover"
                                    src={medicine.image_url.replace(
                                      "/uploads/",
                                      "/api/uploads/"
                                    )}
                                    alt="medicine image"
                                  />
                                ) : (
                                  <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                                    <span className="text-indigo-600 font-medium text-xs">
                                      {medicine.name
                                        .substring(0, 2)
                                        .toUpperCase()}
                                    </span>
                                  </div>
                                )}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {medicine.name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {medicine.manufacturer}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {medicine.category || "N/A"}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {medicine.discount_price ? (
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  Rs. {medicine.discount_price}
                                </div>
                                <div className="text-sm text-gray-500 line-through">
                                  Rs. {medicine.price}
                                </div>
                              </div>
                            ) : (
                              <div className="text-sm text-gray-900">
                                Rs. {medicine.price}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                medicine.in_stock
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {medicine.in_stock
                                ? `In Stock (${medicine.quantity})`
                                : "Out of Stock"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                medicine.prescription_required
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {medicine.prescription_required
                                ? "Required"
                                : "Not Required"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              type="button"
                              onClick={() => openEditModal(medicine)}
                              className="text-indigo-600 hover:text-indigo-900 mr-3"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(medicine)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {pagination.pages > 1 && (
              <div className="flex justify-center mt-6">
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

        {isModalOpen && (
          <div className="fixed inset-0 z-10 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div
                className="fixed inset-0 transition-opacity"
                aria-hidden="true"
              >
                <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
              </div>

              <span
                className="hidden sm:inline-block sm:align-middle sm:h-screen"
                aria-hidden="true"
              >
                &#8203;
              </span>

              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                      <h3
                        className="text-lg leading-6 font-medium text-gray-900"
                        id="modal-headline"
                      >
                        {editingMedicine ? "Edit Medicine" : "Add New Medicine"}
                      </h3>
                      <div className="mt-4">
                        <form onSubmit={handleSubmit}>
                          <div className="grid grid-cols-1 gap-y-4">
                            <div>
                              <label
                                htmlFor="name"
                                className="block text-sm font-medium text-gray-700"
                              >
                                Name <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                name="name"
                                id="name"
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                value={formData.name}
                                onChange={handleInputChange}
                                required
                              />
                            </div>

                            <div>
                              <label
                                htmlFor="description"
                                className="block text-sm font-medium text-gray-700"
                              >
                                Description
                              </label>
                              <textarea
                                name="description"
                                id="description"
                                rows="3"
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                value={formData.description}
                                onChange={handleInputChange}
                              ></textarea>
                            </div>

                            <div>
                              <label
                                htmlFor="manufacturer"
                                className="block text-sm font-medium text-gray-700"
                              >
                                Manufacturer
                              </label>
                              <input
                                type="text"
                                name="manufacturer"
                                id="manufacturer"
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                value={formData.manufacturer}
                                onChange={handleInputChange}
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label
                                  htmlFor="price"
                                  className="block text-sm font-medium text-gray-700"
                                >
                                  Price <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="number"
                                  name="price"
                                  id="price"
                                  min="0"
                                  step="0.01"
                                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                  value={formData.price}
                                  onChange={handleInputChange}
                                  required
                                />
                              </div>
                              <div>
                                <label
                                  htmlFor="discount_price"
                                  className="block text-sm font-medium text-gray-700"
                                >
                                  Discount Price
                                </label>
                                <input
                                  type="number"
                                  name="discount_price"
                                  id="discount_price"
                                  min="0"
                                  step="0.01"
                                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                  value={formData.discount_price}
                                  onChange={handleInputChange}
                                />
                              </div>
                            </div>

                            <div>
                              <label
                                htmlFor="category"
                                className="block text-sm font-medium text-gray-700"
                              >
                                Category
                              </label>
                              <input
                                type="text"
                                name="category"
                                id="category"
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                value={formData.category}
                                onChange={handleInputChange}
                              />
                            </div>

                            <div>
                              <label
                                htmlFor="image"
                                className="block text-sm font-medium text-gray-700"
                              >
                                Medicine Image
                              </label>
                              <div className="mt-1 flex items-center">
                                <input
                                  type="file"
                                  id="image"
                                  name="image"
                                  accept="image/*"
                                  ref={fileInputRef}
                                  onChange={handleImageChange}
                                  className="sr-only"
                                />
                                <label
                                  htmlFor="image"
                                  className="relative cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
                                >
                                  <span>Choose file</span>
                                </label>
                                {imageFile && (
                                  <button
                                    type="button"
                                    className="ml-2 bg-red-100 text-red-800 text-xs py-1 px-2 rounded-md"
                                    onClick={handleClearImage}
                                  >
                                    Clear
                                  </button>
                                )}
                                <span className="ml-3 text-sm text-gray-500">
                                  {imageFile
                                    ? imageFile.name
                                    : "No file chosen"}
                                </span>
                              </div>
                              {imagePreview && (
                                <div className="mt-2">
                                  <img
                                    src={imagePreview}
                                    alt="Preview"
                                    className="h-24 w-24 object-cover rounded-md"
                                  />
                                </div>
                              )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label
                                  htmlFor="quantity"
                                  className="block text-sm font-medium text-gray-700"
                                >
                                  Quantity
                                </label>
                                <input
                                  type="number"
                                  name="quantity"
                                  id="quantity"
                                  min="0"
                                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                  value={formData.quantity}
                                  onChange={handleInputChange}
                                />
                              </div>
                              <div className="flex items-center h-full pt-6">
                                <input
                                  type="checkbox"
                                  name="in_stock"
                                  id="in_stock"
                                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                  checked={formData.in_stock}
                                  onChange={handleInputChange}
                                />
                                <label
                                  htmlFor="in_stock"
                                  className="ml-2 block text-sm text-gray-700"
                                >
                                  In Stock
                                </label>
                              </div>
                            </div>

                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                name="prescription_required"
                                id="prescription_required"
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                checked={formData.prescription_required}
                                onChange={handleInputChange}
                              />
                              <label
                                htmlFor="prescription_required"
                                className="ml-2 block text-sm text-gray-700"
                              >
                                Prescription Required
                              </label>
                            </div>
                          </div>
                        </form>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm ${
                      isSubmitting ? "opacity-75 cursor-not-allowed" : ""
                    }`}
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center">
                        <svg
                          className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Saving...
                      </span>
                    ) : editingMedicine ? (
                      "Update"
                    ) : (
                      "Save"
                    )}
                  </button>
                  <button
                    type="button"
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                    onClick={() => {
                      setIsModalOpen(false);
                      setEditingMedicine(null);
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {deleteTarget && (
          <ConfirmModal
            title="Delete medicine?"
            message={`Remove "${deleteTarget.name}" from the store? Patients will no longer be able to find or order it.`}
            confirmLabel={isDeleting ? "Deleting..." : "Delete"}
            loading={isDeleting}
            onConfirm={handleDeleteMedicine}
            onCancel={() => setDeleteTarget(null)}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default MedicineManagementPage;
