const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const auth = require("../middleware/auth");
const musicController = require("../controllers/musicController");

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, "../../uploads/music");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for music file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  // Accept audio files only
  const allowedMimes = [
    "audio/mpeg",
    "audio/wav",
    "audio/ogg",
    "audio/webm",
    "audio/aac",
    "audio/flac",
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only audio files are allowed"), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
});

// Routes

// Get trending public music (before other GET routes)
router.get("/public/trending", musicController.getTrendingMusic);

// Upload music
router.post(
  "/upload",
  auth,
  upload.single("file"),
  musicController.uploadMusic,
);

// Increment play count
router.put("/:id/play", auth, musicController.incrementPlayCount);

// Get all user's music
router.get("/", auth, musicController.getUserMusic);

// Get specific music
router.get("/:id", auth, musicController.getMusicById);

// Stream music
router.get("/:id/stream",  musicController.streamMusic);

// Update music
router.put("/:id", auth, musicController.updateMusic);

// Delete music
router.delete("/:id", auth, musicController.deleteMusic);

module.exports = router;
