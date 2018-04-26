const express = require('express');
const passport = require('passport');
const router = express.Router();

router.get('/callback', passport.authenticate('github', { failureRedirect: '/' }), function (req, res) {
    res.redirect('/account');
});

module.exports = router;