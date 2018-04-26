var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  console.log(req.user);
  let properties = { title: 'Express' };
  if (req.user) {
    properties.user = req.user.value;
  }
  res.render('index', properties);
});

module.exports = router;
