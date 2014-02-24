'use strict';

exports.init = function(req, res){
    console.log(req.session);
  res.render('about/index');
};
