const { GoogleGenerativeAI } = require("@google/generative-ai");

/* =========================
   PROMPT CONFIG
========================= */
const SYSTEM_PROMPT = `
You are a Pomodoro Study Assistant.

Rules:
- Keep responses short (max 5 sentences)
- Help user focus on studying
- Avoid distractions
- If question is unrelated, gently redirect to studying
- Be encouraging and supportive
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
const chatAI = async (req, res, next) => {
  try {
    const { message, context } = req.body;

    if (!message || typeof message !== "string" || message.trim() === "") {
      return res.status(400).json({ message: "Valid message is required" });
    }

    const safeContext = {
      task: context?.task || "Unknown task",
      pomodoroStatus: context?.pomodoroStatus || "idle",
      timeRemaining: context?.timeRemaining || 0,
      completedSessionsToday: context?.completedSessionsToday || 0,
    };

    const prompt = `
${SYSTEM_PROMPT}

CONTEXT:
Task: ${safeContext.task}
Status: ${safeContext.pomodoroStatus}
Time remaining: ${Math.ceil(safeContext.timeRemaining / 60)} minutes
Completed sessions today: ${safeContext.completedSessionsToday}

USER QUESTION:
${message}

ANSWER:
`;

    const result = await model.generateContent(prompt);

    const reply =
      result?.response?.text() || "Stay focused! Let's continue studying.";

    res.json({ reply });
  } catch (err) {
    console.error("GEMINI ERROR:", err);

    // Better error handling
    if (err.status === 404) {
      return res.status(500).json({
        message: "AI model not available. Please check configuration.",
      });
    }

    if (err.status === 429) {
      return res.status(429).json({
        message: "Too many requests. Please try again later.",
      });
    }

    res.status(500).json({
      message: "AI service unavailable",
      reply:
        "I'm having trouble connecting right now. Keep studying and try again later!",
    });
  }
};

module.exports = { chatAI };
