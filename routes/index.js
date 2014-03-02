var config = require('../config.js');

exports.index = function(req, res) {
  res.render('index', { showRunDemoButton: config.showRunDemoButton });
};