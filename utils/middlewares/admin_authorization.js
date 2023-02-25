const {NOT_FOUND}=require('../config').STATUS_CODES;
const messageBundle = require('../../locales/en');
const jwt = require('../token');
module.exports = (request,response,next)=>{
    if(request.headers['authorization']){
        let tokenId = request.headers['authorization'];
        if(jwt.verifyAuthorizedAdmin(tokenId)){
            console.log("token verified");
            next();     //moves to next route next route
        }else{
            response.status(NOT_FOUND).json({message:messageBundle['auth.fail1']});
            console.log("wrong token");
        }
    }else{
        response.status(NOT_FOUND).json({message:messageBundle['auth.fail2']});
        console.log("nothing in headers");
    }
};