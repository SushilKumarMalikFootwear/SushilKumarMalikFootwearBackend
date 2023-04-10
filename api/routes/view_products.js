const express = require('express');
const router = express.Router();
const {view_all_products, filter_footwears, view_by_name, view_by_category, view_by_price,view_by_rating,view_by_name_category,
    view_by_name_categories,view_by_categories,search_in_reviews,view_all_reviews, view_by_product_id,view_by_price_categories,view_45_products} = require('../../controller/product');
const {VIEW_ALL_FOOTWEARS,VIEW_BY_NAME,FILTER_FOOTWEARS,VIEW_BY_CATEGORY,VIEW_BY_PRICE,VIEW_BY_RATING,VIEW_BY_NAME_CATEGORY,
    VIEW_BY_NAME_CATEGORIES,VIEW_BY_CATEGORIES,SEARCH_IN_REVIEWS,VIEW_ALL_REVIEWS,VIEW_BY_FOOTWEAR_ID,
    VIEW_BY_PRICE_CATEGORIES,VIEW_45_PRODUCTS} = require('../../utils/config').ROUTES.PRODUCT;
router.post(FILTER_FOOTWEARS,filter_footwears)
router.get(VIEW_ALL_FOOTWEARS,view_all_products);
// router.get(VIEW_45_PRODUCTS,view_45_products);
// router.get(VIEW_BY_NAME,view_by_name);
// router.get(VIEW_BY_CATEGORY,view_by_category);
// router.post(VIEW_BY_CATEGORIES,view_by_categories);
router.get(VIEW_BY_FOOTWEAR_ID,view_by_product_id);
// router.get(VIEW_BY_PRICE,view_by_price);
// router.get(VIEW_BY_RATING,view_by_rating);
// router.get(VIEW_BY_NAME_CATEGORY,view_by_name_category);
// router.post(VIEW_BY_NAME_CATEGORIES,view_by_name_categories);
// router.post(VIEW_BY_PRICE_CATEGORIES,view_by_price_categories);
// router.post(VIEW_ALL_REVIEWS,view_all_reviews);
// router.post(SEARCH_IN_REVIEWS,search_in_reviews);
module.exports = router;