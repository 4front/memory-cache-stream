# memory-cache-stream

[![NPM Version][npm-image]][npm-url]
[![NPM Downloads][downloads-image]][downloads-url]
[![Build Status][travis-image]][travis-url]
[![Test Coverage][coveralls-image]][coveralls-url]

In-memory cache implementing a subset of the [node-redis](https://github.com/mranney/node_redis) API - specifically the [get](http://redis.io/commands/get), [set](http://redis.io/commands/set), [setex](http://redis.io/commands/setex), [exists](http://redis.io/commands/exists), [del](http://redis.io/commands/del), [flushall](http://redis.io/commands/flushall), and [ttl](http://redis.io/commands/ttl) commands. Like node_redis, all commands can take an optional `callback` as the final argument.

This cache isn't really intended for production scenarios, but is suitable for use in place of `node_redis` for development environments and unit tests.

In addition to the subset of the built-in Redis commands, there are 2 additional functions: `readStream` and `writeThrough` that are used to stream data into and out of the cache. Although these are purely for backwards API compatibility since the cached strings are already in memory. 

For the real Redis, checkout the [redis-streams](https://github.com/4front/redis-streams) package augments `RedisClient` with these same functions.

## Installation
~~~
npm install memory-cache-stream
~~~

## Usage

~~~js
var memoryCache = require('memory-cache-stream');

// Set with ttl of 1 minute
memoryCache.setex(key, 60, 'some string to cache');

// Get using a callback
memoryCache.get(key, function(err, data) {
	console.log(data);
});

// Pipe out of the cache
memoryCache.readStream(key)
	.pipe(process.stdout);
	
// Pipe into the cache and out to stdout
fs.createReadStream('file.txt')
	.pipe(memoryCache.writeThrough(key, 60))
	.pipe(process.stdout);
~~~

See the [unit tests](https://github.com/4front/memory-cache-stream/blob/master/test/cache.js) for additional examples.

[npm-image]: https://img.shields.io/npm/v/memory-cache-stream.svg?style=flat
[npm-url]: https://npmjs.org/package/memory-cache-stream
[travis-image]: https://img.shields.io/travis/4front/memory-cache-stream.svg?style=flat
[travis-url]: https://travis-ci.org/4front/apphost
[coveralls-image]: https://img.shields.io/coveralls/4front/memory-cache-stream.svg?style=flat
[coveralls-url]: https://coveralls.io/r/4front/memory-cache-stream?branch=master
[downloads-image]: https://img.shields.io/npm/dm/memory-cache-stream.svg?style=flat
[downloads-url]: https://npmjs.org/package/memory-cache-stream