const WebsiteUser = require("../db/models/website_user");
const Otp = require("../db/models/otp");
const Order = require("../db/models/order");
const cfg = require("../utils/website_config");
const auth = require("../utils/auth");
const { sendOtpEmail } = require("../utils/mailer");
const { cleanPhone, cleanAddress, cleanText } = require("../utils/validation");

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function normEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function publicUser(user) {
  return {
    email: user.email,
    name: user.name || "",
    phone: user.phone || "",
    address: user.address || null,
    is_admin: auth.isAdminEmail(user.email),
  };
}

function fail(res, status, message, extra = {}) {
  return res.status(status).json({ message, ...extra });
}

function checkPassword(password) {
  if (typeof password !== "string" || password.length < cfg.MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${cfg.MIN_PASSWORD_LENGTH} characters.`;
  }
  if (password.length > 128) return "Password is too long.";
  return null;
}

// Creates a new code (replacing older ones) and emails it.
// Returns false if a code was sent too recently.
async function issueOtp(email, purpose) {
  const last = await Otp.findOne({ email, purpose }).sort({ createdAt: -1 });
  if (last && Date.now() - last.createdAt.getTime() < cfg.OTP_RESEND_SECONDS * 1000) {
    return false;
  }
  const code = auth.generateOtp();
  await Otp.deleteMany({ email, purpose });
  await Otp.create({
    email,
    purpose,
    code_hash: auth.hashOtp(email, purpose, code),
    expires_at: new Date(Date.now() + cfg.OTP_TTL_MINUTES * 60 * 1000),
  });
  await sendOtpEmail(email, purpose, code);
  return true;
}

// Checks a code. Returns null on success, otherwise an error message.
async function consumeOtp(email, purpose, code) {
  const otp = await Otp.findOne({ email, purpose }).sort({ createdAt: -1 });
  if (!otp || otp.expires_at < new Date()) return "The code has expired. Ask for a new one.";
  if (otp.attempts >= cfg.OTP_MAX_ATTEMPTS) return "Too many wrong attempts. Ask for a new code.";
  if (!auth.otpMatches(email, purpose, code, otp.code_hash)) {
    otp.attempts += 1;
    await otp.save();
    return "That code is not correct.";
  }
  await Otp.deleteMany({ email, purpose });
  return null;
}

function loggedIn(res, user) {
  return res.json({ token: auth.signToken(user), user: publicUser(user) });
}

module.exports = {
  async signup(req, res, next) {
    try {
      const email = normEmail(req.body.email);
      const { password } = req.body;
      if (!EMAIL_RE.test(email)) return fail(res, 400, "Enter a valid email address.");
      const pwError = checkPassword(password);
      if (pwError) return fail(res, 400, pwError);

      let user = await WebsiteUser.findOne({ email });
      if (user && user.email_verified) {
        return fail(res, 409, "An account with this email already exists. Log in instead.");
      }
      const fields = {
        password_hash: auth.hashPassword(password),
        name: cleanText(req.body.name, 60),
        phone: req.body.phone ? cleanPhone(req.body.phone) : undefined,
      };
      if (req.body.phone && !fields.phone) return fail(res, 400, "Enter a valid 10-digit mobile number.");
      if (user) Object.assign(user, fields);
      else user = new WebsiteUser({ email, ...fields });
      await user.save();

      const sent = await issueOtp(email, "VERIFY_EMAIL");
      res.status(201).json({
        message: sent ? "We sent a code to your email." : "A code was sent recently. Check your email.",
        otp_sent: true,
      });
    } catch (err) {
      next(err);
    }
  },

  async verifyEmail(req, res, next) {
    try {
      const email = normEmail(req.body.email);
      const user = await WebsiteUser.findOne({ email });
      if (!user) return fail(res, 400, "That code is not correct.");
      const error = await consumeOtp(email, "VERIFY_EMAIL", req.body.code);
      if (error) return fail(res, 400, error);
      user.email_verified = true;
      await user.save();
      loggedIn(res, user);
    } catch (err) {
      next(err);
    }
  },

  async resendOtp(req, res, next) {
    try {
      const email = normEmail(req.body.email);
      const purpose = req.body.purpose;
      if (!["VERIFY_EMAIL", "RESET_PASSWORD", "ADMIN_LOGIN"].includes(purpose)) {
        return fail(res, 400, "Unknown code type.");
      }
      const user = await WebsiteUser.findOne({ email });
      // Only send codes that make sense for this account; reply the same either way.
      const allowed =
        user &&
        ((purpose === "VERIFY_EMAIL" && !user.email_verified) ||
          purpose === "RESET_PASSWORD" ||
          (purpose === "ADMIN_LOGIN" && auth.isAdminEmail(email) && (await Otp.exists({ email, purpose }))));
      if (allowed) {
        const sent = await issueOtp(email, purpose);
        if (!sent) return fail(res, 429, `Please wait ${cfg.OTP_RESEND_SECONDS} seconds before asking again.`);
      }
      res.json({ message: "If the email is registered, a new code is on its way." });
    } catch (err) {
      next(err);
    }
  },

  async login(req, res, next) {
    try {
      const email = normEmail(req.body.email);
      const user = await WebsiteUser.findOne({ email });
      if (!user || !auth.verifyPassword(req.body.password || "", user.password_hash)) {
        return fail(res, 401, "Email or password is wrong.");
      }
      if (!user.email_verified) {
        await issueOtp(email, "VERIFY_EMAIL");
        return fail(res, 403, "Verify your email first. We sent you a code.", { needs_verification: true });
      }
      if (auth.isAdminEmail(email)) {
        // Admins confirm every login with a code sent to their email.
        await issueOtp(email, "ADMIN_LOGIN");
        return res.json({ otp_required: true, message: "We sent a login code to your email." });
      }
      loggedIn(res, user);
    } catch (err) {
      next(err);
    }
  },

  async adminVerifyLogin(req, res, next) {
    try {
      const email = normEmail(req.body.email);
      const user = await WebsiteUser.findOne({ email });
      if (!user || !auth.isAdminEmail(email)) return fail(res, 400, "That code is not correct.");
      const error = await consumeOtp(email, "ADMIN_LOGIN", req.body.code);
      if (error) return fail(res, 400, error);
      loggedIn(res, user);
    } catch (err) {
      next(err);
    }
  },

  async forgotPassword(req, res, next) {
    try {
      const email = normEmail(req.body.email);
      const user = await WebsiteUser.findOne({ email });
      if (user) await issueOtp(email, "RESET_PASSWORD");
      // Same reply whether or not the account exists.
      res.json({ message: "If the email is registered, we sent a code to reset the password." });
    } catch (err) {
      next(err);
    }
  },

  async resetPassword(req, res, next) {
    try {
      const email = normEmail(req.body.email);
      const pwError = checkPassword(req.body.password);
      if (pwError) return fail(res, 400, pwError);
      const user = await WebsiteUser.findOne({ email });
      if (!user) return fail(res, 400, "That code is not correct.");
      const error = await consumeOtp(email, "RESET_PASSWORD", req.body.code);
      if (error) return fail(res, 400, error);
      user.password_hash = auth.hashPassword(req.body.password);
      user.email_verified = true; // they proved they own the email
      user.token_version = (user.token_version || 0) + 1; // log out other devices
      await user.save();
      res.json({ message: "Password changed. Log in with your new password." });
    } catch (err) {
      next(err);
    }
  },

  async me(req, res) {
    res.json({ user: publicUser(req.user) });
  },

  async updateMe(req, res, next) {
    try {
      const user = req.user;
      if ("name" in req.body) user.name = cleanText(req.body.name, 60);
      if ("phone" in req.body) {
        const phone = req.body.phone ? cleanPhone(req.body.phone) : "";
        if (req.body.phone && !phone) return fail(res, 400, "Enter a valid 10-digit mobile number.");
        user.phone = phone;
      }
      if ("address" in req.body) {
        const { address, error } = cleanAddress(req.body.address);
        if (error) return fail(res, 400, error);
        user.address = address;
      }
      await user.save();
      res.json({ user: publicUser(user) });
    } catch (err) {
      next(err);
    }
  },

  async myOrders(req, res, next) {
    try {
      const orders = await Order.find({ user_id: req.user._id }, { _id: 0, __v: 0, user_id: 0, "status_history.by": 0 })
        .sort({ createdAt: -1 })
        .limit(50)
        .lean();
      res.json({ orders });
    } catch (err) {
      next(err);
    }
  },
};
