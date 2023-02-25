const {Schema,SchemaTypes} = require('../connect');
const {ORDERS} = require('../../utils/config').SCHEMAS;
const mongoose = require('../connect');
const orderSchema = new Schema({
    order_id:{type:SchemaTypes.String,required:true,unique:true,index:true},
    user_id:{type:SchemaTypes.String,required:true,index:true},
    product_id:{type:SchemaTypes.String,required:true,index:true},
    product_qty:{type:SchemaTypes.Number,required:true},
    /*purchased_on:{type:SchemaTypes.Date,required:true},
    delivered_by:{type:SchemaTypes.Date,required:true},*/
    order_status:{type:SchemaTypes.String,required:true,index:true},
    product_rated:{type:SchemaTypes.Number,required:true},
    ACC_DELETED:{type:SchemaTypes.String}
    },
    {
        timestamps:true
    }
);
const OrderModel = mongoose.model(ORDERS,orderSchema);
module.exports = OrderModel;