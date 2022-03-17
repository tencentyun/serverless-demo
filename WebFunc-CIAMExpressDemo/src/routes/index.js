var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  if (!req.cookies['CIAM_ACCESS_TOKEN']) {
    res.render('index', { isLogin: false });
  }
  res.render('index', { isLogin: true });
});

module.exports = router;
