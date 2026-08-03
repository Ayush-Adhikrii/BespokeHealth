require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { PrismaClient } = require("@prisma/client");
const rateLimit = require("express-rate-limit");

const app = express();
const prisma = new PrismaClient();

prisma
  .$connect()
  .then(() => console.log("PostgreSQL connected successfully"))
  .catch((error) => console.error("PostgreSQL connection failed:", error));

app.use(helmet());
app.use(cors({
origin: ["https://localhost:5173", "http://localhost:5173"],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-temp-device-id'],
  exposedHeaders: ['Content-Disposition']
}));
app.use(express.json());
app.use(express.static("../frontend/dist"));
app.use(cookieParser());

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 1000,
  message: {
    error: "Too many requests, please try again later."
  }
});
app.use(limiter);

app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

const authRoutes = require("./routes/authRoutes");
const fileRoutes = require("./routes/fileRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const doctorRoutes = require("./routes/doctorRoutes");
const availabilityRoutes = require("./routes/availabilityRoutes");
const appointmentRoutes = require("./routes/appointmentRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const statRoutes = require("./routes/statRoutes");
const diseaseRoutes = require("./routes/diseaseRoutes");
const medicineRoutes = require("./routes/medicineRoutes");
const medicineProtectedRoutes = require("./routes/medicineProtectedRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const adminRoutes = require("./routes/adminRoutes");
const kycRoutes = require("./routes/kycRoutes");
const medicineOrderRoutes = require("./routes/medicineOrderRoutes");

app.use("/api/auth", authRoutes);
app.use("/api/reviews", reviewRoutes);

app.options("/api/uploads/:type/:filename", cors());
app.use("/api/uploads", fileRoutes);
app.use("/api/availability", availabilityRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/stats", statRoutes);
app.use("/api/disease", diseaseRoutes);
app.use("/api/medicines", medicineRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/medicines", medicineProtectedRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/kyc", kycRoutes);
app.use("/api/medicine-orders", medicineOrderRoutes);

const { handleFileUploadErrors } = require("./middleware/errorHandler");
app.use(handleFileUploadErrors);

module.exports = app;
