'use strict';

exports.init = function(req, res){
  req.logout();
  res.redirect('/');
};

exports.logout = function(req, res){
  req.logout();
  res.send({success: true});
};
