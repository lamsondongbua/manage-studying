const jwt = require("jsonwebtoken");
const User = require("../models/User");

const auth = async (req, res, next) => {
  const header = req.header("Authorization");
  if (!header || !header.startsWith("Bearer "))
    return res.status(401).json({ msg: "No token provided" });

  const token = header.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select("-password");
    if (!req.user) return res.status(401).json({ msg: "Invalid token" });
    next();
  } catch (err) {
    return res.status(401).json({ msg: "Token expired or invalid" });
  }
};

module.exports = auth;
