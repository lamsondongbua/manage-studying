const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const pomodoroController = require("../controllers/pomodoroController");

router.use(auth);
router.post("/start", pomodoroController.start);
router.post("/stop", pomodoroController.stop);
router.get("/history", pomodoroController.history);

module.exports = router;
