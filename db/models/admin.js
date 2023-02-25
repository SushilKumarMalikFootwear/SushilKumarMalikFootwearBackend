const {Schema,SchemaTypes} = require('../connect');
const {ADMIN} = require('../../utils/config').SCHEMAS;
const mongoose = require('../connect');
const adminSchema = new Schema({
    emailid:{type:SchemaTypes.String,required:true,unique:true,index:true},
    password:{type:SchemaTypes.String,required:true,min:3,max:25},
    old_pass:{type:SchemaTypes.String,required:true},
    name:{type:SchemaTypes.String,required:true,index:true},
    admin_id:{type:SchemaTypes.String,required:true,unique:true,index:true},
    isadmin:{type:SchemaTypes.Number,required:true},
    address:{
        Houseno:{type:SchemaTypes.String,required:true},
        City:{type:SchemaTypes.String,required:true},
        State:{type:SchemaTypes.String,required:true},
        Pincode:{type:SchemaTypes.Number,required:true},
        Landmark:{type:SchemaTypes.String,required:true}
    },
    account_activated:{type:SchemaTypes.Number,required:true},
    key:{type:SchemaTypes.String,required:true},
    two_factor_auth:{type:SchemaTypes.Number,required:true},
    otp_checked:{type:SchemaTypes.Number},
    authorized_by:{
        name : {type:SchemaTypes.String},
        email : {type:SchemaTypes.String},
        admin_id : {type:SchemaTypes.String},
    },
    unauthorized_by:{
        name : {type:SchemaTypes.String},
        email : {type:SchemaTypes.String},
        admin_id : {type:SchemaTypes.String},
    },
},
{
    timestamps:true         
});
const AdminModel = mongoose.model(ADMIN,adminSchema);
module.exports = AdminModel;