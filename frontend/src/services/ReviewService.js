import API from "../utils/axios";

const ReviewService = {
  submitReview: async (appointmentId, data) => {
    try {
      const response = await API.post(`/reviews/appointments/${appointmentId}`, data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: "Failed to submit review" };
    }
  },

  getAppointmentReview: async (appointmentId) => {
    try {
      const response = await API.get(`/reviews/appointments/${appointmentId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: "Failed to fetch review status" };
    }
  },

  getDoctorReviews: async (doctorId, page = 1) => {
    try {
      const response = await API.get(`/reviews/doctors/${doctorId}?page=${page}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: "Failed to fetch reviews" };
    }
  },

  getMyReviews: async (page = 1) => {
    try {
      const response = await API.get(`/reviews/mine?page=${page}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: "Failed to fetch reviews" };
    }
  },

  getAllReviews: async (page = 1) => {
    try {
      const response = await API.get(`/reviews?page=${page}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: "Failed to fetch reviews" };
    }
  },
};

export default ReviewService;
