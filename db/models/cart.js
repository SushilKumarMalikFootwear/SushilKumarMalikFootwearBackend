const {Schema,SchemaTypes} = require('../connect');
const {CART} = require('../../utils/config').SCHEMAS;
const mongoose = require('../connect');
const cartSchema = new Schema({
    cart_id:{type:SchemaTypes.String,required:true,unique:true},
    products:{type:SchemaTypes.Array}
    }
);
const CartModel = mongoose.model(CART,cartSchema);
module.exports = CartModel;