const express = require('express');
const router = express.Router();
const {my_api} = require('../../controller/my_api');
const {MY_API} = require('../../utils/config').ROUTES;
router.get(MY_API,my_api);
module.exports = router;