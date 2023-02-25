const {NOT_FOUND}=require('../config').STATUS_CODES;
const messageBundle = require('../../locales/en');
const jwt = require('../token');
module.exports = (request,response,next)=>{
    const token = request.headers['authorization']
        if(token){
            if(jwt.verifyToken(token)){
                next();     //moves to next route next route
            }else{
                response.status(NOT_FOUND).json({message:messageBundle['auth.fail1']});
            }
        }else{
            response.status(NOT_FOUND).json({message:messageBundle['auth.fail2']});
        }
};