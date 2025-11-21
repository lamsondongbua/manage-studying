const BlockedSite = require("../models/BlockedSite");

exports.add = async (req, res) => {
  const { url } = req.body;
  try {
    const bs = new BlockedSite({ user: req.user._id, url });
    await bs.save();
    res.json(bs);
  } catch (err) {
    if (err.code === 11000)
      return res.status(400).json({ msg: "Already blocked" });
    res.status(500).send("Server error");
  }
};

exports.list = async (req, res) => {
  try {
    const list = await BlockedSite.find({ user: req.user._id });
    res.json(list);
  } catch (err) {
    res.status(500).send("Server error");
  }
};

exports.remove = async (req, res) => {
  try {
    const { id } = req.params;
    const removed = await BlockedSite.findOneAndDelete({
      _id: id,
      user: req.user._id,
    });
    if (!removed) return res.status(404).json({ msg: "Not found" });
    res.json({ msg: "Removed" });
  } catch (err) {
    res.status(500).send("Server error");
  }
};
