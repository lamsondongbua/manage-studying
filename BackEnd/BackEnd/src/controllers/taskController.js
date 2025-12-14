const Task = require("../models/Task");

exports.createTask = async (req, res) => {
  const { title, description, dueDate, duration} = req.body;
  try {
    const task = new Task({
      user: req.user._id,
      title,
      description,
      dueDate,
      duration
    });
    await task.save();
    res.json(task);
  } catch (err) {
    res.status(500).send("Server error");
  }
};

exports.getTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ user: req.user._id }).sort({
      createdAt: -1,
    });
    res.json(tasks);
  } catch (err) {
    res.status(500).send("Server error");
  }
};

exports.updateTask = async (req, res) => {
  const { id } = req.params;
  try {
    const task = await Task.findOneAndUpdate(
      { _id: id, user: req.user._id },
      { $set: req.body },
      { new: true }
    );
    if (!task) return res.status(404).json({ msg: "Task not found" });
    res.json(task);
  } catch (err) {
    res.status(500).send("Server error");
  }
};

exports.deleteTask = async (req, res) => {
  const { id } = req.params;
  try {
    const task = await Task.findOneAndDelete({ _id: id, user: req.user._id });
    if (!task) return res.status(404).json({ msg: "Task not found" });
    res.json({ msg: "Task removed" });
  } catch (err) {
    res.status(500).send("Server error");
  }
};

/* -----------------------------------------------------
   GET TASKS BY USER ID (ADMIN)
-------------------------------------------------------*/
exports.getTasksByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ msg: "Missing user id" });
    }

    const Task = require("../models/Task");
    
    const tasks = await Task.find({ user: userId }).sort({ createdAt: -1 });
    
    // Phân loại tasks
    const completedTasks = tasks.filter(t => t.isCompleted === true);
    const incompleteTasks = tasks.filter(t => t.isCompleted !== true);

    console.log(`📋 Admin fetched ${tasks.length} tasks for user ${userId}`);

    res.json({
      tasks,
      completed: completedTasks,
      incomplete: incompleteTasks,
      stats: {
        total: tasks.length,
        completed: completedTasks.length,
        incomplete: incompleteTasks.length,
      }
    });
  } catch (err) {
    console.error("❌ getTasksByUserId error:", err);
    res.status(500).json({ msg: err.message });
  }
};

/* -----------------------------------------------------
   CREATE TASK FOR USER (ADMIN ONLY)
-------------------------------------------------------*/
exports.createTaskForUser = async (req, res) => {
  try {
    const { title, description, dueDate, duration, userId } = req.body;
    
    // Validate
    if (!userId) {
      return res.status(400).json({ msg: "userId is required" });
    }
    
    if (!title) {
      return res.status(400).json({ msg: "title is required" });
    }

    // ✅ Tạo task với user được chỉ định
    const task = new Task({
      user: userId,  // ✅ Dùng userId từ body (do admin chọn)
      title,
      description,
      dueDate,
      duration: duration || 25,
    });
    
    await task.save();
    
    console.log(`✅ Admin ${req.user.email} created task for user ${userId}`);
    
    res.json(task);
  } catch (err) {
    console.error("❌ createTaskForUser error:", err);
    res.status(500).json({ msg: err.message });
  }
};

/* -----------------------------------------------------
   UPDATE TASK FOR USER (ADMIN ONLY)
-------------------------------------------------------*/
exports.updateTaskForUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, dueDate, duration, completed } = req.body;
    
    // ✅ Admin có thể update bất kỳ task nào (không check user)
    const task = await Task.findByIdAndUpdate(
      id,
      { 
        $set: { 
          title, 
          description, 
          dueDate, 
          duration,
          completed 
        } 
      },
      { new: true }
    );
    
    if (!task) {
      return res.status(404).json({ msg: "Task not found" });
    }
    
    console.log(`✅ Admin ${req.user.email} updated task ${id}`);
    
    res.json(task);
  } catch (err) {
    console.error("❌ updateTaskForUser error:", err);
    res.status(500).json({ msg: err.message });
  }
};

/* -----------------------------------------------------
   DELETE TASK FOR USER (ADMIN ONLY)
-------------------------------------------------------*/
exports.deleteTaskForUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    // ✅ Admin có thể xóa bất kỳ task nào
    const task = await Task.findByIdAndDelete(id);
    
    if (!task) {
      return res.status(404).json({ msg: "Task not found" });
    }
    
    console.log(`✅ Admin ${req.user.email} deleted task ${id}`);
    
    res.json({ msg: "Task removed" });
  } catch (err) {
    console.error("❌ deleteTaskForUser error:", err);
    res.status(500).json({ msg: err.message });
  }
};