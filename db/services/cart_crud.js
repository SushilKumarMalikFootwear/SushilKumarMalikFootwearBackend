const CartModel = require('../models/cart');
module.exports = {
    create_cart(cartObject){
        try{
            let add = CartModel.create(cartObject);
            return add;
        }
        catch(err){
            console.log("ERROR is : ",err);
        }
    },
    async check_cart(cart_id,product_id){
        try{
            let check = await CartModel.findOne(
                {
                    "cart_id":cart_id,
                    "products.product_id":product_id
                },
                {
                    "_id":1
                }
            );
            if(check){
                return check;
            }
            else{
                return null;
            }
        }
        catch(err){
            console.log("ERROR is : ",err);
        }
    },
    async update_my_cart(cart_id,product_id,product_qty){
        try{
            let update = await CartModel.updateOne(
                {
                    "cart_id":cart_id,
                    "products.product_id":product_id
                },
                {
                    $inc:{
                        "products.$.product_qty":product_qty
                    }
                }
            );
            return update;
        }
        catch(err){
            console.log("ERROR is : ",err);
        }
    },
    async add_To_Cart(cart_id,product){
        try{
            let addtocart = await CartModel.updateOne(
                {
                    "cart_id":cart_id
                },
                {
                    $push:{
                        "products":product
                    }
                }
            );
            return addtocart;
        }
        catch(err){
            console.log("ERROR is : ",err);
        }
    },
    async view_my_cart(user_id){
        try{
            let cart = await CartModel.aggregate(
                [
                    {
                        $match:{
                            "cart_id":user_id
                        }
                    },
                    {
                        $unwind:"$products"
                        
                    },
                    {
                        $lookup:{
                            from:'products',
                            localField:'products.product_id',
                            foreignField:'product_id',
                            as:"product_details"
                        }
                    },
                    {
                        $project:{
                            "_id":0,
                            "products.product_qty":1,
                            "product_details.product_id":1,
                            "product_details.product_img":1,
                            "product_details.product_name":1,
                            "product_details.product_price":1,
                            "product_details.discount":1
                        }
                    }
                ]
            )
            if(cart){
                return cart;
            }
            else{
                return null;
            }
        }
        catch(err){
            console.log("ERROR is : ",err);
        }
    },
    async view_one_cart(cart_id,product_id){
        try{
            let cart = await CartModel.aggregate(
                [
                    {
                        $match:{
                        "cart_id":cart_id
                        }
                    },    
                    {
                        $unwind:"$products"
                    },
                    {
                        $match:{
                            "products.product_id":product_id
                        }
                    },
                    {
                        $lookup:{
                            from:'products',
                            localField:'products.product_id',
                            foreignField:'product_id',
                            as:"product_details"
                        }
                    },
                    {
                        $project:{
                            "_id":0,
                            "products.product_qty":1,
                            "product_details.product_id":1,
                            "product_details.product_img":1,
                            "product_details.product_name":1,
                            "product_details.product_price":1,
                            "product_details.discount":1
                        }
                    }
                ]
            )
            if(cart){
                return cart;
            }
            else{
                return null;
            }
        }
        catch(err){
            console.log("ERROR is : ",err);
        }
    },
    async view_cart_by_name(cart_id,name){
        try{
            let cart = await CartModel.aggregate(
                [
                    {
                        $match:{
                        "cart_id":cart_id
                        }
                    },    
                    {
                        $unwind:"$products"
                    },
                    {
                        $lookup:{
                            from:'products',
                            localField:'products.product_id',
                            foreignField:'product_id',
                            as:"product_details"
                        }
                    },
                    {
                        $match:{
                            "product_details.product_name":new RegExp(".*"+name+".*","i")
                        }
                    },
                    {
                        $project:{
                            "_id":0,
                            "products.product_qty":1,
                            "product_details.product_id":1,
                            "product_details.product_img":1,
                            "product_details.product_name":1,
                            "product_details.product_price":1,
                            "product_details.discount":1
                        }
                    }
                ]
            )
            if(cart.length!=0){
                return cart;
            }
            else{
                return null;
            }
        }
        catch(err){
            console.log("ERROR is : ",err);
        }
    },
    async delete_my_cart(cart_id,product_id){
        try{
            let deleted = await CartModel.updateOne(
                {
                    "cart_id":cart_id
                },
                {
                    $pull:{
                        "products":{
                            "product_id":product_id
                        }
                    }
                }
            );
            return deleted;
        }
        catch(err){
            console.log("ERROR is : ",err);
        }
    },
    async delete_user_cart(cart_id){
        try{
            let deleted = await CartModel.deleteOne(
                {
                    "cart_id":cart_id
                }
            );
            return deleted;
        }
        catch(err){
            console.log("ERROR is : ",err);
        }
    }
}