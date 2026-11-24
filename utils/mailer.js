const nodemailer = require("nodemailer");
const cfg = require("./website_config");

let transporter = null;

function getTransporter() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass: pass.replace(/\s+/g, "") },
    });
  }
  return transporter;
}

const SUBJECTS = {
  VERIFY_EMAIL: "Verify your email",
  RESET_PASSWORD: "Reset your password",
  ADMIN_LOGIN: "Admin login code",
};

const INTROS = {
  VERIFY_EMAIL: "Use this code to verify your email address:",
  RESET_PASSWORD: "Use this code to reset your password:",
  ADMIN_LOGIN: "Use this code to finish logging in to the admin panel:",
};

async function sendOtpEmail(to, purpose, code) {
  const transport = getTransporter();
  if (!transport) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Email is not configured. Set GMAIL_USER and GMAIL_APP_PASSWORD.");
    }
    // Local development without Gmail: print the code instead of emailing it.
    console.log(`[dev] ${purpose} code for ${to}: ${code}`);
    return;
  }
  const subject = `${code} is your ${cfg.SHOP_NAME} code`;
  const minutes = cfg.OTP_TTL_MINUTES;
  await transport.sendMail({
    from: `"${cfg.SHOP_NAME}" <${process.env.GMAIL_USER}>`,
    to,
    subject,
    text: `${INTROS[purpose]}\n\n${code}\n\nThe code expires in ${minutes} minutes. If you did not ask for it, ignore this email.\n\n${cfg.SHOP_NAME}`,
    html: `<div style="font-family:Arial,sans-serif;max-width:420px">
      <h2 style="margin:0 0 12px">${SUBJECTS[purpose]}</h2>
      <p>${INTROS[purpose]}</p>
      <p style="font-size:28px;letter-spacing:6px;font-weight:bold;margin:16px 0">${code}</p>
      <p style="color:#666">The code expires in ${minutes} minutes. If you did not ask for it, ignore this email.</p>
      <p style="color:#8f6c25;font-weight:bold">${cfg.SHOP_NAME}</p>
    </div>`,
  });
}

module.exports = { sendOtpEmail };
