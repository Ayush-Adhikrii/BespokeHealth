const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { sendEmail } = require("../utils/email");
const xss = require("xss");
const validator = require("validator");

const getAllPatients = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const sortBy = xss(req.query.sortBy || "created_at");
    const sortOrder = req.query.sortOrder?.toLowerCase() === "asc" ? "asc" : "desc";
    const search = xss(req.query.search || "");
    const skip = (page - 1) * limit;

    const where = {
      OR: [
        { user: { name: { contains: search, mode: "insensitive" } } },
        { user: { email: { contains: search, mode: "insensitive" } } },
        { phone_number: { contains: search, mode: "insensitive" } }
      ]
    };

    const patients = await prisma.patient.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            created_at: true,
            email_verified: true
          }
        },
        appointments: {
          select: {
            id: true,
            status: true,
            created_at: true
          },
          take: 5,
          orderBy: { created_at: "desc" }
        },
        _count: {
          select: { appointments: true }
        }
      },
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit
    });

    const totalPatients = await prisma.patient.count({ where });
    const totalPages = Math.ceil(totalPatients / limit);

    res.status(200).json({
      patients,
      pagination: {
        totalItems: totalPatients,
        totalPages,
        currentPage: page,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error("Get all patients error:", error);
    res.status(500).json({ error: "Failed to retrieve patients" });
  }
};

const getPatientDetails = async (req, res) => {
  try {
    const { id } = req.params;
    if (!validator.isInt(id)) return res.status(400).json({ error: "Invalid patient ID" });

    const patient = await prisma.patient.findUnique({
      where: { id: parseInt(id) },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            created_at: true,
            email_verified: true
          }
        },
        appointments: {
          include: {
            doctor: {
              include: {
                user: {
                  select: { name: true }
                }
              }
            },
            time_slot: true,
            payment: true
          },
          orderBy: { created_at: "desc" }
        }
      }
    });

    if (!patient) {
      return res.status(404).json({ error: "Patient not found" });
    }

    res.status(200).json({ patient });
  } catch (error) {
    console.error("Get patient details error:", error);
    res.status(500).json({ error: "Failed to retrieve patient details" });
  }
};

const updatePatient = async (req, res) => {
  try {
    const { id } = req.params;
    if (!validator.isInt(id)) return res.status(400).json({ error: "Invalid patient ID" });

    const { name, email, phone_number, gender, date_of_birth } = req.body;

    const updatedPatient = await prisma.$transaction(async (prisma) => {
      const patient = await prisma.patient.findUnique({
        where: { id: parseInt(id) },
        select: { userId: true }
      });

      if (!patient) {
        throw new Error("Patient not found");
      }

      if (name || email !== undefined) {
        await prisma.users.update({
          where: { id: patient.userId },
          data: {
            ...(name && { name: xss(name.trim()) }),
            ...(email && validator.isEmail(email) && { email: xss(email.trim()) })
          }
        });
      }

      return prisma.patient.update({
        where: { id: parseInt(id) },
        data: {
          ...(phone_number && { phone_number: xss(phone_number.trim()) }),
          ...(gender && { gender: xss(gender.trim()) }),
          ...(date_of_birth && validator.isDate(date_of_birth) && { date_of_birth: new Date(date_of_birth) })
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              is_active: true
            }
          }
        }
      });
    });

    res.status(200).json({
      message: "Patient updated successfully",
      patient: updatedPatient
    });
  } catch (error) {
    console.error("Update patient error:", error);
    if (error.message === "Patient not found") {
      return res.status(404).json({ error: "Patient not found" });
    }
    res.status(500).json({ error: "Failed to update patient" });
  }
};

const deletePatient = async (req, res) => {
  try {
    const { id } = req.params;
    if (!validator.isInt(id)) return res.status(400).json({ error: "Invalid patient ID" });

    await prisma.$transaction(async (prisma) => {
      const patient = await prisma.patient.findUnique({
        where: { id: parseInt(id) },
        select: { userId: true }
      });

      if (!patient) {
        throw new Error("Patient not found");
      }

      await prisma.appointment.deleteMany({
        where: { patient_id: parseInt(id) }
      });

      await prisma.patient.delete({
        where: { id: parseInt(id) }
      });

      await prisma.users.delete({
        where: { id: patient.userId }
      });
    });

    res.status(200).json({ message: "Patient deleted successfully" });
  } catch (error) {
    console.error("Delete patient error:", error);
    if (error.message === "Patient not found") {
      return res.status(404).json({ error: "Patient not found" });
    }
    res.status(500).json({ error: "Failed to delete patient" });
  }
};

const sendEmailToPatient = async (req, res) => {
  try {
    const { id } = req.params;
    if (!validator.isInt(id)) return res.status(400).json({ error: "Invalid patient ID" });

    let { subject, message } = req.body;

    if (!subject || !message) {
      return res.status(400).json({ error: "Subject and message are required" });
    }

    subject = xss(subject.trim());
    message = xss(message.trim());

    const patient = await prisma.patient.findUnique({
      where: { id: parseInt(id) },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (!patient) {
      return res.status(404).json({ error: "Patient not found" });
    }

    await sendEmail({
      to: patient.user.email,
      subject,
      text: message,
      html: `<p>Hello ${patient.user.name},</p><p>${message}</p><p>Best regards,<br>Bspoke Health Admin Team</p>`
    });

    res.status(200).json({ message: "Email sent successfully" });
  } catch (error) {
    console.error("Send email to patient error:", error);
    res.status(500).json({ error: "Failed to send email" });
  }
};

module.exports = {
  getAllPatients,
  getPatientDetails,
  updatePatient,
  deletePatient,
  sendEmailToPatient
};
