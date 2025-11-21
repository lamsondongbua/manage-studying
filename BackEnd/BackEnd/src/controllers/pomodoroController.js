const Pomodoro = require("../models/PomodoroSession");
const StudyLog = require("../models/StudyLog");

exports.start = async (req, res) => {
  try {
    const session = new Pomodoro({
      user: req.user._id,
      startTime: new Date(),
    });
    await session.save();
    res.json(session);
  } catch (err) {
    res.status(500).send("Server error");
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

    session.endTime = new Date();
    const diffMs = session.endTime - session.startTime;
    const minutes = Math.round(diffMs / 60000);
    session.durationMinutes = minutes;
    session.isCompleted = true;
    await session.save();

    // Update StudyLog for that day
    const day = new Date(session.startTime);
    day.setHours(0, 0, 0, 0);
    const log = await StudyLog.findOneAndUpdate(
      { user: req.user._id, date: day },
      { $inc: { totalMinutes: minutes } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.json({ session, log });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
};

exports.history = async (req, res) => {
  try {
    const items = await Pomodoro.find({ user: req.user._id })
      .sort({ startTime: -1 })
      .limit(100);
    res.json(items);
  } catch (err) {
    res.status(500).send("Server error");
  }
};
