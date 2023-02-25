const {SUCCESS,SERVER_CRASH,NOT_FOUND} = require('../utils/config').STATUS_CODES;
const messageBundle = require('../locales/en');
const deleted_adminOperations = require('../db/services/deleted_admin_crud');
const jwt = require('../utils/token');
const deleted_adminController = {
    add_to_deleted(adminObject,deletedby){
        let deleted_adminObject={
            emailid:adminObject.emailid,
            password:adminObject.password,
            old_pass:adminObject.old_pass,
            name:adminObject.name,
            admin_id:adminObject.admin_id,
            isadmin:adminObject.isadmin,
            address:adminObject.address,
            deleted_by:deletedby
        };
        let promise = deleted_adminOperations.add_to_deleted(deleted_adminObject);
        promise.then((doc)=>{
            console.log("admin : ",doc.name," is added to deleted admin");
        }).catch((err)=>{
            console.log("Can't add admin : ",doc.name,"to deleted admins because of this error ",err);
        });
    },
    async login(request,response){      //not used
        try{
            let admin = request.body;
            let doc = await deleted_adminOperations.login(admin);
            if(doc){
                //generate token here
                    let token = jwt.generateToken(doc);
                            response.status(SUCCESS).json({message:messageBundle['login.welcome'],name:doc.name,token:token});    
                    }
            else{
                response.status(NOT_FOUND).json({message:messageBundle['login.invaliduser']});
            }
        }
        catch(err){
            response.status(SERVER_CRASH).json({message:messageBundle['unsuccessful'],ERROR:err});
        }
    },
    async view_all(request,response){
        try{
            let alladmins = await deleted_adminOperations.find_all();
            if(alladmins){
                response.status(SUCCESS).json({message:messageBundle['admin.found'],Adminfound:alladmins});               
            }
            else{
                response.status(NOT_FOUND).json({message:messageBundle['admin.notfound']});               
            }
        }
        catch(err){
            response.status(SERVER_CRASH).json({message:messageBundle['unsuccessful'],ERROR:err});
        }
    },
    async view_by_admin_id(request,response){
        try{
            let admin_id = request.body.admin_id;
            let admin = await deleted_adminOperations.find_admin_by_admin_id(admin_id);
            if(admin){
                response.status(SUCCESS).json({message:messageBundle['admin.found'],admin:admin});                
            }
            else{
                response.status(NOT_FOUND).json({message:messageBundle['admin.notfound']});                
            }
        }
        catch(err){
            response.status(SERVER_CRASH).json({message:messageBundle['unsuccessful'],ERROR:err});
        }
    },
    async view_by_name(request,response){
        try{
            let name = request.body.name;
            let admin = await deleted_adminOperations.find_by_name(name);
            if(admin){
                response.status(SUCCESS).json({message:messageBundle['admin.found'],admin:admin});               
            }
            else{
                response.status(NOT_FOUND).json({message:messageBundle['admin.notfound']});                
            }
        }
        catch(err){
            response.status(SERVER_CRASH).json({message:messageBundle['unsuccessful'],ERROR:err});
        }
    },
    async view_by_email(request,response){
        try{
            let email = request.body.email;
            let admin = await adminOperations.find_by_email(email);
            if(admin){
                response.status(SUCCESS).json({message:messageBundle['admin.found'],admin:admin});               
            }
            else{
                response.status(NOT_FOUND).json({message:messageBundle['admin.notfound']});                
            }
        }
        catch(err){
            response.status(SERVER_CRASH).json({message:messageBundle['unsuccessful'],ERROR:err});
        }
    },
    async delete_any_admin(request,response){
        try{
            let admin_id = request.body.admin_id;
            let deleted = await deleted_adminOperations.delete_any_admin(admin_id);
            if(deleted.deletedCount){
                response.status(SUCCESS).json({message:messageBundle['delete.successful']});               
            }
            else{
                response.status(NOT_FOUND).json({message:messageBundle['delete.unsuccessful']});
            }
        }
        catch(err){
            response.status(SERVER_CRASH).json({message:messageBundle['unsuccessful'],ERROR:err});
        }
    },
    
};
module.exports = deleted_adminController;