const express = require('express');
const router = express.Router();
const {check_otp} = require('../../controller/admin');
const {CHECK_OTP} = require('../../utils/config').ROUTES.ADMIN;
router.post(CHECK_OTP,check_otp);
module.exports = router;