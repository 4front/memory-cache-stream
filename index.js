var stream = require('stream');
var through2 = require('through2');
var isFunction = require('lodash.isfunction');
var isUndefined = require('lodash.isundefined');
var keys = require('lodash.keys');

// Simple memory cache
module.exports = function() {
  var _cache = {};
  var exports = {};

  exports.get = function(key, callback) {
    var entry = _cache[key];
    if (entry && isExpired(entry)) {
      _cache[key] = undefined;
      entry = null;
    }

    var value = entry ? entry.value : undefined;
    if (isFunction(callback)) {
      setTimeout(function() {
        callback(null, value);
      });
    }
    else
      return value;
  };

  exports.set = function(key, value, callback) {
    _cache[key] = {value:value};

    if (isFunction(callback))
      setTimeout(callback, 0);
  };

  exports.setex = function(key, seconds, value, callback) {
    _cache[key] = {
      value: value,
      expires: new Date().getTime() + seconds * 1000
    };

    if (isFunction(callback))
      setTimeout(callback, 0);
  };

  exports.del = function(key, callback) {
    _cache[key] = undefined;

    if (isFunction(callback))
      setTimeout(callback, 0);
  };

  exports.exists = function(key, callback) {
    var exists;
    var entry = _cache[key];
    if (!entry)
      exists = false;
    else if (isExpired(entry)) {
      _cache[key] = undefined;
      exists = false;
    }
    else
      exists = true;

    if (isFunction(callback)) {
      setTimeout(function() {
        callback(null, exists);
      });
    }
    else
      return exists;
  };

  exports.ttl = function(key, callback) {
    // http://redis.io/commands/ttl
    // The command returns -2 if the key does not exist.
    // The command returns -1 if the key exists but has no associated expire.
    var entry = _cache[key];
    var ttl;
    if (isUndefined(entry))
      ttl = -2;
    else if (isUndefined(entry.expires))
      ttl = -1;
    else {
      ttl = Math.round((entry.expires - new Date().getTime()) / 1000);
      if (ttl < 0) {
        _cache[key] = undefined;
        ttl = -2;
      }
    }

    if (isFunction(callback)) {
      setTimeout(function() {
        callback(null, ttl);
      }, 0);
    }
    else
      return ttl;
  };

  exports.flushall = function(callback) {
    _cache = {};
    if (isFunction(callback))
      setTimeout(callback, 0);
  };

  exports.hmset = function(args) {
    var key = args[0];
    var entry = _cache[key];
    if (entry) {
      hash = entry.value;
    } else {
      hash = {};
      _cache[key] = {value: hash};
    }

    for (var i = 1; i < args.length; i = i + 2) {
      hash[args[i]] = args[i+1];
    }
  }

  exports.hgetall = function(key, callback) {
    var entry = _cache[key];
    var hash = entry ? entry.value : null;

    if (isFunction(callback)) {
      setTimeout(function() {
        callback(null, hash);
      }, 0);
    } else {
      return hash;
    }
  };

  // Simulate the augmented stream functions from
  // https://github.com/4front/redis-streams
  exports.readStream = function(key) {
    var entry = _cache[key], value;
    if (entry)
      value = entry.value;
    else
      value = null;

    if (value && isExpired(entry)) {
      _cache[key] = undefined;
      value = null;
    }

    var rs = stream.Readable();
    rs._read = function () {
      rs.push(value);
      rs.push(null);
    };
    return rs;
  };

  exports.writeThrough = function(key, seconds) {
    var value = new Buffer(0);
    return through2(function(chunk, enc, callback) {
      value = Buffer.concat([value, chunk]);
      this.push(chunk);
      callback();
    }, function(callback) {
      var entry = {value: value};
      if (seconds)
        entry.expires = new Date().getTime() + seconds * 1000;
      _cache[key] = entry;
      callback();
    });
  };

  exports.writeStream = function(key, ttl) {
    var writeableStream = new stream.Writable();
    var entry = _cache[key] = {value: new Buffer(0)};
    entry.expires = new Date().getTime() + ttl * 1000;

    writeableStream._write = function (chunk, encoding, done) {
      entry.value = Buffer.concat([entry.value, chunk]);
      done();
    };

    return writeableStream;
  };

  exports.keys = function() {
    return keys(_cache);
  }

  return exports;

  function isExpired(entry) {
    if (isUndefined(entry.expires))
      return false;

    return new Date().getTime() >  entry.expires;
  }
};
