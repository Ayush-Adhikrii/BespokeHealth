const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { createNotification } = require("../services/notificationService");
const validator = require("validator");

const createOrUpdatePrescription = async (req, res) => {
  const rawAppointmentId = req.params.appointmentId;
  const doctorId = req.user.doctorProfile.id;

  if (!validator.isInt(rawAppointmentId + "")) {
    return res.status(400).json({ error: "Invalid appointment ID" });
  }
  const appointmentId = parseInt(rawAppointmentId);

  const {
    diagnosis,
    doctor_notes,
    medications,
    follow_up_needed,
    follow_up_date,
  } = req.body;

  if (typeof diagnosis !== "string" || !diagnosis.trim()) {
    return res.status(400).json({ error: "Diagnosis is required" });
  }
  if (doctor_notes && typeof doctor_notes !== "string") {
    return res.status(400).json({ error: "Doctor notes must be a string" });
  }
  if (medications && !Array.isArray(medications)) {
    return res.status(400).json({ error: "Medications must be an array" });
  }
  if (follow_up_date && !validator.isISO8601(follow_up_date + "")) {
    return res.status(400).json({ error: "Invalid follow-up date format" });
  }

  try {
    const appointment = await prisma.appointment.findFirst({
      where: {
        id: appointmentId,
        doctor_id: doctorId,
      },
      include: {
        patient: { include: { user: true } },
        doctor: { include: { user: true } },
        time_slot: true,
      },
    });

    if (!appointment) {
      return res.status(404).json({ error: "Appointment not found or unauthorized" });
    }

    if (appointment.status !== "completed") {
      await prisma.appointment.update({
        where: { id: appointmentId },
        data: { status: "completed" },
      });
    }

    const existingPrescription = await prisma.prescription.findUnique({
      where: { appointment_id: appointmentId },
      include: { medications: true },
    });

    let prescription;

    await prisma.$transaction(async (tx) => {
      if (existingPrescription) {
        prescription = await tx.prescription.update({
          where: { id: existingPrescription.id },
          data: {
            diagnosis: diagnosis.trim(),
            doctor_notes: doctor_notes ? doctor_notes.trim() : null,
            follow_up_needed: follow_up_needed === true,
            follow_up_date: follow_up_date ? new Date(follow_up_date) : null,
            updated_at: new Date(),
          },
        });

        await tx.medication.deleteMany({
          where: { prescription_id: existingPrescription.id },
        });
      } else {
        prescription = await tx.prescription.create({
          data: {
            appointment_id: appointmentId,
            diagnosis: diagnosis.trim(),
            doctor_notes: doctor_notes ? doctor_notes.trim() : null,
            follow_up_needed: follow_up_needed === true,
            follow_up_date: follow_up_date ? new Date(follow_up_date) : null,
          },
        });
      }

      if (medications && medications.length > 0) {
        for (const med of medications) {
          if (
            med.name && typeof med.name === "string" &&
            med.dosage && typeof med.dosage === "string" &&
            med.frequency && typeof med.frequency === "string" &&
            med.duration && typeof med.duration === "string"
          ) {
            await tx.medication.create({
              data: {
                prescription_id: prescription.id,
                name: med.name.trim(),
                dosage: med.dosage.trim(),
                frequency: med.frequency.trim(),
                duration: med.duration.trim(),
                instructions: med.instructions ? med.instructions.trim() : "",
              },
            });
          }
        }
      }
    });

    const completePrescription = await prisma.prescription.findUnique({
      where: { id: prescription.id },
      include: { medications: true },
    });

    await createNotification(
      appointment.patient.user.id,
      `Dr. ${appointment.doctor.user.name} has issued a prescription for your appointment on ${appointment.time_slot.date.toISOString().split("T")[0]}.`,
      "prescription_added"
    );

    res.status(200).json({
      message: existingPrescription
        ? "Prescription updated successfully"
        : "Prescription created successfully",
      prescription: completePrescription,
    });
  } catch (error) {
    console.error("Create/update prescription error:", error);
    res.status(500).json({ error: "Failed to save prescription" });
  }
};

const getPrescription = async (req, res) => {
  const rawAppointmentId = req.params.appointmentId;
  const userId = req.user.id;

  if (!validator.isInt(rawAppointmentId + "")) {
    return res.status(400).json({ error: "Invalid appointment ID" });
  }
  const appointmentId = parseInt(rawAppointmentId);

  try {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        patient: { include: { user: true } },
        doctor: { include: { user: true } },
        time_slot: true,
      },
    });

    if (!appointment) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    const isDoctor = appointment.doctor.user.id === userId;
    const isPatient = appointment.patient.user.id === userId;

    if (!isDoctor && !isPatient) {
      return res.status(403).json({ error: "You are not authorized to view this prescription" });
    }

    const prescription = await prisma.prescription.findUnique({
      where: { appointment_id: appointmentId },
      include: { medications: true },
    });

    if (!prescription) {
      return res.status(404).json({ error: "No prescription found for this appointment" });
    }

    res.status(200).json({
      id: prescription.id,
      appointment_id: prescription.appointment_id,
      appointment_date: appointment.time_slot.date.toISOString().split("T")[0],
      doctor: {
        id: appointment.doctor.id,
        name: appointment.doctor.user.name,
      },
      patient: {
        id: appointment.patient.id,
        name: appointment.patient.user.name,
      },
      diagnosis: prescription.diagnosis,
      doctor_notes: prescription.doctor_notes,
      follow_up: {
        needed: prescription.follow_up_needed,
        date: prescription.follow_up_date,
      },
      medications: prescription.medications.map((med) => ({
        id: med.id,
        name: med.name,
        dosage: med.dosage,
        frequency: med.frequency,
        duration: med.duration,
        instructions: med.instructions,
      })),
      created_at: prescription.created_at,
      updated_at: prescription.updated_at,
    });
  } catch (error) {
    console.error("Get prescription error:", error);
    res.status(500).json({ error: "Failed to retrieve prescription" });
  }
};

