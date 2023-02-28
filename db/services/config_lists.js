const ConfigListsModel = require("../models/config_lists");
module.exports = {
  async getConfigLists() {
    let congifLists = await ConfigListsModel.findOne({},{categoryList:1,sizeRangeList:1,_id:0});
    return congifLists;
  },
};
