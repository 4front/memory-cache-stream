var assert = require('assert');
var stream = require('stream');
var _ = require('lodash');
var through2 = require('through2');
var sinon = require('sinon');
var memoryCache = require('..');

describe('memoryCache()', function() {
  var cache = memoryCache(), clock;

  afterEach(function () {
    if (clock)
      clock.restore();
  });

  afterEach(function() {
    cache.flushall();
  });

  it('set()', function() {
    var key = 'asdfsadf', value= 'asdfasf';
    cache.set(key, value);
    assert.ok(cache.exists(key));
    assert.equal(cache.get(key), value);
  });

  it('exists of expired key returns 0', function() {
    var key = 'asdfsadf';
    cache.setex(key, -1, 'asdfasdf');
    assert.equal(cache.exists(key), 0);
  });

  it('get of expired key is undefined', function() {
    var key = 'asdfsadf';
    cache.setex(key, 100, 'asdfasdf');

    clock = sinon.useFakeTimers(Date.now(), 'Date');
    clock.tick(200 * 1000);

    assert.ok(_.isUndefined(cache.get(key)));
    assert.equal(cache.exists(key), 0);
  });

  it('ttl of not expiring object', function() {
    var key = 'asdfsadf';
    cache.set(key, 'asfsadf');
    assert.equal(cache.ttl(key), -1);
  });

  it('ttl of object with expiry', function() {
    var key = '24334';
    cache.setex(key, 10, 'a4rgdfgsdfg'); // Expire in 10 seconds

    clock = sinon.useFakeTimers(Date.now(), 'Date');
    clock.tick(5 * 1000);  // fast-forward ahead 5 seconds

    // remaining ttl should be 5 seconds
    assert.equal(cache.ttl(key), 5);
  });

  it('ttl of expired object is -2', function(done) {
    var key = '4534543';
    cache.setex(key, 5, '2435345'); // expire in 5 seconds

    clock = sinon.useFakeTimers(Date.now(), 'Date');
    clock.tick(6 * 1000);  // fast-forward ahead 6 seconds

    cache.ttl(key, function(err, ttl) {
      assert.equal(ttl, -2);
      done();
    });
  });

  it('get async', function(done) {
    var key = 'asdfsa', value='wrfsdf';
    cache.set(key, value);

    cache.get(key, function(err, data) {
      assert.equal(data, value);
      done();
    });
  });

  it('set async', function(done) {
    var key = 'asdfsdf';
    cache.set(key, 'asdasg', function() {
      assert.equal(cache.exists(key), 1);
      done();
    });
  });

  it('exists async', function(done) {
    var key = '23543534';
    cache.set(key, '245ertert');

    cache.exists(key, function(err, exists) {
      assert.equal(exists, 1);
      done();
    });
  });

  it('del', function() {
    var key = 'asdfasdf';
    cache.set(key, 'asdfasdfds');
    cache.del(key);
    assert.equal(cache.exists(key), 0);
  });

  it('del async', function(done) {
    var key = 'asdfasdf';
    cache.set(key, 'asdfasdfds');
    cache.del(key, function() {
      assert.equal(cache.exists(key), 0);
      done();  
    });
  });

  it('readStream', function(done) {
    var key = 'asdfsdf', value='sth4iotiortre';
    cache.set(key, value);

    var out = '';
    cache.readStream(key)
      .pipe(through2(function(chunk, enc, cb) {
        out += chunk;
        cb();
      }, function(cb) {
        assert.equal(out, value);
        done();
      }));
  });

  it('writeThrough', function() {
    var key = 'asdfasdfsd', value= '34534534fsdf';

    var rs = stream.Readable();
    rs._read = function () {
      rs.push(value);
      rs.push(null);
    };

    var out = '';
    rs.pipe(cache.writeThrough(key, 10)).on('data', function(chunk) {
      out += chunk;
    }).on('end', function() {
      assert.equal(out, value);
      assert.equal(cache.exists(key), 1);
      done();
    }); 
  });
});