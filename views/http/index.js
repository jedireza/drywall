'use strict';

exports.http404 = function(req, res){
  res.status(404);
  if (req.xhr) {
    res.send({ error: 'Resource not found.' });
  }
  else {
    res.render('http/404');
  }
};

exports.http500 = function(err, req, res, next){
  res.status(500);

  var data = { err: {} };
  if (req.app.get('env') === 'development') {
    data.err = err;
    console.log(err.stack);
  }

  if (req.xhr) {
    res.send({ error: 'Something went wrong.', details: data });
  }
  else {
    res.render('http/500', data);
  }
};
