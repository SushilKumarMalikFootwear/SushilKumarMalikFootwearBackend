const nodemailer = require("nodemailer");
const cfg = require("./website_config");

let transporter = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD.replace(/\s+/g, ""),
      },
    });
  }
  return transporter;
}

// Tests replace the Gmail transport with a fake one so they never send real email.
function useTransportForTests(fake) {
  transporter = fake;
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
  const subject = `${code} is your ${cfg.SHOP_NAME} code`;
  const minutes = cfg.OTP_TTL_MINUTES;
  await getTransporter().sendMail({
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
    // Lets tests read which code was sent without parsing the text.
    headers: { "X-ND-Purpose": purpose },
  });
}

module.exports = { sendOtpEmail, useTransportForTests };
