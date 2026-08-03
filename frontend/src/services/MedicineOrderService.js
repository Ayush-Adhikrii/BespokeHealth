import API from "../utils/axios";

const MedicineOrderService = {
  createOrder: async (items) => {
    try {
      const response = await API.post("/medicine-orders", { items });
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: "Failed to create order" };
    }
  },

  confirmOrderPayment: async (orderId) => {
    try {
      const response = await API.post(`/medicine-orders/${orderId}/confirm`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: "Failed to confirm order" };
    }
  },

  getPrescriptionEligibility: async () => {
    try {
      const response = await API.get("/medicine-orders/prescription-eligibility");
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: "Failed to check prescription eligibility" };
    }
  },

  getMyOrders: async (page = 1, limit = 10) => {
    try {
      const response = await API.get("/medicine-orders/mine", { params: { page, limit } });
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: "Failed to fetch orders" };
    }
  },

  getOrderById: async (orderId) => {
    try {
      const response = await API.get(`/medicine-orders/${orderId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: "Failed to fetch order" };
    }
  },

  getAllOrders: async (page = 1, limit = 20, status = "") => {
    try {
      const response = await API.get("/medicine-orders/admin/all", {
        params: { page, limit, ...(status && { status }) },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: "Failed to fetch orders" };
    }
  },

  updateOrderStatus: async (orderId, status) => {
    try {
      const response = await API.put(`/medicine-orders/admin/${orderId}/status`, { status });
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: "Failed to update order status" };
    }
  },
};

export default MedicineOrderService;
