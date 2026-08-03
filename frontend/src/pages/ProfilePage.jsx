import { useState, useEffect } from "react";
import { toast } from "sonner";
import API from "../utils/axios";
import DashboardLayout from "../components/layouts/DashboardLayout";
import { uploadDoctorPhoto } from "../services/DoctorService";
import DoctorAvatar from "../components/common/DoctorAvatar";

const ProfilePage = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await API.get("/auth/profile");
      setProfile(response.data);
      setFormData(response.data);
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!["image/jpeg", "image/jpg", "image/png"].includes(file.type)) {
      toast.error("Profile photo must be a JPG or PNG image");
      e.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Profile photo must be smaller than 5MB");
      e.target.value = "";
      return;
    }

    try {
      setUploadingPhoto(true);
      const response = await uploadDoctorPhoto(file);
      setProfile((prev) => ({
        ...prev,
        doctorProfile: { ...prev.doctorProfile, image_url: response.image_url },
      }));
      setFormData((prev) => ({
        ...prev,
        doctorProfile: { ...prev.doctorProfile, image_url: response.image_url },
      }));
      toast.success("Profile photo updated");
    } catch (error) {
      console.error("Error uploading photo:", error);
      toast.error(error.error || "Failed to upload photo");
    } finally {
      setUploadingPhoto(false);
      e.target.value = "";
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await API.put("/auth/profile", formData);
      setProfile(formData);
      setEditing(false);
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error(error.response?.data?.error || "Failed to update profile");
    } finally {
      setSaving(false);
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
    if (passwordData.newPassword.length === 0) return "";
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

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (!passwordData.currentPassword) {
      toast.error("Please enter your current password");
      return;
    }

    if (!passwordData.newPassword) {
      toast.error("Please enter a new password");
      return;
    }

    if (!passwordData.confirmPassword) {
      toast.error("Please confirm your new password");
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    if (passwordData.currentPassword === passwordData.newPassword) {
      toast.error("New password cannot be the same as current password");
      return;
    }

    const passwordStrengthRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;
    if (!passwordStrengthRegex.test(passwordData.newPassword)) {
      toast.error("Password must be at least 8 characters long and include uppercase, lowercase, number, and special character");
      return;
    }

    try {
      setChangingPassword(true);
      const response = await API.put("/auth/change-password", {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      
      if (response.status === 200) {
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: ""
        });
        setShowPasswordChange(false);
        toast.success("Password changed successfully");
      }
    } catch (error) {
      console.error("Error changing password:", error);
      const errorMessage = error.response?.data?.error || "Failed to change password";
      
      if (errorMessage.includes("last 5 passwords")) {
        toast.error("Password cannot be any of your last 5 passwords. Please choose a different password.");
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setChangingPassword(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Not provided";
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold text-gray-900">Profile not found</h2>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        {}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
              <p className="mt-2 text-gray-600">Manage your account information and preferences</p>
            </div>
            <button
              onClick={() => setEditing(!editing)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {editing ? "Cancel" : "Edit Profile"}
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="bg-white shadow rounded-lg">
            {}
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  {editing ? (
                    <input
                      type="text"
                      name="name"
                      value={formData.name || ""}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  ) : (
                    <p className="text-gray-900">{profile.name || "Not provided"}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <p className="text-gray-900">{profile.email}</p>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${
                    profile.email_verified ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                  }`}>
                    {profile.email_verified ? "Verified" : "Not Verified"}
                  </span>
                </div>
              </div>
            </div>

            {}
            {profile.role === "Doctor" && profile.doctorProfile && (
              <>
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                  <h2 className="text-lg font-semibold text-gray-900">Professional Information</h2>
                </div>
                <div className="px-6 py-4 space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="border border-gray-300 rounded-full">
                      <DoctorAvatar
                        name={profile.name}
                        imageUrl={profile.doctorProfile.image_url}
                        sizeClass="h-20 w-20"
                        textClass="text-2xl"
                        fallbackClass="bg-gray-100 text-gray-400"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="profile-photo"
                        className="inline-block px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 cursor-pointer transition-colors"
                      >
                        {uploadingPhoto ? "Uploading..." : "Change Photo"}
                      </label>
                      <input
                        id="profile-photo"
                        type="file"
                        accept="image/jpeg,image/jpg,image/png"
                        className="hidden"
                        disabled={uploadingPhoto}
                        onChange={handlePhotoChange}
                      />
                      <p className="mt-1 text-xs text-gray-500">JPG or PNG, up to 5MB</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        NMC Number
                      </label>
                      {editing ? (
                        <input
                          type="text"
                          name="nmc_number"
                          value={formData.doctorProfile?.nmc_number || ""}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            doctorProfile: { ...prev.doctorProfile, nmc_number: e.target.value }
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      ) : (
                        <p className="text-gray-900">{profile.doctorProfile.nmc_number || "Not provided"}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Speciality
                      </label>
                      {editing ? (
                        <input
                          type="text"
                          name="speciality"
                          value={formData.doctorProfile?.speciality || ""}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            doctorProfile: { ...prev.doctorProfile, speciality: e.target.value }
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      ) : (
                        <p className="text-gray-900">{profile.doctorProfile.speciality || "Not provided"}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Educational Qualification
                      </label>
                      {editing ? (
                        <input
                          type="text"
                          name="educational_qualification"
                          value={formData.doctorProfile?.educational_qualification || ""}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            doctorProfile: { ...prev.doctorProfile, educational_qualification: e.target.value }
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      ) : (
                        <p className="text-gray-900">{profile.doctorProfile.educational_qualification || "Not provided"}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Years of Experience
                      </label>
                      {editing ? (
                        <input
                          type="number"
                          name="years_of_experience"
                          value={formData.doctorProfile?.years_of_experience || ""}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            doctorProfile: { ...prev.doctorProfile, years_of_experience: parseInt(e.target.value) }
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          min="0"
                          required
                        />
                      ) : (
                        <p className="text-gray-900">{profile.doctorProfile.years_of_experience || "Not provided"} years</p>
                      )}
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Former Organisation
                      </label>
                      {editing ? (
                        <input
                          type="text"
                          name="former_organisation"
                          value={formData.doctorProfile?.former_organisation || ""}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            doctorProfile: { ...prev.doctorProfile, former_organisation: e.target.value }
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <p className="text-gray-900">{profile.doctorProfile.former_organisation || "Not provided"}</p>
                      )}
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        CV/Resume URL
                      </label>
                      {editing ? (
                        <input
                          type="url"
                          name="cv_url"
                          value={formData.doctorProfile?.cv_url || ""}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            doctorProfile: { ...prev.doctorProfile, cv_url: e.target.value }
                          }))}
                          placeholder="https://example.com/my-cv.pdf"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : profile.doctorProfile.cv_url ? (
                        <a
                          href={profile.doctorProfile.cv_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          View CV
                        </a>
                      ) : (
                        <p className="text-gray-900">Not provided</p>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}

            {profile.role === "Patient" && profile.patientProfile && (
              <>
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                  <h2 className="text-lg font-semibold text-gray-900">Personal Information</h2>
                </div>
                <div className="px-6 py-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number
                      </label>
                      {editing ? (
                        <input
                          type="tel"
                          name="phone_number"
                          value={formData.patientProfile?.phone_number || ""}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            patientProfile: { ...prev.patientProfile, phone_number: e.target.value }
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <p className="text-gray-900">{profile.patientProfile.phone_number || "Not provided"}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Date of Birth
                      </label>
                      {editing ? (
                        <input
                          type="date"
                          name="date_of_birth"
                          value={formData.patientProfile?.date_of_birth ? new Date(formData.patientProfile.date_of_birth).toISOString().split('T')[0] : ""}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            patientProfile: { ...prev.patientProfile, date_of_birth: e.target.value }
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <p className="text-gray-900">{formatDate(profile.patientProfile.date_of_birth)}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Gender
                      </label>
                      {editing ? (
                        <select
                          name="gender"
                          value={formData.patientProfile?.gender || ""}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            patientProfile: { ...prev.patientProfile, gender: e.target.value }
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select Gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      ) : (
                        <p className="text-gray-900">{profile.patientProfile.gender || "Not provided"}</p>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}

            {}
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Password</h2>
                <button
                  type="button"
                  onClick={() => setShowPasswordChange(!showPasswordChange)}
                  className="px-4 py-2 text-blue-600 hover:text-blue-700 font-medium"
                >
                  {showPasswordChange ? "Cancel" : "Change Password"}
                </button>
              </div>
            </div>

            {showPasswordChange && (
              <div className="px-6 py-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Current Password
                    </label>
                    <input
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div></div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => {
                        setPasswordData(prev => ({ ...prev, newPassword: e.target.value }));
                        calculatePasswordStrength(e.target.value);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    {passwordData.newPassword && (
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>
                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={handlePasswordChange}
                    disabled={changingPassword}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {changingPassword ? "Changing..." : "Change Password"}
                  </button>
                </div>
              </div>
            )}

            {}
            {editing && (
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(false);
                      setFormData(profile);
                    }}
                    className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default ProfilePage;