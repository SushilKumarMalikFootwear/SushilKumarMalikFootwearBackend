const {Schema,SchemaTypes} = require('../connect');
const {CONFIG_LISTS} = require('../../utils/config').SCHEMAS;
const mongoose = require('../connect');
const configListsSchema = new Schema({
    categoryList : {type:SchemaTypes.Array},
    sizeRangeList : {type:SchemaTypes.Array}
    }
);
const ConfigListsModel = mongoose.model(CONFIG_LISTS,configListsSchema);
module.exports = ConfigListsModel;