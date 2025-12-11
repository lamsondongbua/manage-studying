const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const sendEmail = require("../untils/sendEmail");

const { OAuth2Client } = require("google-auth-library");
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Generate Access + Refresh token
const genTokens = (user) => {
  const accessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "15m",
  });

  const refreshToken = jwt.sign(
    { id: user._id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "7d" }
  );

  return { accessToken, refreshToken };
};

/* ----------------------------------------------
   REGISTER
------------------------------------------------*/
exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password)
      return res.status(400).json({ msg: "Missing fields" });

    const exists = await User.findOne({ email });
    if (exists)
      return res.status(400).json({ msg: "Email already registered" });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ username, email, password: hashed });

    const tokens = genTokens(user);
    res.status(201).json({
      msg: "User registered successfully",
      user: { id: user._id, username, email },
      ...tokens,
    });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

/* ----------------------------------------------
   LOGIN
------------------------------------------------*/
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: "Wrong password" });

    const tokens = genTokens(user);
    res.json({
      msg: "Login successful",
      user: { id: user._id, username: user.username, email: user.email, role: user.role, status: user.status },
      ...tokens,
    });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

/* ----------------------------------------------
   PROFILE
------------------------------------------------*/
exports.profile = async (req, res) => {
  res.json(req.user);
};

/* ----------------------------------------------
   REFRESH TOKEN
------------------------------------------------*/
exports.refresh = async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken)
    return res.status(401).json({ msg: "Missing refresh token" });

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) return res.status(401).json({ msg: "Invalid token" });

    const tokens = genTokens(user);
    res.json(tokens);
  } catch (err) {
    res.status(401).json({ msg: "Token expired or invalid" });
  }
};

/* ----------------------------------------------
   LOGOUT
------------------------------------------------*/
exports.logout = (req, res) => {
  res.json({ msg: "Logged out (FE clear token)" });
};

/* ----------------------------------------------
   GOOGLE LOGIN
------------------------------------------------*/
exports.googleLogin = async (req, res) => {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🟢 GOOGLE LOGIN START');
  console.log('Request body:', req.body);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  try {
    // ✅ FIX: Đổi từ "token" sang "credential"
    const { credential } = req.body;
    
    console.log('Step 1: Credential check');
    console.log('  Credential exists?', !!credential);
    console.log('  Credential type:', typeof credential);
    console.log('  Credential length:', credential?.length);
    
    if (!credential) {
      console.log('❌ Missing credential');
      return res.status(400).json({ msg: 'Missing Google credential' });
    }

    console.log('Step 2: Verifying with Google...');
    console.log('  GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID);
    
    const ticket = await client.verifyIdToken({
      idToken: credential,  // ✅ FIX: Dùng "credential"
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    console.log('✅ Token verified');

    const payload = ticket.getPayload();
    const { email, name, picture, sub } = payload;
    
    console.log('Step 3: User data extracted');
    console.log('  Email:', email);
    console.log('  Name:', name);
    console.log('  Sub:', sub);

    console.log('Step 4: Finding user in DB...');
    let user = await User.findOne({ email });
    console.log('  User exists?', !!user);

    if (!user) {
      console.log('Step 5: Creating new user...');
      
      // ✅ FIX: Hash password thay vì lưu plain text
      const hashedPassword = await bcrypt.hash(sub, 10);
      
      user = await User.create({
        username: name,
        email,
        password: hashedPassword,  // ✅ Lưu password đã hash
      });
      
      console.log('  User created:', user._id);
    }

    console.log('Step 6: Generating tokens...');
    const tokens = genTokens(user);

    console.log('Step 7: Sending response...');
    res.json({
      msg: "Google login successful",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        picture,
        role: user.role, // ⬅️ THÊM VÀO
        status: user.status, // ⬅️ THÊM VÀO
      },
      ...tokens,
    });
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ GOOGLE LOGIN SUCCESS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
  } catch (err) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('❌ GOOGLE LOGIN ERROR');
    console.log('Error name:', err.name);
    console.log('Error message:', err.message);
    console.log('Full error:', err);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    res.status(500).json({ 
      msg: "Google authentication failed",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

/* ----------------------------------------------
   FORGOT PASSWORD - GỬI OTP
------------------------------------------------*/
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ msg: "Missing email" });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: "Email not found" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    user.resetPasswordOTP = otp;
    user.resetPasswordExpires = Date.now() + 5 * 60 * 1000;
    await user.save();

    const message = `
Xin chào,

Bạn đã yêu cầu đặt lại mật khẩu.
Mã xác thực (OTP) của bạn là: ${otp}
Mã có hiệu lực trong 5 phút.

Nếu bạn không yêu cầu, hãy bỏ qua email này.

Trân trọng,
Hệ thống hỗ trợ người dùng. <3
`;

    await sendEmail(email, "Mã OTP khôi phục mật khẩu", message);

    res.json({ msg: "OTP đã gửi về email" });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

/* ----------------------------------------------
   VERIFY OTP
------------------------------------------------*/
exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({
      email,
      resetPasswordOTP: otp,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user)
      return res.status(400).json({ msg: "OTP không đúng hoặc đã hết hạn" });

    res.json({ msg: "OTP hợp lệ" });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

/* ----------------------------------------------
   RESET PASSWORD
------------------------------------------------*/
exports.resetPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: "User not found" });

    const hashed = await bcrypt.hash(newPassword, 10);

    user.password = hashed;
    user.resetPasswordOTP = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.json({ msg: "Đặt lại mật khẩu thành công" });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};
