const Music = require("../models/Music");
const cloudinary = require("../config/cloudinary");


// @route   POST /api/music/upload
// @desc    Upload a music file
// @access  Private
exports.uploadMusic = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const { title, artist, duration, isPublic, coverImage } = req.body;

    if (!title || !artist) {
      return res.status(400).json({ message: "Title and artist are required" });
    }

    const music = new Music({
      userId: req.user.id,
      title: title.trim(),
      artist: artist.trim(),
      duration: parseInt(duration) || 0,

      // 🌥️ CLOUDINARY
      fileUrl: req.file.path,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      cloudinaryId: req.file.filename,

      coverImage: coverImage || null,
      isPublic: isPublic === "true" || false,
    });

    await music.save();

    res.status(201).json({
      message: "Music uploaded successfully",
      data: music,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Upload failed" });
  }
};

// @route   GET /api/music
// @desc    Get all music for the current user
// @access  Private
exports.getUserMusic = async (req, res) => {
  try {
    const music = await Music.find({ userId: req.user.id })
      .select("-fileUrl") // Exclude large data initially
      .sort({ createdAt: -1 });

    res.json({
      message: "Music retrieved successfully",
      count: music.length,
      data: music,
    });
  } catch (error) {
    console.error("Get music error:", error);
    res
      .status(500)
      .json({ message: "Failed to get music", error: error.message });
  }
};

// @route   GET /api/music/:id
// @desc    Get a specific music file
// @access  Private
exports.getMusicById = async (req, res) => {
  try {
    const music = await Music.findById(req.params.id);

    if (!music) {
      return res.status(404).json({ message: "Music not found" });
    }

    // Check authorization
    if (music.userId.toString() !== req.user.id && !music.isPublic) {
      return res
        .status(403)
        .json({ message: "Not authorized to access this music" });
    }

    res.json({
      message: "Music retrieved successfully",
      data: music,
    });
  } catch (error) {
    console.error("Get music by id error:", error);
    res
      .status(500)
      .json({ message: "Failed to get music", error: error.message });
  }
};


exports.updateMusic = async (req, res) => {
  try {
    let music = await Music.findById(req.params.id);

    if (!music) {
      return res.status(404).json({ message: "Music not found" });
    }

    // Check authorization
    if (music.userId.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this music" });
    }

    const { title, artist, duration, coverImage, isPublic } = req.body;

    if (title) music.title = title.trim();
    if (artist) music.artist = artist.trim();
    if (duration) music.duration = parseInt(duration);
    if (coverImage !== undefined) music.coverImage = coverImage;
    if (isPublic !== undefined)
      music.isPublic = isPublic === "true" || isPublic === true;

    await music.save();

    res.json({
      message: "Music updated successfully",
      data: music,
    });
  } catch (error) {
    console.error("Update music error:", error);
    res
      .status(500)
      .json({ message: "Failed to update music", error: error.message });
  }
};

// @route   DELETE /api/music/:id
// @desc    Delete a music file
// @access  Private
exports.deleteMusic = async (req, res) => {
  try {
    const music = await Music.findById(req.params.id);

    if (!music) return res.status(404).json({ message: "Not found" });

    if (music.userId.toString() !== req.user.id)
      return res.status(403).json({ message: "Forbidden" });

    // 🌥️ Delete from Cloudinary
    await cloudinary.uploader.destroy(music.cloudinaryId, {
      resource_type: "video",
    });

    await music.deleteOne();

    res.json({ message: "Music deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Delete failed" });
  }
};
// @route   PUT /api/music/:id/play
// @desc    Increment play count
// @access  Private
exports.incrementPlayCount = async (req, res) => {
  try {
    const music = await Music.findByIdAndUpdate(
      req.params.id,
      { $inc: { playCount: 1 } },
      { new: true },
    );

    if (!music) {
      return res.status(404).json({ message: "Music not found" });
    }

    res.json({
      message: "Play count updated",
      data: music,
    });
  } catch (error) {
    console.error("Play count error:", error);
    res
      .status(500)
      .json({ message: "Failed to update play count", error: error.message });
  }
};

// @route   GET /api/music/public/trending
// @desc    Get trending public music
// @access  Public
exports.getTrendingMusic = async (req, res) => {
  try {
    const music = await Music.find({ isPublic: true })
      .sort({ playCount: -1, createdAt: -1 })
      .limit(20);

    res.json({
      message: "Trending music retrieved successfully",
      count: music.length,
      data: music,
    });
  } catch (error) {
    console.error("Trending music error:", error);
    res
      .status(500)
      .json({ message: "Failed to get trending music", error: error.message });
  }
};
