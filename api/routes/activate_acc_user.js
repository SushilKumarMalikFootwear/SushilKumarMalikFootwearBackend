const express = require('express');
const router = express.Router();
const {activate_acc} = require('../../controller/user');
const {ACTIVATE_ACC} = require('../../utils/config').ROUTES.USER;
router.get(ACTIVATE_ACC,activate_acc);
module.exports = router;