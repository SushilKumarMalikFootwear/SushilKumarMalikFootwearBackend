const jwt = require('jsonwebtoken');
module.exports = {
    secret:process.env.SECRET,
    generateToken(doc){
        doc.address=undefined;
        doc.createdAt=undefined;
        doc.updatedAt=undefined;
        let tokenId = jwt.sign({object:doc},this.secret,{expiresIn:"2h"});
        return tokenId;
    },
    verifyToken(tokenId){
        try{
            const decode = jwt.verify(tokenId,this.secret);
            
        if(decode && decode.object){
            return true;
        }
        else{
            return false;
        }
        }
        catch (err){
            console.log("VERIFY TOKEN",err);
        }
    },
     verifyAdmin(tokenId){
        try{
            let decode = jwt.verify(tokenId,this.secret);
        if(decode && decode.object.admin_id){
            return true;
        }
        else{
            return false;
        }
        }
        catch (err){
            console.log("VERIFY TOKEN",err);
        }
    },
    verifyAuthorizedAdmin(tokenId){
        try{
            const decode = jwt.verify(tokenId,this.secret);
        if(decode && decode.object.isadmin==1){
            return true;
        }
        else{
            return false;
        }
        }
        catch (err){
            console.log("VERIFY TOKEN",err);
        }
    },
    getdoc(token){
        try{
            let decode = jwt.verify(token,this.secret);
            return decode.object;
        }
        catch (err){
            console.log("VERIFY TOKEN",err);
        }
    },
    logout(){
        let tokenId = jwt.sign({message:"Logout"},this.secret,{expiresIn:"1"});
        return tokenId;
    },
    generatekey(){
        let key = jwt.sign({object:"activate"},this.secret,{expiresIn:"2h"});
        return key;
    },
    verifykey(key){
        try{
            const decode = jwt.verify(key,this.secret);
            if(decode){
                return true;
            }
            else{
                return false;
            }
        }
        catch(err){
            console.log("error is ",err)
        }
    }
}