const mongoose = require('mongoose');
const dbOptions = {
    maxPoolSize:5
}
mongoose.connect('mongodb+srv://sushilkumarmalikfootwear:sushilkumarmalikfootwear@sushilkumarmalikfootwea.4y2qtto.mongodb.net/',dbOptions,err=>{
    if(err){
        console.log("database connection failed",err);
    }
    else{
        console.log("Database connection created sucessfully...")
    }
});
module.exports = mongoose;