
/**
 * An Array.prototype.slice.call(arguments) alternative
 *
 * @param {Object} args something with a length
 * @param {Number} slice
 * @param {Number} sliceEnd
 * @api public
 */

module.exports = function (args, slice, sliceEnd) {
  var ret = [];
  var len = args.length;

  if (0 === len) return ret;

  var start = slice < 0
    ? Math.max(0, slice + len)
    : slice || 0;

  var end = 3 === arguments.length
    ? sliceEnd < 0
      ? sliceEnd + len
      : sliceEnd
    : len;

  for (var i = start; i < end; ++i) {
    ret[i - start] = args[i];
  }

  return ret;
}

