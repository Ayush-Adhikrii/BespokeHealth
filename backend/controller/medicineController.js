const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const path = require("path");


const addMedicine = async (req, res) => {
  try {
    const {
      name,
      description,
      manufacturer,
      price,
      discount_price,
      category,
      in_stock,
      quantity,
      prescription_required,
    } = req.body;

    if (!name || !price) {
      return res.status(400).json({ error: "Name and price are required" });
    }

    
    let image_url = null;
    if (req.file) {
      
      image_url = `/uploads/medicines/${path.basename(req.file.path)}`;
    }

    const medicine = await prisma.medicine.create({
      data: {
        name,
        description,
        manufacturer,
        price: parseFloat(price),
        discount_price: discount_price ? parseFloat(discount_price) : null,
        category,
        image_url,
        in_stock: in_stock === undefined ? true : Boolean(in_stock),
        quantity: quantity ? parseInt(quantity) : 0,
        prescription_required: Boolean(prescription_required),
      },
    });

    res.status(201).json({
      message: "Medicine added successfully",
      medicine: {
        ...medicine,
        image_url: medicine.image_url
          ? `${req.protocol}://${req.get("host")}/api${medicine.image_url}`
          : null,
      },
    });
  } catch (error) {
    console.error("Add medicine error:", error);
    res.status(500).json({ error: "Failed to add medicine" });
  }
};


const addFullImageUrls = (req, medicines) => {
  if (Array.isArray(medicines)) {
    return medicines.map((medicine) => ({
      ...medicine,
      image_url: medicine.image_url
        ? `${req.protocol}://${req.get("host")}/api${medicine.image_url}`
        : null,
    }));
  } else {
    return {
      ...medicines,
      image_url: medicines.image_url
        ? `${req.protocol}://${req.get("host")}/api${medicines.image_url}`
        : null,
    };
  }
};


const getAdminMedicines = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const medicines = await prisma.medicine.findMany({
      skip,
      take: limit,
      orderBy: { name: "asc" },
    });

    const total = await prisma.medicine.count();

    res.status(200).json({
      medicines,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get admin medicines error:", error);
    res.status(500).json({ error: "Failed to retrieve medicines" });
  }
};


const getAllMedicines = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || "";
    const category = req.query.category;
    const inStock = req.query.in_stock === "true";

    let whereClause = {};

    
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { manufacturer: { contains: search, mode: "insensitive" } },
      ];
    }

    
    if (category) {
      whereClause.category = category;
    }

    
    if (req.query.in_stock !== undefined) {
      whereClause.in_stock = inStock;
    }

    const medicines = await prisma.medicine.findMany({
      where: whereClause,
      skip,
      take: limit,
      orderBy: { name: "asc" },
    });

    
    const medicinesWithFullUrls = addFullImageUrls(req, medicines);

    const total = await prisma.medicine.count({ where: whereClause });

    res.status(200).json({
      medicines: medicinesWithFullUrls,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get all medicines error:", error);
    res.status(500).json({ error: "Failed to retrieve medicines" });
  }
};


const getMedicineById = async (req, res) => {
  try {
    const { id } = req.params;

    if (isNaN(parseInt(id))) {
      return res.status(400).json({ error: "Invalid medicine ID format" });
    }

    const medicine = await prisma.medicine.findUnique({
      where: { id: parseInt(id) },
    });

    if (!medicine) {
      return res.status(404).json({ error: "Medicine not found" });
    }

    
    const medicineWithFullUrl = addFullImageUrls(req, medicine);

    res.status(200).json(medicineWithFullUrl);
  } catch (error) {
    console.error("Get medicine by ID error:", error);
    res.status(500).json({ error: "Failed to retrieve medicine" });
  }
};


const updateMedicine = async (req, res) => {
  try {
    const { id } = req.params;
    if (isNaN(parseInt(id))) {
      return res.status(400).json({ error: "Invalid medicine ID format" });
    }

    const existing = await prisma.medicine.findUnique({ where: { id: parseInt(id) } });
    if (!existing) {
      return res.status(404).json({ error: "Medicine not found" });
    }

    const {
      name,
      description,
      manufacturer,
      price,
      discount_price,
      category,
      in_stock,
      quantity,
      prescription_required,
    } = req.body;

    if (!name || !price) {
      return res.status(400).json({ error: "Name and price are required" });
    }

    let image_url = existing.image_url;
    if (req.file) {
      image_url = `/uploads/medicines/${path.basename(req.file.path)}`;
    }

    const medicine = await prisma.medicine.update({
      where: { id: parseInt(id) },
      data: {
        name,
        description,
        manufacturer,
        price: parseFloat(price),
        discount_price: discount_price ? parseFloat(discount_price) : null,
        category,
        image_url,
        in_stock: in_stock === undefined ? existing.in_stock : in_stock === "true" || in_stock === true,
        quantity: quantity !== undefined ? parseInt(quantity) : existing.quantity,
        prescription_required: prescription_required === "true" || prescription_required === true,
      },
    });

    res.status(200).json({
      message: "Medicine updated successfully",
      medicine: addFullImageUrls(req, medicine),
    });
  } catch (error) {
    console.error("Update medicine error:", error);
    res.status(500).json({ error: "Failed to update medicine" });
  }
};

const deleteMedicine = async (req, res) => {
  try {
    const { id } = req.params;
    if (isNaN(parseInt(id))) {
      return res.status(400).json({ error: "Invalid medicine ID format" });
    }

    const existing = await prisma.medicine.findUnique({ where: { id: parseInt(id) } });
    if (!existing) {
      return res.status(404).json({ error: "Medicine not found" });
    }

    await prisma.medicine.delete({ where: { id: parseInt(id) } });

    res.status(200).json({ message: "Medicine deleted successfully" });
  } catch (error) {
    if (error.code === "P2003") {
      return res.status(409).json({
        error: "Cannot delete this medicine because it has existing orders. Mark it out of stock instead.",
      });
    }
    console.error("Delete medicine error:", error);
    res.status(500).json({ error: "Failed to delete medicine" });
  }
};

const getMedicineCategories = async (req, res) => {
  try {
    const categories = await prisma.medicine.findMany({
      select: { category: true },
      distinct: ["category"],
      where: { category: { not: null } },
    });

    const categoryList = categories
      .map((item) => item.category)
      .filter(Boolean);

    res.status(200).json(categoryList);
  } catch (error) {
    console.error("Get medicine categories error:", error);
    res.status(500).json({ error: "Failed to retrieve medicine categories" });
  }
};

module.exports = {
  addMedicine,
  updateMedicine,
  deleteMedicine,
  getAdminMedicines,
  getAllMedicines,
  getMedicineById,
  getMedicineCategories,
};
