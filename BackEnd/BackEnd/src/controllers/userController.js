const User = require("../models/User");
const bcrypt = require("bcryptjs");

/* -----------------------------------------------------
   CREATE USER (ADMIN)
-------------------------------------------------------*/
exports.createUser = async (req, res) => {
  try {
    console.log("📝 createUser called by:", req.user?.email);
    const { username, email, password, role } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ msg: "Missing fields" });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ msg: "Email already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      username,
      email,
      password: hashed,
      role: role || "user",
      status: "active", // ✅ Default status
    });

    console.log("✅ User created:", user.email);

    res.status(201).json({
      msg: "User created successfully",
      user: {
        id: user._id,
        username,
        email,
        role: user.role,
        status: user.status,
      },
    });
  } catch (err) {
    console.error("❌ createUser error:", err);
    res.status(500).json({ msg: err.message });
  }
};

/* -----------------------------------------------------
   UPDATE USER (ADMIN)
-------------------------------------------------------*/
exports.updateUser = async (req, res) => {
  try {
    console.log("📝 updateUser called");
    console.log("User ID:", req.params.userId);
    console.log("Update data:", req.body);

    const { userId } = req.params;
    const { username, email, password, role, status } = req.body;

    if (!userId) {
      return res.status(400).json({ msg: "Missing user id" });
    }

    const updateData = {};
    if (username) updateData.username = username;
    if (email) updateData.email = email;
    if (role) updateData.role = role;
    if (status) updateData.status = status; // ✅ Allow status update
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const updated = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
    }).select("-password");

    if (!updated) {
      return res.status(404).json({ msg: "User not found" });
    }

    console.log("✅ User updated:", updated.email);

    res.json({
      msg: "User updated successfully",
      user: updated,
    });
  } catch (err) {
    console.error("❌ updateUser error:", err);
    res.status(500).json({ msg: err.message });
  }
};

/* -----------------------------------------------------
   UPDATE USER STATUS (ADMIN) - ✅ WITH DETAILED LOGGING
-------------------------------------------------------*/
exports.updateUserStatus = async (req, res) => {
  try {
    console.log("🔄 updateUserStatus called");
    console.log("User ID:", req.params.userId);
    console.log("New Status:", req.body.status);
    console.log("Request user:", req.user?.email, "Role:", req.user?.role);

    const { userId } = req.params;
    const { status } = req.body;

    if (!userId) {
      console.log("❌ Missing userId");
      return res.status(400).json({ msg: "Missing user id" });
    }

    if (!status) {
      console.log("❌ Missing status");
      return res.status(400).json({ msg: "Missing status" });
    }

    // Validate status value
    const validStatuses = ["active", "inactive", "suspended"];
    if (!validStatuses.includes(status)) {
      console.log("❌ Invalid status:", status);
      return res.status(400).json({ msg: "Invalid status value" });
    }

    console.log("🔍 Finding user...");
    const user = await User.findById(userId);
    if (!user) {
      console.log("❌ User not found");
      return res.status(404).json({ msg: "User not found" });
    }

    console.log("📝 Current status:", user.status);
    console.log("🔄 Updating to:", status);

    const updated = await User.findByIdAndUpdate(
      userId,
      { status },
      { new: true }
    ).select("-password");

    console.log("✅ Status updated successfully");
    console.log("New status:", updated.status);

    res.json({
      msg: "Status updated successfully",
      user: {
        id: updated._id,
        email: updated.email,
        status: updated.status,
      },
    });
  } catch (err) {
    console.error("❌ updateUserStatus error:", err);
    res.status(500).json({ msg: err.message });
  }
};

/* -----------------------------------------------------
   GET ONE USER (ADMIN)
-------------------------------------------------------*/
exports.getOneUser = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ msg: "Missing user id" });
    }

    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    res.json({ user });
  } catch (err) {
    console.error("❌ getOneUser error:", err);
    res.status(500).json({ msg: err.message });
  }
};

/* -----------------------------------------------------
   GET ALL USERS (ADMIN)
-------------------------------------------------------*/
exports.getAllUsers = async (req, res) => {
  try {
    console.log("📋 getAllUsers called by:", req.user?.email);

    const users = await User.find().select("-password");

    console.log(`✅ Found ${users.length} users`);

    // ✅ Format response to match frontend expectations
    const formattedUsers = users.map((user) => ({
      id: user._id.toString(),
      _id: user._id.toString(),
      name: user.username,
      email: user.email,
      role: user.role || "user",
      status: user.status || "active",
      createdAt: user.createdAt,
      stats: {
        completedTasks: user.completedTasks || 0,
      },
    }));

    res.json({ users: formattedUsers });
  } catch (err) {
    console.error("❌ getAllUsers error:", err);
    res.status(500).json({ msg: err.message });
  }
};

/* -----------------------------------------------------
   DELETE USER (ADMIN)
-------------------------------------------------------*/
exports.deleteUser = async (req, res) => {
  try {
    console.log("🗑️ deleteUser called");
    console.log("User ID:", req.params.userId);

    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ msg: "Missing user id" });
    }

    const deleted = await User.findByIdAndDelete(userId);
    if (!deleted) {
      console.log("❌ User not found");
      return res.status(404).json({ msg: "User not found" });
    }

    console.log("✅ User deleted:", deleted.email);

    res.json({ msg: "User deleted successfully" });
  } catch (err) {
    console.error("❌ deleteUser error:", err);
    res.status(500).json({ msg: err.message });
  }
};
