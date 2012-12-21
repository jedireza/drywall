// muri

/**
 * MongoDB URI parser as described here:
 * http://www.mongodb.org/display/DOCS/Connections
 */

/**
 * Module dependencies
 */

var url = require('url');
var qs = require('querystring');

/**
 * Defaults
 */

const DEFAULT_PORT = 27017;
const DEFAULT_DB = 'admin';

/**
 * Muri
 */

module.exports = exports = function muri (str) {
  if (!/^mongodb:\/\//.test(str)) {
    throw new Error('Invalid mongodb uri. Must begin with "mongodb://"'
                  + '\n  Received: ' + str);
  }

  var ret = {
      hosts: []
    , db: 'admin'
    , options: {}
  }

  var match = /^mongodb:\/\/([^?]+)(\??.*)$/.exec(str);
  if (!match || '/' == match[1]) {
    throw new Error('Invalid mongodb uri. Missing hostname');
  }

  var uris = match[1];
  var path = match[2];
  var db;

  uris.split(',').forEach(function (uri) {
    if (!/^mongodb:\/\//.test(uri)) {
      uri = 'mongodb://' + uri;
    }

    var o = url.parse(uri);

    if (o.hostname) {
      ret.hosts.push({
          host: o.hostname
        , port: parseInt(o.port || DEFAULT_PORT, 10)
      })

      if (!db && o.pathname) {
        db = o.pathname.replace(/^\//, '');
      }
    } else {
      var domain = /(.+)\.sock$/.exec(o.pathname);
      if (domain && domain[1]) {
        ret.hosts.push({ ipc: domain[1] });
      }
    }

    if (o.auth) {
      var auth = o.auth.split(':');
      ret.auth = {
          user: auth[0]
        , pass: auth[1]
      }
    }
  })

  if (!ret.hosts.length) {
    throw new Error('Invalid mongodb uri. Missing hostname');
  }

  var parts = path.split('?');

  if (!db) {
    if (parts[0]) {
      db = parts[0].replace(/^\//, '');
    } else {
      // deal with ipc formats
      db = /\/([^\.]+)$/.exec(match[1]);
      if (db && db[1]) {
        db = db[1];
      }
    }
  }

  if (db) {
    ret.db = db;
  }

  if (parts[1]) {
    ret.options = options(parts[1]);
  }

  return ret;
}

/**
 * Parse str into key/val pairs casting values appropriately.
 */

function options (str) {
  var sep = /;/.test(str)
    ? ';'
    : '&';

  var ret = qs.parse(str, sep);

  Object.keys(ret).forEach(function (key) {
    var val = ret[key];
    if ('readPreferenceTags' == key) {
      val = readPref(val);
      if (val) {
        ret[key] = Array.isArray(val)
          ? val
          : [val];
      }
    } else {
      ret[key] = format(val);
    }
  });

  return ret;
}

function format (val) {
  var num;

  if ('true' == val) {
    return true;
  } else if ('false' == val) {
    return false;
  } else {
    num = parseInt(val, 10);
    if (!isNaN(num)) {
      return num;
    }
  }

  return val;
}

function readPref (val) {
  var ret;

  if (Array.isArray(val)) {
    ret = val.map(readPref).filter(Boolean);
    return ret.length
      ? ret
      : undefined
  }

  var pair = val.split(',');
  var hasKeys;
  ret = {};

  pair.forEach(function (kv) {
    kv = (kv || '').trim();
    if (!kv) return;
    hasKeys = true;
    var split = kv.split(':');
    ret[split[0]] = format(split[1]);
  });

  return hasKeys && ret;
}

/**
 * Version
 */

module.exports.version = JSON.parse(
  require('fs').readFileSync(__dirname + '/../package.json', 'utf8')
).version;
