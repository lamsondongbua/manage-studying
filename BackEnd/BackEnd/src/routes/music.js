const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const musicController = require("../controllers/musicController");
const upload = require("../middleware/uploadMusic");



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


// Update music
router.put("/:id", auth, musicController.updateMusic);

// Delete music
router.delete("/:id", auth, musicController.deleteMusic);

module.exports = router;
