const {SUCCESS,SERVER_CRASH,NOT_FOUND} = require('../utils/config').STATUS_CODES;
let sendmail = require('../utils/nodemailer');
const uniqid = require('uniqid');
const path = require('path');
const HTMLBundle = require('../locales/html');
const messageBundle = require('../locales/en');
const emailBundle = require('../locales/mailcontent');
const userOperations = require('../db/services/user_crud');
const jwt = require('../utils/token');
const encryption = require('../utils/encrypt');
const otp_generate = require('otp-generator');
const deleted_userController = require('./deleted_user');
const cartOperations = require('../db/services/cart_crud');
const orderOperations = require('../db/services/orders_crud');
const userController = {
    async check_email(request,response){
        try{
            let email = request.body.email;
            let check = await userOperations.find_by_email(email);
            if(check==null){
                response.status(SUCCESS).json({message:messageBundle['successful']});
            }
            else{
                response.status(SERVER_CRASH).json({message:messageBundle['email.already_used']});
            }
        }
        catch(err){
            response.status(SERVER_CRASH).json({message:messageBundle['unsuccessful'],ERROR:err});
        }
    },
    register(request,response){
        let full_name = request.body.name;
        let fname = full_name.split(" ");
        let user_id = uniqid(fname[0]);
        let key_=jwt.generatekey();
        let userObject={
            emailid:request.body.email,
            password:request.body.pwd,
            old_pass:request.body.pwd,
            name:request.body.name,
            user_id:user_id,
            //profile_pic:
            address:{
                Houseno:request.body.address.Houseno,
                City:request.body.address.City,
                State:request.body.address.State,
                Pincode:request.body.address.Pincode,
                Landmark:request.body.address.Landmark
            },
            interested_in:request.body.interested_in,
            account_activated:0,
            key:key_,
            two_factor_auth:0,
            otp_checked:0
        }
        let promise = userOperations.register(userObject);
        promise.then((doc)=>{
            sendmail(request.body.email,emailBundle['registersuccessfull.sub'],emailBundle['registersuccessfull.body']+key_);
            let object = {
                cart_id : user_id
            }
            cartOperations.create_cart(object);
            response.status(SUCCESS).json({message:messageBundle['register.welcome'],doc:doc});
        }).catch((err)=>{
            response.status(SERVER_CRASH).json({message:messageBundle['register.fail'],err:err})
        });
    },
    async activate_acc(request,response){
        try{
            let key = request.query.key;
            let activate = await userOperations.activate_acc(key);
            if(activate.modifiedCount && key){
                let user = await userOperations.find_by_key(key);
                sendmail(user.emailid,emailBundle['activatesuccessfull.sub'],emailBundle['activatesuccessfull.body']);
                response.status(SUCCESS).send(HTMLBundle['activate.html']);
            }
            else{
                response.status(NOT_FOUND).json({message:messageBundle['activate.unsuccessful']});
            }
        }
        catch(err){
            response.status(SERVER_CRASH).json({message:messageBundle['unsuccessful'],ERROR:err});
        }
    },
    async login(request,response){
        try{
            let user = request.body;
            let doc = await userOperations.login(user);
            let old_pass = await userOperations.check_old_pass(user.email,user.pwd);
            if(doc){
                if(doc.account_activated==1){
                    let token = jwt.generateToken(doc); //generate token here
                    if(doc.two_factor_auth==1){
                        let otp = otp_generate.generate(6, {lowerCaseAlphabets:false, upperCaseAlphabets: false, specialChars: false });
                        let save_key = await userOperations.save_key(doc.emailid,otp);
                        let uncheck_otp = await userOperations.uncheck_otp(doc.user_id);
                        if(save_key.modifiedCount && uncheck_otp.modifiedCount){
                            sendmail(user.email,emailBundle['login.sub'],emailBundle['login.body']+" OTP for login is "+otp);
                            response.status(SUCCESS).json({message:messageBundle['login.welcome'],name:doc.name,token:token,two_factor_authentication:1,OTP_SENT:1});
                            }
                        else{
                            response.status(SUCCESS).json({message:messageBundle['login.welcome'],name:doc.name,two_factor_authentication:1,OTP_SENT:0});
                        }
                    }
                    else{
                        sendmail(user.email,emailBundle['login.sub'],emailBundle['login.body']);
                        response.status(SUCCESS).json({message:messageBundle['login.welcome'],name:doc.name,token:token,two_factor_authentication:0});
                    }
                }
                else{
                    response.status(NOT_FOUND).json({message:messageBundle['account.not_activated']});
                }
            }
            else if(old_pass){
                response.status(SUCCESS).json({message:messageBundle['old_pass.success'],name:old_pass.name});
            }
            else{
                response.status(NOT_FOUND).json({message:messageBundle['login.invaliduser']});
            }
        }
        catch(err){
            response.status(SERVER_CRASH).json({message:messageBundle['unsuccessful'],ERROR:err});
        }
    },
    async check_otp(request,response){
        try{
            let otp = request.body.otp;
            let token = request.headers['authorization'];
            let doc=jwt.getdoc(token);
                let check_otp = await userOperations.verify_otp(doc.user_id,otp);
                if(check_otp){
                    let opt_checked=await userOperations.otp_checked(doc.user_id);
                    if(opt_checked.modifiedCount){
                        doc.otp_checked=1
                        let new_token = jwt.generateToken(doc);
                        response.status(SUCCESS).json({message:messageBundle['otp.verified'],token:new_token});
                    }
                }
                else{
                    sendmail(doc.emailid,emailBundle['acc_compromised.sub'],emailBundle['acc_compromised.body']);
                    response.status(NOT_FOUND).json({message:messageBundle['otp.wrong']});
                }
        }
        catch(err){
            response.status(SERVER_CRASH).json({message:messageBundle['unsuccessful'],ERROR:err});
        }
    },
    async forgot_pass(request,response){
        try{
            let email = request.body.email;
            let user = await userOperations.find_by_email(email);
            if(user){
                let key = jwt.generatekey();
                let save_key = await userOperations.save_key(email,key);
                if(save_key.modifiedCount){
                    sendmail(email,emailBundle['forgot_pass.sub'],emailBundle['forgot_pass.body']+key);
                    response.status(SUCCESS).json({message:messageBundle['forgotpass.success']});
                }
                else{
                    response.status(NOT_FOUND).json({message:messageBundle['forgotpass.fail']});
                }
            }
            else{
                response.status(NOT_FOUND).json({message:messageBundle['email.notfound']});
            }
        }
        catch(err){
            response.status(SERVER_CRASH).json({message:messageBundle['unsuccessful'],ERROR:err});
        }
    },
    async acc_recover(request,response){
        try{
            let password = request.body.pwd;
            let key = request.query.key;
            let check_key = await userOperations.find_by_key(key);
            if(check_key){
                let save_old_pass = await userOperations.save_old_pass(check_key.emailid);
                let update_pass = await userOperations.update_pass_for_recovery(check_key.user_id,password);
                if(update_pass.modifiedCount && save_old_pass.modifiedCount){
                    sendmail(check_key.emailid,emailBundle['account_recover.sub'],emailBundle['account_recover.body']);
                    response.status(SUCCESS).json({message:messageBundle['acc_recovery.success']});
                }
                else{
                    response.status(SERVER_CRASH).json({message:messageBundle['acc_recovery.fail']});
                }
            }
            else{
                response.status(NOT_FOUND).json({message:messageBundle['acc_recovery.fail']});
            }
        }
        catch(err){
            response.status(SERVER_CRASH).json({message:messageBundle['unsuccessful'],ERROR:err});
        }
    },
    async acc_recover_old_pass(request,response){
        try{
            let email = request.body.email;       
            let old_pass = request.body.old_pass;
            let new_pass = request.body.new_pass;
            let check_old_pass = await userOperations.check_old_pass(email,old_pass);
            if(check_old_pass){
                let save_old_pass = await userOperations.save_old_pass(email);
                let update_pass = await userOperations.update_pass_by_email(email,new_pass);
                if(update_pass.modifiedCount && save_old_pass.modifiedCount){
                    sendmail(email,emailBundle['account_recover.sub'],emailBundle['account_recover.body']);
                    response.status(SUCCESS).json({message:messageBundle['acc_recovery.success']});
                }
                else{
                    response.status(SERVER_CRASH).json({message:messageBundle['acc_recovery.fail']});
                }
            }
            else{
                response.status(NOT_FOUND).json({message:messageBundle['old_pass.fail']});
            }
        }
        catch(err){
            response.status(SERVER_CRASH).json({message:messageBundle['unsuccessful'],ERROR:err});
        }
    },
    async view_my_account(request,response){
        try{
            let token = request.headers['authorization'];
            let doc=jwt.getdoc(token);
            let user  = await userOperations.view_my_account(doc.user_id);
            if(user){
                response.status(SUCCESS).json({message:messageBundle['user.found'],user:user});
            }
            else{
                response.status(NOT_FOUND).json({message:messageBundle['user.notfound']});
            }
        }
        catch(err){
            response.status(SERVER_CRASH).json({message:messageBundle['unsuccessful'],ERROR:err});
        }
    },
    async activate_two_factor_auth(request,response){
        try{
            let token = request.headers['authorization'];
            let doc=jwt.getdoc(token);
            let updated = await userOperations.activate_two_factor_auth(doc.user_id);
            if(updated.modifiedCount){
                let user = await userOperations.find_user(doc.user_id);
                let new_token = jwt.generateToken(user);
                sendmail(user.emailid,emailBundle['activate_two_factor_auth.sub'],emailBundle['activate_two_factor_auth.body']);
                response.status(SUCCESS).json({message:messageBundle['activate_two_factor_auth.success'],token:new_token});
            }
            else{
                response.status(NOT_FOUND).json({message:messageBundle['activate_two_factor_auth.fail']});
            }
        }
        catch(err){
            response.status(SERVER_CRASH).json({message:messageBundle['unsuccessful'],ERROR:err});
        }
    },
    async deactivate_two_factor_auth(request,response){
        try{
            let token = request.headers['authorization'];
            let doc=jwt.getdoc(token);
            let updated = await userOperations.deactivate_two_factor_auth(doc);
            if(updated.modifiedCount){
                let user = await userOperations.find_user(doc.user_id);
                let new_token = jwt.generateToken(user);
                sendmail(user.emailid,emailBundle['deactivate_two_factor_auth.sub'],emailBundle['deactivate_two_factor_auth.body']);
                response.status(SUCCESS).json({message:messageBundle['deactivate_two_factor_auth.success'],token:new_token});
            }
            else{
                response.status(NOT_FOUND).json({message:messageBundle['deactivate_two_factor_auth.fail']});
            }
        }
        catch(err){
            response.status(SERVER_CRASH).json({message:messageBundle['unsuccessful'],ERROR:err});
        }
    },
    async update_name(request,response){
        try{
            let name = request.body.name;
            let token = request.headers['authorization'];
            let doc=jwt.getdoc(token);
            let updated = await userOperations.update_name(doc.user_id,name);
            if(updated.modifiedCount && name){
                doc.name = name;
                let new_token = jwt.generateToken(doc);
                response.status(SUCCESS).json({message:messageBundle['update.successful'],name:name,token:new_token});
            }
            else{
                response.status(NOT_FOUND).json({message:messageBundle['update.unsuccessful']});
            }
        }
        catch(err){
            response.status(SERVER_CRASH).json({message:messageBundle['unsuccessful'],ERROR:err});
        }
    },
    async update_email(request,response){
        try{
            let email = request.body.email;
            let token = request.headers['authorization'];
            let doc=jwt.getdoc(token);
            let updated = await userOperations.update_email(doc.user_id,email);
            if(updated.modifiedCount && email){
                doc.emailid = email;
                let new_token = jwt.generateToken(doc);
                sendmail(email,emailBundle['emailupdated.sub'],emailBundle['emailupdated.body']);
                response.status(SUCCESS).json({message:messageBundle['update.successful'],email:email,token:new_token});
            }
            else{
                response.status(NOT_FOUND).json({message:messageBundle['update.unsuccessful']});
            }
        }
        catch(err){
            response.status(SERVER_CRASH).json({message:messageBundle['unsuccessful'],ERROR:err});
        }
    },
    async update_password(request,response){
        try{
            let old_pass = request.body.old_pass;
            let new_pass = request.body.new_pass;
            let token = request.headers['authorization'];
            let doc=jwt.getdoc(token);
            let save_old_pass = await userOperations.save_old_pass(doc.emailid);
            let updated = await userOperations.update_pass(doc,old_pass,new_pass);
            if(updated && old_pass && new_pass && save_old_pass.modifiedCount){
                doc.password = encryption.generateHash(new_pass);
                let new_token = jwt.generateToken(doc);
                sendmail(doc.emailid,emailBundle['passwordchanged.sub'],emailBundle['passwordchanged.body']);
                response.status(SUCCESS).json({message:messageBundle['update.successful'],token:new_token});
            }
            else{
                response.status(NOT_FOUND).json({message:messageBundle['update.unsuccessful'],Error:"Old Passowrd was wrong"});
            }
        }
        catch(err){
            response.status(SERVER_CRASH).json({message:messageBundle['unsuccessful'],ERROR:err});
        }
    },
    async update_address(request,response){
        try{
            let Houseno = request.body.Houseno;
            let City = request.body.City;
            let State = request.body.State;
            let Pincode = request.body.Pincode;
            let Landmark = request.body.Landmark
            let token = request.headers['authorization'];
            let doc=jwt.getdoc(token);
            let updated = await userOperations.update_address(doc.user_id,Houseno,City,State,Pincode,Landmark);
            if(updated.modifiedCount){
                response.status(SUCCESS).json({message:messageBundle['update.successful']});
            }
            else{
                response.status(NOT_FOUND).json({message:messageBundle['update.unsuccessful']});
            }
        }
        catch(err){
            response.status(SERVER_CRASH).json({message:messageBundle['unsuccessful'],ERROR:err});
        }
    },
    async delete_user(request,response){
        try{
            let token = request.headers['authorization'];
            let doc=jwt.getdoc(token);
            let pass = request.body.pwd;
            let obj = {
                email : doc.emailid,
                pwd : pass
            }
            let deletedby = "SELF_USER"
            let find = await userOperations.login(obj);
            let deleted = await userOperations.delete_user(doc,pass);
            if(deleted.deletedCount){
                deleted_userController.add_to_deleted(find,deletedby);
                cartOperations.delete_user_cart(find.user_id);
                orderOperations.user_acc_deleted(find.user_id);
                sendmail(doc.emailid,emailBundle['acc_deleted.sub'],emailBundle['acc_deleted.body']);
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
    async view_all(request,response){
        try{
            let allusers = await userOperations.find_all();
            if(allusers){
                response.status(SUCCESS).json({message:messageBundle['users.viewall'],AllUsers:allusers});
            }
            else{
                response.status(NOT_FOUND).json({message:messageBundle['users.viewall'],AllUsers:allusers});
            }
        }
        catch(err){
            response.status(SERVER_CRASH).json({message:messageBundle['unsuccessful'],ERROR:err});
        }
    },
    async view_by_user_id(request,response){
        try{
            let user_id = request.body.user_id;
            let user = await userOperations.find_user(user_id);
            if(user){
                response.status(SUCCESS).json({message:messageBundle['users.viewall'],user:user});
            }
            else{
                response.status(NOT_FOUND).json({message:messageBundle['users.viewall']});
            }
        }
        catch(err){
            response.status(SERVER_CRASH).json({message:messageBundle['unsuccessful'],ERROR:err});
        }
    },
    async view_by_emailid(request,response){
        try{
            let email = request.body.email;
            let user = await userOperations.find_by_email(email);
            if(user){
                response.status(SUCCESS).json({message:messageBundle['user.found'],AllUsers:user});
            }
            else{
                response.status(NOT_FOUND).json({message:messageBundle['user.notfound']});
            }
        }
        catch(err){
            response.status(SERVER_CRASH).json({message:messageBundle['unsuccessful'],ERROR:err});
        }
    },
    async view_by_name(request,response){
        try{
            let name = request.body.name;
            let allusers = await userOperations.find_by_name(name);
            if(allusers){
                response.status(SUCCESS).json({message:messageBundle['user.found'],AllUsers:allusers});
            }
            else{
                response.status(NOT_FOUND).json({message:messageBundle['user.notfound']});
            }
        }
        catch(err){
            response.status(SERVER_CRASH).json({message:messageBundle['unsuccessful'],ERROR:err});
        }
    },
    async view_by_pincode(request,response){
        try{
            let pincode = request.query.pincode;
            let allusers = await userOperations.find_by_pincode(pincode);
            if(allusers){
                response.status(SUCCESS).json({message:messageBundle['user.found'],AllUsers:allusers});
            }
            else{
                response.status(NOT_FOUND).json({message:messageBundle['user.notfound']});
            }
        }
        catch(err){
            response.status(SERVER_CRASH).json({message:messageBundle['unsuccessful'],ERROR:err});
        }
    },
    async view_by_city(request,response){
        try{
            let city = request.query.city;
            let allusers = await userOperations.find_by_city(city);
            if(allusers){
                response.status(SUCCESS).json({message:messageBundle['user.found'],AllUsers:allusers});
            }
            else{
                response.status(NOT_FOUND).json({message:messageBundle['user.notfound']});
            }
        }
        catch(err){
            response.status(SERVER_CRASH).json({message:messageBundle['unsuccessful'],ERROR:err});
        }
    },async view_by_state(request,response){
        try{
            let state = request.query.state;
            let allusers = await userOperations.find_by_state(state);
            if(allusers){
                response.status(SUCCESS).json({message:messageBundle['user.found'],AllUsers:allusers});
            }
            else{
                response.status(NOT_FOUND).json({message:messageBundle['user.notfound']});
            }
        }
        catch(err){
            response.status(SERVER_CRASH).json({message:messageBundle['unsuccessful'],ERROR:err});
        }
    },
    logout(request,response){
        try{
            let logout = jwt.logout();
            if(logout){        //create token with expire time 1 or delete token from headers in front end for logout
                response.status(SUCCESS).json({message:messageBundle['logout.successful'],token:logout});
            }
            else
            response.status(SERVER_CRASH).json({message:messageBundle['logout.unsuccessful']});
        }
        catch(err){
            response.status(SERVER_CRASH).json({message:messageBundle['unsuccessful'],ERROR:err});
        }
    },
    async delete_any_user(request,response){
        try{
            let user_id = request.body.user_id;
            let find = await userOperations.find_user(user_id);
            let token = request.headers['authorization'];
            let admin = jwt.getdoc(token)
            let deletedby = {
                name : admin.name,
                email : admin.emailid,
                admin_id : admin.admin_id
            }
            let deleted = await userOperations.delete_any_user(user_id);
            if(deleted.deletedCount){
                sendmail(find.emailid,emailBundle['acc_deletedbyadmin.sub'],emailBundle['acc_deletedbyadmin.body']);
                deleted_userController.add_to_deleted(find,deletedby);
                cartOperations.delete_user_cart(user_id);
                orderOperations.user_acc_deleted(user_id);
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
};
module.exports = userController;