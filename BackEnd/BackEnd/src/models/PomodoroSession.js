const mongoose = require("mongoose");

const PomodoroSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date }, // null nếu đang chạy
  durationMinutes: { type: Number }, // computed when finished
  isCompleted: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("PomodoroSession", PomodoroSchema);
