const express = require('express');
const router = express.Router();
const {check_otp} = require('../../controller/user');
const {CHECK_OTP} = require('../../utils/config').ROUTES.USER;
router.post(CHECK_OTP,check_otp);
module.exports = router;