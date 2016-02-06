var EMAIL_REGEX = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;
var TUFTS_SUPPL_REGEX = /^.*@(\w+\.)?tufts\.edu$/i;


function validateEmail(email) {
    return EMAIL_REGEX.test(email);
}

function validateTuftsEmail(email) {
    return validateEmail(email) && TUFTS_SUPPL_REGEX.test(email);
}

function checkForKeys(keys, variable) {
    if (keys instanceof Array) {
        for (i=0; i<keys.length; i++) {
            if (!(keys[i] in variable))
                return false;
        }
        return true;
    }
    return false;
}

function normalizeEmail(email) {
    email = email.toLowerCase();
    if (!validateEmail(email))
        return email;
    email_parts = email.split('@');
    username = email_parts[0];
    domain = email_parts[1];

    if (domain === 'gmail.com' || domain === 'googlemail.com')
        return username.replace('.', '')+'@'+domain;
    return email;
}

exports.normalizeEmail = normalizeEmail;
exports.checkForKeys = checkForKeys;
exports.validateEmail = validateEmail;
exports.validateTuftsEmail = validateTuftsEmail;

