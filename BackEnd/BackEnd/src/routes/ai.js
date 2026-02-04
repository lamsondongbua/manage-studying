const express = require("express");
const { chatAI } = require("../controllers/aiController");
const  auth  = require("../middleware/auth");
const { aiLimiter } = require("../middleware/aiRateLimit");

const router = express.Router();


router.post("/chat", auth, aiLimiter, chatAI);

module.exports = router;
