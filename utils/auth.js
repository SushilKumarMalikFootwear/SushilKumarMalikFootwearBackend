const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const cfg = require("./website_config");

// Presence and length are checked at startup (utils/env.js).
function jwtSecret() {
  return process.env.JWT_SECRET;
}

// ---- Passwords (scrypt, built into Node; no extra package) ----
function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, 64);
  return `scrypt$${salt.toString("base64")}$${hash.toString("base64")}`;
}

function verifyPassword(password, stored) {
  if (typeof stored !== "string") return false;
  const [scheme, saltB64, hashB64] = stored.split("$");
  if (scheme !== "scrypt" || !saltB64 || !hashB64) return false;
  const expected = Buffer.from(hashB64, "base64");
  const actual = crypto.scryptSync(String(password), Buffer.from(saltB64, "base64"), expected.length);
  return crypto.timingSafeEqual(actual, expected);
}

// ---- One-time codes ----
function generateOtp() {
  const max = 10 ** cfg.OTP_LENGTH;
  return String(crypto.randomInt(0, max)).padStart(cfg.OTP_LENGTH, "0");
}

function hashOtp(email, purpose, code) {
  return crypto
    .createHmac("sha256", jwtSecret())
    .update(`${String(email).toLowerCase()}|${purpose}|${code}`)
    .digest("hex");
}

function otpMatches(email, purpose, code, storedHash) {
  const a = Buffer.from(hashOtp(email, purpose, String(code || "").trim()), "hex");
  const b = Buffer.from(String(storedHash), "hex");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// ---- Admins ----
function adminEmails() {
  return process.env.ADMIN_EMAILS.split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

function isAdminEmail(email) {
  return adminEmails().includes(String(email || "").toLowerCase());
}

// ---- Tokens ----
function signToken(user) {
  const admin = isAdminEmail(user.email);
  const days = admin ? cfg.ADMIN_TOKEN_DAYS : cfg.CUSTOMER_TOKEN_DAYS;
  return jwt.sign(
    { sub: String(user._id), role: admin ? "admin" : "customer", tv: user.token_version || 0 },
    jwtSecret(),
    { expiresIn: `${days}d` }
  );
}

function readToken(req) {
  const header = req.headers.authorization || "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;
  try {
    return jwt.verify(match[1], jwtSecret());
  } catch {
    return null;
  }
}

// Loads the user for a valid token, or null.
async function userFromRequest(req) {
  const payload = readToken(req);
  if (!payload) return null;
  const WebsiteUser = require("../db/models/website_user");
  const user = await WebsiteUser.findById(payload.sub);
  if (!user || (user.token_version || 0) !== payload.tv) return null;
  return user;
}

function optionalUser(req, res, next) {
  userFromRequest(req)
    .then((user) => {
      req.user = user;
      next();
    })
    .catch(next);
}

function requireUser(req, res, next) {
  userFromRequest(req)
    .then((user) => {
      if (!user) return res.status(401).json({ message: "Please log in again." });
      req.user = user;
      next();
    })
    .catch(next);
}

function requireAdmin(req, res, next) {
  userFromRequest(req)
    .then((user) => {
      // Re-check ADMIN_EMAILS on every request so removing an email revokes access.
      if (!user || !isAdminEmail(user.email)) {
        return res.status(401).json({ message: "Admin login required." });
      }
      req.user = user;
      next();
    })
    .catch(next);
}

// Protects the existing app endpoints. ADMIN_AUTH_ENFORCED must be set
// explicitly: "false" while the mobile app has no login screen, "true" once it does.
function legacyAdminGuard(req, res, next) {
  if (process.env.ADMIN_AUTH_ENFORCED === "false") return next();
  return requireAdmin(req, res, next);
}

module.exports = {
  hashPassword,
  verifyPassword,
  generateOtp,
  hashOtp,
  otpMatches,
  isAdminEmail,
  signToken,
  optionalUser,
  requireUser,
  requireAdmin,
  legacyAdminGuard,
};
