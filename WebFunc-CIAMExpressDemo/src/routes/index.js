var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  const user = req.session.user;
  const isLogin = !!user;
  const displayName = isLogin ? user.nickname || user.userName ||  user.email || user.phoneNumber  || 'Sample' : '';
  res.render('index', { isLogin, displayName });
});

module.exports = router;
