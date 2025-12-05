const mongoose = require("mongoose");

const StudyLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  date: { type: Date, required: true },
  totalMinutes: { type: Number, default: 0 },
  tasksCompleted: { type: Number, default: 0 },
  tasks: [
    {
      name: String,
      duration: Number,
      completedAt: Date,
    },
  ],
});

// unique index để tránh duplicate
StudyLogSchema.index({ user: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("StudyLog", StudyLogSchema);
