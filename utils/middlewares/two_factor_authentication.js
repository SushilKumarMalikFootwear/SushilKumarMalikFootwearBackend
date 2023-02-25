const {NOT_FOUND}=require('../config').STATUS_CODES;
const messageBundle = require('../../locales/en');
const jwt = require('../token');
module.exports = (request,response,next)=>{
    const token = request.headers['authorization']
    const doc = jwt.getdoc(token);
    if(doc.two_factor_auth==1 && doc.otp_checked==1){
                next();     //moves to next route        
    }
    else if(doc.two_factor_auth==0){
        next();
    }
    else{
        response.status(NOT_FOUND).json({message:messageBundle['auth.fail3']});
    }
};