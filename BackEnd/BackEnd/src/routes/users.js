const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const isAdmin = require("../middleware/isAdmin");

const {
  createUser,
  updateUser,
  getOneUser,
  getAllUsers,
  deleteUser,
} = require("../controllers/userController");

// CREATE
router.post("/create", auth, isAdmin, createUser);

// UPDATE
router.put("/update", auth, isAdmin, updateUser);

// GET ONE USER
router.post("/getOne", auth, getOneUser);

// GET ALL USERS
router.get("/getAll", auth, getAllUsers);

// DELETE
router.delete("/delete", auth, isAdmin, deleteUser);

module.exports = router;
