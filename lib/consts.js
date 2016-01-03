function getDefaultMaxAge() {
    var week = 1000*60*60*24*7;
    return week;
}

function genDefaultExpires() {
    return new Date(Date.now() + getDefaultMaxAge());
}

exports.getDefaultMaxAge = getDefaultMaxAge;
exports.genDefaultExpires = genDefaultExpires;
