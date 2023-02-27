const express = require("express");
const app = express(); //call express function and it returns app function
//it creates a new app for our application
const cors = require("cors"); //to expose our backend application, so that front end on any other system can use it
require("dotenv").config(); //to read .env file
app.use(express.static("public")); //app.use(middleware) middlware is a function and static here is for static content i.e html,css..
app.use(express.json()); //for reading json format data key:value
app.use(express.urlencoded()); //for reading key=value&key=value
const { ROOT } = require("./utils/config").ROUTES;
app.use(cors()); //using cors

//ALL ROUTES

//ROUTES AVAILABLE BEFORE ANY LOGIN     (basically these routes dont require token in headers/authorization)
app.use(ROOT, require("./api/routes/my_apis"));
app.use(ROOT, require("./api/routes/config_lists"));
app.use(ROOT, require("./api/routes/user_login_register")); //user - login,register,forgot pass, acc recover
app.use(ROOT, require("./api/routes/admin_login")); //admin - login,forgot pass,acc recover (admin can only be registered by any other authorized admin)
app.use(ROOT, require("./api/routes/activate_acc_user")); //activate account after regiseration
app.use(ROOT, require("./api/routes/activate_acc_admin"));
app.use(ROOT, require("./api/routes/view_products")); //view product all,by category, by name, by price, by rating...
app.use(ROOT, require("./api/routes/activate_news_letter")); //activate news letter service both for registered, non-registered users

//Authentication for USER

app.use(ROOT, require("./api/routes/check_otp_user")); //this will check otp if user have activated two factor authentication
app.use(ROOT, require("./api/routes/check_otp_admin"));
// app.use(require("./utils/middlewares/authentication")); //it's a middleware necessary for all users this will check & verify token in headers by key Authorization otherwise it will show authorization fail
// app.use(require("./utils/middlewares/two_factor_authentication")); //it's another middleware which check if a user has enabled two factor authentication and has entered password or not, if not it will stop right here and send to login.

//all admins, users can access this section after authentication

app.use(ROOT, require("./api/routes/user_update_delete")); //update user details,activate/deactivate two factor auth, delete acc.
app.use(ROOT, require("./api/routes/user_cart")); //all cart functionality for user. CRUD
app.use(ROOT, require("./api/routes/user_orders")); //all orders functionality for user. CRUD
app.use(ROOT, require("./api/routes/user_products")); //view products by interest,give rating,review to product, edit your rating,review

//Authentication for ADMIN

// app.use(require("./utils/middlewares/admin_authentication")); //check & verify token in headers-authorization and check if there is any field admin_id in that token object

//all ADMIN section

app.use(ROOT, require("./api/routes/view_users")); //views user,by name,email,user_id,address
app.use(ROOT, require("./api/routes/view_orders")); //view order by userid,orderid,productid
app.use(ROOT, require("./api/routes/admin_update_delete")); //update admin details,activate/deactivate two factor auth, delete acc.
app.use(ROOT, require("./api/routes/send_news_letter")); //send news letter to user and to those who have activated news letter service.
app.use(ROOT, require("./api/routes/view_deleted_users")); //can view deleted users by name,id,address,emailid

//AUTHORIZATION check for ADMIN

// app.use(require("./utils/middlewares/admin_authorization")); //this will check for isadmin==1 in the decoded token from headers-authorization

//only AUTHORIZED ADMIN section

app.use(ROOT, require("./api/routes/admin_crud")); //only authorized admins can register another admins, authorize/unauthorize other admin,del user,,admin,view all admins
app.use(ROOT, require("./api/routes/update_order_status")); //update order status, user will be notified by email.
app.use(ROOT, require("./api/routes/product_crud")); //add a product, update product details, delete a product.
app.use(ROOT, require("./api/routes/view_delete_deleted_admins_users"));

app.use(ROOT, require("./api/routes/direct_change"));

app.use(ROOT, require("./api/routes/payments"));
app.use(require("./utils/middlewares/404")); //ifuser has typed something wrong

const server = app.listen(process.env.PORT || 1234, (err) => {
  //.listen up the our application on that port in local host this port number should be unique , should not get conflict with other apps
  if (err) {
    console.log("app crash", err);
  } else {
    console.log("server started...", server.address().port); //server.address().port tells on which port our application is running
  }
});
