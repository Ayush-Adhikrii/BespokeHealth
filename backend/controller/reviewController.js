const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const submitReview = async (req, res) => {
  const { appointmentId } = req.params;
  const { score, feedback } = req.body;
  const userId = req.user.id;

  const parsedScore = parseInt(score);
  if (!parsedScore || parsedScore < 1 || parsedScore > 5) {
    return res.status(400).json({ error: "Score must be a number between 1 and 5" });
  }

  try {
    const appointment = await prisma.appointment.findUnique({
      where: { id: parseInt(appointmentId) },
      include: { patient: true },
    });

    if (!appointment) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    if (appointment.patient.userId !== userId) {
      return res.status(403).json({ error: "You are not authorized to review this appointment" });
    }

    if (appointment.status !== "completed") {
      return res.status(422).json({ error: "You can only review completed appointments" });
    }

    const existing = await prisma.doctorReview.findUnique({
      where: { appointment_id: parseInt(appointmentId) },
    });

    if (existing) {
      return res.status(409).json({ error: "You have already submitted a review for this appointment" });
    }

    const review = await prisma.doctorReview.create({
      data: {
        appointment_id: parseInt(appointmentId),
        patient_id: appointment.patient_id,
        doctor_id: appointment.doctor_id,
        score: parsedScore,
        feedback: feedback?.trim() || null,
      },
    });

    const agg = await prisma.doctorReview.aggregate({
      where: { doctor_id: appointment.doctor_id },
      _avg: { score: true },
      _count: { id: true },
    });

    await prisma.doctor.update({
      where: { id: appointment.doctor_id },
      data: {
        avg_rating: Math.round((agg._avg.score || 0) * 10) / 10,
        rating_count: agg._count.id,
      },
    });

    return res.status(201).json({ message: "Review submitted successfully", review });
  } catch (error) {
    console.error("Submit review error:", error);
    return res.status(500).json({ error: "Failed to submit review" });
  }
};

const getDoctorReviews = async (req, res) => {
  const { doctorId } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  try {
    const [reviews, total, doctor] = await Promise.all([
      prisma.doctorReview.findMany({
        where: { doctor_id: parseInt(doctorId) },
        include: {
          patient: { include: { user: { select: { name: true } } } },
        },
        orderBy: { created_at: "desc" },
        skip,
        take: limit,
      }),
      prisma.doctorReview.count({ where: { doctor_id: parseInt(doctorId) } }),
      prisma.doctor.findUnique({
        where: { id: parseInt(doctorId) },
        select: { avg_rating: true, rating_count: true },
      }),
    ]);

    return res.status(200).json({
      avg_rating: doctor?.avg_rating || 0,
      rating_count: doctor?.rating_count || 0,
      reviews: reviews.map((r) => ({
        id: r.id,
        score: r.score,
        feedback: r.feedback,
        patient_name: r.patient.user.name,
        created_at: r.created_at,
      })),
      pagination: { total, page, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Get doctor reviews error:", error);
    return res.status(500).json({ error: "Failed to retrieve reviews" });
  }
};

const getAppointmentReview = async (req, res) => {
  const { appointmentId } = req.params;

  try {
    const review = await prisma.doctorReview.findUnique({
      where: { appointment_id: parseInt(appointmentId) },
    });

    return res.status(200).json({ reviewed: !!review, review: review || null });
  } catch (error) {
    console.error("Get appointment review error:", error);
    return res.status(500).json({ error: "Failed to check review status" });
  }
};

const getMyReviews = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  try {
    const doctor = await prisma.doctor.findFirst({ where: { userId: req.user.id } });
    if (!doctor) return res.status(404).json({ error: "Doctor profile not found" });

    const [reviews, total] = await Promise.all([
      prisma.doctorReview.findMany({
        where: { doctor_id: doctor.id },
        include: { patient: { include: { user: { select: { name: true } } } } },
        orderBy: { created_at: "desc" },
        skip,
        take: limit,
      }),
      prisma.doctorReview.count({ where: { doctor_id: doctor.id } }),
    ]);

    return res.status(200).json({
      avg_rating: doctor.avg_rating,
      rating_count: doctor.rating_count,
      reviews: reviews.map((r) => ({
        id: r.id,
        score: r.score,
        feedback: r.feedback,
        patient_name: r.patient.user.name,
        created_at: r.created_at,
      })),
      pagination: { total, page, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Get my reviews error:", error);
    return res.status(500).json({ error: "Failed to retrieve reviews" });
  }
};

const getAllReviews = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  try {
    const [reviews, total] = await Promise.all([
      prisma.doctorReview.findMany({
        include: {
          doctor: { include: { user: { select: { name: true } } } },
          patient: { include: { user: { select: { name: true } } } },
        },
        orderBy: { created_at: "desc" },
        skip,
        take: limit,
      }),
      prisma.doctorReview.count(),
    ]);

    return res.status(200).json({
      reviews: reviews.map((r) => ({
        id: r.id,
        score: r.score,
        feedback: r.feedback,
        doctor_name: r.doctor.user.name,
        doctor_speciality: r.doctor.speciality,
        patient_name: r.patient.user.name,
        created_at: r.created_at,
      })),
      pagination: { total, page, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Get all reviews error:", error);
    return res.status(500).json({ error: "Failed to retrieve reviews" });
  }
};

module.exports = { submitReview, getDoctorReviews, getAppointmentReview, getMyReviews, getAllReviews };
