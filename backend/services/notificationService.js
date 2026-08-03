const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();


const createNotification = async (userId, message, type) => {
  try {
    
    const notification = await prisma.notification.create({
      data: {
        user_id: userId,
        message,
        type
      }
    });

    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
  }
};


const sendAppointmentBookedNotification = async (appointment) => {
  try {
    
    const doctor = await prisma.doctor.findUnique({
      where: { id: appointment.doctor_id },
      include: { user: true }
    });
    
    const patient = await prisma.patient.findUnique({
      where: { id: appointment.patient_id },
      include: { user: true }
    });
    
    const timeSlot = await prisma.timeSlot.findUnique({
      where: { id: appointment.time_slot_id }
    });

    
    const appointmentDate = timeSlot.date.toISOString().split('T')[0];
    const startTime = timeSlot.start_time.toISOString().substring(11, 16);
    
    
    if (doctor && doctor.user) {
      await createNotification(doctor.user.id, `${patient.user.name} has booked an appointment with you on ${appointmentDate} at ${startTime}.`, "appointment");
    }
    
    
    if (patient && patient.user) {
      await createNotification(patient.user.id, `Your appointment with Dr. ${doctor.user.name} on ${appointmentDate} at ${startTime} has been booked. Please complete the payment to confirm.`, "appointment");
    }
  } catch (error) {
    console.error("Error sending appointment booked notification:", error);
  }
};


const sendPaymentConfirmedNotification = async (payment) => {
  try {
    
    const appointment = await prisma.appointment.findUnique({
      where: { id: payment.appointment_id },
      include: {
        patient: { include: { user: true } },
        doctor: { include: { user: true } },
        time_slot: true
      }
    });
    
    if (!appointment) return;
    
    
    const appointmentDate = appointment.time_slot.date.toISOString().split('T')[0];
    const startTime = appointment.time_slot.start_time.toISOString().substring(11, 16);
    
    
    await createNotification(appointment.patient.user.id, `Your payment of ${payment.amount} ${payment.currency} for the appointment with Dr. ${appointment.doctor.user.name} has been confirmed.`, "payment");
    
    
    await createNotification(appointment.doctor.user.id, `${appointment.patient.user.name}'s appointment on ${appointmentDate} at ${startTime} has been confirmed.`, "appointment");
  } catch (error) {
    console.error("Error sending payment confirmed notification:", error);
  }
};


const sendAppointmentCancelledNotification = async (appointment, cancelledBy) => {
  try {
    
    const fullAppointment = await prisma.appointment.findUnique({
      where: { id: appointment.id },
      include: {
        patient: { include: { user: true } },
        doctor: { include: { user: true } },
        time_slot: true
      }
    });
    
    if (!fullAppointment) return;
    
    
    const appointmentDate = fullAppointment.time_slot.date.toISOString().split('T')[0];
    const startTime = fullAppointment.time_slot.start_time.toISOString().substring(11, 16);
    
    
    if (cancelledBy === 'doctor') {
      await createNotification(fullAppointment.patient.user.id, `Your appointment with Dr. ${fullAppointment.doctor.user.name} on ${appointmentDate} at ${startTime} has been cancelled by the doctor.`, "appointment");
    } 
    
    else if (cancelledBy === 'patient') {
      await createNotification(fullAppointment.doctor.user.id, `${fullAppointment.patient.user.name} has cancelled the appointment on ${appointmentDate} at ${startTime}.`, "appointment");
    }
  } catch (error) {
    console.error("Error sending appointment cancelled notification:", error);
  }
};


const sendAppointmentReminderNotification = async (appointment) => {
  try {
    
    const fullAppointment = await prisma.appointment.findUnique({
      where: { id: appointment.id },
      include: {
        patient: { include: { user: true } },
        doctor: { include: { user: true } },
        time_slot: true
      }
    });
    
    if (!fullAppointment || fullAppointment.status !== 'confirmed') return;
    
    
    const appointmentDate = fullAppointment.time_slot.date.toISOString().split('T')[0];
    const startTime = fullAppointment.time_slot.start_time.toISOString().substring(11, 16);
    
    
    await createNotification(fullAppointment.patient.user.id, `You have an appointment with Dr. ${fullAppointment.doctor.user.name} tomorrow at ${startTime}.`, "appointment");
    
    
    await createNotification(fullAppointment.doctor.user.id, `You have an appointment with ${fullAppointment.patient.user.name} tomorrow at ${startTime}.`, "appointment");
  } catch (error) {
    console.error("Error sending appointment reminder notification:", error);
  }
};


const getNotificationController = {
  
  getUserNotifications: async (req, res) => {
    try {
      const userId = req.user.id;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;
      
      const notifications = await prisma.notification.findMany({
        where: {
          user_id: userId
        },
        orderBy: {
          created_at: 'desc'
        },
        skip,
        take: limit
      });
      
      const totalCount = await prisma.notification.count({
        where: {
          user_id: userId
        }
      });
      
      const formattedNotifications = notifications.map(notification => ({
        id: notification.id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        subType: notification.sub_type,
        relatedId: notification.related_id,
        isRead: notification.is_read,
        timestamp: notification.created_at,
        metadata: notification.metadata ? JSON.parse(notification.metadata) : null
      }));
      
      res.status(200).json({
        notifications: formattedNotifications,
        totalCount,
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit)
      });
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  },
  
  
  markAsRead: async (req, res) => {
    try {
      const userId = req.user.id;
      const { notificationId } = req.params;
      
      
      const notification = await prisma.notification.findFirst({
        where: {
          id: parseInt(notificationId),
          user_id: userId
        }
      });
      
      if (!notification) {
        return res.status(404).json({ error: "Notification not found" });
      }
      
      
      await prisma.notification.update({
        where: { id: parseInt(notificationId) },
        data: { is_read: true }
      });
      
      res.status(200).json({ message: "Notification marked as read" });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ error: "Failed to update notification" });
    }
  },
  
  
  markAllAsRead: async (req, res) => {
    try {
      const userId = req.user.id;
      
      await prisma.notification.updateMany({
        where: {
          user_id: userId,
          is_read: false
        },
        data: { is_read: true }
      });
      
      res.status(200).json({ message: "All notifications marked as read" });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      res.status(500).json({ error: "Failed to update notifications" });
    }
  },
  
  
  getUnreadCount: async (req, res) => {
    try {
      const userId = req.user.id;
      
      const count = await prisma.notification.count({
        where: {
          user_id: userId,
          is_read: false
        }
      });
      
      res.status(200).json({ count });
    } catch (error) {
      console.error("Error getting unread count:", error);
      res.status(500).json({ error: "Failed to get unread count" });
    }
  }
};

module.exports = {
  sendAppointmentBookedNotification,
  sendPaymentConfirmedNotification,
  sendAppointmentCancelledNotification,
  sendAppointmentReminderNotification,
  getNotificationController,
  createNotification
};