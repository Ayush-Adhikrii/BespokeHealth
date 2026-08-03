import API from "../utils/axios";

class AdminService {

  async getAllPatients(
    page = 1,
    limit = 10,
    search = "",
    sortBy = "created_at",
    sortOrder = "desc"
  ) {
    try {
      const params = { page, limit, search };

      if (sortBy) {
        params.sortBy = sortBy;
        params.sortOrder = sortOrder;
      }

      const response = await API.get("/admin/patients", { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: "Failed to fetch patients" };
    }
  }

  async getPatientById(patientId) {
    try {
      const response = await API.get(`/admin/patients/${patientId}`);
      return response.data;
    } catch (error) {
      throw (
        error.response?.data || { error: "Failed to fetch patient details" }
      );
    }
  }

  async updatePatient(patientId, patientData) {
    try {
      const response = await API.put(
        `/admin/patients/${patientId}`,
        patientData
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: "Failed to update patient" };
    }
  }

  async deletePatient(patientId) {
    try {
      const response = await API.delete(`/admin/patients/${patientId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: "Failed to delete patient" };
    }
  }

  async sendEmailToPatient(patientId, emailData) {
    try {
      const response = await API.post(
        `/admin/patients/${patientId}/email`,
        emailData
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: "Failed to send email" };
    }
  }

  async getAllDoctors(
    page = 1,
    limit = 10,
    search = "",
    speciality = "",
    sortBy = "created_at",
    sortOrder = "desc"
  ) {
    try {
      const params = { page, limit, search, speciality };

      if (sortBy) {
        params.sortBy = sortBy;
        params.sortOrder = sortOrder;
      }

      const response = await API.get("/admin/doctors", { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: "Failed to fetch doctors" };
    }
  }

  async getDoctorById(doctorId) {
    try {
      const response = await API.get(`/admin/doctors/${doctorId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: "Failed to fetch doctor details" };
    }
  }

  async updateDoctorStatus(doctorId, statusData) {
    try {
      const response = await API.put(
        `/admin/doctors/${doctorId}/status`,
        statusData
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: "Failed to update doctor status" };
    }
  }

  async deleteDoctor(doctorId) {
    try {
      const response = await API.delete(`/admin/doctors/${doctorId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: "Failed to delete doctor" };
    }
  }

  async sendEmailToDoctor(doctorId, emailData) {
    try {
      const response = await API.post(
        `/admin/doctors/${doctorId}/email`,
        emailData
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: "Failed to send email" };
    }
  }

  async getAllPayments(
    page = 1,
    limit = 20,
    filters = {},
    sortBy = "created_at",
    sortOrder = "desc"
  ) {
    try {
      const { startDate, endDate, status, paymentMethod, minAmount, maxAmount } =
        filters;

      const params = {
        page,
        limit,
        sortBy,
        sortOrder,
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
        ...(status && { status }),
        ...(paymentMethod && { paymentMethod }),
        ...(minAmount && { minAmount }),
        ...(maxAmount && { maxAmount }),
      };

      const response = await API.get("/admin/payments", { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: "Failed to fetch payments" };
    }
  }

  async getPaymentById(paymentId) {
    try {
      const response = await API.get(`/admin/payments/${paymentId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: "Failed to fetch payment details" };
    }
  }

  async processRefund(paymentId, refundData) {
    try {
      const response = await API.post(
        `/admin/payments/${paymentId}/refund`,
        refundData
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: "Failed to process refund" };
    }
  }

  async generatePaymentReport(reportParams) {
    try {
      const response = await API.post("/admin/payments/report", reportParams);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: "Failed to generate payment report" };
    }
  }

  async getActivityLogs(params = {}) {
    try {
      const response = await API.get('/admin/activity-logs', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: "Failed to fetch activity logs" };
    }
  }
}

export default new AdminService();
