const AdminModel = require('../models/admin');
const encryption = require('../../utils/encrypt');
module.exports = {
    async find_by_email(email){
        try{
            let admin = await AdminModel.findOne(
                {
                    "emailid":email
                }
            );
            if(admin){
                return admin;
            }
            else{
                return null;
            }
        }
        catch(err){
            console.log("ERROR is : ",err);
        }
    },
    register(adminObject){
        try{
            adminObject.password = encryption.generateHash(adminObject.password);
            adminObject.old_pass = adminObject.password;
            let promise = AdminModel.create(adminObject);
            return promise;
        }
        catch(err){
            console.log("ERROR is : ",err);
        }
    },
    async activate_admin_acc(key){
        try{
            let activate = await AdminModel.updateOne(
                {
                    "key":key
                },
                {
                    $set:{
                            "account_activated":1
                    }
                }
            );
            return activate;
        }
        catch(err){
            console.log("ERROR is : ",err);
        }
    },
    async login({email,pwd}){
        try{
            let doc= await AdminModel.findOne(
                {
                    "emailid":email
                }
            );
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
            let doc= await AdminModel.findOne(
                {
                    "emailid":email
                }
            );
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
            let saved = await AdminModel.updateOne(
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
    async save_old_pass(email){
        try{
            let find = await AdminModel.findOne(
                {
                    "emailid":email
                },
                {
                    "_id":0,
                    "password":1
                }
            );
            let old_pass = find.password;
            let saved = await AdminModel.updateOne(
                {
                    "emailid":email
                },
                {
                    $set:{
                        "old_pass":old_pass
                    }
                }
            );
            if(saved){
                return saved;
            }
            else{
                return null;
            }
        }
        catch(err){
            console.log("ERROR is : ",err);
        }
    },
    async find_by_key(key){
        try{
            let admin = await AdminModel.findOne(
                {
                    "key":key
                },
                {
                    "_id":0,
                    "admin_id":1,
                    "emailid":1
                }
            );
            if(admin){
                return admin;
            }
            else{
                return null;
            }
        }
        catch(err){
            console.log("ERROR is : ",err);
        }
    },
    async view_my_account(adminid){
        try{
            let admin = await AdminModel.findOne(
                {
                    "admin_id":adminid
                },
                {
                    "_id":0,
                    "address":1,
                    "emailid":1,
                    "name":1,
                    "isadmin":1,
                    "two_factor_auth":1
                }
            );
            if(admin){
                return admin;
            }
            else{
                return null;
            }
        }
        catch(err){
            console.log("ERROR is : ",err);
        }
    },
    async update_pass_for_recovery(admin_id,pass){
        try{
            let pass = encryption.generateHash(pass);
            let update = await AdminModel.updateOne(
                {
                    "admin_id":admin_id
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
            let new_pass = encryption.generateHash(new_pass);
            let update = await AdminModel.updateOne(
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
    async activate_two_factor_auth(admin_id){
        try{
            let activate = await AdminModel.updateOne(
                {
                    "admin_id":admin_id
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
    async find_admin_by_admin_id(admin_id){
        try{
            let admin = await AdminModel.findOne(
                {
                    "admin_id":admin_id
                }
            );
            if(admin){
                return admin;
            }
            else{
                return null;
            }
        }
        catch(err){
            console.log("ERROR is : ",err);
        }
    },
    async check_otp(admin_id,otp){
        try{
            let found = await AdminModel.findOne(
                {
                    "admin_id":admin_id,
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
    async uncheck_otp(admin_id){
        try{
            let checked = await AdminModel.updateOne(
                {
                    "admin_id":admin_id
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
    async otp_checked(admin_id){
        try{
            let checked = await AdminModel.updateOne(
                {
                    "admin_id":admin_id
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
    async deactivate_two_factor_auth(doc){
        try{
            let deactivate = await AdminModel.updateOne(
                {
                    "admin_id":doc.admin_id
                },
                {
                    $set:{
                        "two_factor_auth":0
                    }
                }
            );
            return deactivate;
        }
        catch(err){
            console.log("ERROR is : ",err);
        }
    },
    async authorize_admin(admin_id,authorized_by){
        try{
            let authorize = await AdminModel.updateOne(
                {
                    "admin_id":admin_id
                },
                {
                    $set:{
                        "isadmin":1,
                        "authorized_by":authorized_by
                    }
                }
            );
            return authorize;
        }
        catch(err){
            console.log("ERROR is : ",err);
        }
    },
    async unauthorize_admin(admin_id,unauthorized_by){
        try{
            let unauthorize = await AdminModel.updateOne(
                {
                    "admin_id":admin_id
                },
                {
                    $set:{
                        "isadmin":0,
                        "unauthorized_by":unauthorized_by
                    }
                }
            );
            return unauthorize;
        }
        catch(err){
            console.log("ERROR is : ",err);
        }
    },
    async find_all(){
        try{
            let alladmins = await AdminModel.find(
                {

                },
                {
                    "_id":0,
                    "emailid":1,
                    "name":1,
                    "admin_id":1,
                    "account_activated":1,
                    "authorizedby":1,
                    "unauthorizedby":1,
                    "isadmin":1
                }
            );
            if(alladmins.length!=0){
                return alladmins;
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
            let admin = await AdminModel.find(
                {
                    "name":new RegExp(".*"+name+".*","i")
                }
            );
            if(admin.length!=0){
                return admin;
            }
            else{
                return null;
            }
        }
        catch(err){
            console.log("ERROR is : ",err);
        }
    },
    async update_name(admin_id,name){
        try{
            let update = await AdminModel.updateOne(
                {
                    "admin_id":admin_id
                },
                {
                    $set:{
                        name:name
                    }
                }
            );
            return update;
        }
        catch(err){
            console.log("ERROR is : ",err);
        }
    },
    async update_email(admin_id,email){
        try{
            let update = await AdminModel.updateOne(
                {
                    "admin_id":admin_id
                },
                {
                    $set:{
                        emailid:email
                    }
                }
            );
            return update;
        }
        catch(err){
            console.log("ERROR is : ",err);
        }
    },
    async update_address(admin_id,Houseno,City,State,Pincode,Landmark){
        try{
            let update = await AdminModel.updateOne(
                {
                    "admin_id":admin_id
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
    async update_pass(doc,old_pass,new_pass){
        try{
            if(encryption.comapreHash(doc.password,old_pass)){
                new_pass = encryption.generateHash(new_pass);
                let update = await AdminModel.updateOne(
                    {
                        "admin_id":doc.admin_id
                    },
                    {
                        $set:{
                            password:new_pass
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
    async delete(doc,pass){
        try{
            if(encryption.comapreHash(doc.password,pass)){
            let deleted = await AdminModel.deleteOne(
                {
                    "admin_id":doc.admin_id
                }
            );
            return deleted;
            }
        }
        catch(err){
            console.log("ERROR is : ",err);
        }
    },
    async deleteanyadmin(admin_id){
        try{
            let deleted = await AdminModel.deleteOne(
                {
                    "admin_id":admin_id
                }
            );
            return deleted;
        }
        catch(err){
            console.log("ERROR is : ",err);
        }
    } 
}