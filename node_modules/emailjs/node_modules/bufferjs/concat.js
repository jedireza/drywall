(function () {
  "use strict";

  function concat(bufs) {
    if (!Array.isArray(bufs)) {
      bufs = Array.prototype.slice.call(arguments);
    }

    var bufsToConcat = [], length = 0;
    bufs.forEach(function (buf) {
      if (buf) {
        if (!Buffer.isBuffer(buf)) {
          buf = new Buffer(buf);
        }
        length += buf.length;
        bufsToConcat.push(buf);
      }
    });

    var concatBuf = new Buffer(length), index = 0;
    bufsToConcat.forEach(function (buf) {
      buf.copy(concatBuf, index, 0, buf.length);
      index += buf.length;
    });

    return concatBuf;
  }
  
  Buffer.concat = concat;

}());
