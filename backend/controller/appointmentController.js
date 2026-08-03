const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { createNotification } = require("../services/notificationService");
const { logActivity } = require('../utils/activityLogger');


const getDoctorTimeSlots = async (req, res) => {
  const doctorId = parseInt(req.params.doctorId);
  const date = req.query.date ? new Date(req.query.date) : null;

  try {
    
    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!doctor) {
      return res.status(404).json({ error: "Doctor not found" });
    }

    if (!doctor.is_active) {
      return res
        .status(400)
        .json({ error: "Doctor is not currently available for appointments" });
    }

    
    let whereClause = {
      doctor_id: doctorId,
      is_available: true,
      start_time: {
        gte: new Date(), 
      },
    };

    
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      whereClause.date = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }

    
    const timeSlots = await prisma.timeSlot.findMany({
      where: whereClause,
      orderBy: {
        start_time: "asc",
      },
    });

    
    const formattedSlots = timeSlots.map((slot) => ({
      id: slot.id,
      date: slot.date.toISOString().split("T")[0],
      start_time: slot.start_time.toISOString().substring(11, 16),
      end_time: slot.end_time.toISOString().substring(11, 16),
      duration_minutes: slot.duration_minutes,
    }));

    
    const fees = await prisma.consultationFee.findMany({
      where: { doctor_id: doctorId },
    });

    res.status(200).json({
      doctor: {
        id: doctor.id,
        name: doctor.user.name,
        speciality: doctor.speciality,
      },
      time_slots: formattedSlots,
      consultation_fees: fees,
    });
  } catch (error) {
    console.error("Get doctor time slots error:", error);
    res.status(500).json({ error: "Failed to retrieve available time slots" });
  }
};


