const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    
    console.log("Auth middleware - Headers:", req.headers);
    console.log("Auth middleware - Token:", token ? "Present" : "Missing");
    
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Auth middleware - Decoded token:", decoded);
    
    req.user = decoded;  
    if (decoded.role === "Doctor") {
      console.log("Auth middleware - Fetching doctor profile for user ID:", decoded.id);
      const doctorProfile = await prisma.doctor.findFirst({
        where: { userId: decoded.id },
        include: { user: { select: { kyc_status: true } } },
      });
      console.log("Auth middleware - Doctor profile found:", doctorProfile ? "Yes" : "No");
      if (doctorProfile) {
        req.user.doctorProfile = doctorProfile;
        req.user.kyc_status = doctorProfile.user.kyc_status;
      }
    }
    if (decoded.role === "Patient") {    
      const patientProfile = await prisma.patient.findFirst({
        where: { userId: decoded.id },
      });
      if (patientProfile) {
        req.user.patientProfile = patientProfile;
      } else {
        console.log(`Patient profile not found for user ID: ${decoded.id}`);
      }
    }
    
    console.log("Auth middleware - Final req.user:", req.user);
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    return res.status(403).json({ error: "Invalid or expired token" });
  }
};

const authorizeRoles = (roles) => {
  return (req, res, next) => {
    console.log("Authorize roles - User:", req.user);
    console.log("Authorize roles - Required roles:", roles);
    console.log("Authorize roles - User role:", req.user?.role);

    if (!req.user || !roles.includes(req.user.role)) {
      console.log("Authorize roles - Access denied");
      return res.status(403).json({ error: "Access denied" });
    }
    console.log("Authorize roles - Access granted");
    next();
  };
};

const requireApprovedDoctor = (req, res, next) => {
  if (req.user?.kyc_status !== "Approved") {
    return res.status(403).json({
      error: "Your KYC verification must be approved before you can do this.",
      kyc_status: req.user?.kyc_status || "Not Submitted",
    });
  }
  next();
};

module.exports = { authenticateToken, authorizeRoles, requireApprovedDoctor };
