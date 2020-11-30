# koi8-r [![Build status](https://travis-ci.org/mathiasbynens/koi8-r.svg?branch=master)](https://travis-ci.org/mathiasbynens/koi8-r) [![Dependency status](https://gemnasium.com/mathiasbynens/koi8-r.svg)](https://gemnasium.com/mathiasbynens/koi8-r)

_koi8-r_ is a robust JavaScript implementation of [the koi8-r character encoding as defined by the Encoding Standard](http://encoding.spec.whatwg.org/#koi8-r).

This encoding is known under the following names: cskoi8r, koi, koi8, koi8-r, and koi8_r.

## Installation

Via [npm](http://npmjs.org/):

```bash
npm install koi8-r
```

Via [Bower](http://bower.io/):

```bash
bower install koi8-r
```

Via [Component](https://github.com/component/component):

```bash
component install mathiasbynens/koi8-r
```

In a browser:

```html
<script src="koi8-r.js"></script>
```

In [Narwhal](http://narwhaljs.org/), [Node.js](http://nodejs.org/), and [RingoJS](http://ringojs.org/):

```js
var koi8r = require('koi8-r');
```

In [Rhino](http://www.mozilla.org/rhino/):

```js
load('koi8r.js');
```

Using an AMD loader like [RequireJS](http://requirejs.org/):

```js
require(
  {
    'paths': {
      'koi8-r': 'path/to/koi8-r'
    }
  },
  ['koi8-r'],
  function(koi8r) {
    console.log(koi8r);
  }
);
```

## API

### `koi8r.version`

A string representing the semantic version number.

### `koi8r.labels`

An array of strings, each representing a [label](http://encoding.spec.whatwg.org/#label) for this encoding.

### `koi8r.encode(input, options)`

This function takes a plain text string (the `input` parameter) and encodes it according to koi8-r. The return value is a ‘byte string’, i.e. a string of which each item represents an octet as per koi8-r.

```js
var encodedData = koi8r.encode(text);
```

The optional `options` object and its `mode` property can be used to set the [error mode](http://encoding.spec.whatwg.org/#error-mode). For encoding, the error mode can be `'fatal'` (the default) or `'html'`.

```js
var encodedData = koi8r.encode(text, {
  'mode': 'html'
});
// If `text` contains a symbol that cannot be represented in koi8-r,
// instead of throwing an error, it will return an HTML entity for the symbol.
```

### `koi8r.decode(input, options)`

This function takes a byte string (the `input` parameter) and decodes it according to koi8-r.

```js
var text = koi8r.decode(encodedData);
```

The optional `options` object and its `mode` property can be used to set the [error mode](http://encoding.spec.whatwg.org/#error-mode). For decoding, the error mode can be `'replacement'` (the default) or `'fatal'`.

```js
var text = koi8r.decode(encodedData, {
  'mode': 'fatal'
});
// If `encodedData` contains an invalid byte for the koi8-r encoding,
// instead of replacing it with U+FFFD in the output, an error is thrown.
```

## Support

_koi8-r_ is designed to work in at least Node.js v0.10.0, Narwhal 0.3.2, RingoJS 0.8-0.9, PhantomJS 1.9.0, Rhino 1.7RC4, as well as old and modern versions of Chrome, Firefox, Safari, Opera, and Internet Explorer.

## Unit tests & code coverage

After cloning this repository, run `npm install` to install the dependencies needed for development and testing. You may want to install Istanbul _globally_ using `npm install istanbul -g`.

Once that’s done, you can run the unit tests in Node using `npm test` or `node tests/tests.js`. To run the tests in Rhino, Ringo, Narwhal, and web browsers as well, use `grunt test`.

To generate the code coverage report, use `grunt cover`.

## Notes

[Similar modules for other single-byte legacy encodings are available.](https://www.npmjs.org/browse/keyword/legacy-encoding)

## Author

| [![twitter/mathias](https://gravatar.com/avatar/24e08a9ea84deb17ae121074d0f17125?s=70)](https://twitter.com/mathias "Follow @mathias on Twitter") |
|---|
| [Mathias Bynens](http://mathiasbynens.be/) |

## License

_koi8-r_ is available under the [MIT](http://mths.be/mit) license.
