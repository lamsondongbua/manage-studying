const Music = require("../models/Music");
const fs = require("fs");
const path = require("path");

// @route   POST /api/music/upload
// @desc    Upload a music file
// @access  Private
exports.uploadMusic = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const { title, artist } = req.body;

    if (!title || !artist) {
      // Delete file if validation fails
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: "Title and artist are required" });
    }

    // For production, you would upload to a cloud service like AWS S3, Google Cloud Storage, etc.
    // For now, we'll use local file system or a data URL
    const fileUrl = `/uploads/music/${req.file.filename}`;

    // Get audio duration (you may need to use a library like music-metadata or ffmpeg)
    // For simplicity, we'll store 0 and update it later
    const duration = parseInt(req.body.duration) || 0;

    const music = new Music({
      userId: req.user.id,
      title: title.trim(),
      artist: artist.trim(),
      duration: duration,
      fileUrl: fileUrl,
      fileName: req.file.filename,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      coverImage: req.body.coverImage || null,
      isPublic: req.body.isPublic === "true" || false,
    });

    await music.save();

    res.status(201).json({
      message: "Music uploaded successfully",
      music: music,
    });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    console.error("Upload error:", error);
    res
      .status(500)
      .json({ message: "Failed to upload music", error: error.message });
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

// @route   GET /api/music/:id/stream
// @desc    Stream audio file
// @access  Private
exports.streamMusic = async (req, res) => {
  try {
    const music = await Music.findById(req.params.id);
    if (!music) return res.sendStatus(404);

    if (!music.isPublic) {
      return res.sendStatus(403);
    }

    // ❗ remove "/" đầu path
    const relativePath = music.fileUrl.replace(/^\/+/, "");
    const filePath = path.resolve(process.cwd(), relativePath);
    console.log("filePath  là: ", filePath);

    if (!fs.existsSync(filePath)) {
      console.error("❌ FILE NOT FOUND:", filePath);
      return res.status(404).json({ message: "Audio file not found" });
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (!range) {
      res.writeHead(200, {
        "Content-Length": fileSize,
        "Content-Type": music.mimeType || "audio/mpeg",
        "Accept-Ranges": "bytes",
      });
      fs.createReadStream(filePath).pipe(res);
      return;
    }

    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1]
      ? Math.min(parseInt(parts[1], 10), fileSize - 1)
      : fileSize - 1;

    if (start >= fileSize) {
      return res.status(416).send("Requested range not satisfiable");
    }

    const chunkSize = end - start + 1;

    res.writeHead(206, {
      "Content-Range": `bytes ${start}-${end}/${fileSize}`,
      "Accept-Ranges": "bytes",
      "Content-Length": chunkSize,
      "Content-Type": music.mimeType || "audio/mpeg",
    });

    fs.createReadStream(filePath, { start, end }).pipe(res);
  } catch (err) {
    console.error("🔥 STREAM ERROR:", err);
    res.status(500).json({ message: "Stream error" });
  }
};

// @route   PUT /api/music/:id
// @desc    Update music metadata
// @access  Private
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

    if (!music) {
      return res.status(404).json({ message: "Music not found" });
    }

    // Check authorization
    if (music.userId.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this music" });
    }

    // Delete file from server
    const filePath = path.join(__dirname, "../..", music.fileUrl);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await Music.findByIdAndDelete(req.params.id);

    res.json({
      message: "Music deleted successfully",
    });
  } catch (error) {
    console.error("Delete music error:", error);
    res
      .status(500)
      .json({ message: "Failed to delete music", error: error.message });
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
