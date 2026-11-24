// Input cleaning for customer details (orders and profiles).

function cleanText(value, max) {
  if (value === undefined || value === null) return "";
  return String(value).replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

// Indian mobile number: returns the 10 digits, or "" if invalid.
function cleanPhone(value) {
  let digits = String(value || "").replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  return /^[6-9]\d{9}$/.test(digits) ? digits : "";
}

function cleanAddress(input) {
  const a = input || {};
  const address = {
    line1: cleanText(a.line1, 150),
    line2: cleanText(a.line2, 150),
    landmark: cleanText(a.landmark, 100),
    city: cleanText(a.city, 60),
    pincode: String(a.pincode || "").replace(/\D/g, ""),
  };
  if (!address.line1) return { error: "Enter your house number and street." };
  if (!address.city) return { error: "Enter your city." };
  if (!/^[1-9]\d{5}$/.test(address.pincode)) return { error: "Enter a valid 6-digit pincode." };
  return { address };
}

module.exports = { cleanText, cleanPhone, cleanAddress };
