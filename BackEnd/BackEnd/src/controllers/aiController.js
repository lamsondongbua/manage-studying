const { GoogleGenerativeAI } = require("@google/generative-ai");
const Pomodoro = require("../models/PomodoroSession");
const Task = require("../models/Task");

/* =========================
   PROMPT CONFIG
========================= */
const SYSTEM_PROMPT = `
You are a Pomodoro Study Assistant.

You ALWAYS use the provided CONTEXT.
If Task is not "No active task", you MUST mention the task.
If Time remaining > 0, you MUST mention remaining time.
Never say you lack task information if context is provided.

Rules:
- Max 5 sentences
- Focus only on studying
- Be encouraging
`;


/* =========================
   GEMINI INIT
========================= */
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: process.env.GEMINI_MODEL || "models/gemini-2.5-pro",
});

/* =========================
   CONTROLLER
========================= */
const chatAI = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message?.trim()) {
      return res.status(400).json({ message: "Valid message is required" });
    }

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const todaySessions = await Pomodoro.find({
      user: req.user._id,
      isCompleted: true,
      createdAt: { $gte: startOfToday },
    }).lean();



    const completedSessionsToday = todaySessions.length;
    const totalFocusMinutes = todaySessions.reduce(
      (s, x) => s + (x.durationMinutes || 0),
      0,
    );

    const activeTask = await Task.findOne({
      user: req.user._id,
      completed: false,
    });


    const activeSession = await Pomodoro.findOne({
      user: req.user._id,
      isCompleted: false,
    });

    let timeRemaining = 0;
    if (activeSession?.startedAt && activeSession?.durationMinutes) {
      const elapsed =
        (Date.now() - new Date(activeSession.startedAt).getTime()) / 1000;
      timeRemaining = Math.max(
        activeSession.durationMinutes * 60 - Math.floor(elapsed),
        0,
      );
    }

    const context = {
      task: activeTask?.title ?? activeSession?.taskName ?? "No active task",
      pomodoroStatus: activeSession ? "focus" : "idle",
      timeRemaining,
      completedSessionsToday,
      totalFocusMinutes,
    };

    console.log("🧠 AI CONTEXT:", context);

    const prompt = `
${SYSTEM_PROMPT}

CONTEXT:
Task: ${context.task}
Status: ${context.pomodoroStatus}
Time remaining: ${Math.ceil(context.timeRemaining / 60)} minutes
Completed sessions today: ${context.completedSessionsToday}
Total focus today: ${context.totalFocusMinutes} minutes

USER QUESTION:
${message}

ANSWER:
`;

    const result = await model.generateContent(prompt);
    const reply = result?.response?.text() ?? "Stay focused! 🍅";

    res.json({ reply });
  } catch (err) {
    console.error("GEMINI ERROR:", err);
    res.status(500).json({
      reply: "AI is busy. Keep studying and try again shortly!",
    });
  }
};


module.exports = { chatAI };
