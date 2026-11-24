const express = require("express");
const router = express.Router();
const website = require("../../controller/website");
const authController = require("../../controller/auth");
const product = require("../../controller/product");
const { optionalUser, requireUser, requireAdmin, legacyAdminGuard } = require("../../utils/auth");
const { rateLimit } = require("../../utils/rate_limit");
const { PUBLIC, AUTH, ADMIN } = require("../../utils/website_config").ROUTES;

const authLimit = rateLimit({ windowMs: 15 * 60 * 1000, max: 30, message: "Too many attempts. Try again in 15 minutes." });
const orderLimit = rateLimit({ windowMs: 60 * 60 * 1000, max: 15, message: "Too many orders from this connection. Please call or WhatsApp us." });

// ---- Customer website (no login needed) ----
router.get(PUBLIC.PRODUCTS, website.listProducts);
router.get(PUBLIC.PRODUCT, website.getProduct);
router.get(PUBLIC.FILTERS, website.filters);
router.get(PUBLIC.STORE_INFO, website.storeInfo);
router.post(PUBLIC.PLACE_ORDER, orderLimit, optionalUser, website.placeOrder);

// ---- Accounts ----
router.post(AUTH.SIGNUP, authLimit, authController.signup);
router.post(AUTH.VERIFY_EMAIL, authLimit, authController.verifyEmail);
router.post(AUTH.RESEND_OTP, authLimit, authController.resendOtp);
router.post(AUTH.LOGIN, authLimit, authController.login);
router.post(AUTH.ADMIN_LOGIN_VERIFY, authLimit, authController.adminVerifyLogin);
router.post(AUTH.FORGOT_PASSWORD, authLimit, authController.forgotPassword);
router.post(AUTH.RESET_PASSWORD, authLimit, authController.resetPassword);
router.get(AUTH.ME, requireUser, authController.me);
router.put(AUTH.ME, requireUser, authController.updateMe);
router.get(AUTH.MY_ORDERS, requireUser, authController.myOrders);

// ---- Admin (always requires an admin login) ----
router.get(ADMIN.ORDERS, requireAdmin, website.adminListOrders);
router.post(ADMIN.ORDER_STATUS, requireAdmin, website.adminUpdateStatus);
router.post(ADMIN.UPLOAD_PRESIGN, requireAdmin, website.presignUpload);

// Product-form helpers for the admin app. Same protection as the other
// existing app endpoints (enforced once ADMIN_AUTH_ENFORCED=true).
router.get(ADMIN.GROUP_KEYS, legacyAdminGuard, product.get_all_group_keys);
router.get(ADMIN.TAGS, legacyAdminGuard, product.get_all_tags);

module.exports = router;
