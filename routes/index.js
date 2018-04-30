var express = require('express');
var router = express.Router();
var tools = require('../tools');

/* GET home page. */
router.get('/', function(req, res, next) {
  console.log(req.user);
  res.render('index', tools.addUser({ title: 'Express' }, req.user));
});

module.exports = router;
