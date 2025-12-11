const User = require("../models/User");
const bcrypt = require("bcryptjs");

/* -----------------------------------------------------
   CREATE USER (ADMIN)
------------------------------------------------------*/
exports.createUser = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    if (!username || !email || !password)
      return res.status(400).json({ msg: "Missing fields" });

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ msg: "Email already exists" });

    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
      username,
      email,
      password: hashed,
      role: role || "user",
    });

    res.status(201).json({
      msg: "User created successfully",
      user: {
        id: user._id,
        username,
        email,
        role: user.role,
      },
    });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

/* -----------------------------------------------------
   UPDATE USER (ADMIN)
------------------------------------------------------*/
exports.updateUser = async (req, res) => {
  try {
    const { id, username, email, password, role } = req.body;

    if (!id) return res.status(400).json({ msg: "Missing user id" });

    const updateData = {};
    if (username) updateData.username = username;
    if (email) updateData.email = email;
    if (role) updateData.role = role;

    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const updated = await User.findByIdAndUpdate(id, updateData, {
      new: true,
    }).select("-password");

    if (!updated) return res.status(404).json({ msg: "User not found" });

    res.json({
      msg: "User updated successfully",
      user: updated,
    });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

/* -----------------------------------------------------
   GET ONE USER (ADMIN)
------------------------------------------------------*/
exports.getOneUser = async (req, res) => {
  try {
    const { id } = req.body;

    if (!id) return res.status(400).json({ msg: "Missing user id" });

    const user = await User.findById(id).select("-password");
    if (!user) return res.status(404).json({ msg: "User not found" });

    res.json({ user });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

/* -----------------------------------------------------
   GET ALL USERS (ADMIN)
------------------------------------------------------*/
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json({
      users,
    });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

/* -----------------------------------------------------
   DELETE USER (ADMIN)
------------------------------------------------------*/
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.body;

    if (!id) return res.status(400).json({ msg: "Missing user id" });

    const deleted = await User.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ msg: "User not found" });

    res.json({ msg: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};
