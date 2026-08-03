import { useState } from "react";
import ReCAPTCHA from "react-google-recaptcha";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const SignupPage = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "Patient",
    phone_number: "",
    date_of_birth: "",
    gender: "",
    nmc_number: "",
    speciality: "",
    educational_qualification: "",
    years_of_experience: "",
    former_organisation: "",
    cv_url: "",
  });

  const [captchaToken, setCaptchaToken] = useState(null);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const { signup, loading, error } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === "password") {
      calculatePasswordStrength(value);
    }
  };

  const calculatePasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    setPasswordStrength(strength);
  };

  const getStrengthText = () => {
    if (formData.password.length === 0) return "";
    const texts = ["Weak", "Fair", "Good", "Strong"];
    return texts[passwordStrength - 1] || "Very Weak";
  };

  const getStrengthColor = () => {
    const colors = [
      "bg-red-500",
      "bg-orange-500",
      "bg-yellow-500",
      "bg-green-500",
    ];
    return colors[passwordStrength - 1] || "bg-gray-300";
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) {
      setPhotoFile(null);
      setPhotoPreview(null);
      return;
    }

    if (!["image/jpeg", "image/jpg", "image/png"].includes(file.type)) {
      setFormError("Profile photo must be a JPG or PNG image");
      e.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setFormError("Profile photo must be smaller than 5MB");
      e.target.value = "";
      return;
    }

    setFormError("");
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const validateForm = () => {
    if (
      !formData.name.trim() ||
      !formData.email.trim() ||
      !formData.password.trim()
    ) {
      setFormError("Name, email, and password are required");
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setFormError("Passwords do not match");
      return false;
    }
    if (formData.password.length < 6) {
      setFormError("Password must be at least 6 characters long");
      return false;
    }

    if (!captchaToken) {
      setFormError("Please complete the CAPTCHA verification");
      return false;
    }

    if (formData.role === "Doctor") {
      if (
        !formData.nmc_number ||
        !formData.speciality ||
        !formData.educational_qualification
      ) {
        setFormError(
          "NMC number, speciality, and educational qualification are required for doctors"
        );
        return false;
      }

      if (!photoFile) {
        setFormError("A profile photo is required for doctors");
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setSuccessMessage("");
    console.log("Submitting with captchaToken:", captchaToken);

    if (!validateForm()) return;

    try {
      const { confirmPassword, ...signupData } = formData;

      let payload;
      if (formData.role === "Doctor") {
        payload = new FormData();
        Object.entries(signupData).forEach(([key, value]) => {
          if (value !== null && value !== undefined) {
            payload.append(key, value);
          }
        });
        payload.append("captchaToken", captchaToken);
        payload.append("photo", photoFile);
      } else {
        payload = { ...signupData, captchaToken };
      }

      const response = await signup(payload);
      setSuccessMessage(response.message);

      setTimeout(() => {
        navigate(`/verify-email?email=${encodeURIComponent(formData.email)}`, {
          state: { email: formData.email },
        });
      }, 1500);
    } catch (err) {
      console.error("Signup error:", err);
      setFormError(err.message || "An error occurred during signup");
    }
  };

  const handleRoleToggle = (role) => {
    setFormData((prev) => ({
      ...prev,
      role,
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-6xl flex flex-col lg:flex-row bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="lg:w-1/2 bg-gradient-to-br from-blue-500 to-indigo-600 p-8 lg:p-12 flex flex-col justify-between text-white hidden lg:flex">
          <div>
            <div className="flex items-center space-x-2 mb-12">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              <h1 className="text-2xl font-bold">Bespoke Health</h1>
            </div>
          </div>
        </div>

        <div className="lg:w-1/2 p-8 sm:p-12">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Create Account
            </h2>
            <div className="lg:hidden flex items-center text-blue-600">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              <span className="font-bold">Bespoke Health</span>
            </div>
          </div>

          {successMessage && (
            <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded-md animate-fadeIn">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-green-500"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-green-700">{successMessage}</p>
                  <p className="text-sm text-green-700 mt-1">
                    Redirecting to verification page...
                  </p>
                </div>
              </div>
            </div>
          )}

          {(error || formError) && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-md animate-fadeIn">
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
                <div className="ml-3

">
                  <p className="text-sm text-red-700">{formError || error}</p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2 mb-8">
            <p className="text-gray-600">Already have an account?</p>
            <Link
              to="/login"
              className="block w-full py-3 px-4 border border-blue-600 text-blue-600 font-medium rounded-lg text-center hover:bg-blue-50 transition-colors duration-300"
            >
              Sign in
            </Link>
          </div>

          <div className="mb-8">
            <p className="text-sm font-medium text-gray-700 mb-2">
              I want to register as:
            </p>
            <div className="bg-gray-100 rounded-lg p-1 flex">
              <button
                type="button"
                onClick={() => handleRoleToggle("Patient")}
                className={`flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-colors duration-200 ${formData.role === "Patient"
                  ? "bg-white text-blue-700 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
                  }`}
              >
                Patient
              </button>
              <button
                type="button"
                onClick={() => handleRoleToggle("Doctor")}
                className={`flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-colors duration-200 ${formData.role === "Doctor"
                  ? "bg-white text-blue-700 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
                  }`}
              >
                Doctor
              </button>
            </div>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-800">
                Basic Information
              </h3>
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-300"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Email address <span className="text-red-500">*</span>
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-300"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-300"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                  />
                  {formData.password && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between mb-1">
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div
                            className={`h-2.5 rounded-full ${getStrengthColor()}`}
                            style={{ width: `${passwordStrength * 25}%` }}
                          ></div>
                        </div>
                        <span className="text-xs font-medium text-gray-500 ml-2 w-16">
                          {getStrengthText()}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        Use 8+ characters with letters, numbers & symbols
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Confirm Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-300"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            {formData.role === "Patient" ? (
              <div className="space-y-4 pt-4 border-t border-gray-200">
                <h3 className="text-lg font-medium text-gray-800">
                  Patient Information
                </h3>

                <div>
                  <label
                    htmlFor="phone_number"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Phone Number
                  </label>
                  <input
                    id="phone_number"
                    name="phone_number"
                    type="tel"
                    className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-300"
                    placeholder="98XXXXXXXX"
                    value={formData.phone_number}
                    onChange={handleChange}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="date_of_birth"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Date of Birth
                    </label>
                    <input
                      id="date_of_birth"
                      name="date_of_birth"
                      type="date"
                      className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-300"
                      value={formData.date_of_birth}
                      onChange={handleChange}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="gender"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Gender
                    </label>
                    <select
                      id="gender"
                      name="gender"
                      className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-300"
                      value={formData.gender}
                      onChange={handleChange}
                    >
                      <option value="">Select gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                      <option value="Prefer not to say">
                        Prefer not to say
                      </option>
                    </select>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4 pt-4 border-t border-gray-200">
                <h3 className="text-lg font-medium text-gray-800">
                  Doctor Information
                </h3>

                <div>
                  <label
                    htmlFor="photo"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Profile Photo <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-4">
                    {photoPreview ? (
                      <img
                        src={photoPreview}
                        alt="Profile preview"
                        className="h-16 w-16 rounded-full object-cover border border-gray-300"
                      />
                    ) : (
                      <div className="h-16 w-16 rounded-full bg-gray-100 border border-gray-300 flex items-center justify-center text-gray-400">
                        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                    )}
                    <input
                      id="photo"
                      name="photo"
                      type="file"
                      accept="image/jpeg,image/jpg,image/png"
                      onChange={handlePhotoChange}
                      className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    JPG or PNG, up to 5MB. Patients will see this on your profile.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="nmc_number"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      NMC Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="nmc_number"
                      name="nmc_number"
                      type="text"
                      required
                      className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-300"
                      placeholder="12345678"
                      value={formData.nmc_number}
                      onChange={handleChange}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="speciality"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Speciality <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="speciality"
                      name="speciality"
                      type="text"
                      required
                      className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-300"
                      placeholder="Cardiology"
                      value={formData.speciality}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="educational_qualification"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Educational Qualification{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="educational_qualification"
                    name="educational_qualification"
                    type="text"
                    required
                    className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-300"
                    placeholder="MBBS, MD, etc."
                    value={formData.educational_qualification}
                    onChange={handleChange}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="years_of_experience"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Years of Experience
                    </label>
                    <input
                      id="years_of_experience"
                      name="years_of_experience"
                      type="number"
                      min="0"
                      className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-300"
                      placeholder="5"
                      value={formData.years_of_experience}
                      onChange={handleChange}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="former_organisation"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Former Organization
                    </label>
                    <input
                      id="former_organisation"
                      name="former_organisation"
                      type="text"
                      className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-300"
                      placeholder="TU Teaching"
                      value={formData.former_organisation}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="cv_url"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    CV/Resume URL
                  </label>
                  <input
                    id="cv_url"
                    name="cv_url"
                    type="url"
                    className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-300"
                    placeholder="https://example.com/my-cv.pdf"
                    value={formData.cv_url}
                    onChange={handleChange}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Link to an online copy of your CV (Google Drive, Dropbox,
                    etc.)
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CAPTCHA Verification <span className="text-red-500">*</span>
              </label>
              <ReCAPTCHA
                sitekey="6Lf0YI8rAAAAAF843BSQgiExArvCCtZNdKEEcUdh"
                onChange={(token) => setCaptchaToken(token)}
                onErrored={() => {
                  setCaptchaToken(null);
                  setFormError("CAPTCHA verification failed. Please try again.");
                }}
                onExpired={() => {
                  setCaptchaToken(null);
                  setFormError("CAPTCHA has expired. Please try again.");
                }}
              />
            </div>

            <div className="mt-8">
              <button
                type="submit"
                disabled={loading || successMessage || !captchaToken}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors duration-300"
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
                    Creating account...
                  </span>
                ) : (
                  "Create Account"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const BenefitItem = ({ text }) => {
  return (
    <div className="flex items-start">
      <div className="flex-shrink-0 h-5 w-5 text-blue-300">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
      </div>
      <p className="ml-2 text-sm text-blue-100">{text}</p>
    </div>
  );
};

export default SignupPage;