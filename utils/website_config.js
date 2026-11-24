// Settings for the customer website. Kept separate from utils/config.js.

module.exports = {
  SHOP_NAME: "N.D. Footwear",
  // WhatsApp number that receives orders (with country code, digits only).
  WHATSAPP_NUMBER: process.env.WHATSAPP_NUMBER || "919213517228",

  // Tags offered in the admin app even before any product uses them.
  DEFAULT_TAGS: ["Super soft", "Soft", "Very flexible", "Lightweight", "Office wear", "Party wear", "Daily wear"],

  // Automatic tags (never stored on products, computed on every request).
  AUTO_TAGS: { NEW_ARRIVAL: "New arrival", TOP_SELLING: "Top selling" },
  NEW_ARRIVAL_DAYS: 30,
  NEW_ARRIVAL_MIN_COUNT: 10,
  TOP_SELLING_DAYS: 30,
  TOP_SELLING_COUNT: 10,

  // Orders
  ORDER_STATUSES: ["NEW", "CONFIRMED", "DELIVERED", "CANCELLED"],
  MAX_ORDER_ITEMS: 20,
  MAX_QUANTITY_PER_ITEM: 10,

  // Login
  OTP_LENGTH: 6,
  OTP_TTL_MINUTES: 10,
  OTP_MAX_ATTEMPTS: 5,
  OTP_RESEND_SECONDS: 60,
  CUSTOMER_TOKEN_DAYS: 30,
  ADMIN_TOKEN_DAYS: 7,
  MIN_PASSWORD_LENGTH: 8,

  ROUTES: {
    PUBLIC: {
      PRODUCTS: "/public/products",
      PRODUCT: "/public/products/:id",
      FILTERS: "/public/filters",
      STORE_INFO: "/public/store",
      PLACE_ORDER: "/public/orders",
    },
    AUTH: {
      SIGNUP: "/auth/signup",
      VERIFY_EMAIL: "/auth/verify-email",
      RESEND_OTP: "/auth/resend-otp",
      LOGIN: "/auth/login",
      ADMIN_LOGIN_VERIFY: "/auth/admin/verify-login",
      FORGOT_PASSWORD: "/auth/forgot-password",
      RESET_PASSWORD: "/auth/reset-password",
      ME: "/auth/me",
      MY_ORDERS: "/auth/my-orders",
    },
    ADMIN: {
      ORDERS: "/admin/orders",
      ORDER_STATUS: "/admin/orders/:order_no/status",
      UPLOAD_PRESIGN: "/admin/uploads/presign",
      GROUP_KEYS: "/get_all_group_keys",
      TAGS: "/get_all_tags",
    },
  },
};
