// Every setting the backend needs. All are required: there are no built-in
// fallbacks, so a missing setting stops the server with a clear message
// instead of quietly running in a half-working state.
//
// Locally they come from .env; on Vercel from Project Settings >
// Environment Variables. See .env.example for what each one is.
const REQUIRED = [
  "MONGODB_URI",
  "JWT_SECRET",
  "ADMIN_EMAILS",
  "GMAIL_USER",
  "GMAIL_APP_PASSWORD",
  "UPLOADTHING_SECRET",
  "WHATSAPP_NUMBER",
  "ADMIN_AUTH_ENFORCED",
];

function checkEnv() {
  const missing = REQUIRED.filter((name) => !String(process.env[name] || "").trim());
  const problems = missing.map((name) => `${name} is not set`);
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    problems.push("JWT_SECRET must be at least 32 characters");
  }
  if (process.env.WHATSAPP_NUMBER && !/^\d{11,15}$/.test(process.env.WHATSAPP_NUMBER)) {
    problems.push("WHATSAPP_NUMBER must be digits only with country code, e.g. 919213517228");
  }
  if (process.env.ADMIN_AUTH_ENFORCED && !["true", "false"].includes(process.env.ADMIN_AUTH_ENFORCED)) {
    problems.push('ADMIN_AUTH_ENFORCED must be "true" or "false"');
  }
  if (problems.length) {
    throw new Error(
      "Backend settings are missing or invalid:\n  - " +
        problems.join("\n  - ") +
        "\nSet them in .env (local) or in Vercel > Project Settings > Environment Variables."
    );
  }
}

module.exports = { checkEnv, REQUIRED };