const getDoctorPrescriptions = async (req, res) => {
  const doctorId = req.user.doctorProfile.id;
  const rawPage = req.query.page || "1";
  const rawLimit = req.query.limit || "10";
  const rawPatientId = req.query.patient_id;

  if (!validator.isInt(rawPage) || !validator.isInt(rawLimit)) {
    return res.status(400).json({ error: "Invalid pagination parameters" });
  }

  let patientId = null;
  if (rawPatientId && !validator.isInt(rawPatientId + "")) {
    return res.status(400).json({ error: "Invalid patient ID" });
  }
  if (rawPatientId) patientId = parseInt(rawPatientId);

  const page = parseInt(rawPage);
  const limit = parseInt(rawLimit);
  const skip = (page - 1) * limit;

  try {
    const whereClause = {
      appointment: {
        doctor_id: doctorId,
      },
    };
    if (patientId) {
      whereClause.appointment.patient_id = patientId;
    }

    const prescriptions = await prisma.prescription.findMany({
      where: whereClause,
      include: {
        medications: true,
        appointment: {
          include: {
            patient: { include: { user: { select: { name: true } } } },
            time_slot: true,
          },
        },
      },
      orderBy: { created_at: "desc" },
      skip,
      take: limit,
    });

    const totalCount = await prisma.prescription.count({ where: whereClause });

    const formattedPrescriptions = prescriptions.map((prescription) => ({
      id: prescription.id,
      appointment_id: prescription.appointment_id,
      patient: {
        id: prescription.appointment.patient.id,
        name: prescription.appointment.patient.user.name,
      },
      appointment_date: prescription.appointment.time_slot.date.toISOString().split("T")[0],
      diagnosis: prescription.diagnosis,
      medication_count: prescription.medications.length,
      follow_up_needed: prescription.follow_up_needed,
      follow_up_date: prescription.follow_up_date,
      created_at: prescription.created_at,
    }));

    res.status(200).json({
      prescriptions: formattedPrescriptions,
      pagination: {
        total: totalCount,
        page,
        limit,
        pages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Get doctor prescriptions error:", error);
    res.status(500).json({ error: "Failed to retrieve prescriptions" });
  }
};

const getPatientPrescriptions = async (req, res) => {
  if (!req.user || req.user.role !== "Patient") {
    return res.status(403).json({ error: "Only patients can access this endpoint" });
  }

  try {
    const patient = await prisma.patient.findFirst({
      where: { userId: req.user.id },
    });

    if (!patient) {
      return res.status(404).json({ error: "Patient profile not found" });
    }

    const patientId = patient.id;
    const rawPage = req.query.page || "1";
    const rawLimit = req.query.limit || "10";

    if (!validator.isInt(rawPage) || !validator.isInt(rawLimit)) {
      return res.status(400).json({ error: "Invalid pagination parameters" });
    }

    const page = parseInt(rawPage);
    const limit = parseInt(rawLimit);
    const skip = (page - 1) * limit;

    const prescriptions = await prisma.prescription.findMany({
      where: { appointment: { patient_id: patientId } },
      include: {
        medications: true,
        appointment: {
          include: {
            doctor: { include: { user: { select: { name: true } } } },
            time_slot: true,
          },
        },
      },
      orderBy: { created_at: "desc" },
      skip,
      take: limit,
    });

    const totalCount = await prisma.prescription.count({
      where: { appointment: { patient_id: patientId } },
    });

    const formattedPrescriptions = prescriptions.map((prescription) => ({
      id: prescription.id,
      appointment_id: prescription.appointment_id,
      doctor: {
        id: prescription.appointment.doctor.id,
        name: prescription.appointment.doctor.user.name,
      },
      appointment_date: prescription.appointment.time_slot.date.toISOString().split("T")[0],
      diagnosis: prescription.diagnosis,
      medication_count: prescription.medications.length,
      medications: prescription.medications.map((med) => ({
        name: med.name,
        dosage: med.dosage,
        frequency: med.frequency,
        duration: med.duration,
      })),
      follow_up_needed: prescription.follow_up_needed,
      follow_up_date: prescription.follow_up_date,
      created_at: prescription.created_at,
    }));

    res.status(200).json({
      prescriptions: formattedPrescriptions,
      pagination: {
        total: totalCount,
        page,
        limit,
        pages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Get patient prescriptions error:", error);
    res.status(500).json({ error: "Failed to retrieve prescriptions" });
  }
};

module.exports = {
  createOrUpdatePrescription,
  getPrescription,
  getDoctorPrescriptions,
  getPatientPrescriptions,
};
