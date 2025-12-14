const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const isAdmin = require("../middleware/isAdmin");

const {
  createUser,
  updateUser,
  updateUserStatus, // ✅ Import thêm
  getOneUser,
  getAllUsers,
  deleteUser,
} = require("../controllers/userController");

// CREATE
router.post("/create", auth, isAdmin, createUser);

// UPDATE
router.put("/:userId", auth, isAdmin, updateUser);

// UPDATE STATUS - ✅ Gọi từ controller
router.patch("/:userId/status", auth, isAdmin, updateUserStatus);


// GET ALL USERS
router.get("/getAll", auth, isAdmin, getAllUsers);

// GET ONE USER
router.get("/:userId", auth, isAdmin, getOneUser);
// DELETE
router.delete("/:userId", auth, isAdmin, deleteUser);

module.exports = router;
