const express = require("express");
const router = express.Router();
const reviewController = require("../controller/reviewController");
const { authenticateToken, authorizeRoles } = require("../middleware/auth");
const rateLimit = require("express-rate-limit");

const postLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: "Too many requests. Please try again after 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post(
  "/appointments/:appointmentId",
  postLimiter,
  authenticateToken,
  authorizeRoles(["Patient"]),
  reviewController.submitReview
);

router.get(
  "/appointments/:appointmentId",
  authenticateToken,
  reviewController.getAppointmentReview
);

router.get(
  "/mine",
  authenticateToken,
  authorizeRoles(["Doctor"]),
  reviewController.getMyReviews
);

router.get("/doctors/:doctorId", reviewController.getDoctorReviews);

router.get(
  "/",
  authenticateToken,
  authorizeRoles(["Admin"]),
  reviewController.getAllReviews
);

module.exports = router;
