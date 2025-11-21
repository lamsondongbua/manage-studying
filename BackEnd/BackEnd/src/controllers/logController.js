const StudyLog = require("../models/StudyLog");
const mongoose = require("mongoose");

exports.getDaily = async (req, res) => {
  const { date } = req.query; // optional YYYY-MM-DD
  try {
    let day = date ? new Date(date) : new Date();
    day.setHours(0, 0, 0, 0);
    const log = await StudyLog.findOne({ user: req.user._id, date: day });
    res.json(log || { totalMinutes: 0, tasksCompleted: 0 });
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
