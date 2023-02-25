const bcrypt = require('bcrypt');
module.exports = {
    SALT:10,
    //at registration time, we will ENCRYPT password
    generateHash(pwd){
        return bcrypt.hashSync(pwd,this.SALT);
    },
    //at the time of login we will DECRYPT the password from database for verifying credentials
    comapreHash(dbPwd,PlainPwd){
        return bcrypt.compareSync(PlainPwd,dbPwd);
    }
}