const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const axios = require("axios");
const { createNotification } = require("../services/notificationService");


const initiateKhaltiPayment = async (req, res) => {
  const { paymentId } = req.params;
  const userId = req.user.id;

  try {
    
    const payment = await prisma.payment.findUnique({
      where: { id: parseInt(paymentId) },
      include: {
        appointment: {
          include: {
            patient: {
              include: {
                user: true,
              },
            },
            doctor: {
              include: {
                user: {
                  select: {
                    name: true,
                  },
                },
              },
            },
            time_slot: true,
          },
        },
      },
    });

    if (!payment) {
      return res.status(404).json({ error: "Payment not found" });
    }

    
    if (payment.appointment.patient.user.id !== userId) {
      return res
        .status(403)
        .json({ error: "You are not authorized to process this payment" });
    }

    
    if (payment.status !== "pending") {
      return res
        .status(400)
        .json({ error: `Payment already ${payment.status}` });
    }

    
    const purchase_order_id = `appointment_${
      payment.appointment_id
    }_${Date.now()}`;
    const purchase_order_name = `Appointment with Dr. ${payment.appointment.doctor.user.name}`;

    
    const amount = Math.round(parseFloat(payment.amount) * 100);

    
    const khaltiResponse = await axios.post(
      "https://dev.khalti.com/api/v2/epayment/initiate/",
      {
        return_url: `${process.env.FRONTEND_URL}/payment-callback`,
        website_url: process.env.FRONTEND_URL,
        amount: amount,
        purchase_order_id,
        purchase_order_name,
      },
      {
        headers: {
          Authorization: `Key ${process.env.KHALTI_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const { pidx, payment_url } = khaltiResponse.data;

    
    await prisma.payment.update({
      where: { id: parseInt(paymentId) },
      data: {
        transaction_id: purchase_order_id,
        payment_method: "khalti",
        
        metadata: JSON.stringify({ pidx, khalti_order_id: purchase_order_id }),
      },
    });

    res.status(200).json({
      success: true,
      pidx,
      payment_url,
      message:
        "Payment initiated successfully. Redirect user to the payment URL.",
      transaction_id: purchase_order_id,
    });
  } catch (error) {
    console.error("Initiate Khalti payment error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to initiate payment",
      details: error.response?.data || error.message,
    });
  }
};


const verifyKhaltiPayment = async (req, res) => {
  const { pidx, transaction_id } = req.body;

  try {
    
    const payment = await prisma.payment.findFirst({
      where: { transaction_id },
      include: {
        appointment: {
          include: {
            patient: {
              include: {
                user: true,
              },
            },
            doctor: {
              include: {
                user: true,
              }
            },
            time_slot: true,
          },
        },
      },
    });

    if (!payment || payment.status !== "pending") {
      return res.status(404).json({
        success: false,
        message: "Payment not found or already processed",
      });
    }

    
    const khaltiResponse = await axios.post(
      "https://dev.khalti.com/api/v2/epayment/lookup/",
      { pidx },
      {
        headers: {
          Authorization: `Key ${process.env.KHALTI_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const { status, total_amount } = khaltiResponse.data;

    if (status === "Completed") {
      
      await prisma.$transaction(async (tx) => {
        
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: "completed",
            metadata: JSON.stringify({
              ...JSON.parse(payment.metadata || "{}"),
              khalti_verification: khaltiResponse.data,
            }),
          },
        });

        
        await tx.appointment.update({
          where: { id: payment.appointment_id },
          data: {
            status: "confirmed",
          },
        });

        
        await createNotification(
          payment.appointment.patient.user.id,
          `Your payment for appointment with Dr. ${payment.appointment.doctor.user.name} has been confirmed.`,
          "payment"
        );

        await createNotification(
          payment.appointment.doctor.user.id,
          `${payment.appointment.patient.user.name}'s appointment payment has been confirmed.`,
          "payment"
        );
      });

      

      return res.status(200).json({
        success: true,
        message: "Payment verified successfully, appointment confirmed",
        appointment_id: payment.appointment_id,
        appointment_date: payment.appointment.time_slot.date
          .toISOString()
          .split("T")[0],
        appointment_time: payment.appointment.time_slot.start_time
          .toISOString()
          .substring(11, 16),
      });
    } else {
      
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: "failed",
          metadata: JSON.stringify({
            ...JSON.parse(payment.metadata || "{}"),
            khalti_verification: khaltiResponse.data,
            failure_reason: `Khalti status: ${status}`,
          }),
        },
      });

      return res.status(400).json({
        success: false,
        message: `Payment verification failed: ${status}`,
      });
    }
  } catch (error) {
    console.error("Verify Khalti payment error:", error);
    res.status(500).json({
      success: false,
      message: "Payment verification failed",
      details: error.response?.data || error.message,
    });
  }
};


const processPayment = async (req, res) => {
  const { paymentId } = req.params;
  const { payment_method } = req.body;

  
  if (payment_method === "khalti") {
    return initiateKhaltiPayment(req, res);
  }

  
  
};


const confirmDirectPayment = async (req, res) => {
  const { paymentId } = req.params;
  const userId = req.user.id;

  try {
    const payment = await prisma.payment.findUnique({
      where: { id: parseInt(paymentId) },
      include: {
        appointment: {
          include: {
            patient: { include: { user: true } },
            doctor: { include: { user: { select: { name: true } } } },
            time_slot: true,
          },
        },
      },
    });

    if (!payment) {
      return res.status(404).json({ error: "Payment not found" });
    }

    if (payment.appointment.patient.user.id !== userId) {
      return res.status(403).json({ error: "Not authorized" });
    }

    if (payment.status !== "pending") {
      return res.status(400).json({ error: `Payment already ${payment.status}` });
    }

    await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: "completed",
          payment_method: "direct",
          transaction_id: `direct_${payment.appointment_id}_${Date.now()}`,
        },
      });

      await tx.appointment.update({
        where: { id: payment.appointment_id },
        data: { status: "confirmed" },
      });

      await createNotification(
        payment.appointment.patient.user.id,
        `Your appointment with Dr. ${payment.appointment.doctor.user.name} has been confirmed.`,
        "payment"
      );

      await createNotification(
        payment.appointment.doctor.user.id,
        `${payment.appointment.patient.user.name}'s appointment has been confirmed.`,
        "payment"
      );
    });

    return res.status(200).json({
      success: true,
      message: "Payment confirmed",
      appointment_id: payment.appointment_id,
      appointment_date: payment.appointment.time_slot.date.toISOString().split("T")[0],
      appointment_time: payment.appointment.time_slot.start_time.toISOString().substring(11, 16),
    });
  } catch (error) {
    console.error("confirmDirectPayment error:", error);
    res.status(500).json({ error: "Failed to confirm payment" });
  }
};

const getPaymentDetails = async (req, res) => {

};

module.exports = {
  processPayment,
  getPaymentDetails,
  initiateKhaltiPayment,
  verifyKhaltiPayment,
  confirmDirectPayment,
};
