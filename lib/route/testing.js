var consts = require('../consts.js');
var common = require('../common.js');

var WHITELIST = [
    [/^\/user\/\w+\/listing\/?$/i, ["GET"], [consts.ROLE_MODERATOR_PUBLIC]],
    [/^\/user\/\w+\/listing\/filter\/[%a-zA-Z0-9,?:@&=+$#]+\/?$/i, ["GET"], [consts.ROLE_MODERATOR_PUBLIC]],
    [/^\/user\/\w+\/confirm(\?[\w=&]+)*$/i, ["GET"], [consts.ROLE_INVALID]],
    [/^\/user\/(([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?))\/recover$/i, ["POST"], [consts.ROLE_INVALID]],
    [/^\/me\/password\/?$/i, ["PUT"], [consts.ROLE_INVALID]],
    [/^\/me\/register\/?$/i, ["POST"], [consts.ROLE_INVALID]],
    [/^\/me\/login\/?$/i, ["POST"], [consts.ROLE_INVALID]],
    [/^\/me\/logout\/?$/i, ["POST"], [consts.ROLE_CONFIRMED_PUBLIC]],
    [/^\/me\/listing\/?$/i, ["GET"], [consts.ROLE_CONFIRMED_PUBLIC]],
    [/^\/me\/listing\/filter\/[%a-zA-Z0-9,?:@&=+$#]+\/?$/i, ["GET"], [consts.ROLE_CONFIRMED_PUBLIC]],
    [/^\/listing\/?$/i, ["GET", "POST"], [consts.ROLE_INVALID, consts.ROLE_CONFIRMED_PUBLIC]],
    [/^\/listing\/\w+\/?$/i, ["GET"], [consts.ROLE_CONFIRMED_PUBLIC]],
    [/^\/listing\/\w+\/flag\/?$/i, ["GET", "POST"], [consts.ROLE_MODERATOR_PUBLIC, consts.ROLE_CONFIRMED_PUBLIC]],
    [/^\/listing\/\w+\/approve\/?$/i, ["PUT"], [consts.ROLE_MODERATOR_PUBLIC]],
    [/^\/listing\/\w+\/quarrentine\/?$/i, ["PUT"], [consts.ROLE_MODERATOR_PUBLIC]],
];

function hasUrlPermission(url, method, user_roles) {
    for (var i=0; i<WHITELIST.length; i++) {
        var line = WHITELIST[i];
        if (line[0].test(url)) {
            for (var j=0; j<line[1].length; j++) {
                var method_chk = method === line[1][j];
                if (method_chk && consts.checkPriv(user_roles, line[2][j])) {
                    return true;
                }
            }
        }
    }
    return false;
}

exports.WHITELIST = WHITELIST;

exports.hasUrlPermission = hasUrlPermission;
exports.ensureEnv = function(request, response, next) {
    if (hasUrlPermission(request.originalUrl,
        request.method,
        getRoles(request))) {
        return next();
    }
    return response.status(403).send();
}

function getRoles(request) {
    if (common.ensureLoginSession(request)) {
        return request.session.login.who.role;
    }
    return consts.ROLE_INVALID;
}

