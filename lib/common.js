exports.error = function(type, message) {
    return JSON.stringify({
        type: type,
        message: message
    });
}

exports.sendEnvConfigFailure = function(response) {
    return response.status(500).send(error(
        'consts.ENVIRONMENT_MISCONFIGURATION_FAILURE',
        'The local environment was configured incorrectly'
    ));
}

exports.sendNotYetImplementedFailure = function(response) {
    return response.status(501).send(error('NOT_YET_IMPLEMENTED_FAILURE', 'Not yet implemented'));
}

exports.ensureLoginSession = function(request) {
    if (request.session &&
        request.session.login &&
        request.session.login.valid &&
        request.session.login.who.id) {
        return true;
    }
    return false;
}

