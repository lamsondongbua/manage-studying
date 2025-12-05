const StudyLog = require("../models/StudyLog");
const mongoose = require("mongoose");

exports.getDaily = async (req, res) => {
  const { date } = req.query; // optional YYYY-MM-DD
  try {
    let day = date ? new Date(date) : new Date();
    day.setHours(0, 0, 0, 0);
    const log = await StudyLog.findOne({ user: req.user._id, date: day });
    res.json(log || { totalMinutes: 0, tasksCompleted: 0, tasks: [] });
  } catch (err) {
    res.status(500).send("Server error");
  }
};

exports.getWeekly = async (req, res) => {
  try {
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() - 6);
    start.setHours(0, 0, 0, 0);
    const logs = await StudyLog.find({
      user: req.user._id,
      date: { $gte: start },
    }).sort({ date: 1 });
    res.json(logs);
  } catch (err) {
    res.status(500).send("Server error");
  }
};

exports.getMonthly = async (req, res) => {
  try {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const logs = await StudyLog.find({
      user: req.user._id,
      date: { $gte: start },
    }).sort({ date: 1 });
    res.json(logs);
  } catch (err) {
    res.status(500).send("Server error");
  }
};

// ===== LOG SESSION =====
exports.logSession = async (req, res) => {
  const { taskName, duration, completedAt } = req.body; // duration tính bằng PHÚT

  try {
    // Lấy ngày (bỏ giờ phút giây)
    const sessionDate = new Date(completedAt);
    sessionDate.setHours(0, 0, 0, 0);

    // Tìm hoặc tạo mới log cho ngày đó
    let log = await StudyLog.findOne({
      user: req.user._id,
      date: sessionDate,
    });

    if (!log) {
      log = new StudyLog({
        user: req.user._id,
        date: sessionDate,
        totalMinutes: 0,
        tasksCompleted: 0,
        tasks: [],
      });
    }

    // Chuyển duration sang Number để tránh lỗi
    const durationNum = Number(duration) || 0;

    // Cộng dồn thời gian
    log.totalMinutes += durationNum;
    log.tasksCompleted += 1;

    // Lưu thông tin task
    log.tasks.push({
      name: taskName,
      duration: durationNum,
      completedAt: new Date(completedAt),
    });

    await log.save();
    res.json({ message: "Log saved", log });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
};
