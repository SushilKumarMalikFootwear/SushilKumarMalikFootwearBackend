const {Schema,SchemaTypes} = require('../connect');
const {EMAIL} = require('../../utils/config').SCHEMAS;
const mongoose = require('../connect');
const emailSchema = new Schema({
    emailid:{type:SchemaTypes.String,required:true,unique:true,index:true}}
    ,{
        timestamps:true
    }
)
const EmailModel = mongoose.model(EMAIL,emailSchema);
module.exports = EmailModel;

