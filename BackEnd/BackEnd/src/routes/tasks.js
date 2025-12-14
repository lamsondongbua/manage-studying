// backend/routes/tasks.js
const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const admin = require("../middleware/isAdmin"); // ✅ THÊM
const taskController = require("../controllers/taskController");

router.use(auth);
router.post("/", taskController.createTask);
router.get("/", taskController.getTasks);
router.put("/:id", taskController.updateTask);
router.delete("/:id", taskController.deleteTask);

// ✅ ADMIN: Get tasks by user ID
router.get("/user/:userId", admin, taskController.getTasksByUserId);

module.exports = router;
