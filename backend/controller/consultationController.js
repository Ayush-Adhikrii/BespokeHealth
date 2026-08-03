const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { logActivity } = require('../utils/activityLogger');
const validator = require("validator");

const updateConsultationNotes = async (req, res) => {
  const rawAppointmentId = req.params.appointmentId;
  const rawNotes = req.body.notes;
  const doctorId = req.user.doctorProfile.id;

  if (rawNotes !== undefined && typeof rawNotes !== "string") {
    return res.status(400).json({ error: "Notes must be a string" });
  }

  const appointmentId = validator.isInt(rawAppointmentId + "") ? parseInt(rawAppointmentId) : null;
  const notes = rawNotes ? validator.escape(rawNotes) : "";

  if (!appointmentId) {
    return res.status(400).json({ error: "Invalid appointment ID" });
  }

  try {
    const appointment = await prisma.appointment.findFirst({
      where: {
        id: appointmentId,
        doctor_id: doctorId
      }
    });

    if (!appointment) {
      return res.status(404).json({ error: "Appointment not found or unauthorized" });
    }

    const updatedAppointment = await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        notes,
        updated_at: new Date()
      }
    });

    await logActivity(req.user.id, 'updated_consultation', `Doctor updated consultation notes for appointmentId=${appointmentId}`);

    res.status(200).json({
      message: "Consultation notes updated successfully",
      appointment: {
        id: updatedAppointment.id,
        notes: updatedAppointment.notes
      }
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to save consultation notes" });
  }
};

const getConsultationNotes = async (req, res) => {
  const rawAppointmentId = req.params.appointmentId;
  const doctorId = req.user.doctorProfile.id;
  const appointmentId = validator.isInt(rawAppointmentId + "") ? parseInt(rawAppointmentId) : null;

  if (!appointmentId) {
    return res.status(400).json({ error: "Invalid appointment ID" });
  }

  try {
    const appointment = await prisma.appointment.findFirst({
      where: {
        id: appointmentId,
        doctor_id: doctorId
      },
      select: {
        id: true,
        notes: true,
        patient: {
          include: {
            user: {
              select: { name: true }
            }
          }
        },
        time_slot: {
          select: { date: true }
        }
      }
    });

    if (!appointment) {
      return res.status(404).json({ error: "Appointment not found or unauthorized" });
    }

    if (!appointment.notes) {
      return res.status(404).json({ error: "No consultation notes found for this appointment" });
    }

    res.status(200).json({
      appointment_id: appointment.id,
      patient_name: appointment.patient.user.name,
      appointment_date: appointment.time_slot.date.toISOString().split('T')[0],
      notes: appointment.notes
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve consultation notes" });
  }
};

module.exports = {
  updateConsultationNotes,
  getConsultationNotes
};
