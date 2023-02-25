const express = require('express');
const router = express.Router();
const {login,forgot_pass,acc_recover,acc_recover_by_old_pass} = require('../../controller/admin');
const {LOGIN,FORGOT_PASS,ACC_RECOVER,ACC_RECOVER_BY_OLD_PASS_ADMIN} = require('../../utils/config').ROUTES.ADMIN;
router.post(LOGIN,login);
router.post(FORGOT_PASS,forgot_pass);
router.post(ACC_RECOVER,acc_recover);
router.post(ACC_RECOVER_BY_OLD_PASS_ADMIN,acc_recover_by_old_pass);
module.exports = router;