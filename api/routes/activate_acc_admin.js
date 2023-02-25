const express = require('express');
const router = express.Router();
const {activate_acc} = require('../../controller/admin');
const {ACTIVATE_ACC} = require('../../utils/config').ROUTES.ADMIN;
router.get(ACTIVATE_ACC,activate_acc);
module.exports = router;