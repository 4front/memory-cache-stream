var stream = require('stream');
var through2 = require('through2');
var _ = require('lodash');

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
    if (_.isFunction(callback)) {
      setTimeout(function() {
        callback(null, value);
      });
    }
    else
      return value;
  };

  exports.set = function(key, value, callback) {
    _cache[key] = {value:value};

    if (_.isFunction(callback))
      setTimeout(callback, 0);
  };

  exports.setex = function(key, seconds, value, callback) {
    _cache[key] = { 
      value: value,
      expires: new Date().getTime() + seconds * 1000
    };

    if (_.isFunction(callback))
      setTimeout(callback, 0);
  };

  exports.del = function(key, callback) {
    _cache[key] = undefined;
    
    if (_.isFunction(callback))
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

    if (_.isFunction(callback)) {
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
    if (_.isUndefined(entry))
      ttl = -2;
    else if (_.isUndefined(entry.expires))
      ttl = -1;
    else {
      ttl = Math.round((entry.expires - new Date().getTime()) / 1000);
      if (ttl < 0) {
        _cache[key] = undefined;
        ttl = -2;
      }
    }

    if (_.isFunction(callback)) {
      setTimeout(function() {
        callback(null, ttl);
      }, 0);
    }
    else
      return ttl;
  };

  exports.flushall = function(callback) {
    _cache = {};
    if (_.isFunction(callback))
      setTimeout(callback, 0);
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
    var value = '';
    return through2(function(chunk, enc, callback) {
      value += chunk;
      this.push(chunk);
    }, function(callback) {
      var entry = {value: value};
      if (seconds)
        entry.expires = new Date().getTime() + seconds * 1000;
      _cache[key] = entry;
    });
  };

  return exports;

  function isExpired(entry) {
    if (_.isUndefined(entry.expires))
      return false;

    return new Date().getTime() >  entry.expires;
  }
};