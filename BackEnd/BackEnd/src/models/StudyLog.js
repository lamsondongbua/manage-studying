const mongoose = require("mongoose");

const StudyLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  date: { type: Date, required: true }, // store as UTC midnight for that day
  totalMinutes: { type: Number, default: 0 },
  tasksCompleted: { type: Number, default: 0 },
});

StudyLogSchema.index({ user: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("StudyLog", StudyLogSchema);
