const express = require('express');
const passport = require('passport');
const router = express.Router();

router.get('/callback', passport.authenticate('github', { failureRedirect: '/' }), function (req, res) {
    res.redirect('/account');
});

router.get('/login', passport.authenticate('github'));

router.get('/logout', function (req, res) {
    req.logout();
    res.redirect('/');
});

module.exports = router;