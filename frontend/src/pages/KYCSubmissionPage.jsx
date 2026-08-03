import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast, Toaster } from "sonner";
import DashboardLayout from "../components/layouts/DashboardLayout";
import { useAuth } from "../context/AuthContext";
import { getKYCStatus, submitKYC } from "../services/KycService";

const KYCSubmissionPage = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    citizenship_front_file: null,
    citizenship_back_file: null,
    citizenship_front_preview: "",
    citizenship_back_preview: "",
    permanent_address: {
      street: "",
      city: "",
      state: "",
      postalCode: "",
      country: "",
    },
    temporary_address: {
      street: "",
      city: "",
      state: "",
      postalCode: "",
      country: "",
      sameAsPermanent: false,
    },
  });


  useEffect(() => {
    const fetchKYCStatus = async () => {
      try {
        const data = await getKYCStatus();

        if (data.status && data.status !== "Not Submitted") {
          navigate("/dashboard/kyc-status");
        }
      } catch (err) {
        console.error("Error fetching KYC status:", err);
      }
    };

    fetchKYCStatus();
  }, [navigate]);


  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent],
          [child]: value,
        },
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };


  const handleFileChange = (e) => {
    const { name, files } = e.target;

    if (files && files[0]) {
      const file = files[0];
      const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
      if (!allowedTypes.includes(file.type)) {
        toast.error("Only images (JPEG, PNG, JPG) are allowed");
        return;
      }

      const fileKey =
        name === "citizenship_front"
          ? "citizenship_front_file"
          : "citizenship_back_file";
      const previewKey =
        name === "citizenship_front"
          ? "citizenship_front_preview"
          : "citizenship_back_preview";


      setFormData((prev) => ({
        ...prev,
        [fileKey]: file,
      }));


      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({
          ...prev,
          [previewKey]: reader.result,
        }));
      };
      reader.readAsDataURL(file);
    }
  };


  const handleSameAddressChange = (e) => {
    const { checked } = e.target;

    setFormData({
      ...formData,
      temporary_address: {
        ...formData.temporary_address,
        sameAsPermanent: checked,
        ...(checked
          ? {
            street: formData.permanent_address.street,
            city: formData.permanent_address.city,
            state: formData.permanent_address.state,
            postalCode: formData.permanent_address.postalCode,
            country: formData.permanent_address.country,
          }
          : {}),
      },
    });
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);


    if (!formData.citizenship_front_file || !formData.citizenship_back_file) {
      setError("Please upload both front and back citizenship documents");
      setLoading(false);
      return;
    }

    try {


      await submitKYC({
        citizenship_front_file: formData.citizenship_front_file,
        citizenship_back_file: formData.citizenship_back_file,
        permanent_address: formData.permanent_address,
        temporary_address: formData.temporary_address.sameAsPermanent
          ? formData.permanent_address
          : formData.temporary_address,
      });


      if (typeof updateUser === "function") {

        updateUser({
          ...user,
          kyc_status: "In-Review",
        });
      } else {

        console.log(
          "Note: User context couldn't be updated automatically, but KYC was submitted successfully"
        );
      }


      toast.success("KYC information submitted successfully");


      setTimeout(() => {
        navigate("/dashboard");
      }, 1500);
    } catch (err) {
      console.error("Error in submission:", err);

      toast.error(err.error || "Failed to submit KYC information");
      setError(
        err.error || "Failed to submit KYC information. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>

      <Toaster position="top-right" richColors closeButton />

      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          KYC Verification
        </h1>

        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-500"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white shadow-md rounded-lg p-6 mb-8">
          <p className="text-gray-600 mb-6">
            To verify your identity, please provide the following information.
            This helps us ensure security and trust within our platform.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">

            <div className="space-y-4">
              <h2 className="text-lg font-medium text-gray-900 border-b pb-2">
                Identity Documents
              </h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Citizenship Front Side <span className="text-red-500">*</span>
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                  <div className="space-y-1 text-center">
                    {formData.citizenship_front_preview ? (
                      <div>
                        <img
                          src={formData.citizenship_front_preview}
                          alt="Citizenship Front Preview"
                          className="mx-auto h-32 object-cover rounded-md"
                        />
                        <p className="text-xs text-gray-500 mt-2">
                          Click "Choose File" to change
                        </p>
                      </div>
                    ) : (
                      <svg
                        className="mx-auto h-12 w-12 text-gray-400"
                        stroke="currentColor"
                        fill="none"
                        viewBox="0 0 48 48"
                      >
                        <path
                          d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}

                    <div className="flex text-sm text-gray-600">
                      <label
                        htmlFor="citizenship_front"
                        className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none"
                      >
                        <span>Choose File</span>
                        <input
                          id="citizenship_front"
                          name="citizenship_front"
                          type="file"
                          accept="image/*"
                          className="sr-only"
                          onChange={handleFileChange}
                          required={!formData.citizenship_front_file}
                        />
                      </label>
                    </div>
                    <p className="text-xs text-gray-500">
                      PNG, JPG, GIF up to 5MB
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Citizenship Back Side <span className="text-red-500">*</span>
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                  <div className="space-y-1 text-center">
                    {formData.citizenship_back_preview ? (
                      <div>
                        <img
                          src={formData.citizenship_back_preview}
                          alt="Citizenship Back Preview"
                          className="mx-auto h-32 object-cover rounded-md"
                        />
                        <p className="text-xs text-gray-500 mt-2">
                          Click "Choose File" to change
                        </p>
                      </div>
                    ) : (
                      <svg
                        className="mx-auto h-12 w-12 text-gray-400"
                        stroke="currentColor"
                        fill="none"
                        viewBox="0 0 48 48"
                      >
                        <path
                          d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}

                    <div className="flex text-sm text-gray-600">
                      <label
                        htmlFor="citizenship_back"
                        className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none"
                      >
                        <span>Choose File</span>
                        <input
                          id="citizenship_back"
                          name="citizenship_back"
                          type="file"
                          accept="image/*"
                          className="sr-only"
                          onChange={handleFileChange}
                          required={!formData.citizenship_back_file}
                        />
                      </label>
                    </div>
                    <p className="text-xs text-gray-500">
                      PNG, JPG, GIF up to 5MB
                    </p>
                  </div>
                </div>
              </div>
            </div>


            <div className="space-y-4">
              <h2 className="text-lg font-medium text-gray-900 border-b pb-2">
                Permanent Address
              </h2>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="permanent_address.street"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Street/Locality <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="permanent_address.street"
                    id="permanent_address.street"
                    value={formData.permanent_address.street}
                    onChange={handleChange}
                    required
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="permanent_address.city"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    City <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="permanent_address.city"
                    id="permanent_address.city"
                    value={formData.permanent_address.city}
                    onChange={handleChange}
                    required
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="permanent_address.state"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    State/Province <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="permanent_address.state"
                    id="permanent_address.state"
                    value={formData.permanent_address.state}
                    onChange={handleChange}
                    required
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="permanent_address.postalCode"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Postal Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="permanent_address.postalCode"
                    id="permanent_address.postalCode"
                    value={formData.permanent_address.postalCode}
                    onChange={handleChange}
                    required
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label
                    htmlFor="permanent_address.country"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Country <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="permanent_address.country"
                    name="permanent_address.country"
                    value={formData.permanent_address.country}
                    onChange={handleChange}
                    required
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select a country</option>
                    <option value="Nepal">Nepal</option>
                    <option value="India">India</option>
                    <option value="United States">United States</option>
                    <option value="Canada">Canada</option>
                    <option value="United Kingdom">United Kingdom</option>

                  </select>
                </div>
              </div>
            </div>


            <div className="space-y-4">
              <div className="flex justify-between items-center border-b pb-2">
                <h2 className="text-lg font-medium text-gray-900">
                  Temporary Address
                </h2>
                <div className="flex items-center">
                  <input
                    id="same-address"
                    name="same-address"
                    type="checkbox"
                    checked={formData.temporary_address.sameAsPermanent}
                    onChange={handleSameAddressChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor="same-address"
                    className="ml-2 text-sm text-gray-700"
                  >
                    Same as permanent address
                  </label>
                </div>
              </div>

              {!formData.temporary_address.sameAsPermanent && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="temporary_address.street"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Street/Locality
                    </label>
                    <input
                      type="text"
                      name="temporary_address.street"
                      id="temporary_address.street"
                      value={formData.temporary_address.street}
                      onChange={handleChange}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="temporary_address.city"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      City
                    </label>
                    <input
                      type="text"
                      name="temporary_address.city"
                      id="temporary_address.city"
                      value={formData.temporary_address.city}
                      onChange={handleChange}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="temporary_address.state"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      State/Province
                    </label>
                    <input
                      type="text"
                      name="temporary_address.state"
                      id="temporary_address.state"
                      value={formData.temporary_address.state}
                      onChange={handleChange}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="temporary_address.postalCode"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Postal Code
                    </label>
                    <input
                      type="text"
                      name="temporary_address.postalCode"
                      id="temporary_address.postalCode"
                      value={formData.temporary_address.postalCode}
                      onChange={handleChange}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label
                      htmlFor="temporary_address.country"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Country
                    </label>
                    <select
                      id="temporary_address.country"
                      name="temporary_address.country"
                      value={formData.temporary_address.country}
                      onChange={handleChange}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select a country</option>
                      <option value="Nepal">Nepal</option>
                      <option value="India">India</option>
                      <option value="United States">United States</option>
                      <option value="Canada">Canada</option>
                      <option value="United Kingdom">United Kingdom</option>

                    </select>
                  </div>
                </div>
              )}
            </div>


            <div className="space-y-4">
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="consent"
                    name="consent"
                    type="checkbox"
                    required
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label
                    htmlFor="consent"
                    className="font-medium text-gray-700"
                  >
                    I hereby certify that the information provided is true and
                    accurate
                  </label>
                  <p className="text-gray-500">
                    By submitting this form, you agree to our verification
                    process and privacy policy.
                  </p>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {loading ? (
                    <>
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
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        ></path>
                      </svg>
                      Submitting...
                    </>
                  ) : (
                    "Submit for Verification"
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default KYCSubmissionPage;
