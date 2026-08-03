const express = require("express");
const router = express.Router();
const authController = require("../controller/authController");
const { authenticateToken } = require("../middleware/auth");
const { uploadDoctorSignupPhoto } = require("../utils/fileUpload");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
const {
  sendVerificationEmail,
  sendForgotPasswordEmail,
} = require("../utils/email");
const { generateOTP, verifyOTP } = require("../utils/otp");
const prisma = new PrismaClient();

const rateLimit = require('express-rate-limit');
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: {
    error: 'Too many login attempts. Please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const sensitiveLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    error: 'Too many attempts. Please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
router.post("/signup", sensitiveLimiter, uploadDoctorSignupPhoto.single("photo"), authController.signup);
router.post("/login", loginLimiter, authController.login);
router.post("/verify-email", sensitiveLimiter, authController.verifyEmail);
router.post("/forgot-password", sensitiveLimiter, authController.forgotPassword);
router.post("/reset-password", sensitiveLimiter, authController.changePassword);
router.post("/change-password", sensitiveLimiter, authController.changePassword);
router.post("/set-new-password", sensitiveLimiter, authController.changePassword);
router.get("/profile", authenticateToken, authController.getProfile);
router.put("/profile", authenticateToken, authController.updateProfile);
router.put("/change-password", authenticateToken, authController.changePasswordWithCurrent);

module.exports = router;