const multer = require('multer');
const path = require('path');
const fs = require('fs');


const uploadsDir = path.join(__dirname, '../uploads');
const kycDir = path.join(uploadsDir, 'kyc');
const cvDir = path.join(uploadsDir, 'cv');
const medicineDir = path.join(uploadsDir, 'medicines');
const doctorPhotoDir = path.join(uploadsDir, 'doctors');

[uploadsDir, kycDir, cvDir, medicineDir, doctorPhotoDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const medicineStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, medicineDir);
  },
  filename: (req, file, cb) => {
    const fileExt = path.extname(file.originalname);
    cb(null, `medicine_${Date.now()}${fileExt}`);
  }
});
const kycStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, kycDir);
  },
  filename: (req, file, cb) => {
    const userId = req.user.id;
    const documentType = file.fieldname; 
    const fileExt = path.extname(file.originalname);
    cb(null, `${userId}_${documentType}_${Date.now()}${fileExt}`);
  }
});

const cvStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, cvDir);
  },
  filename: (req, file, cb) => {
    const fileExt = path.extname(file.originalname);
    cb(null, `cv_${Date.now()}${fileExt}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedFileTypes = ['.jpg', '.jpeg', '.png'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedFileTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPG, JPEG, PNG and PDF files are allowed.'), false);
  }
};

const uploadKYC = multer({
  storage: kycStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, 
  },
  fileFilter
});

const uploadCV = multer({
  storage: cvStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, 
  },
  fileFilter
});

const uploadMedicineImage = multer({
  storage: medicineStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, 
  },
  fileFilter
});
const doctorPhotoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, doctorPhotoDir);
  },
  filename: (req, file, cb) => {
    const userId = req.user?.id || 'unknown';
    const fileExt = path.extname(file.originalname);
    cb(null, `doctor_${userId}_${Date.now()}${fileExt}`);
  }
});

const uploadDoctorPhoto = multer({
  storage: doctorPhotoStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter
});

const doctorSignupPhotoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, doctorPhotoDir);
  },
  filename: (req, file, cb) => {
    const fileExt = path.extname(file.originalname);
    cb(null, `doctor_signup_${Date.now()}_${Math.round(Math.random() * 1e9)}${fileExt}`);
  }
});

const uploadDoctorSignupPhoto = multer({
  storage: doctorSignupPhotoStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter
});

module.exports = {
  uploadKYC,
  uploadCV,
  uploadMedicineImage,
  uploadDoctorPhoto,
  uploadDoctorSignupPhoto
};