require("dotenv").config();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const { PrismaClient } = require("@prisma/client");
const { sendVerificationEmail, sendForgotPasswordEmail } = require("../utils/email");
const { generateOTP, verifyOTP } = require("../utils/otp");
const { logActivity } = require("../utils/activityLogger");

const prisma = new PrismaClient();

const verifyCaptcha = async (token) => {
  if (!token) return false;
  try {
    const response = await axios.post(
      "https://www.google.com/recaptcha/api/siteverify",
      null,
      { params: { secret: process.env.RECAPTCHA_SECRET_KEY, response: token } }
    );
    return response.data.success === true;
  } catch (error) {
    console.error("CAPTCHA verification request failed:", error.message);
    return false;
  }
};

const signup = async (req, res) => {
  const { name, email, password, role, nmc_number, speciality, educational_qualification, cv_url, years_of_experience, captchaToken } = req.body;

  try {
    const captchaValid = await verifyCaptcha(captchaToken);
    if (!captchaValid) {
      return res.status(400).json({ error: "CAPTCHA verification failed. Please try again." });
    }

    const existingUser = await prisma.users.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: "Email already registered" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const experience = parseInt(years_of_experience);

    const user = await prisma.users.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
      },
    });

    if (role === "Doctor") {
      const imageUrl = req.file ? `uploads/doctors/${req.file.filename}` : null;
      await prisma.doctor.create({
        data: {
          userId: user.id,
          nmc_number,
          speciality,
          educational_qualification,
          cv_url: cv_url || null,
          years_of_experience: experience,
          image_url: imageUrl,
        },
      });
    } else if (role === "Patient") {
      await prisma.patient.create({
        data: {
          userId: user.id,
        },
      });
    }

    await prisma.passwordHistory.create({
      data: {
        userId: user.id,
        password: hashedPassword,
      },
    });

    const otp = generateOTP();
    await prisma.users.update({
      where: { id: user.id },
      data: {
        otp,
        otp_expires: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    await sendVerificationEmail(email, otp);
    await logActivity(user.id, 'signup', `User ${email} signed up as ${role}`);

    res.status(201).json({
      message: "User registered successfully. Please check your email for verification.",
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ error: "Registration failed" });
  }
};

const verifyEmail = async (req, res) => {
  const { email, otp } = req.body;
  const tempDeviceId = req.headers['x-temp-device-id'];

  if (!email || !otp) {
    return res.status(400).json({ error: 'Email and OTP are required' });
  }

  try {
    const isValid = await verifyOTP(email, otp);
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    const user = await prisma.users.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (tempDeviceId) {
      const trustedDevice = await prisma.trustedDevices.upsert({
        where: { deviceId: tempDeviceId },
        update: {
          userId: user.id,
        },
        create: {
          userId: user.id,
          deviceId: tempDeviceId,
        },
      });
      console.log(`Stored deviceId ${tempDeviceId} for ${email} after OTP verification. Trusted device:`, trustedDevice);
    } else {
      console.log(`No tempDeviceId provided for ${email} during OTP verification`);
    }

    await prisma.users.update({
      where: { email },
      data: {
        email_verified: true,
        otp: null,
        otp_expires: null
      },
    });
    await logActivity(user.id, 'otp_verified', `OTP verified for ${email}`);
    return res.status(200).json({ message: 'Email verified successfully' });
  } catch (error) {
    console.error('Email verification error:', error);
    return res.status(500).json({ error: 'Verification failed' });
  }
};

const login = async (req, res) => {
  const { email, password, rememberMe, deviceId } = req.body;

  console.log('Login request received:', { email, password: '****', rememberMe, deviceId });

  if (!deviceId) {
    console.log(`Login warning: Missing deviceId for ${email}`);
    return res.status(400).json({ error: 'Device ID is required for login' });
  }

  try {
    const user = await prisma.users.findUnique({ where: { email } });
    if (!user) {
      console.log(`Login failed: User not found for email ${email}`);
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    if (user.account_locked_until && user.account_locked_until > new Date()) {
      const minutes = Math.ceil((user.account_locked_until - new Date()) / 60000);
      return res.status(403).json({ error: `Account locked. Try again in ${minutes} minute(s).` });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      let failedAttempts = user.failed_login_attempts + 1;
      let lockUntil = null;
      if (failedAttempts >= 5) {
        lockUntil = new Date(Date.now() + 5 * 60 * 1000);
        failedAttempts = 0;
      }
      await prisma.users.update({
        where: { id: user.id },
        data: {
          failed_login_attempts: failedAttempts,
          account_locked_until: lockUntil,
        },
      });
      if (lockUntil) {
        return res.status(403).json({ error: 'Account locked due to too many failed attempts. Try again in 5 minutes.' });
      }
      return res.status(400).json({ error: `Invalid credentials. ${5 - failedAttempts} attempt(s) left before lock.` });
    }

    if (user.failed_login_attempts > 0 || user.account_locked_until) {
      await prisma.users.update({
        where: { id: user.id },
        data: {
          failed_login_attempts: 0,
          account_locked_until: null,
        },
      });
    }

    if (!user.email_verified) {
      const otp = generateOTP();
      await prisma.users.update({
        where: { id: user.id },
        data: {
          otp,
          otp_expires: new Date(Date.now() + 10 * 60 * 1000),
        },
      });
      await sendVerificationEmail(email, otp);
      await logActivity(user.id, 'otp_sent', `OTP sent to ${email}`);
      return res.json({
        message: 'OTP sent to your email.',
        requiresOtp: true,
        email,
      });
    }

    let doctorProfileId = null;
    if (user.role === 'Doctor') {
      const doctorProfile = await prisma.doctor.findFirst({
        where: { userId: user.id },
        select: { id: true },
      });
      if (doctorProfile) {
        doctorProfileId = doctorProfile.id;
      }
    }

    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
        doctorId: doctorProfileId,
      },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    await logActivity(user.id, 'login', `User ${email} logged in`);

    await prisma.users.update({
      where: { id: user.id },
      data: {
        otp: null,
        otp_expires: null
      },
    });

    res.json({
      token,
      role: user.role,
      requiresOtp: false,
      email,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;
  console.log('Forgot password request received:', { email });

  try {
    const user = await prisma.users.findUnique({ where: { email } });
    if (!user) {
      console.log(`User not found for email: ${email}`);
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.email_verified) {
      console.log(`Email not verified for: ${email}`);
      return res.status(403).json({
        error: 'Email not verified. Please verify your email first.',
      });
    }

    const resetToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    console.log(`Generated reset token for user ${user.id}: ${resetToken.substring(0, 20)}...`);

    await prisma.users.update({
      where: { id: user.id },
      data: {
        reset_token: resetToken,
        reset_token_expires: new Date(Date.now() + 60 * 60 * 1000),
      },
    });

    console.log(`Reset token saved to database for user ${user.id}`);
    await sendForgotPasswordEmail(email, resetToken);
    console.log(`Reset password email sent to: ${email}`);

    res.json({ message: 'Password reset email sent. Check your inbox.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Forgot password failed' });
  }
};

const changePassword = async (req, res) => {
  const { token, newPassword } = req.body;
  console.log('Reset password request received:', { token: token ? `${token.substring(0, 20)}...` : 'null', hasPassword: !!newPassword });

  if (!token || !newPassword) {
    console.log('Missing token or password');
    return res.status(400).json({ error: 'Token and new password are required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token verified, user ID:', decoded.id);

    const user = await prisma.users.findFirst({
      where: {
        id: decoded.id,
        reset_token: token,
        reset_token_expires: { gt: new Date() },
      },
    });

    if (!user) {
      console.log('User not found or token mismatch');
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    console.log('User found:', user.id, user.email);

    const passwordHistory = await prisma.passwordHistory.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    for (const historyEntry of passwordHistory) {
      const isPasswordMatch = await bcrypt.compare(newPassword, historyEntry.password);
      if (isPasswordMatch) {
        console.log('Password matches history');
        return res.status(400).json({
          error: 'New password cannot be any of your last 5 passwords. Please choose a different password.'
        });
      }
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.passwordHistory.create({
      data: {
        userId: user.id,
        password: user.password,
      },
    });

    await prisma.users.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        reset_token: null,
        reset_token_expires: null,
      },
    });

    console.log('Password updated successfully for user:', user.id);
    await logActivity(user.id, 'password_changed', 'Password changed via reset token');
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(400).json({ error: 'Invalid reset token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(400).json({ error: 'Reset token has expired' });
    }
    res.status(500).json({ error: 'Password change failed' });
  }
};

const changePasswordWithCurrent = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.id;

  try {
    const user = await prisma.users.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const validCurrentPassword = await bcrypt.compare(currentPassword, user.password);
    if (!validCurrentPassword) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    const passwordHistory = await prisma.passwordHistory.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    for (const historyEntry of passwordHistory) {
      const isPasswordMatch = await bcrypt.compare(newPassword, historyEntry.password);
      if (isPasswordMatch) {
        return res.status(400).json({
          error: 'New password cannot be any of your last 5 passwords. Please choose a different password.'
        });
      }
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.passwordHistory.create({
      data: {
        userId: user.id,
        password: user.password,
      },
    });

    await prisma.users.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    await logActivity(user.id, 'password_changed', 'Password changed via current password');
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Password change failed' });
  }
};

const getProfile = async (req, res) => {
  try {
    const user = await prisma.users.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        email_verified: true,
        created_at: true,
        doctor: true,
        patient: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { doctor, patient, ...userFields } = user;

    if (doctor) {
      doctor.image_url = `${req.protocol}://${req.get('host')}/api/${doctor.image_url || 'uploads/doctors/doctor.png'}`;
    }

    res.json({
      ...userFields,
      doctorProfile: doctor || null,
      patientProfile: patient || null,
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
};

const updateProfile = async (req, res) => {
  const { name, email, doctorProfile, patientProfile } = req.body;

  try {
    const existingUser = await prisma.users.findUnique({
      where: { email, NOT: { id: req.user.id } },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Email already in use' });
    }

    await prisma.users.update({
      where: { id: req.user.id },
      data: { name, email },
    });

    if (req.user.role === 'Doctor' && doctorProfile) {
      const experience = parseInt(doctorProfile.years_of_experience);
      await prisma.doctor.update({
        where: { userId: req.user.id },
        data: {
          nmc_number: doctorProfile.nmc_number,
          speciality: doctorProfile.speciality,
          educational_qualification: doctorProfile.educational_qualification,
          years_of_experience: isNaN(experience) ? undefined : experience,
          former_organisation: doctorProfile.former_organisation || null,
          cv_url: doctorProfile.cv_url || null,
        },
      });
    } else if (req.user.role === 'Patient' && patientProfile) {
      await prisma.patient.update({
        where: { userId: req.user.id },
        data: {
          phone_number: patientProfile.phone_number || null,
          date_of_birth: patientProfile.date_of_birth ? new Date(patientProfile.date_of_birth) : null,
          gender: patientProfile.gender || null,
        },
      });
    }

    await logActivity(req.user.id, 'profile_updated', 'Profile updated');
    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

module.exports = {
  signup,
  verifyEmail,
  login,
  forgotPassword,
  changePassword,
  changePasswordWithCurrent,
  getProfile,
  updateProfile,
};
