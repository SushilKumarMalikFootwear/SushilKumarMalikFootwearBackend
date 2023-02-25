const Deleted_userModel = require('../models/deleted_users');
const encryption = require('../../utils/encrypt');
module.exports = {
    add_to_deleted(userObject){
        try{
            let promise = Deleted_userModel.create(userObject);
            return promise;
        }
        catch(err){
            console.log("ERROR is : ",err);
        }
    },
    async login({email,pwd}){
        try{
            let doc= await Deleted_userModel.findOne({"emailid":email});
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
    async find_all(){
        try{
            let allusers = await Deleted_userModel.find(
                {

                },
                {
                    "_id":0,
                    "emailid":1,
                    "name":1,
                    "user_id":1,
                    "address":1,
                    "intersted_in":1,
                    "deleted_date":1,
                    "deleted_by":1
                }
            );
            console.log(allusers)
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
            let user = await Deleted_userModel.findOne(
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
    async find_by_email(email){
        try{
            let user = await Deleted_userModel.findOne(
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
    async find_by_name(name){
        try{
            let user = await Deleted_userModel.find(
                {
                    "name":new RegExp(".*"+name+".*","i")
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
            let user = await Deleted_userModel.find(
                {
                    "address.Pincode":pincode
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
            let user = await Deleted_userModel.find(
                {
                    "address.City":new RegExp(".*"+city+".*","i")
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
            let user = await Deleted_userModel.find(
                {
                    "address.State":new RegExp(".*"+state+".*","i")
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
            let deleted = await Deleted_userModel.deleteOne(
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
}