const express = require("express");
const router = express.Router();
const { getConfigLists } = require("../../controller/config_lists");
const { GET_CONFIF_LISTS } = require("../../utils/config").ROUTES;
router.get(GET_CONFIF_LISTS, getConfigLists);
module.exports = router;
