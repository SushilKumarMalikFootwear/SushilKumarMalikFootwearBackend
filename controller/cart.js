const {SUCCESS,SERVER_CRASH,NOT_FOUND} = require('../utils/config').STATUS_CODES;
const messageBundle = require('../locales/en');
const cartOperations = require('../db/services/cart_crud');
const productOperations = require('../db/services/product_crud');
const jwt = require('../utils/token');
const cartController = {
    async add_to_cart(request,response){
        try{
            let product = request.body.product;
            let token = request.headers['authorization'];
            let user=jwt.getdoc(token);
            let cart_id = user.user_id;
            let db_product = await productOperations.view_by_product_id(product.product_id);
            if(db_product.product_qty>=product.product_qty){
                let check_cart = await cartOperations.check_cart(cart_id,product.product_id);
                if(check_cart){
                    let update = await cartOperations.update_my_cart(cart_id,product.product_id,product.product_qty);
                    if(update.modifiedCount){
                        let cart = await cartOperations.view_one_cart(cart_id,product.product_id);
                        response.status(SUCCESS).json({message:messageBundle['addtocart.successful'],cart:cart});
                    }
                    else{
                        response.status(SERVER_CRASH).json({message:messageBundle['addtocart.unsuccessful']});
                    }
                }
                else{
                    let add = await cartOperations.add_To_Cart(cart_id,product);
                    if(add.modifiedCount){
                        let cart = await cartOperations.view_one_cart(cart_id,product.product_id);
                        response.status(SUCCESS).json({message:messageBundle['addtocart.successful'],cart:cart});
                    }
                    else{
                        response.status(SERVER_CRASH).json({message:messageBundle['addtocart.unsuccessful']});
                    }
                }
            }
            else{
                response.status(NOT_FOUND).json({message:messageBundle['addtocart.not_enough_qty']});
            }
        }
        catch(err){
            response.status(SERVER_CRASH).json({message:messageBundle['unsuccessful'],ERROR:err});
        } 
    },
    async view_my_cart(request,response){
        try{
            let token = request.headers['authorization'];
            let doc=jwt.getdoc(token);
            let cart = await cartOperations.view_my_cart(doc.user_id);
            if(cart){
                response.status(SUCCESS).json({cart:cart});           
            }
            else{
                response.status(NOT_FOUND).json({message:messageBundle['cart.empty']});
            }
        }    
        catch(err){
            response.status(SERVER_CRASH).json({message:messageBundle['unsuccessful'],ERROR:err});
        }
    },
    async view_one_cart(request,response){
        try{
            let token = request.headers['authorization'];
            let doc=jwt.getdoc(token);
            let cart_id = doc.user_id;
            let product_id = request.body.product_id;
            let cart = await cartOperations.view_one_cart(cart_id,product_id);
            if(cart){
                response.status(SUCCESS).json({cart:cart});           
            }
            else{
                response.status(NOT_FOUND).json({message:messageBundle['cart.empty']});
            }
        }
        catch(err){
            response.status(SERVER_CRASH).json({message:messageBundle['unsuccessful'],ERROR:err});
        }
    },
    async search_in_cart(request,response){
        try{
            let name = request.query.name;
            let token = request.headers['authorization'];
            let doc=jwt.getdoc(token);
            let cart = await cartOperations.view_cart_by_name(doc.user_id,name);
            if(cart){
                response.status(SUCCESS).json({cart:cart});           
            }
            else{
                response.status(NOT_FOUND).json({message:messageBundle['cart.empty']});
            }
        }
        catch(err){
            response.status(SERVER_CRASH).json({message:messageBundle['unsuccessful'],ERROR:err});
        }
    },
    async update_my_cart(request,response){
        try{
            let token = request.headers['authorization'];
            let doc=jwt.getdoc(token);
            let cart_id = doc.user_id;
            let product_id = request.body.product_id;
            let product_qty = request.body.product_qty;
            let db_product = await productOperations.view_by_product_id(product_id);
            if(db_product.product_qty>=product_qty){
                let update = await cartOperations.update_my_cart(cart_id,product_id,product_qty);
                if(update.modifiedCount){
                    let cart = await cartOperations.view_one_cart(doc.user_id,product_id);
                    response.status(SUCCESS).json({message:messageBundle['cart_update.successful'],cart:cart});           
                }
                else{
                    response.status(NOT_FOUND).json({message:messageBundle['cart_update.unsuccessful']});
                }
            }
            else{
                response.status(NOT_FOUND).json({message:messageBundle['addtocart.not_enough_qty']});
            }
        }
        catch(err){
            response.status(SERVER_CRASH).json({message:messageBundle['unsuccessful'],ERROR:err});
        }
    },
    async delete_my_cart_item(request,response){
        try{
            let token = request.headers['authorization'];
            let doc=jwt.getdoc(token);
            let cart_id = doc.user_id;
            let product_id = request.body.product_id;
            let deleted = await cartOperations.delete_my_cart(cart_id,product_id);
            if(deleted.modifiedCount){
                response.status(SUCCESS).json({message:messageBundle['delete.successful']});           
            }
            else{
                response.status(NOT_FOUND).json({message:messageBundle['delete.unsuccessful']});
            }
        }
        catch(err){
            response.status(SERVER_CRASH).json({message:messageBundle['unsuccessful'],ERROR:err});
        }
    },
    async delete_user_cart(request,response){
        try{
            let token = request.headers['authorization'];
            let doc=jwt.getdoc(token);
            let cart_id = doc.user_id;
            let deleted = await cartOperations.delete_user_cart(cart_id);
            if(deleted.deletedCount){
                let object = {
                    cart_id : cart_id
                }
                cartOperations.create_cart(object);
                response.status(SUCCESS).json({message:messageBundle['delete.successful']});           
            }
            else{
                response.status(NOT_FOUND).json({message:messageBundle['delete.unsuccessful']});
            }
        }
        catch(err){
            response.status(SERVER_CRASH).json({message:messageBundle['unsuccessful'],ERROR:err});
        }
    },
}
module.exports = cartController;