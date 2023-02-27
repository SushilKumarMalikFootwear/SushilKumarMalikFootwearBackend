const ConfigListsModel = require("../models/config_lists");
module.exports = {
  async getConfigLists() {
    let congifLists = await ConfigListsModel.find();
    return congifLists;
  },
};
