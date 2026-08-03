const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { authenticateToken } = require("../middleware/auth");


router.use(authenticateToken);


router.get("/", async (req, res) => {
  try {
    const userId = req.user.id;
    
    const notifications = await prisma.notification.findMany({
      where: { user_id: userId },
      orderBy: { created_at: "desc" }
    });
    
    res.json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});


router.put("/read-all", async (req, res) => {
  try {
    const userId = req.user.id;

    await prisma.notification.updateMany({
      where: { user_id: userId, is_read: false },
      data: { is_read: true },
    });

    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    res.status(500).json({ error: "Failed to update notifications" });
  }
});


router.put("/:id/read", async (req, res) => {
  try {
    const userId = req.user.id;
    const notificationId = parseInt(req.params.id);
    
    
    const notification = await prisma.notification.findFirst({
      where: { 
        id: notificationId,
        user_id: userId
      }
    });
    
    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }
    
    
    await prisma.notification.update({
      where: { id: notificationId },
      data: { is_read: true }
    });
    
    res.json({ message: "Notification marked as read" });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ error: "Failed to update notification" });
  }
});

module.exports = router;