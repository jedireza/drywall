'use strict';
// public api
var http = {
  http500: function(err, req, res, next){
    res.status(500);

    var data = { err: {} };
    if (req.app.get('env') === 'development') {
      data.err = err;
      console.log(err.stack);
    }
    res.send({ error: 'Something went wrong.', details: data });
  }
};
module.exports = http;