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
exports.ROLE_CONFIRMED_TUFTS = 0x0021;
exports.ROLE_MODERATOR_PUBLIC = 0x0111;
exports.ROLE_MODERATOR_TUFTS = 0x0121;
exports.ROLE_ADMIN = 0x1FF1;
var ACCOUNT_MASK = 0x000F;
var CONFIRMED_MASK = 0x00F0;
var MODERATOR_MASK = 0x0F00;
var ADMIN_MASK = 0xF000;
exports.getAdminToolRoles = function(roles) {
    return (roles & 0xF000) >> 12;
}
exports.getModToolRoles = function(roles) {
    return (roles & 0x0F00) >> 8;
}
exports.getUserRoles = function(roles) {
    return (roles & 0x00F0) >> 4;
}
exports.getAccountRoles = function(roles) {
    return (roles & 0x000F) >> 0;
}
exports.getLowestRoleTier = function(roles) {
    if (!roles)
        return 0;
    for (var i=0; i < 32; i+=4) {
        if (((roles >> i) & 0xF) > 0)
            return i/4;
    }
}
exports.checkModPriv = function(roles, requested_role) {
    if (!(roles & requested_role))
        return false;
    return ((roles >> 4) & requested_role) == requested_role;
}
