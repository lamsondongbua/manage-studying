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

exports.stop = async (req, res) => {
  const { sessionId } = req.body;
  try {
    const session = await Pomodoro.findOne({
      _id: sessionId,
      user: req.user._id,
    });

    if (!session) return res.status(404).json({ msg: "Session not found" });

    if (session.pausedAt) {
      const pausedDuration = (new Date() - new Date(session.pausedAt)) / 1000;
      session.totalPausedTime += Math.floor(pausedDuration);
      session.pausedAt = null;
    }

    session.endTime = new Date();
    session.isCompleted = true;
    await session.save();

    const response = session.toObject();
    response.timeRemaining = 0;

    res.json({ session: response });
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
