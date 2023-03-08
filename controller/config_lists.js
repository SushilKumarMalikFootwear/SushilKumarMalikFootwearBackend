const {SUCCESS,SERVER_CRASH,NOT_FOUND} = require('../utils/config').STATUS_CODES;
const messageBundle = require('../locales/en');
const ConfigListsOperations = require("../db/services/config_lists");
const configListsController = {
    async getConfigLists(request,response){
        let configLists = await ConfigListsOperations.getConfigLists();
        if(configLists){
            response.status(SUCCESS).json(configLists);           
        }
        else{
            response.status(NOT_FOUND).json({message:messageBundle['unsuccessful']});
        }
    }
}
module.exports = configListsController;