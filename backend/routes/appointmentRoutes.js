const express = require("express");
const router = express.Router();
const appointmentController = require("../controller/appointmentController");
const prescriptionController = require("../controller/prescriptionController");
const consultationController = require("../controller/consultationController");
const { authenticateToken, authorizeRoles } = require("../middleware/auth");
const rateLimit = require('express-rate-limit');

const postLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: {
    error: 'Too many requests. Please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

router.get(
  "/doctors/:doctorId/time-slots",
  appointmentController.getDoctorTimeSlots
);

router.post(
  "/book",
  postLimiter,
  authenticateToken,
  authorizeRoles(["Patient"]),
  appointmentController.bookAppointment
);

router.get(
  "/patient",
  authenticateToken,
  authorizeRoles(["Patient"]),
  appointmentController.getPatientAppointments
);

router.get(
  "/doctor",
  authenticateToken,
  authorizeRoles(["Doctor"]),
  appointmentController.getDoctorAppointments
);

router.get(
  "/doctor/schedule",
  authenticateToken,
  authorizeRoles(["Doctor"]),
  appointmentController.getDoctorSchedule
);

router.patch(
  "/:appointmentId/complete",
  authenticateToken,
  authorizeRoles(["Doctor"]),
  appointmentController.completeAppointment
);

router.delete(
  "/:appointmentId",
  authenticateToken,
  authorizeRoles(["Doctor"]),
  appointmentController.cancelAppointment
);

router.put(
  "/:appointmentId/cancel",
  authenticateToken,
  appointmentController.cancelAppointment
);

router.post(
  "/:appointmentId/prescription",
  postLimiter,
  authenticateToken,
  authorizeRoles(["Doctor"]),
  prescriptionController.createOrUpdatePrescription
);

router.get(
  "/:appointmentId/prescription",
  authenticateToken,
  prescriptionController.getPrescription
);

router.get(
  "/doctor/prescriptions",
  authenticateToken,
  authorizeRoles(["Doctor"]),
  prescriptionController.getDoctorPrescriptions
);

router.post(
  "/:appointmentId/notes",
  postLimiter,
  authenticateToken,
  authorizeRoles(["Doctor"]),
  consultationController.updateConsultationNotes
);

router.get(
  "/:appointmentId/notes",
  authenticateToken,
  authorizeRoles(["Doctor"]),
  consultationController.getConsultationNotes
);

router.get(
  "/patient/prescriptions",
  authenticateToken,
  authorizeRoles(["Patient"]),
  prescriptionController.getPatientPrescriptions
);

router.get(
  "/messages/unread-count",
  authenticateToken,
  appointmentController.getUnreadMessageCount
);

module.exports = router;
