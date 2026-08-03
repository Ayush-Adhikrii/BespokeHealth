const path = require("path");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { createNotification } = require("../services/notificationService");



const submitKYC = async (req, res) => {
  const userId = req.user.id;
  const { permanent_address, temporary_address } = req.body;

  try {
    
    if (
      !req.files ||
      !req.files.citizenship_front ||
      !req.files.citizenship_back
    ) {
      return res.status(400).json({
        error:
          "Missing citizenship documents. Please upload both front and back images.",
      });
    }

    if (!permanent_address) {
      return res.status(400).json({
        error: "Permanent address is required.",
      });
    }

    
    const citizenship_front = `/uploads/kyc/${path.basename(req.files.citizenship_front[0].path)}`;
    const citizenship_back = `/uploads/kyc/${path.basename(req.files.citizenship_back[0].path)}`;

    
    const existingKYC = await prisma.kYC.findUnique({
      where: { user_id: userId },
    });

    
    await prisma.$transaction(async (prisma) => {
      
      if (existingKYC) {
        await prisma.kYC.update({
          where: { user_id: userId },
          data: {
            citizenship_front,
            citizenship_back,
            permanent_address,
            temporary_address,
            status: "In-Review",
            updated_at: new Date(),
          },
        });
      } else {
        await prisma.kYC.create({
          data: {
            user_id: userId,
            citizenship_front,
            citizenship_back,
            permanent_address,
            temporary_address,
            status: "In-Review",
          },
        });
      }

      
      await prisma.users.update({
        where: { id: userId },
        data: { kyc_status: "In-Review" },
      });
    });

     await createNotification(
      userId,
      "Your KYC documents have been submitted and are under review. You will be notified once the review is complete.",
      "kyc_submitted"
    );

    return res.status(200).json({
      message:
        "KYC information submitted successfully. Your documents are under review.",
    });
  } catch (error) {
    console.error("KYC submission error:", error);
    return res.status(500).json({ error: "Failed to submit KYC information" });
  }
};


const getKYCStatus = async (req, res) => {
  const userId = req.user.id;

  try {
    const kyc = await prisma.kYC.findUnique({
      where: { user_id: userId },
    });

    if (!kyc) {
      return res.status(404).json({
        message: "KYC information not found",
        status: "Not Submitted",
      });
    }

    return res.status(200).json({
      status: kyc.status,
      submitted_at: kyc.created_at,
      updated_at: kyc.updated_at,
      review_notes: kyc.review_notes,
    });
  } catch (error) {
    console.error("Get KYC status error:", error);
    return res.status(500).json({ error: "Failed to retrieve KYC status" });
  }
};




const getKYCsForReview = async (req, res) => {
  
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const status = req.query.status || "In-Review";
  const skip = (page - 1) * limit;

  try {
    const kycs = await prisma.kYC.findMany({
      where: { status },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: { created_at: "asc" },
      skip,
      take: limit,
    });

    const totalCount = await prisma.kYC.count({
      where: { status },
    });

    return res.status(200).json({
      kycs,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
      totalCount,
    });
  } catch (error) {
    console.error("Get KYCs for review error:", error);
    return res
      .status(500)
      .json({ error: "Failed to retrieve KYCs for review" });
  }
};


const reviewKYC = async (req, res) => {
  const adminId = req.user.id; 
  const { kycId } = req.params;
  const { status, review_notes } = req.body;

  if (!["Approved", "Rejected"].includes(status)) {
    return res.status(400).json({
      error: "Invalid status. Status must be 'Approved' or 'Rejected'",
    });
  }

  try {
    const kyc = await prisma.kYC.findUnique({
      where: { id: parseInt(kycId) },
      include: { user: true },
    });

    if (!kyc) {
      return res.status(404).json({ error: "KYC not found" });
    }

    
    await prisma.$transaction(async (prisma) => {
      await prisma.kYC.update({
        where: { id: parseInt(kycId) },
        data: {
          status,
          review_notes,
          reviewed_by: adminId,
          reviewed_at: new Date(),
        },
      });

      await prisma.users.update({
        where: { id: kyc.user_id },
        data: { kyc_status: status },
      });
    });

     if (status === "Approved") {
      await createNotification(
        kyc.user_id,
        "Congratulations! Your KYC verification has been approved. You can now access all platform features.",
        "kyc_approved"
      );
    } else {
      await createNotification(
        kyc.user_id,
        `Your KYC verification has been rejected. Reason: ${review_notes || "Not specified"}. Please update your information and submit again.`,
        "kyc_rejected"
      );
    }

    return res.status(200).json({
      message: `KYC ${status.toLowerCase()} successfully`,
      user: {
        id: kyc.user.id,
        name: kyc.user.name,
        email: kyc.user.email,
      },
    });
  } catch (error) {
    console.error("Review KYC error:", error);
    return res.status(500).json({ error: "Failed to update KYC status" });
  }
};

module.exports = {
  submitKYC,
  getKYCStatus,
  getKYCsForReview,
  reviewKYC,
};
