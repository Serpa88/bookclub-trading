function addUser(object, user) {
    if (user) {
        object.user = user.value;
    }
    return object;
}

String.isNullOrWhitespace = function (i) {
    return typeof i !== 'string' || !i.trim();
}

function ensureLogged(req, res, next) {
    if (!req.user) 
        res.redirect('/');
    else 
        next();
    }

module.exports = {
    addUser,
    ensureLogged
};