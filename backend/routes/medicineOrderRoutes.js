const express = require("express");
const router = express.Router();
const medicineOrderController = require("../controller/medicineOrderController");
const { authenticateToken, authorizeRoles } = require("../middleware/auth");
const rateLimit = require("express-rate-limit");

const orderLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: "Too many requests. Please try again after 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

router.use(authenticateToken);

router.get(
  "/admin/all",
  authorizeRoles(["Admin"]),
  medicineOrderController.getAllOrders
);

router.put(
  "/admin/:orderId/status",
  authorizeRoles(["Admin"]),
  medicineOrderController.updateOrderStatus
);

router.post(
  "/",
  orderLimiter,
  authorizeRoles(["Patient"]),
  medicineOrderController.createOrder
);

router.post(
  "/:orderId/confirm",
  orderLimiter,
  authorizeRoles(["Patient"]),
  medicineOrderController.confirmOrderPayment
);

router.get(
  "/mine",
  authorizeRoles(["Patient"]),
  medicineOrderController.getMyOrders
);

router.get(
  "/prescription-eligibility",
  authorizeRoles(["Patient"]),
  medicineOrderController.getPrescriptionEligibility
);

router.get("/:orderId", medicineOrderController.getOrderById);

module.exports = router;
