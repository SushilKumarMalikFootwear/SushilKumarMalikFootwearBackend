const mongoose = require('mongoose');
const dbOptions = {
    maxPoolSize:5
}
mongoose.connect(process.env.DB_URL,dbOptions,err=>{
    if(err){
        console.log("database connection failed",err);
    }
    else{
        console.log("Database connection created sucessfully...")
    }
});
module.exports = mongoose;