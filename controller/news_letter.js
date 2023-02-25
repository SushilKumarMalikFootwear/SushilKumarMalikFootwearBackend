let sendmail = require('../utils/nodemailer');
const {SUCCESS,SERVER_CRASH,NOT_FOUND} = require('../utils/config').STATUS_CODES;
const News_letterOperations = require('../db/services/save_news_letter')
const emailOperations = require('../db/services/new_letter_email');
const userOperations = require('../db/services/user_crud');
const jwt = require('../utils/token');
const emailBundle = require('../locales/mailcontent');
const messageBundle = require('../locales/en');
module.exports = {
    async news_letter(request,response){
        try{
            let email = request.body.email;
            let object = {
                emailid : email
            }
            let check = await emailOperations.check(email);
            if(check==null){
                emailOperations.save_email(object);
                sendmail(email,emailBundle['news_letter.sub'],emailBundle['news_letter.body']);
                response.status(SUCCESS).json({message:messageBundle['mail.sent']});
            }
            else{
                response.status(NOT_FOUND).json({message:messageBundle['news_letter_service.already_activated']});
            }
        }
        catch(err){
            response.status(SERVER_CRASH).json({message:messageBundle['unsuccessful'],ERROR:err});
        }
    },
    async send_news_letter(request,response){
        try{
            let sub = request.body.heading;
            let body = request.body.content;
            let token = request.headers['authorization'];
            let doc=jwt.getdoc(token);
            let mails = [];
            let user_emails = await userOperations.get_emails();
            let usermails = [];
            let news_letter_mails = [];
            for(let l = 0;l<user_emails.length;l++)
            {
                usermails[l]=user_emails[l].emailid;
            }
            let news_letter_emails = await emailOperations.get_emails();
            for(let m = 0;m<news_letter_emails.length;m++)
            {
                news_letter_mails[m]=news_letter_emails[m].emailid;
            }
            for(let k = 0;k<news_letter_mails.length;k++){
                let match = 0;
                for(let j = 0;j<usermails.length;j++){
                    if(usermails[j]!=news_letter_mails[k]){
                        match++;
                    }
                }
                if(match==usermails.length)
                {
                    mails.push(news_letter_mails[k]);
                }
            }
            for(let x = 0;x<usermails.length;x++){
                mails.push(usermails[x]);
            }
            let object = {
                subject : sub,
                body : body,
                send_by : {
                    emailid : doc.emailid,
                    admin_id : doc.admin_id,
                    name : doc.name
                },
                send_to : mails
            }
            let save = News_letterOperations.save_content(object);
            sendmail(mails,sub,body);
            if(sub && body && save){
                response.status(SUCCESS).json({message:messageBundle['mail.sent']});
            }
            else{
                response.status(NOT_FOUND).json({message:messageBundle['mail.not_sent']});
            }
        }
        catch(err){
            response.status(SERVER_CRASH).json({message:messageBundle['unsuccessful'],ERROR:err});
        }
    },
    async view_all(request,response){
        try{
            let view = await News_letterOperations.view_all();
            if(view){
                response.status(SUCCESS).json({message:messageBundle['found'],NEWS_LETTERS : view});
            }
            else{
                response.status(NOT_FOUND).json({message:messageBundle['not_found']});
            }
        }
        catch(err){
            response.status(SERVER_CRASH).json({message:messageBundle['unsuccessful'],ERROR:err});
        }
    }
}
