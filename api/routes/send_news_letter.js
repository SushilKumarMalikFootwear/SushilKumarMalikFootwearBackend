const express = require('express');
const router = express.Router();
const {SEND_NEWS_LETTER,VIEW_NEWS_LETTERS} = require('../../utils/config').ROUTES.NEWS_LETTER;
const {send_news_letter,view_all} = require('../../controller/news_letter');
router.post(SEND_NEWS_LETTER,send_news_letter);
router.get(VIEW_NEWS_LETTERS,view_all)
module.exports = router;