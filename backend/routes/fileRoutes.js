const express = require("express");
const router = express.Router();
const path = require("path");
const { authenticateToken, authorizeRoles } = require("../middleware/auth");


router.get("/:type/:filename", (req, res) => {
  const { type, filename } = req.params;

  
  if (!["kyc", "cv", "medicines", "doctors"].includes(type)) {
    return res.status(404).send("File not found");
  }

  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  res.header('Cache-Control', 'public, max-age=31536000');

  const filePath = path.join(__dirname, "../uploads", type, filename);
  
  const fs = require('fs');
  if (!fs.existsSync(filePath)) {
    return res.status(404).send("File not found");
  }

  const ext = path.extname(filename).toLowerCase();
  const mimeTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.pdf': 'application/pdf'
  };
  
  const contentType = mimeTypes[ext] || 'application/octet-stream';
  res.setHeader('Content-Type', contentType);

  res.sendFile(filePath);
});

module.exports = router;
