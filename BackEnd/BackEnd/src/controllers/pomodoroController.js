const Pomodoro = require("../models/PomodoroSession");
const StudyLog = require("../models/StudyLog");

exports.start = async (req, res) => {
  try {
    const { taskName, duration } = req.body;

    console.log("📥 Request received:", {
      taskName,
      duration,
      type: typeof duration,
    });

    // Parse và validate duration
    let durationMinutes = 25; // default

    if (duration !== undefined && duration !== null) {
      const parsed = parseInt(duration, 10);
      if (!isNaN(parsed) && parsed > 0) {
        durationMinutes = parsed;
      }
    }

    console.log("✅ Using duration:", durationMinutes);

    const session = new Pomodoro({
      user: req.user._id,
      taskName: taskName || "Pomodoro Session",
      startTime: new Date(),
      durationMinutes: durationMinutes,
      totalPausedTime: 0,
      pausedAt: null,
    });

    await session.save();

    // ✅ Trả về session với timeRemaining ban đầu
    const response = session.toObject();
    response.timeRemaining = session.getTimeRemaining();

    console.log("✅ Session created:", {
      _id: response._id,
      durationMinutes: response.durationMinutes,
      timeRemaining: response.timeRemaining,
    });

    res.json(response);
  } catch (err) {
    console.error("❌ Error starting pomodoro:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
};

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

    // ✅ Nếu đang pause, cộng thêm thời gian pause cuối cùng
    if (session.pausedAt) {
      const pausedDuration = (new Date() - new Date(session.pausedAt)) / 1000;
      session.totalPausedTime += Math.floor(pausedDuration);
      session.pausedAt = null;
    }

    session.endTime = new Date();
    session.isCompleted = true;
    await session.save();

    // ✅ Tính actual time để lưu study log
    const diffMs = session.endTime - new Date(session.startTime);
    const totalSeconds = Math.floor(diffMs / 1000);
    const activeSeconds = totalSeconds - session.totalPausedTime;
    const actualMinutes = Math.max(1, Math.round(activeSeconds / 60));

    console.log("⏹️ Session completed:", {
      sessionId,
      durationMinutes: session.durationMinutes,
      actualMinutes,
      totalPausedTime: session.totalPausedTime,
    });

    // Update StudyLog
    const day = new Date(session.startTime);
    day.setHours(0, 0, 0, 0);

    const log = await StudyLog.findOneAndUpdate(
      { user: req.user._id, date: day },
      { $inc: { totalMinutes: actualMinutes } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const response = session.toObject();
    response.timeRemaining = 0; // ✅ Completed = 0

    res.json({ session: response, log });
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
exports.resume = async (req, res) => {
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

    // Nếu đang pause → tính thời gian pause và reset
    if (session.pausedAt) {
      const pausedDuration = (new Date() - new Date(session.pausedAt)) / 1000;
      session.totalPausedTime += Math.floor(pausedDuration);
      session.pausedAt = null;
      await session.save();
      console.log(
        "▶️ Session resumed, total paused time:",
        session.totalPausedTime,
        "seconds"
      );
    }

    const response = session.toObject();
    response.timeRemaining = session.getTimeRemaining();

    res.json(response);
  } catch (err) {
    console.error("❌ Error resuming:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// ✅ History - Chỉ trả về timeRemaining khi load
exports.history = async (req, res) => {
  try {
    const items = await Pomodoro.find({ user: req.user._id })
      .sort({ startTime: -1 })
      .limit(100);

    const itemsWithTime = items.map((item) => {
      const obj = item.toObject();
      obj.timeRemaining = item.getTimeRemaining();
      return obj;
    });

    console.log("📋 History retrieved, total sessions:", itemsWithTime.length);

    res.json(itemsWithTime);
  } catch (err) {
    console.error("❌ Error fetching history:", err);
    res.status(500).json({ error: "Server error" });
  }
};
