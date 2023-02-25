const {Schema,SchemaTypes} = require('../connect');
const {DELETED_ADMIN} = require('../../utils/config').SCHEMAS;
const mongoose = require('../connect');
const deleted_adminSchema = new Schema({
    emailid:{type:SchemaTypes.String,required:true,unique:true,index:true},
    password:{type:SchemaTypes.String,required:true,min:3,max:25},
    old_pass:{type:SchemaTypes.String,required:true},
    name:{type:SchemaTypes.String,required:true,index:true},
    admin_id:{type:SchemaTypes.String,required:true,unique:true,index:true},
    isadmin:{type:SchemaTypes.Number},
    address:{
        Houseno:{type:SchemaTypes.String,required:true},
        City:{type:SchemaTypes.String,required:true},
        State:{type:SchemaTypes.String,required:true},
        Pincode:{type:SchemaTypes.Number,required:true},
        Landmark:{type:SchemaTypes.String,required:true}
    },
    deleted_date:{type:SchemaTypes.Date,expires:31536000, default:Date.now},     //deleted admin info will be deleted after one year from database
    deleted_by:{}
},
{
    timestamps:true         
});
const Deleted_adminModel = mongoose.model(DELETED_ADMIN,deleted_adminSchema);
module.exports = Deleted_adminModel;