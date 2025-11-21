const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

module.exports = async function sendEmail(to, subject, text) {
  const options = {
    from: process.env.MAIL_FROM || process.env.MAIL_USER,
    to,
    subject,
    text,
  };

  await transporter.sendMail(options);
  console.log(`📧 Email đã gửi tới ${to}`);
};
