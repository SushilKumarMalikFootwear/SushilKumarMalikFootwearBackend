const EmailModel = require('../models/news_letter_email');
module.exports = {
    save_email(object){
        try{
            let promise = EmailModel.create(object);
            return promise;
        }
        catch(err){
            console.log("ERROR is : ",err);
        }
    },
    async get_emails(){
        try{
            let emails =await EmailModel.find(
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
    },
    async check(email){
        try{
            let check =await EmailModel.findOne(
                {
                    "emailid":email
                },
                {
                    "_id":0,
                    "emailid":1
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
    }
}