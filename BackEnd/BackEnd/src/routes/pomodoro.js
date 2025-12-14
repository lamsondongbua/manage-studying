const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const admin = require('../middleware/isAdmin');
const pomodoroController = require("../controllers/pomodoroController");

router.use(auth);
router.post("/start", pomodoroController.start);
router.post("/stop", pomodoroController.stop);
router.post("/pause",  pomodoroController.pause);  // ✅ New
router.post("/resume", pomodoroController.resume); // ✅ New
router.get("/history", pomodoroController.history);


router.get("/admin/all-sessions",auth,admin,pomodoroController.adminGetAllSessions);
router.get("/admin/user/:userId", admin, pomodoroController.getSessionsByUserId); // ✅ NEW



module.exports = router;
