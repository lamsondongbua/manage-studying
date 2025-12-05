const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const logCtrl = require("../controllers/logController");

router.use(auth);
router.get("/daily", logCtrl.getDaily);
router.get("/weekly", logCtrl.getWeekly);
router.get("/monthly", logCtrl.getMonthly);
router.post("/log-session", auth, logCtrl.logSession);

module.exports = router;