const bookAppointment = async (req, res) => {
  console.log("Book appointment request received");
  console.log("User data:", {
    userId: req.user.id,
    role: req.user.role,
    patientProfile: req.user.patientProfile,
  });

  const {
    doctor_id,
    time_slot_id,
    consultation_type = "first_visit",
    symptoms,
    notes,
  } = req.body;

  
  if (!req.user || req.user.role !== "Patient") {
    return res
      .status(403)
      .json({ error: "Only patients can book appointments" });
  }

  
  if (!req.user.patientProfile) {
    return res.status(400).json({
      error:
        "Patient profile not found. Please complete your profile before booking",
    });
  }

  const patient_id = req.user.patientProfile.id;

  try {
    
    const timeSlot = await prisma.timeSlot.findUnique({
      where: {
        id: time_slot_id,
        is_available: true,
      },
      include: {
        doctor: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (!timeSlot) {
      return res
        .status(400)
        .json({ error: "Selected time slot is not available" });
    }

    
    if (timeSlot.doctor_id !== parseInt(doctor_id)) {
      return res
        .status(400)
        .json({ error: "Time slot does not belong to the selected doctor" });
    }

    
    const consultationFee = await prisma.consultationFee.findFirst({
      where: {
        doctor_id: parseInt(doctor_id),
        consultation_type,
      },
    });

    if (!consultationFee) {
      return res
        .status(400)
        .json({ error: "Invalid consultation type for this doctor" });
    }

    
    const result = await prisma.$transaction(async (prisma) => {
      
      await prisma.timeSlot.update({
        where: { id: time_slot_id },
        data: { is_available: false },
      });

      
      const appointment = await prisma.appointment.create({
        data: {
          patient_id,
          doctor_id: parseInt(doctor_id),
          time_slot_id,
          status: "pending",
          symptoms,
          notes,
        },
      });
      await logActivity(req.user.id, 'booked_appointment', `User booked appointment with doctorId=${doctor_id}, appointmentId=${appointment.id}`);

      
      const payment = await prisma.payment.create({
        data: {
          appointment_id: appointment.id,
          amount: consultationFee.amount,
          currency: consultationFee.currency,
          payment_method: "pending",
          status: "pending",
        },
      });
      await logActivity(req.user.id, 'created_payment', `User created payment for appointmentId=${appointment.id}, paymentId=${payment.id}`);

      return { appointment, payment };
    });

    
    

    const patient = req.user.patientProfile;
    const doctor = timeSlot.doctor;
    const appointmentDate = timeSlot.date.toISOString().split("T")[0];
    const startTime = timeSlot.start_time.toISOString().substring(11, 16);

    await createNotification(
      doctor.userId,
      `${patient.name} has booked an appointment with you on ${appointmentDate} at ${startTime}.`,
      "appointment"
    );

    await createNotification(
      patient.userId,
      `Your appointment with Dr. ${doctor.user.name} has been booked for ${appointmentDate} at ${startTime}. Please complete payment to confirm.`,
      "appointment"
    );

    res.status(201).json({
      message: "Appointment booked successfully. Please complete payment to confirm your appointment.",
      appointment_id: result.appointment.id,
      doctor_name: timeSlot.doctor.user.name,
      appointment_date: timeSlot.date.toISOString().split("T")[0],
      appointment_time: timeSlot.start_time.toISOString().substring(11, 16),
      payment_amount: result.payment.amount,
      payment_id: result.payment.id,
      
      payment_options: {
        khalti: `/api/payments/${result.payment.id}/khalti/initiate`,
      },
    });
  } catch (error) {
    console.error("Book appointment error:", error);
    res.status(500).json({ error: "Failed to book appointment" });
  }
};


const getPatientAppointments = async (req, res) => {
  const patientId = req.user.patientProfile.id;
  const status = req.query.status; 

  try {
    let whereClause = {
      patient_id: patientId,
    };

    if (status) {
      if (status === "upcoming") {
        whereClause.status = {
          in: ["confirmed", "pending"]
        };
      } else {
        whereClause.status = status;
      }
    }

    const appointments = await prisma.appointment.findMany({
      where: whereClause,
      include: {
        doctor: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
        time_slot: true,
        payment: true,
      },
      orderBy: {
        time_slot: {
          start_time: "asc",
        },
      },
    });

    
    const formattedAppointments = appointments.map((appointment) => ({
      id: appointment.id,
      doctor: {
        id: appointment.doctor.id,
        name: appointment.doctor.user.name,
        speciality: appointment.doctor.speciality,
      },
      date: appointment.time_slot.date.toISOString().split("T")[0],
      start_time: appointment.time_slot.start_time
        .toISOString()
        .substring(11, 16),
      end_time: appointment.time_slot.end_time.toISOString().substring(11, 16),
      status: appointment.status,
      payment_status: appointment.payment?.status || "pending",
      amount: appointment.payment?.amount,
      symptoms: appointment.symptoms,
      notes: appointment.notes,
      created_at: appointment.created_at,
    }));

    res.status(200).json(formattedAppointments);
  } catch (error) {
    console.error("Get patient appointments error:", error);
    res.status(500).json({ error: "Failed to retrieve appointments" });
  }
};


const getDoctorAppointments = async (req, res) => {
  const doctorId = req.user.doctorProfile.id;
  const { status, date, page = 1, limit = 10 } = req.query;

  try {
    
    let whereClause = { doctor_id: doctorId };

    if (status) {
      whereClause.status = status;
    }

    if (date) {
      whereClause.time_slot = {
        date: new Date(date),
      };
    }

    
    const skip = (parseInt(page) - 1) * parseInt(limit);

    
    const appointments = await prisma.appointment.findMany({
      where: whereClause,
      include: {
        patient: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
        time_slot: true,
        payment: {
          select: {
            status: true,
            amount: true,
          },
        },
      },
      orderBy: [
        { time_slot: { date: "desc" } },
        { time_slot: { start_time: "desc" } },
      ],
      skip,
      take: parseInt(limit),
    });


    const totalCount = await prisma.appointment.count({
      where: whereClause,
    });

    
    const formattedAppointments = appointments.map((appointment) => ({
      id: appointment.id,
      patient: {
        id: appointment.patient.id,
        name: appointment.patient.user.name,
        email: appointment.patient.user.email,
      },
      date: appointment.time_slot.date.toISOString().split("T")[0],
      time: {
        start: appointment.time_slot.start_time.toISOString().substring(11, 16),
        end: appointment.time_slot.end_time.toISOString().substring(11, 16),
      },
      status: appointment.status,
      payment_status: appointment.payment?.status || "pending",
      amount: appointment.payment?.amount || 0,
      symptoms: appointment.symptoms || "",
      has_notes: !!appointment.notes,
      has_prescription: false, 
      created_at: appointment.created_at,
    }));

    
    const appointmentIds = appointments.map((a) => a.id);
    if (appointmentIds.length > 0) {
      const prescriptions = await prisma.prescription.findMany({
        where: {
          appointment_id: { in: appointmentIds },
        },
        select: {
          appointment_id: true,
        },
      });

      const prescriptionMap = prescriptions.reduce((map, p) => {
        map[p.appointment_id] = true;
        return map;
      }, {});

      
      formattedAppointments.forEach((appointment) => {
        appointment.has_prescription = !!prescriptionMap[appointment.id];
      });
    }

    res.status(200).json({
      appointments: formattedAppointments,
      pagination: {
        total: totalCount,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(totalCount / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Get doctor appointments error:", error);
    res.status(500).json({ error: "Failed to retrieve appointments" });
  }
};


const cancelAppointment = async (req, res) => {
  const { appointmentId } = req.params;
  const doctorId = req.user.doctorProfile.id;
  const { cancellation_reason } = req.body;

  if (!cancellation_reason) {
    return res.status(400).json({ error: "Cancellation reason is required" });
  }

  try {
    
    const appointment = await prisma.appointment.findFirst({
      where: {
        id: parseInt(appointmentId),
        doctor_id: doctorId,
      },
      include: {
        patient: {
          include: {
            user: true,
          },
        },
        doctor: {
          include: {
            user: true,
          },
        },
        time_slot: true,
      },
    });

    if (!appointment) {
      return res
        .status(404)
        .json({ error: "Appointment not found or unauthorized" });
    }

    
    if (["completed", "cancelled"].includes(appointment.status)) {
      return res.status(400).json({
        error: `Appointment cannot be cancelled because it is already ${appointment.status}`,
      });
    }

    
    await prisma.$transaction(async (prisma) => {
      
      await prisma.appointment.update({
        where: { id: parseInt(appointmentId) },
        data: {
          status: "cancelled",
          cancellation_reason,
          updated_at: new Date(),
        },
      });

      
      await prisma.timeSlot.update({
        where: { id: appointment.time_slot.id },
        data: { is_available: true },
      });
    });

    
    await createNotification(
      appointment.patient.user.id,
      `Your appointment with Dr. ${appointment.doctor.user.name} on ${
        appointment.time_slot.date.toISOString().split("T")[0]
      } has been cancelled by the doctor. Reason: ${cancellation_reason}`,
      "appointment_cancelled"
    );

    res.status(200).json({
      message: "Appointment cancelled successfully",
      time_slot_reopened: true,
    });
  } catch (error) {
    console.error("Cancel appointment error:", error);
    res.status(500).json({ error: "Failed to cancel appointment" });
  }
};


const completeAppointment = async (req, res) => {
  const { appointmentId } = req.params;
  const doctorId = req.user.doctorProfile.id;
  const { notes } = req.body;

  try {
    
    const appointment = await prisma.appointment.findFirst({
      where: {
        id: parseInt(appointmentId),
        doctor_id: doctorId,
      },
      include: {
        patient: {
          include: {
            user: true,
          },
        },
        doctor: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!appointment) {
      return res
        .status(404)
        .json({ error: "Appointment not found or unauthorized" });
    }

    const prescription = await prisma.prescription.findUnique({
      where: { appointment_id: parseInt(appointmentId) },
      include: { medications: true },
    });

    if (!prescription || !prescription.diagnosis || prescription.medications.length === 0) {
      return res.status(400).json({
        error: "Please add a diagnosis and at least one medication in the prescription before completing this consultation.",
      });
    }


    const updatedAppointment = await prisma.appointment.update({
      where: { id: parseInt(appointmentId) },
      data: {
        status: "completed",
        notes: notes || appointment.notes,
        updated_at: new Date(),
      },
    });

    
    await createNotification(
      appointment.patient.user.id,
      `Your appointment with Dr. ${appointment.doctor.user.name} has been marked as completed.`,
      "appointment_completed"
    );

    res.status(200).json({
      message: "Appointment marked as completed",
      appointment: {
        id: updatedAppointment.id,
        status: updatedAppointment.status,
      },
    });
  } catch (error) {
    console.error("Complete appointment error:", error);
    res.status(500).json({ error: "Failed to complete appointment" });
  }
};



const getDoctorSchedule = async (req, res) => {
  const doctorId = req.user.doctorProfile.id;
  const startDate = req.query.startDate
    ? new Date(req.query.startDate)
    : new Date();
  const endDate = req.query.endDate
    ? new Date(req.query.endDate)
    : new Date(startDate);

  
  if (!req.query.endDate) {
    endDate.setDate(startDate.getDate() + 7);
  }

  try {
    
    const appointments = await prisma.appointment.findMany({
      where: {
        doctor_id: doctorId,
        time_slot: {
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
      },
      include: {
        patient: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
        time_slot: true,
        payment: true,
      },
      orderBy: {
        time_slot: {
          start_time: "asc",
        },
      },
    });

    
    const availableSlots = await prisma.timeSlot.findMany({
      where: {
        doctor_id: doctorId,
        date: {
          gte: startDate,
          lte: endDate,
        },
        is_available: true,
      },
      orderBy: {
        start_time: "asc",
      },
    });

    
    const formattedAppointments = appointments.map((appointment) => ({
      id: appointment.id,
      patient: {
        id: appointment.patient.id,
        name: appointment.patient.user.name,
        email: appointment.patient.user.email,
      },
      date: appointment.time_slot.date.toISOString().split("T")[0],
      start_time: appointment.time_slot.start_time
        .toISOString()
        .substring(11, 16),
      end_time: appointment.time_slot.end_time.toISOString().substring(11, 16),
      status: appointment.status,
      payment_status: appointment.payment?.status || "pending",
      symptoms: appointment.symptoms,
      notes: appointment.notes,
    }));

    
    const formattedAvailableSlots = availableSlots.map((slot) => ({
      id: slot.id,
      date: slot.date.toISOString().split("T")[0],
      start_time: slot.start_time.toISOString().substring(11, 16),
      end_time: slot.end_time.toISOString().substring(11, 16),
    }));

    
    const scheduleByDate = {};

    
    formattedAppointments.forEach((appointment) => {
      if (!scheduleByDate[appointment.date]) {
        scheduleByDate[appointment.date] = {
          appointments: [],
          availableSlots: [],
        };
      }
      scheduleByDate[appointment.date].appointments.push(appointment);
    });

    
    formattedAvailableSlots.forEach((slot) => {
      if (!scheduleByDate[slot.date]) {
        scheduleByDate[slot.date] = {
          appointments: [],
          availableSlots: [],
        };
      }
      scheduleByDate[slot.date].availableSlots.push(slot);
    });

    res.status(200).json({
      startDate: startDate.toISOString().split("T")[0],
      endDate: endDate.toISOString().split("T")[0],
      schedule: scheduleByDate,
    });
  } catch (error) {
    console.error("Get doctor schedule error:", error);
    res.status(500).json({ error: "Failed to retrieve doctor schedule" });
  }
};

const getUnreadMessageCount = async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;

    let chatRoomIds = [];

    if (role === "Doctor") {
      const doctorId = req.user.doctorProfile?.id;
      if (!doctorId) return res.json({ count: 0 });
      const appointments = await prisma.appointment.findMany({
        where: { doctor_id: doctorId, chat_room: { isNot: null } },
        select: { chat_room: { select: { id: true } } },
      });
      chatRoomIds = appointments.map((a) => a.chat_room.id);
    } else if (role === "Patient") {
      const patientProfile = req.user.patientProfile;
      if (!patientProfile) return res.json({ count: 0 });
      const appointments = await prisma.appointment.findMany({
        where: { patient_id: patientProfile.id, chat_room: { isNot: null } },
        select: { chat_room: { select: { id: true } } },
      });
      chatRoomIds = appointments.map((a) => a.chat_room.id);
    }

    if (chatRoomIds.length === 0) return res.json({ count: 0 });

    const count = await prisma.chatMessage.count({
      where: {
        chat_room_id: { in: chatRoomIds },
        sender_id: { not: userId },
        read: false,
      },
    });

    return res.json({ count });
  } catch (error) {
    console.error("getUnreadMessageCount error:", error);
    return res.json({ count: 0 });
  }
};

module.exports = {
  getDoctorTimeSlots,
  bookAppointment,
  getPatientAppointments,
  getDoctorAppointments,
  cancelAppointment,
  completeAppointment,
  getDoctorSchedule,
  getUnreadMessageCount,
};
