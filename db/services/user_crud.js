const UserModel = require('../models/user');
const encryption = require('../../utils/encrypt');
module.exports = {
    async find_by_email(email){
        try{
            let user = await UserModel.findOne(
                {
                    "emailid":email
                }
            );
            if(user){
                return user;
            }
            else{
                return null;
            }
        }
        catch(err){
            console.log("ERROR is : ",err);
        }
    },
    register(userObject){
        try{
            userObject.password = encryption.generateHash(userObject.password);
            userObject.old_pass = userObject.password;
            let promise = UserModel.create(userObject);
            return promise;
        }
        catch(err){
            console.log("ERROR is : ",err);
        }
    },
    async activate_acc(key){
        try{
            let doc = await UserModel.updateOne(
                {
                    "key":key
                },
                {
                    $set:{
                        "account_activated":1
                    }
                }
            );
            return doc;
        }
        catch(err){
            console.log("ERROR is : ",err);
        }
    },
    async find_by_key(key){
        try{
            let user = await UserModel.findOne(
                {
                    "key":key
                },
                {
                    "_id":0,
                    "emailid":1,
                    "user_id":1
                }
            );
            if(user){
                return user;
            }
            else{
                return null;
            }
        }
        catch(err){
            console.log("ERROR is : ",err);
        }
    },
    async login({email,pwd}){
        try{
            let doc= await UserModel.findOne({"emailid":email});
            if(doc){
                if(encryption.comapreHash(doc.password,pwd)){
                    return doc;
                }
                else{
                    return null;
                }
            }
            else{
                return null;
            }
        }
        catch(err){
            console.log("ERROR is : ",err);
        }
    },
    async check_old_pass(email,pass){
        try{
            let doc= await UserModel.findOne({"emailid":email});
            if(doc){
                if(encryption.comapreHash(doc.old_pass,pass)){
                    return doc;
                }
                else{
                    return null;
                }
            }
            else{
                return null;
            }
        }
        catch(err){
            console.log("ERROR is : ",err);
        }
    },
    async save_key(email,otp){
        try{
            let saved = await UserModel.updateOne(
                {
                    "emailid":email
                },
                {
                    $set:{
                        "key":otp
                    }
                }
            );
            return saved;
        }
        catch(err){
            console.log("ERROR is : ",err);
        }
    },
    async uncheck_otp(user_id){
        try{
            let checked = await UserModel.updateOne(
                {
                    "user_id":user_id
                },
                {
                    $set:{
                        "otp_checked":0
                    }
                }
            );
            return checked;
        }
        catch(err){
            console.log("ERROR is : ",err);
        }
    },
    async verify_otp(user_id,otp){
        try{
            let found = await UserModel.findOne(
                {
                    "user_id":user_id,
                    "key":otp
                },
                {
                    "_id":1
                }
            );
            if(found){
                return found;
            }
            else{
                return null;
            }
        }
        catch(err){
            console.log("ERROR is : ",err);
        }
    },
    async otp_checked(user_id){
        try{
            let checked = await UserModel.updateOne(
                {
                    "user_id":user_id
                },
                {
                    $set:{
                        "otp_checked":1
                    }
                }
            );
            return checked;
        }
        catch(err){
            console.log("ERROR is : ",err);
        }
    },
    async save_old_pass(email){
        try{
            let find = await UserModel.findOne(
                {
                    "emailid":email
                },
                {
                    "_id":0,
                    "password":1
                }
            );
            let old_pass = find.password;
            let saved = await UserModel.updateOne(
                {
                    "emailid":email
                },
                {
                    $set:{
                        "old_pass":old_pass
                    }
                }
            );
            return saved;
        }
        catch(err){
            console.log("ERROR is : ",err);
        }
    },
    async update_pass(user_id,pass){
        try{
            pass = encryption.generateHash(pass);
            let update = await UserModel.updateOne(
                {
                    "user_id":user_id
                },
                {
                    $set:{
                        "password":pass
                    }
                }
            );
            return update;
        }
        catch(err){
            console.log("ERROR is : ",err);
        }
    },
    async view_my_account(userid){
        try{
            let user = await UserModel.findOne(
                {
                    "user_id":userid
                },
                {
                    "_id":0,
                    "address":1,
                    "emailid":1,
                    "name":1,
                    "intersted_id":1,
                    "two_factor_auth":1
                }
            );
            if(user){
                return user;
            }
            else{
                return null;
            }
        }
        catch(err){
            console.log("ERROR is : ",err);
        }
    },
    async activate_two_factor_auth(user_id){
        try{
            let activate = await UserModel.updateOne(
                {
                    "user_id":user_id
                },
                {
                    $set:{
                        "two_factor_auth":1
                    }
                }
            );
            return activate;
        }
        catch(err){
            console.log("ERROR is : ",err);
        }
    },
    async deactivate_two_factor_auth(doc){
        try{
            let activate = await UserModel.updateOne(
                {
                    "user_id":doc.user_id
                },
                {
                    $set:{
                        "two_factor_auth":0
                    }
                }
            );
            return activate;
        }
        catch(err){
            console.log("ERROR is : ",err);
        }
    },
    async update_pass_for_recovery(user_id,pass){
        try{
            pass = encryption.generateHash(pass);
            let update = await UserModel.updateOne(
                {
                    "user_id":user_id
                },
                {
                    $set:{
                        "password":pass
                    }
                }
            );
            return update;
        }
        catch(err){
            console.log("ERROR is : ",err);
        }
    },
    async update_pass_by_email(email,new_pass){
        try{
            new_pass = encryption.generateHash(new_pass);
            let update = await UserModel.updateOne(
                {
                    "emailid":email
                },
                {
                    $set:{
                        "password":new_pass
                    }
                }
            );
            return update;
        }
        catch(err){
            console.log("ERROR is : ",err);
        }
    },
    async update_name(user_id,name){
        try{
            let update = await UserModel.updateOne(
                {
                    "user_id":user_id
                },
                {
                    $set:{
                        "name":name
                    }
                }
            );
            return update;
        }
        catch(err){
            console.log("ERROR is : ",err);
        }
    },
    async update_email(user_id,email){
        try{
            let update = await UserModel.updateOne(
                {
                    "user_id":user_id
                },
                {
                    $set:{
                        "emailid":email
                    }
                }
            );
            return update;
        }
        catch(err){
            console.log("ERROR is : ",err);
        }
    },
    async update_pass(doc,old_pass,new_pass){
        try{
            if(encryption.comapreHash(doc.password,old_pass)){
                let new_pass = encryption.generateHash(new_pass);
                let update = await UserModel.updateOne(
                    {
                        "user_id":doc.user_id
                    },
                    {
                        $set:{
                            "password":new_pass
                        }
                    }
                );
                return update;
            }
            else{
                return false;
            }
        }
        catch(err){
            console.log("ERROR is : ",err);
        }
    },
    async update_address(user_id,Houseno,City,State,Pincode,Landmark){
        try{
            let update = await UserModel.updateOne(
                {
                    "user_id":user_id
                },
                {
                    $set:{
                        "address.Houseno":Houseno,
                        "address.City":City,
                        "address.State":State,
                        "address.Pincode":Pincode,
                        "address.Landmark":Landmark
                    }
                }
            );
            return update;
        }
        catch(err){
            console.log("ERROR is : ",err);
        }
    },
    async delete_user(doc,pass){
        try{
            if(encryption.comapreHash(doc.password,pass)){
                let deleted = await UserModel.deleteOne(
                    {
                        "user_id":doc.user_id
                    }
                );
                return deleted;
            }
            else{
                return null;
            }
        }
        catch(err){
            console.log("ERROR is : ",err);
        }
    },
    async find_all(){
        try{
            let allusers = await UserModel.find(
                {

                },
                {
                    "_id":0,
                    "name":1,
                    "emailid":1,
                    "user_id":1,
                    "account_activated":1,
                }
            );
            if(allusers.length!=0){
                return allusers;
            }
            else{
                return null;
            }
        }
        catch(err){
            console.log("ERROR is : ",err);
        }
    },
    async find_user(user_id){
        try{
            let user = await UserModel.findOne(
                {
                    "user_id":user_id
                }
            );
            if(user){
                return user;
            }
            else{
                return null;
            }
        }
        catch(err){
            console.log("ERROR is : ",err);
        }
    },
    async find_by_name(name){
        try{
            let user = await UserModel.find(
                {
                    "name":new RegExp(".*"+name+".*","i")
                },
                {
                    "_id":0,
                    "name":1,
                    "emailid":1,
                    "user_id":1,
                    "account_activated":1,
                }
            );
            if(user.length!=0){
                return user;
            }
            else{
                return null;
            }
        }
        catch(err){
            console.log("ERROR is : ",err);
        }
    },
    async find_by_pincode(pincode){
        try{
            let user = await UserModel.find(
                {
                    "address.Pincode":pincode
                },
                {
                    "_id":0,
                    "name":1,
                    "emailid":1,
                    "user_id":1,
                    "account_activated":1,
                }
            );
            if(user.length!=0){
                return user;
            }
            else{
                return null;
            }
        }
        catch(err){
            console.log("ERROR is : ",err);
        }
    },
    async find_by_city(city){
        try{
            let user = await UserModel.find(
                {
                    "address.City":new RegExp(".*"+city+".*","i")
                },
                {
                    "_id":0,
                    "name":1,
                    "emailid":1,
                    "user_id":1,
                    "account_activated":1,
                }
            );
            if(user.length!=0){
                return user;
            }
            else{
                return null;
            }
        }
        catch(err){
            console.log("ERROR is : ",err);
        }
    },
    async find_by_state(state){
        try{
            let user = await UserModel.find(
                {
                    "address.State":new RegExp(".*"+state+".*","i")
                },
                {
                    "_id":0,
                    "name":1,
                    "emailid":1,
                    "user_id":1,
                    "account_activated":1,
                }
            );
            if(user.length!=0){
                return user;
            }
            else{
                return null;
            }
        }
        catch(err){
            console.log("ERROR is : ",err);
        }
    },
    async delete_any_user(user_id){
        try{
            let deleted = await UserModel.deleteOne(
                {
                    "user_id":user_id
                }
            );
            return deleted;
        }
        catch(err){
            console.log("ERROR is : ",err);
        }
    },
    async get_emails(){
        try{
            let emails = await UserModel.find(
                {

                },
                {
                    "_id":0,
                    "emailid":1
                }
            );
            if(emails.length!=0){
                return emails;
            }
            else{
                return null;
            }
        }
        catch(err){
            console.log("ERROR is : ",err);
        }
    }
}