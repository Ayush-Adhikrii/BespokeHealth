const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const verifyOTP = async (email, otp) => {
  const user = await prisma.users.findUnique({ where: { email } });
  if (!user || user.otp !== otp || new Date() > user.otp_expires) {
    return false;
  }
  return true;
};

module.exports = { generateOTP, verifyOTP };