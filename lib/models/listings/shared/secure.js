var consts = require('../../../consts.js');
var utils = require('../../../utils.js');

exports.genListingSecureFunc = function(schema) {
    return function(roles, user_id, include_id) {
        var ret_obj = {};
        var list = this;
        schema.eachPath(function(path, schemaType) {
            if (Array.isArray(schemaType.options.type)) {
                var arr = utils.getValueByPath(list, path);
                for (var i=0; i<arr.length; i++) {
                    var e = arr[i];
                    if (typeof(e) == typeof({}) && 'toSecure' in e)
                        utils.pushValueByPath(ret_obj, path, e.toSecure());
                    else
                        utils.pushValueByPath(ret_obj, path, e);
                }
            } else if ("reqd_role" in schemaType.options && consts.checkPriv(roles, schemaType.options.reqd_role)) {
                utils.setValueByPath(ret_obj, path, utils.getValueByPath(list, path));
            }
        });
        if (include_id || ("user_id" in list && user_id && user_id == list.user_id)) {
            utils.setValueByPath(ret_obj, "_id", utils.getValueByPath(list, "_id"));
        }
        return ret_obj;
    }
}

