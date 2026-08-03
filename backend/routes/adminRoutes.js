const express = require("express");
const router = express.Router();
const { authenticateToken, authorizeRoles } = require("../middleware/auth");
const adminPatientController = require("../controller/adminPatientController");
const adminDoctorController = require("../controller/adminDoctorController");
const adminPaymentController = require("../controller/adminPaymentController");
const { getActivityLogs } = require('../controller/adminLogController');
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

router.use(authenticateToken);
router.use(authorizeRoles(["Admin"]));

router.get("/patients", adminPatientController.getAllPatients);
router.get("/patients/:id", adminPatientController.getPatientDetails);
router.put("/patients/:id", adminPatientController.updatePatient);
router.delete("/patients/:id", adminPatientController.deletePatient);
router.post("/patients/:id/email", postLimiter, adminPatientController.sendEmailToPatient);

router.get("/doctors", adminDoctorController.getAllDoctors);
router.get("/doctors/:id", adminDoctorController.getDoctorDetails);
router.put("/doctors/:id/status", adminDoctorController.updateDoctorStatus);

router.post("/doctors/:id/email", postLimiter, adminDoctorController.sendEmailToDoctor);

router.get("/payments", adminPaymentController.getAllPayments);
router.get("/payments/:id", adminPaymentController.getPaymentDetails);
router.post("/payments/:id/refund", postLimiter, adminPaymentController.processRefund);
router.post("/payments/report", postLimiter, adminPaymentController.generatePaymentReport);

router.get('/activity-logs', authenticateToken, authorizeRoles(['Admin']), getActivityLogs);

module.exports = router;
