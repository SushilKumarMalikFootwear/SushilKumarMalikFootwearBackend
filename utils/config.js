module.exports = {
    SCHEMAS:{
        FOOTWEAR:'footwear',
        INVOICE: 'invoice',
        CONFIG_LISTS:'config_lists',
        TRADER_FINANCES: 'trader_finances',
        TRADER_FINANCES_LOGS: 'trader_finances_logs'
    },
    STATUS_CODES:{
        SUCCESS:200,
        SUCCESS2:201,
        SERVER_CRASH:500,
        FILE_NOT_FOUND:404,
        NOT_FOUND:404
    },
    ROUTES:{
        MY_API:'/my_api',
        DIRECT_CHANGE:'/direct_change',
        ROOT:'/',
        GET_CONFIF_LISTS:'/get_config_lists',
        INVOICE:{
            SAVE_INVOICE:'/saveInvoice',
            UPDATE_INVOICE:'/updateInvoice',
            FETCH_INVOICES:'/fetchInvoices',
            MONTHLY_SALES_REPORT:'/monthlySalesReport'
        },
        TRADER_FINANCES:{
            GET_TRADER_FINANCES:'/get_trader_finances',
            UPDATE_TOTAL_COST_PRICE:'/update_total_cost_price'
        },
        PRODUCT:{
            addFootwear:'/add_footwear',
            applyChanges:'/applyChanges',
            VIEW_ALL_FOOTWEARS:'/view_all_footwears',
            FILTER_FOOTWEARS:'/filter_footwears',
            VIEW_BY_FOOTWEAR_ID:'/view_by_footwear_id',
            GET_ALL_ARTICLES:'/get_all_articles',
            GET_ALL_LABELS:'/get_all_labels',
            UPDATE_PRODUCT:'/update_product',
            DELETE_PRODUCT:'/delete_product',
        },
    }
}