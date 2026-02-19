const mongoose = require('mongoose');
const dbOptions = {
    maxPoolSize:5
}
mongoose.connect('mongodb+srv://sushilkumarmalikfootwear:sushilkumarmalikfootwear@sushilkumarmalikfootwea.4y2qtto.mongodb.net/',dbOptions);
module.exports = mongoose;