exports.getDefaultMaxAge = function() {
    var week = 1000*60*60*24*7;
    return week;
}

exports.genDefaultExpires = function() {
    return new Date(Date.now() + exports.getDefaultMaxAge());
}

var UNDEF = -1,
    UNKWN = -2,
    DEV   =  0,
    STG   =  1,
    PROD  =  2;

var ENVS = {
    "undefined": UNDEF,
    "unknown": UNKWN,
    "development": DEV,
    "staging": STG,
    "production": PROD
};
var raw_ENV = process.env.NODE_ENV;
var ENV = (raw_ENV in ENVS)?ENVS[raw_ENV]:UNKWN;
exports.ENV = ENV;
exports.ENVS = ENVS;
exports.UNDEF = UNDEF;
exports.UNKWN = UNKWN;
exports.DEV = DEV;
exports.STG = STG;
exports.PROD = PROD;

/*
 * User Account Roles
 * --- Byte 4 --- | --- Byte 3 --- | --- Byte 2 --- | --- Byte 1 ---
 *   Admin tool   | Mod tool roles | Confirmed user | Valid account
 *   roles        |                |   roles        |    flags
 *
 * 0000 INVALID
 * 0001 UNCONFIRMED
 * 0011 CONFIRMED_PUBLIC
 * 0021 CONFIRMED_TUFTS
 * 0111 MODERATOR_PUBLIC
 * 0121 MODERATOR_TUFTS
 * 1FF1 ADMIN
 */
exports.ROLE_INVALID = 0x0000;
exports.ROLE_UNCONFIRMED = 0x0001;
exports.ROLE_CONFIRMED_PUBLIC = 0x0011;
exports.ROLE_CONFIRMED_TUFTS =  0x0020 | exports.ROLE_CONFIRMED_PUBLIC;
exports.ROLE_MODERATOR_PUBLIC = 0x0111;
exports.ROLE_MODERATOR_TUFTS = 0x0020 | exports.ROLE_CONFIRMED_PUBLIC;
exports.ROLE_ADMIN = 0x1FF1;
exports.ACCOUNT_MASK = 0x000F;
exports.CONFIRMED_MASK = 0x00F0;
exports.MODERATOR_MASK = 0x0F00;
exports.ADMIN_MASK = 0xF000;
exports.getAdminToolRoles = function(roles) {
    return (roles & exports.ADMIN_MASK) >> 12;
}
exports.getModToolRoles = function(roles) {
    return (roles & exports.MODERATOR_MASK) >> 8;
}
exports.getUserRoles = function(roles) {
    return (roles & exports.CONFIRMED_MASK) >> 4;
}
exports.getAccountRoles = function(roles) {
    return (roles & exports.ACCOUNT_MASK) >> 0;
}
exports.getLowestRoleTier = function(roles) {
    if (!roles)
        return 0;
    for (var i=0; i < 32; i+=4) {
        if (((roles >> i) & 0xF) > 0)
            return i/4;
    }
}
exports.checkPriv = function(roles, requested_role) {
    for (; roles >= requested_role; roles = roles >> 4) {
        if ((roles & requested_role) == requested_role) {
            return true;
        }
    }
    return false;
}
