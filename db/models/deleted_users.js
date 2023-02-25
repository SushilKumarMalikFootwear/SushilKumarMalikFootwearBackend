const {Schema,SchemaTypes} = require('../connect');
const {DELETED_USERS} = require('../../utils/config').SCHEMAS;
const mongoose = require('../connect');
const deleted_userSchema = new Schema({
    emailid:{type:SchemaTypes.String,required:true,index:true},
    password:{type:SchemaTypes.String,required:true,min:3,max:25},
    old_pass:{type:SchemaTypes.String},
    name:{type:SchemaTypes.String,required:true,index:true},
    user_id:{type:SchemaTypes.String,required:true,index:true},
    address:{
        Houseno:{type:SchemaTypes.String,required:true},
        City:{type:SchemaTypes.String,required:true},
        State:{type:SchemaTypes.String,required:true},
        Pincode:{type:SchemaTypes.Number,required:true},
        Landmark:{type:SchemaTypes.String,required:true}
    },
    interested_in:{type:SchemaTypes.Array,required:true},
    deleted_date:{type:SchemaTypes.Date,expires:31536000, default:Date.now},     //deleted user info will be deleted after one year from database
    deleted_by:{}
},
{
    timestamps:true        //this will add time in data object when the user is created in database
});
const Deleted_userModel = mongoose.model(DELETED_USERS,deleted_userSchema);
module.exports = Deleted_userModel;