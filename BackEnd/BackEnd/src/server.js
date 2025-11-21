require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const connectDB = require("./config/db");
const errorHandler = require("./middleware/errorHandler");

const app = express();


//  KẾT NỐI DATABASE MONGODB
// ================================
connectDB();

// MIDDLEWARES
// ================================
app.use(helmet());
app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:5000"], // cho phép FE React truy cập
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());
app.use(morgan("dev"));

// Giới hạn request (chống DDoS nhẹ)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 200,
  message: "Too many requests, please try again later.",
});
app.use(limiter);

//  ROUTES
// ================================
app.use("/api/auth", require("./routes/auth"));
app.use("/api/tasks", require("./routes/tasks"));
app.use("/api/pomodoro", require("./routes/pomodoro"));
app.use("/api/blocked-sites", require("./routes/blockedSites"));
app.use("/api/logs", require("./routes/logs"));

// Middleware xử lý lỗi tổng thể
app.use(errorHandler);

//CHẠY SERVER
// ================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(` Server is running on: http://localhost:${PORT}`);
});
