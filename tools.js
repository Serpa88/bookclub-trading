function addUser(object, user) {
    if (user) {
        object.user = user.value;
    }
    return object;
}

String.isNullOrWhitespace = function (i) {
    return typeof i !== 'string' || !i.trim();
}

module.exports = {
    addUser
};