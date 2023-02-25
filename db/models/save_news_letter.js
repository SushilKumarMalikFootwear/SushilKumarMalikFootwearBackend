const {Schema,SchemaTypes} = require('../connect');
const {NEWS_LETTER} = require('../../utils/config').SCHEMAS;
const mongoose = require('../connect');
const news_letterSchema = new Schema({
    subject:{type:SchemaTypes.String,required:true,index:true},
    body:{type:SchemaTypes.String,required:true,index:true},
    send_by:{
        admin_id:{type:SchemaTypes.String,required:true,index:true},
        emailid:{type:SchemaTypes.String,required:true,index:true},
        name:{type:SchemaTypes.String,required:true,index:true}
    },
    send_to:{type:SchemaTypes.Array,required:true},
    }
    ,{
        timestamps:true
    }
)
const News_letterModel = mongoose.model(NEWS_LETTER,news_letterSchema);
module.exports = News_letterModel;

