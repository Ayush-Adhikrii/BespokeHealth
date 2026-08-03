const express = require("express");
const router = express.Router();
const availabilityController = require("../controller/availabilityController");
const { authenticateToken, authorizeRoles, requireApprovedDoctor } = require("../middleware/auth");
const doctorController = require("../controller/doctorController");
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

router.post(
  "/set",
  postLimiter,
  authenticateToken,
  authorizeRoles(["Doctor"]),
  requireApprovedDoctor,
  availabilityController.setDoctorAvailability
);

router.post(
  "/fees",
  postLimiter,
  authenticateToken,
  authorizeRoles(["Doctor"]),
  requireApprovedDoctor,
  availabilityController.setConsultationFees
);

router.get(
  "/me",
  authenticateToken,
  authorizeRoles(["Doctor"]),
  availabilityController.getOwnAvailability
);

router.get(
  "/fees",
  authenticateToken,
  authorizeRoles(["Doctor"]),
  availabilityController.getOwnConsultationFees
);
router.get(
  "/stats",
  authenticateToken,
  authorizeRoles(["Doctor"]),
  doctorController.getGeneralStats
);

router.get(
  "/doctors/:doctorId/availability",
  availabilityController.getDoctorAvailability
);

router.get(
  "/doctors/:doctorId/fees",
  availabilityController.getConsultationFees
);

module.exports = router;
