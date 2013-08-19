'use strict';

exports.init = function(req, res){
  req.logout();
  res.redirect('/');
};
