const mongoose = require("mongoose");

const PomodoroSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    taskName: { type: String, default: "Pomodoro Session" },
    startTime: { type: Date, required: true },
    endTime: { type: Date },
    durationMinutes: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["running", "paused", "completed"],
      default: "running",
    },
    pausedAt: {
      type: Date,
      default: null,
    },
    totalPausedTime: {
      type: Number,
      default: 0, // Tổng thời gian đã pause (giây)
    },
    isCompleted: { type: Boolean, default: false },
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      required: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_, ret) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
    },
  },
);

// ✅ Method tính thời gian còn lại - FIX: Xử lý trường hợp đang pause
PomodoroSchema.methods.getTimeRemaining = function () {
  if (this.isCompleted) return 0;

  const totalSeconds = this.durationMinutes * 60;
  const now = new Date();
  const startTime = new Date(this.startTime);

  // ✅ Nếu đang pause, tính elapsed time đến thời điểm pause
  const endPoint = this.pausedAt ? new Date(this.pausedAt) : now;
  const elapsedMs = endPoint - startTime;
  const elapsedSeconds = Math.floor(elapsedMs / 1000);

  // Trừ đi thời gian đã pause
  const activeSeconds = elapsedSeconds - this.totalPausedTime;

  const remaining = totalSeconds - activeSeconds;
  return Math.max(0, remaining);
};

module.exports = mongoose.model("PomodoroSession", PomodoroSchema);
