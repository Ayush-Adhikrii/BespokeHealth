import API from "../utils/axios";

class MessageService {
  
  async getConversations() {
    try {
      const response = await API.get('/messages/conversations');
      return response.data;
    } catch (error) {
      console.error("Error fetching conversations:", error);
      throw error;
    }
  }

  
  async getMessages(conversationId) {
    try {
      const response = await API.get(`/messages/conversations/${conversationId}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching messages:", error);
      throw error;
    }
  }

  
  async sendMessage(conversationId, content) {
    try {
      const response = await API.post(`/messages/conversations/${conversationId}`, {
        content
      });
      return response.data;
    } catch (error) {
      console.error("Error sending message:", error);
      throw error;
    }
  }

  
  async startConversation(doctorId, initialMessage) {
    try {
      const response = await API.post('/messages/conversations', {
        doctor_id: doctorId,
        message: initialMessage
      });
      return response.data;
    } catch (error) {
      console.error("Error starting conversation:", error);
      throw error;
    }
  }

  
  async markAsRead(conversationId) {
    try {
      const response = await API.patch(`/messages/conversations/${conversationId}/read`);
      return response.data;
    } catch (error) {
      console.error("Error marking conversation as read:", error);
      throw error;
    }
  }

  async getUnreadCount() {
    try {
      const response = await API.get("/appointments/messages/unread-count");
      return response.data.count || 0;
    } catch {
      return 0;
    }
  }
}

export default new MessageService();