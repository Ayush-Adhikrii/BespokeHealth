const express = require("express");
const router = express.Router();
const kycController = require("../controller/kycController");
const { authenticateToken, authorizeRoles } = require("../middleware/auth");
const { uploadKYC } = require("../utils/fileUpload");
const rateLimit = require('express-rate-limit');
const postLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    error: 'Too many requests. Please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post(
  "/submit",
  postLimiter,
  authenticateToken,
  uploadKYC.fields([
    { name: "citizenship_front", maxCount: 1 },
    { name: "citizenship_back", maxCount: 1 },
  ]),
  kycController.submitKYC
);

router.get("/status", authenticateToken, kycController.getKYCStatus);

router.get(
  "/review",
  authenticateToken,
  authorizeRoles(["Admin"]),
  kycController.getKYCsForReview
);

router.put(
  "/review/:kycId",
  authenticateToken,
  authorizeRoles(["Admin"]),
  kycController.reviewKYC
);

module.exports = router;
