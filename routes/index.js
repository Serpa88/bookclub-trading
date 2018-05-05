var express = require('express');
var router = express.Router();
var tools = require('../tools');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.redirect('/books/all');
});

module.exports = router;
