const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const ctrl = require("../controllers/blockedSiteController");

router.use(auth);
router.post("/", ctrl.add);
router.get("/", ctrl.list);
router.delete("/:id", ctrl.remove);

module.exports = router;
