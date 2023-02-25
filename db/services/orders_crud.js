const OrderModel = require('../models/orders');
module.exports ={
    purchase_product(orderObject){
        try{
            let purchase = OrderModel.create(orderObject);
            return purchase;
        }
        catch(err){
            console.log("ERROR is : ",err);
        }
    },
    async view_one_order(user_id,order_id){
        try{
            let orders = await OrderModel.aggregate(
                [
                    {
                        $match:{
                            "user_id":user_id,
                            "order_id":order_id
                        }
                    },
                    {
                        $lookup:{
                            from:'products',
                            localField:'product_id',
                            foreignField:'product_id',
                            as:"product_details"
                        }
                    },
                    {
                        $project:{
                            "_id":0,
                            "order_id":1,
                            "product_id":1,
                            "product_qty":1,
                            "order_status":1,
                            "product_details.product_img":1,
                            "product_details.product_name":1,
                            "product_details.product_price":1,
                            "product_details.discount":1
                        }
                    }
                ]
            )
            if(orders){
                return orders;
            }
            else{
                return null;
            }
        }
        catch(err){
            console.log("ERROR is : ",err);
        }
    },
    async view_orders(user_id){
        try{
            let orders = await OrderModel.aggregate(
                [
                    {
                        $match:{
                            "user_id":user_id
                        }
                    },
                    {
                        $lookup:{
                            from:'products',
                            localField:'product_id',
                            foreignField:'product_id',
                            as:"product_details"
                        }
                    },
                    {
                        $project:{
                            "_id":0,
                            "order_id":1,
                            "product_id":1,
                            "product_qty":1,
                            "order_status":1,
                            "product_details.product_img":1,
                            "product_details.product_name":1,
                            "product_details.product_price":1,
                            "product_details.discount":1
                        }
                    }
                ]
            )
            if(orders.length!=0){
                return orders;
            }
            else{
                return null;
            }
        }
        catch(err){
            console.log("ERROR is : ",err);
        }
    },
    async change_order_status(user_id,order_id,new_status){
        try{
            let update = await OrderModel.updateOne(
                {
                    "user_id":user_id,
                    "order_id":order_id
                },
                {
                    $set:{
                        "order_status":new_status
                    }
                }
            );
            return update;
        }
        catch(err){
            console.log("ERROR is : ",err);
        }
    },
    async check_order_status(user_id,product_id){
        try{
            let check = await OrderModel.findOne(
                {
                    "user_id":user_id,
                    "product_id":product_id,
                    "order_status":{
                        $in:["DELIVERED","RETURNED"]
                    }
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
    async check_rated(user_id,product_id){
        try{
            let rated = await OrderModel.findOne(
                {
                    "user_id":user_id,
                    "product_id":product_id,
                    "product_rated":0
                },
                {
                    "_id":1
                }
            );
            if(rated){
                return rated;
            }
            else{
                return null;
            }
        }
        catch(err){
            console.log("ERROR is : ",err);
        }
    },
    async product_rated(user_id,product_id,rating){
        try{
            let rated = await OrderModel.updateMany(
                {
                    "user_id":user_id,
                    "product_id":product_id
                },
                {
                    $set:{
                        "product_rated":rating
                    }
                }
            );
            return rated;
        }
        catch(err){
            console.log("ERROR is : ",err);
        }
    },
    
    async view_all_orders(){
        try{
            let orders = await OrderModel.aggregate(
                [
                    {
                        $lookup:{
                            from:'products',
                            localField:'product_id',
                            foreignField:'product_id',
                            as:"product_details"
                        }
                    },
                    {
                        $project:{
                            "_id":0,
                            "order_id":1,
                            "user_id":1,
                            "product_id":1,
                            "product_qty":1,
                            "order_status":1,
                            "product_details.product_img":1,
                            "product_details.product_name":1,
                            "product_details.product_price":1,
                            "product_details.discount":1
                        }
                    }
                ]
            )
            if(orders.length!=0){
                return orders;
            }
            else{
                return null;
            }
        }
        catch(err){
            console.log("ERROR is : ",err);
        }
    },
    async view_orders_by_user(user_id){
        try{
            let orders = await OrderModel.aggregate(
                [
                    {
                        $match:{
                            "user_id":user_id
                        }
                    },
                    {
                        $lookup:{
                            from:'products',
                            localField:'product_id',
                            foreignField:'product_id',
                            as:"product_details"
                        }
                    },
                    {
                        $project:{
                            "_id":0,
                            "order_id":1,
                            "user_id":1,
                            "product_id":1,
                            "product_qty":1,
                            "order_status":1,
                            "product_details.product_img":1,
                            "product_details.product_name":1,
                            "product_details.product_price":1,
                            "product_details.discount":1
                        }
                    }
                ]
            )
            if(orders.length!=0){
                return orders;
            }
            else{
                return null;
            }
        }
        catch(err){
            console.log("ERROR is : ",err);
        }
    },
    async view_order_by_product_id(user_id,product_id){
        try{
            let orders = await OrderModel.findOne(
                
                    {
                        "user_id":user_id,
                        "product_id":product_id
                    },
                    {
                            "_id":0,
                            "order_id":1,
                            "user_id":1,
                            "product_id":1,
                            "product_qty":1,
                            "order_status":1,
                            "product_rated":1
                    }
                
            );
            if(orders){
                return orders;
            }
            else{
                return null;
            }
        }
        catch(err){
            console.log(err)
            console.log("ERROR is : ",err);
        }
    },
    async view_orders_by_product_id(product_id){
        try{
            let orders = await OrderModel.aggregate(
                [
                    {
                        $match:{
                            "product_id":product_id
                        }
                    },
                    {
                        $lookup:{
                            from:'products',
                            localField:'product_id',
                            foreignField:'product_id',
                            as:"product_details"
                        }
                    },
                    {
                        $project:{
                            "_id":0,
                            "order_id":1,
                            "user_id":1,
                            "product_id":1,
                            "product_qty":1,
                            "order_status":1,
                            "product_details.product_img":1,
                            "product_details.product_name":1,
                            "product_details.product_price":1,
                            "product_details.discount":1
                        }
                    }
                ]
            )
            if(orders.length!=0){
                return orders;
            }
            else{
                return null;
            }
        }
        catch(err){
            console.log("ERROR is : ",err);
        }
    },
    async view_order_by_order_status(order_status){
        try{
            let orders = await OrderModel.aggregate(
                [
                    {
                        $match:{
                            "order_status":order_status
                        }
                    },
                    {
                        $lookup:{
                            from:'products',
                            localField:'product_id',
                            foreignField:'product_id',
                            as:"product_details"
                        }
                    },
                    {
                        $project:{
                            "_id":0,
                            "order_id":1,
                            "user_id":1,
                            "product_id":1,
                            "product_qty":1,
                            "order_status":1,
                            "product_details.product_img":1,
                            "product_details.product_name":1,
                            "product_details.product_price":1,
                            "product_details.discount":1
                        }
                    }
                ]
            )
            if(orders.length!=0){
                return orders;
            }
            else{
                return null;
            }
        }
        catch(err){
            console.log("ERROR is : ",err);
        }
    },
    async view_single_order(order_id){
        try{
            let orders = await OrderModel.aggregate(
                [
                    {
                        $match:{
                            "order_id":order_id
                        }
                    },
                    {
                        $lookup:{
                            from:'products',
                            localField:'product_id',
                            foreignField:'product_id',
                            as:"product_details"
                        }
                    }
                ]
            )
            if(orders){
                return orders;
            }
            else{
                return null;
            }
        }
        catch(err){
            console.log("ERROR is : ",err);
        }
    },
    async update_order_status(order_id,new_status){
        try{
            let update = await OrderModel.updateOne(
                {
                    "order_id":order_id
                },
                {
                    $set:{
                        "order_status":new_status
                    }
                }
            );
            return update;
        }
        catch(err){
            console.log("ERROR is : ",err);
        }
    },
    async user_acc_deleted(user_id){
        try{
            let update = await OrderModel.updateMany(
                {
                    "user_id":user_id
                },
                {
                    $set:{
                        "ACC_DELETED":"this user's account has been deleted"
                    }
                }
            );
            return update;
        }
        catch(err){
            console.log("ERROR is : ",err);
        }
    }
}