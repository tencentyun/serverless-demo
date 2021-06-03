
# koa sendfile

[![NPM version][npm-image]][npm-url]
[![Build status][travis-image]][travis-url]
[![Test coverage][coveralls-image]][coveralls-url]
[![Dependency Status][david-image]][david-url]
[![License][license-image]][license-url]
[![Downloads][downloads-image]][downloads-url]

Basic file-sending utility for koa. It does the following:

- Check if a file exists
- Set content-length, content-type, and last-modified headers
- 304 based on last-modified
- Handle HEAD requests

It does not:

- Check for malicious paths or hidden files
- Support directory indexes
- Cache control
- OPTIONS method

## API

### sendfile(context, filename)

You must pass the koa context. `filename` is the filename of the file.

sendfile returns a promise that resolves to the `fs.stat()` result of the filename. If sendfile() resolves, that doesn't mean that a response is set - the filename could be a directory. Instead, check `if (context.status)`.

```js
var sendfile = require('koa-sendfile')

app.use(function* (next) {
  var stats = yield sendfile(this, '/Users/jong/.bash_profile')
  if (!this.status) this.throw(404)
})
```

[npm-image]: https://img.shields.io/npm/v/koa-sendfile.svg?style=flat-square
[npm-url]: https://npmjs.org/package/koa-sendfile
[github-tag]: http://img.shields.io/github/tag/koajs/sendfile.svg?style=flat-square
[github-url]: https://github.com/koajs/sendfile/tags
[travis-image]: https://img.shields.io/travis/koajs/sendfile.svg?style=flat-square
[travis-url]: https://travis-ci.org/koajs/sendfile
[coveralls-image]: https://img.shields.io/coveralls/koajs/sendfile.svg?style=flat-square
[coveralls-url]: https://coveralls.io/r/koajs/sendfile?branch=master
[david-image]: http://img.shields.io/david/koajs/sendfile.svg?style=flat-square
[david-url]: https://david-dm.org/koajs/sendfile
[license-image]: http://img.shields.io/npm/l/koa-sendfile.svg?style=flat-square
[license-url]: LICENSE
[downloads-image]: http://img.shields.io/npm/dm/koa-sendfile.svg?style=flat-square
[downloads-url]: https://npmjs.org/package/koa-sendfile
