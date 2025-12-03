// utils/upload.js
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const avatarDir = path.join(__dirname, "..", "uploads", "avatars");
if (!fs.existsSync(avatarDir)) fs.mkdirSync(avatarDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, avatarDir),
  filename: (req, file, cb) => {
    // e.g., avatar-<userId>-<timestamp>.ext
    const ext = path.extname(file.originalname);
    const safe = `avatar-${req.params.id || req.user?.id || "unknown"}-${Date.now()}${ext}`;
    cb(null, safe);
  },
});

function fileFilter(req, file, cb) {
  if (!file.mimetype.startsWith("image/")) {
    return cb(new Error("Only image files allowed"), false);
  }
  cb(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

module.exports = upload;
