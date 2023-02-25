const express = require('express');
const router = express.Router();
const {NEWS_LETTER} = require('../../utils/config').ROUTES.NEWS_LETTER;
const {news_letter} = require('../../controller/news_letter');
router.post(NEWS_LETTER,news_letter);
module.exports = router;