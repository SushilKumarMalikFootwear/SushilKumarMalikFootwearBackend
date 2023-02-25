const {Schema,SchemaTypes} = require('../connect');
const {USERS} = require('../../utils/config').SCHEMAS;
const mongoose = require('../connect');
const userSchema = new Schema({
    emailid:{type:SchemaTypes.String,required:true,unique:true,index:true},
    password:{type:SchemaTypes.String,required:true,min:3,max:25},
    old_pass:{type:SchemaTypes.String},
    name:{type:SchemaTypes.String,required:true,index:true},
    user_id:{type:SchemaTypes.String,required:true,unique:true,index:true},
    profile_pic:{type:SchemaTypes.Buffer},
    address:{
        Houseno:{type:SchemaTypes.String,required:true},
        City:{type:SchemaTypes.String,required:true},
        State:{type:SchemaTypes.String,required:true},
        Pincode:{type:SchemaTypes.Number,required:true},
        Landmark:{type:SchemaTypes.String,required:true}
    },
    interested_in:{type:SchemaTypes.Array,required:true},
    account_activated:{type:SchemaTypes.Number,required:true},
    key:{type:SchemaTypes.String,required:true},
    two_factor_auth:{type:SchemaTypes.Number,required:true},
    otp_checked:{type:SchemaTypes.Number}
},
{
    timestamps:true        //this will add time in data object when the user is created in database
});
const UserModel = mongoose.model(USERS,userSchema);
module.exports = UserModel;