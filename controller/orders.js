const {SUCCESS,SERVER_CRASH,NOT_FOUND} = require('../utils/config').STATUS_CODES;
const uniqid = require('uniqid');
let sendmail = require('../utils/nodemailer');
const messageBundle = require('../locales/en');
const emailBundle = require('../locales/mailcontent')
const orderOperations = require('../db/services/orders_crud');
const productOperations = require('../db/services/product_crud');
const jwt = require('../utils/token');
const ordersController = {
    async order_product(request,response){
        let token = request.headers['authorization'];
        let doc=jwt.getdoc(token);
        let email = doc.emailid
        let full_name = doc.name;
        let fname = full_name.split(" ");
        let orderid=uniqid(fname[0]);
        let orderObject = {
            order_id:orderid,
            user_id:doc.user_id,
            product_id:request.body.p_id,
            product_qty:request.body.p_qty,
            // purchased_on:request.body.purchased_on,
            // delivered_by:request.body.delivered_by,
            order_status:request.body.order_status,
            product_rated:0,
            product_reviewed:0
        }
        let change_qty = await productOperations.change_quantity(request.body.p_id,request.body.p_qty)
        if(change_qty.modifiedCount){
            let promise = orderOperations.purchase_product(orderObject);
            promise.then((doc)=>{
                sendmail(email,emailBundle['orderplaced.sub'],emailBundle['orderplaced.body']+"\n Order Id : "+orderid);
                response.status(SUCCESS).json({message:messageBundle['purchase.successful'],doc:doc});
            }).catch((err)=>{
                response.status(SERVER_CRASH).json({message:messageBundle['purchase.unsuccessful'],err:err})
            });
        }
        else{
            response.status(SERVER_CRASH).json({message:messageBundle['purchase.unsuccessful']});
        }
    },
    async view_one_order(request,response){
        try{
            let token = request.headers['authorization'];
            let doc=jwt.getdoc(token);
            let order_id = request.body.order_id;
            let order = await orderOperations.view_one_order(doc.user_id,order_id);
            if(order){
                response.status(SUCCESS).json({order:order});
                
            }
            else{
                response.status(NOT_FOUND).json({message:messageBundle['order.notfound']});
            }
        }
        catch(err){
            response.status(SERVER_CRASH).json({message:messageBundle['unsuccessful'],ERROR:err});
        }
    },
    async view_orders(request,response){
        try{
            let token = request.headers['authorization'];
            let doc=jwt.getdoc(token);
            let user_id = doc.user_id;
            let orders = await orderOperations.view_orders(user_id);
            if(orders){
                response.status(SUCCESS).json({orders:orders});
                
            }
            else{
                response.status(NOT_FOUND).json({message:messageBundle['order.notfound']});
            }
        }
        catch(err){
            response.status(SERVER_CRASH).json({message:messageBundle['unsuccessful'],ERROR:err});
        }
    },
    async change_order_status(request,response){
        try{
            let token = request.headers['authorization'];
            let doc=jwt.getdoc(token);
            let user_id = doc.user_id;
            let order_id = request.body.order_id;
            let new_status = request.body.new_status;
            let update = await orderOperations.change_order_status(user_id,order_id,new_status);
            let order = orderOperations.view_single_order(order_id);
            if(update.modifiedCount && order){
                if(new_status == "CANCELLED"){
                    let updatequantity = productOperations.update_quantity(find.product_id,find.product_qty);
                    if(updatequantity.modifiedCount){
                        sendmail(doc.emailid,emailBundle['orderstatuschanged.sub'],emailBundle['orderstatuschanged.body']+" ORDER STATUS : "+new_status+" for Order ID : "+order_id);
                        response.status(SUCCESS).json({message:messageBundle['update.successful'],ORDER_STATUS:new_status});
                    }
                    else{
                        response.status(SERVER_CRASH).json({message:messageBundle['update.unsuccessful']});
                    }
                }
                else{
                    response.status(SUCCESS).json({message:messageBundle['update.successful']});
                }
            }
            else{
                response.status(NOT_FOUND).json({message:messageBundle['update.unsuccessful']});
            }
        }
        catch(err){
            response.status(SERVER_CRASH).json({message:messageBundle['unsuccessful'],ERROR:err});
        }
    },
    async view_all_orders(request,response){
        try{
            let orders = await orderOperations.view_all_orders();
            if(orders){
                response.status(SUCCESS).json({orders:orders});
            }
            else{
                response.status(NOT_FOUND).json({message:messageBundle['order.notfound']});
            }
        }
        catch(err){
            response.status(SERVER_CRASH).json({message:messageBundle['unsuccessful'],ERROR:err});
        }
    },
    async view_orders_by_user(request,response){
        try{
            let user_id = request.body.user_id;
            let orders = await orderOperations.view_orders_by_user(user_id);
            if(orders){
                response.status(SUCCESS).json({orders:orders});
            }
            else{
                response.status(NOT_FOUND).json({message:messageBundle['order.notfound']});
            }
        }
        catch(err){
            response.status(SERVER_CRASH).json({message:messageBundle['unsuccessful'],ERROR:err});
        }
    },
    async view_orders_by_product_id(request,response){
        try{
            let product_id = request.body.product_id;
            let orders = await orderOperations.view_orders_by_product_id(product_id);
            if(orders){
                response.status(SUCCESS).json({orders:orders});
            }
            else{
                response.status(NOT_FOUND).json({message:messageBundle['order.notfound']});
            }
        }
        catch(err){
            response.status(SERVER_CRASH).json({message:messageBundle['unsuccessful'],ERROR:err});
        }
    },
    async view_single_order(request,response){
        try{
            let order_id = request.body.order_id;
            let order = await orderOperations.view_single_order(order_id);
            if(order){
                response.status(SUCCESS).json({orders:order});
            }
            else{
                response.status(NOT_FOUND).json({message:messageBundle['order.notfound']});
            }
        }
        catch(err){
            response.status(SERVER_CRASH).json({message:messageBundle['unsuccessful'],ERROR:err});
        }
    },
    async view_order_by_order_status(request,response){
        try{
            let order_status = request.query.order_status;
            let orders = await orderOperations.view_order_by_order_status(order_status);
            if(orders){
                response.status(SUCCESS).json({orders:orders});
            }
            else{
                response.status(NOT_FOUND).json({message:messageBundle['order.notfound']});
            }
        }
        catch(err){
            response.status(SERVER_CRASH).json({message:messageBundle['unsuccessful'],ERROR:err});
        }
    },
    async update_order_status(request,response){
        try{
            let order_id = request.body.order_id;
            let new_status = request.body.new_status;
            let update = await orderOperations.update_order_status(order_id,new_status);
            let order = orderOperations.view_single_order(order_id);
            if(update.modifiedCount && order){
                if(new_status == "CANCELLED"){
                    let updatequantity = productOperations.update_quantity(order.product_id,order.product_qty);
                    if(updatequantity.modifiedCount){
                        sendmail(order.emailid,emailBundle['orderstatuschanged.sub'],emailBundle['orderstatuschanged.body']+" ORDER STATUS : "+new_status+" for Order ID : "+order_id);
                        response.status(SUCCESS).json({message:messageBundle['update.successful'],ORDER_STATUS:new_status});
                    }
                    else{
                        response.status(SERVER_CRASH).json({message:messageBundle['update.unsuccessful']});
                    }
                }
                else{
                    sendmail(order.emailid,emailBundle['orderstatuschanged.sub'],emailBundle['orderstatuschanged.body']+" ORDER STATUS : "+new_status+" for Order ID : "+order_id);
                    response.status(SUCCESS).json({message:messageBundle['update.successful']});
                }
            }
            else{
                response.status(NOT_FOUND).json({message:messageBundle['update.unsuccessful']});
            }
        }
        catch(err){
            response.status(SERVER_CRASH).json({message:messageBundle['unsuccessful'],ERROR:err});
        }
    }
}
module.exports = ordersController;