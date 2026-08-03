const express = require("express");
const router = express.Router();
const doctorController = require("../controller/doctorController");
const availabilityController = require("../controller/availabilityController");
const { authenticateToken, authorizeRoles } = require("../middleware/auth");
const { uploadDoctorPhoto } = require("../utils/fileUpload");


router.get("/", doctorController.getAllDoctors);
router.get("/specialities", doctorController.getAllSpecialities);
router.get("/speciality/:speciality", doctorController.getDoctorsBySpeciality);
router.get("/fee-range", doctorController.getDoctorsByFeeRange); 
router.get("/:doctorId", doctorController.getDoctorById);


router.get(
  "/patients",
  authenticateToken,
  authorizeRoles(["Doctor"]),
  doctorController.getDoctorPatients
);

router.get(
  "/patients/:patientId",
  authenticateToken,
  authorizeRoles(["Doctor"]),
  doctorController.getPatientDetails
);

router.get(
  "/stats",
  authenticateToken,
  authorizeRoles(["Doctor"]),
  availabilityController.getGeneralStats
);
router.get(
  "/appointments",
  authenticateToken,
  authorizeRoles(["Doctor"]),
  doctorController.getAppointmentAnalytics
);

router.get(
  "/patientsInsights",
  authenticateToken,
  authorizeRoles(["Doctor"]),
  doctorController.getPatientInsights
);

router.post(
  "/me/photo",
  authenticateToken,
  authorizeRoles(["Doctor"]),
  uploadDoctorPhoto.single("photo"),
  doctorController.uploadDoctorPhoto
);

module.exports = router;
