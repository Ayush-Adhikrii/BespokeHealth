const express = require("express");
const router = express.Router();
const medicineController = require("../controller/medicineController");
const { authenticateToken, authorizeRoles } = require("../middleware/auth");
const { uploadMedicineImage } = require("../utils/fileUpload");
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

router.get("/", medicineController.getAllMedicines);
router.get("/categories", medicineController.getMedicineCategories);
router.get("/:id", medicineController.getMedicineById);

router.get(
  "/admin/all",
  authenticateToken,
  authorizeRoles(["Admin"]),
  medicineController.getAdminMedicines
);

module.exports = router;
