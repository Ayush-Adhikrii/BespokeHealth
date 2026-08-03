const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { createNotification } = require("../services/notificationService");

const getEffectivePrice = (medicine) =>
  medicine.discount_price && medicine.discount_price < medicine.price
    ? medicine.discount_price
    : medicine.price;

const getPrescribedMedicineNames = async (patientId) => {
  const medications = await prisma.medication.findMany({
    where: { prescription: { appointment: { patient_id: patientId } } },
    select: { name: true },
  });
  return medications.map((m) => m.name.trim().toLowerCase()).filter(Boolean);
};

const isPrescribedFor = (medicineName, prescribedNames) => {
  const name = medicineName.trim().toLowerCase();
  return prescribedNames.some((p) => p.includes(name) || name.includes(p));
};

const createOrder = async (req, res) => {
  const userId = req.user.id;
  const { items } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "Cart is empty" });
  }

  try {
    const patient = await prisma.patient.findUnique({ where: { userId } });
    if (!patient) {
      return res.status(404).json({ error: "Patient profile not found" });
    }

    const medicineIds = items.map((i) => parseInt(i.medicine_id));
    if (medicineIds.some((id) => isNaN(id))) {
      return res.status(400).json({ error: "Invalid medicine in cart" });
    }

    const medicines = await prisma.medicine.findMany({
      where: { id: { in: medicineIds } },
    });
    const medicineMap = new Map(medicines.map((m) => [m.id, m]));

    const requiresPrescriptionCheck = medicines.some((m) => m.prescription_required);
    const prescribedNames = requiresPrescriptionCheck
      ? await getPrescribedMedicineNames(patient.id)
      : [];

    let total_amount = 0;
    const orderItemsData = [];

    for (const item of items) {
      const medicineId = parseInt(item.medicine_id);
      const quantity = parseInt(item.quantity);
      const medicine = medicineMap.get(medicineId);

      if (!medicine) {
        return res.status(404).json({ error: `Medicine ${medicineId} not found` });
      }
      if (!quantity || quantity <= 0) {
        return res.status(400).json({ error: `Invalid quantity for ${medicine.name}` });
      }
      if (!medicine.in_stock || medicine.quantity < quantity) {
        return res.status(409).json({
          error: `${medicine.name} doesn't have enough stock (available: ${medicine.quantity})`,
        });
      }
      if (medicine.prescription_required && !isPrescribedFor(medicine.name, prescribedNames)) {
        return res.status(403).json({
          error: `${medicine.name} requires a valid prescription from a doctor before it can be purchased.`,
        });
      }

      const unit_price = getEffectivePrice(medicine);
      total_amount += unit_price * quantity;

      orderItemsData.push({
        medicine_id: medicine.id,
        medicine_name: medicine.name,
        quantity,
        unit_price,
      });
    }

    const order = await prisma.medicineOrder.create({
      data: {
        patient_id: patient.id,
        status: "pending",
        total_amount: parseFloat(total_amount.toFixed(2)),
        items: { create: orderItemsData },
      },
      include: { items: true },
    });

    res.status(201).json({ message: "Order created", order });
  } catch (error) {
    console.error("Create medicine order error:", error);
    res.status(500).json({ error: "Failed to create order" });
  }
};

const confirmOrderPayment = async (req, res) => {
  const userId = req.user.id;
  const { orderId } = req.params;

  try {
    const order = await prisma.medicineOrder.findUnique({
      where: { id: parseInt(orderId) },
      include: { items: true, patient: { include: { user: true } } },
    });

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    if (order.patient.user.id !== userId) {
      return res.status(403).json({ error: "Not authorized" });
    }
    if (order.status !== "pending") {
      return res.status(400).json({ error: `Order already ${order.status}` });
    }

    for (const item of order.items) {
      const medicine = await prisma.medicine.findUnique({ where: { id: item.medicine_id } });
      if (!medicine || medicine.quantity < item.quantity) {
        await prisma.medicineOrder.update({
          where: { id: order.id },
          data: { status: "failed" },
        });
        return res.status(409).json({
          error: `${item.medicine_name} no longer has enough stock. Order cancelled.`,
        });
      }
    }

    await prisma.$transaction(async (tx) => {
      for (const item of order.items) {
        const medicine = await tx.medicine.update({
          where: { id: item.medicine_id },
          data: { quantity: { decrement: item.quantity } },
        });
        if (medicine.quantity <= 0) {
          await tx.medicine.update({
            where: { id: item.medicine_id },
            data: { in_stock: false },
          });
        }
      }

      await tx.medicineOrder.update({
        where: { id: order.id },
        data: {
          status: "paid",
          payment_method: "direct",
          transaction_id: `medorder_${order.id}_${Date.now()}`,
          paid_at: new Date(),
        },
      });

      await createNotification(
        order.patient.user.id,
        `Your order #${order.id} has been placed successfully.`,
        "payment"
      );
    });

    res.status(200).json({
      success: true,
      message: "Order confirmed",
      order_id: order.id,
      total_amount: order.total_amount,
    });
  } catch (error) {
    console.error("Confirm medicine order payment error:", error);
    res.status(500).json({ error: "Failed to confirm order" });
  }
};

