const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();


async function logActivity(userId, action, details) {
  try {
    await prisma.activityLog.create({
      data: {
        userId,
        action,
        details,
      },
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
}

module.exports = { logActivity };