# x-mac-cyrillic [![Build status](https://travis-ci.org/mathiasbynens/x-mac-cyrillic.svg?branch=master)](https://travis-ci.org/mathiasbynens/x-mac-cyrillic) [![Dependency status](https://gemnasium.com/mathiasbynens/x-mac-cyrillic.svg)](https://gemnasium.com/mathiasbynens/x-mac-cyrillic)

_x-mac-cyrillic_ is a robust JavaScript implementation of [the x-mac-cyrillic character encoding as defined by the Encoding Standard](http://encoding.spec.whatwg.org/#x-mac-cyrillic).

This encoding is known under the following names: x-mac-cyrillic, and x-mac-ukrainian.

## Installation

Via [npm](http://npmjs.org/):

```bash
npm install x-mac-cyrillic
```

Via [Bower](http://bower.io/):

```bash
bower install x-mac-cyrillic
```

Via [Component](https://github.com/component/component):

```bash
component install mathiasbynens/x-mac-cyrillic
```

In a browser:

```html
<script src="x-mac-cyrillic.js"></script>
```

In [Narwhal](http://narwhaljs.org/), [Node.js](http://nodejs.org/), and [RingoJS](http://ringojs.org/):

```js
var xmaccyrillic = require('x-mac-cyrillic');
```

In [Rhino](http://www.mozilla.org/rhino/):

```js
load('xmaccyrillic.js');
```

Using an AMD loader like [RequireJS](http://requirejs.org/):

```js
require(
  {
    'paths': {
      'x-mac-cyrillic': 'path/to/x-mac-cyrillic'
    }
  },
  ['x-mac-cyrillic'],
  function(xmaccyrillic) {
    console.log(xmaccyrillic);
  }
);
```

## API

### `xmaccyrillic.version`

A string representing the semantic version number.

### `xmaccyrillic.labels`

An array of strings, each representing a [label](http://encoding.spec.whatwg.org/#label) for this encoding.

### `xmaccyrillic.encode(input, options)`

This function takes a plain text string (the `input` parameter) and encodes it according to x-mac-cyrillic. The return value is a ‘byte string’, i.e. a string of which each item represents an octet as per x-mac-cyrillic.

```js
var encodedData = xmaccyrillic.encode(text);
```

The optional `options` object and its `mode` property can be used to set the [error mode](http://encoding.spec.whatwg.org/#error-mode). For encoding, the error mode can be `'fatal'` (the default) or `'html'`.

```js
var encodedData = xmaccyrillic.encode(text, {
  'mode': 'html'
});
// If `text` contains a symbol that cannot be represented in x-mac-cyrillic,
// instead of throwing an error, it will return an HTML entity for the symbol.
```

### `xmaccyrillic.decode(input, options)`

This function takes a byte string (the `input` parameter) and decodes it according to x-mac-cyrillic.

```js
var text = xmaccyrillic.decode(encodedData);
```

The optional `options` object and its `mode` property can be used to set the [error mode](http://encoding.spec.whatwg.org/#error-mode). For decoding, the error mode can be `'replacement'` (the default) or `'fatal'`.

```js
var text = xmaccyrillic.decode(encodedData, {
  'mode': 'fatal'
});
// If `encodedData` contains an invalid byte for the x-mac-cyrillic encoding,
// instead of replacing it with U+FFFD in the output, an error is thrown.
```

## Support

_x-mac-cyrillic_ is designed to work in at least Node.js v0.10.0, Narwhal 0.3.2, RingoJS 0.8-0.9, PhantomJS 1.9.0, Rhino 1.7RC4, as well as old and modern versions of Chrome, Firefox, Safari, Opera, and Internet Explorer.

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

_x-mac-cyrillic_ is available under the [MIT](http://mths.be/mit) license.
