const Pomodoro = require("../models/PomodoroSession");
exports.start = async (req, res) => {
  try {
    const { taskName, duration } = req.body;
    const durationMinutes = parseInt(duration) > 0 ? parseInt(duration) : 25;

    const session = new Pomodoro({
      user: req.user._id,
      taskName: taskName || "Pomodoro Session",
      startTime: new Date(),
      durationMinutes,
      totalPausedTime: 0,
      pausedAt: null,
    });

    await session.save();

    const response = session.toObject();
    response.timeRemaining = session.getTimeRemaining();

    res.json(response);
  } catch (err) {
    console.error("❌ Error starting pomodoro:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
};

// ✅ FIXED Stop - Đảm bảo response structure nhất quán
exports.stop = async (req, res) => {
  const { sessionId } = req.body;
  try {
    const session = await Pomodoro.findOne({
      _id: sessionId,
      user: req.user._id,
    });

    if (!session) {
      return res.status(404).json({ msg: "Session not found" });
    }

    // Nếu session đang pause, tính thời gian pause và cộng dồn
    if (session.pausedAt) {
      const pausedDuration = (new Date() - new Date(session.pausedAt)) / 1000;
      session.totalPausedTime += Math.floor(pausedDuration);
      session.pausedAt = null;
    }

    // ✅ Cập nhật trạng thái hoàn thành
    session.endTime = new Date();
    session.isCompleted = true;
    session.status = "completed"; // ✅ Cập nhật cả status field
    
    await session.save();

    console.log(`✅ Session ${sessionId} stopped and marked as completed`);

    // ✅ Trả về plain object
    const response = session.toObject();
    response.timeRemaining = 0;

    res.json(response);
  } catch (err) {
    console.error("❌ Error stopping pomodoro:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
};




// ✅ Pause - Chỉ lưu timestamp
exports.pause = async (req, res) => {
  const { sessionId } = req.body;
  try {
    const session = await Pomodoro.findOne({
      _id: sessionId,
      user: req.user._id,
      isCompleted: false,
    });

    if (!session) {
      return res.status(404).json({ msg: "Session not found" });
    }

    // Nếu chưa pause → set pausedAt
    if (!session.pausedAt) {
      session.pausedAt = new Date();
      await session.save();
      console.log("⏸️ Session paused at:", session.pausedAt);
    }

    const response = session.toObject();
    response.timeRemaining = session.getTimeRemaining();

    res.json(response);
  } catch (err) {
    console.error("❌ Error pausing:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// ✅ Resume - Tính tổng thời gian pause và reset pausedAt
// controllers/pomodoroController.js
exports.resume = async (req, res) => {
  console.log("🔥 RESUME ENDPOINT ĐƯỢC GỌI!"); // ← THÊM DÒNG NÀY
  console.log("📦 Body:", req.body);
  console.log("👤 User:", req.user?._id);
  
  const { sessionId } = req.body;
  try {
    const session = await Pomodoro.findOne({
      _id: sessionId,
      user: req.user._id,
      isCompleted: false,
    });

    if (!session) {
      console.log("❌ Session not found");
      return res.status(404).json({ msg: "Session not found" });
    }

    if (session.pausedAt) {
      const pausedDuration = (new Date() - new Date(session.pausedAt)) / 1000;
      session.totalPausedTime += Math.floor(pausedDuration);
      session.pausedAt = null;
      await session.save();
      console.log("▶️ Session resumed, total paused time:", session.totalPausedTime, "seconds");
    }

    const response = session.toObject();
    response.timeRemaining = session.getTimeRemaining();

    res.json(response);
  } catch (err) {
    console.error("❌ Error resuming:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// ✅ HISTORY - Trả về mảng sessions
exports.history = async (req, res) => {
  try {
    console.log("🔍 History endpoint called");
    
    // ✅ Check if req.user exists
    if (!req.user || !req.user._id) {
      console.error("❌ req.user is undefined or missing _id");
      return res.status(401).json({ error: "User not authenticated" });
    }

    const userId = req.user._id.toString();
    console.log("👤 User ID:", userId);

    // ✅ Query sessions
    const sessions = await Pomodoro.find({ 
      user: req.user._id
    })
      .sort({ startTime: -1 })
      .limit(100)
      .lean();

    console.log("📦 Sessions found:", sessions.length);

    // ✅ Nếu không có sessions, trả về mảng rỗng
    if (!sessions || sessions.length === 0) {
      console.log("⚠️ No sessions found for user:", userId);
      return res.json([]);
    }

    // ✅ Map qua từng session và tính timeRemaining
    const sessionsWithTime = sessions.map((session) => {
      let timeRemaining = 0;
      
      if (!session.isCompleted) {
        const totalSeconds = session.durationMinutes * 60;
        const now = new Date();
        const startTime = new Date(session.startTime);
        const endPoint = session.pausedAt ? new Date(session.pausedAt) : now;
        const elapsedMs = endPoint - startTime;
        const elapsedSeconds = Math.floor(elapsedMs / 1000);
        const activeSeconds = elapsedSeconds - (session.totalPausedTime || 0);
        const remaining = totalSeconds - activeSeconds;
        timeRemaining = Math.max(0, remaining);
      }

      return {
        _id: session._id,
        taskName: session.taskName,
        startTime: session.startTime,
        endTime: session.endTime,
        durationMinutes: session.durationMinutes,
        status: session.status,
        pausedAt: session.pausedAt,
        totalPausedTime: session.totalPausedTime,
        isCompleted: session.isCompleted,
        timeRemaining: timeRemaining,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt
      };
    });

    console.log(`✅ History retrieved: ${sessionsWithTime.length} sessions`);
    res.json(sessionsWithTime);
    
  } catch (err) {
    console.error("❌ Error fetching history:", err.message);
    res.status(500).json({ 
      error: "Server error", 
      details: err.message 
    });
  }
};

exports.adminGetAllSessions = async (req, res) => {
  try {
    const sessions = await Pomodoro.find()
      .populate("user", "username email status role") // lấy info user
      .sort({ startTime: -1 })
      .lean();

    res.json(sessions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


exports.getSessionsByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ msg: "Missing user id" });
    }

    const PomodoroSession = require("../models/PomodoroSession");

    const sessions = await PomodoroSession.find({ user: userId }).sort({
      startTime: -1,
    });

    // Phân loại sessions
    const completedSessions = sessions.filter((s) => s.isCompleted === true);
    const incompleteSessions = sessions.filter((s) => s.isCompleted !== true);

    // Tính tổng phút đã hoàn thành
    const totalMinutes = completedSessions.reduce(
      (sum, s) => sum + (s.durationMinutes || 0),
      0
    );

    console.log(
      `📋 Admin fetched ${sessions.length} sessions for user ${userId}`
    );

    res.json({
      sessions,
      completed: completedSessions,
      incomplete: incompleteSessions,
      stats: {
        total: sessions.length,
        completed: completedSessions.length,
        incomplete: incompleteSessions.length,
        totalMinutes: totalMinutes,
      },
    });
  } catch (err) {
    console.error("❌ getSessionsByUserId error:", err);
    res.status(500).json({ msg: err.message });
  }
};