const getPrescriptionEligibility = async (req, res) => {
  const userId = req.user.id;

  try {
    const patient = await prisma.patient.findUnique({ where: { userId } });
    if (!patient) {
      return res.status(404).json({ error: "Patient profile not found" });
    }

    const [restrictedMedicines, prescribedNames] = await Promise.all([
      prisma.medicine.findMany({
        where: { prescription_required: true },
        select: { id: true, name: true },
      }),
      getPrescribedMedicineNames(patient.id),
    ]);

    const eligible_medicine_ids = restrictedMedicines
      .filter((m) => isPrescribedFor(m.name, prescribedNames))
      .map((m) => m.id);

    res.status(200).json({ eligible_medicine_ids });
  } catch (error) {
    console.error("Get prescription eligibility error:", error);
    res.status(500).json({ error: "Failed to check prescription eligibility" });
  }
};

const getMyOrders = async (req, res) => {
  const userId = req.user.id;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  try {
    const patient = await prisma.patient.findUnique({ where: { userId } });
    if (!patient) {
      return res.status(404).json({ error: "Patient profile not found" });
    }

    const [orders, total] = await Promise.all([
      prisma.medicineOrder.findMany({
        where: { patient_id: patient.id },
        include: { items: true },
        orderBy: { created_at: "desc" },
        skip,
        take: limit,
      }),
      prisma.medicineOrder.count({ where: { patient_id: patient.id } }),
    ]);

    res.status(200).json({
      orders,
      pagination: { total, page, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Get my medicine orders error:", error);
    res.status(500).json({ error: "Failed to retrieve orders" });
  }
};

const getOrderById = async (req, res) => {
  const userId = req.user.id;
  const { orderId } = req.params;

  try {
    const order = await prisma.medicineOrder.findUnique({
      where: { id: parseInt(orderId) },
      include: {
        items: true,
        patient: { include: { user: { select: { id: true, name: true, email: true } } } },
      },
    });

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    if (order.patient.user.id !== userId && req.user.role !== "Admin") {
      return res.status(403).json({ error: "Not authorized" });
    }

    res.status(200).json({ order });
  } catch (error) {
    console.error("Get medicine order error:", error);
    res.status(500).json({ error: "Failed to retrieve order" });
  }
};

const getAllOrders = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const status = req.query.status || "";
  const skip = (page - 1) * limit;

  try {
    const where = status ? { status } : {};

    const [orders, total] = await Promise.all([
      prisma.medicineOrder.findMany({
        where,
        include: {
          items: true,
          patient: { include: { user: { select: { name: true, email: true } } } },
        },
        orderBy: { created_at: "desc" },
        skip,
        take: limit,
      }),
      prisma.medicineOrder.count({ where }),
    ]);

    res.status(200).json({
      orders,
      pagination: { total, page, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Get all medicine orders error:", error);
    res.status(500).json({ error: "Failed to retrieve orders" });
  }
};

const updateOrderStatus = async (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;

  const allowedStatuses = ["paid", "shipped", "delivered", "cancelled"];
  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }

  try {
    const order = await prisma.medicineOrder.findUnique({
      where: { id: parseInt(orderId) },
      include: { patient: { include: { user: true } } },
    });

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    const updated = await prisma.medicineOrder.update({
      where: { id: parseInt(orderId) },
      data: { status },
    });

    await createNotification(
      order.patient.user.id,
      `Your order #${order.id} status has been updated to: ${status}.`,
      "payment"
    );

    res.status(200).json({ message: "Order status updated", order: updated });
  } catch (error) {
    console.error("Update medicine order status error:", error);
    res.status(500).json({ error: "Failed to update order status" });
  }
};

module.exports = {
  createOrder,
  confirmOrderPayment,
  getPrescriptionEligibility,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
};
