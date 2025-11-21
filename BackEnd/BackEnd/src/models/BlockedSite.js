const mongoose = require("mongoose");

const BlockedSiteSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  url: { type: String, required: true },
  status: { type: String, enum: ["blocked", "allowed"], default: "blocked" },
  createdAt: { type: Date, default: Date.now },
});

BlockedSiteSchema.index({ user: 1, url: 1 }, { unique: true });

module.exports = mongoose.model("BlockedSite", BlockedSiteSchema);
