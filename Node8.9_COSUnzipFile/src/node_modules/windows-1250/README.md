# windows-1250 [![Build status](https://travis-ci.org/mathiasbynens/windows-1250.svg?branch=master)](https://travis-ci.org/mathiasbynens/windows-1250) [![Dependency status](https://gemnasium.com/mathiasbynens/windows-1250.svg)](https://gemnasium.com/mathiasbynens/windows-1250)

_windows-1250_ is a robust JavaScript implementation of [the windows-1250 character encoding as defined by the Encoding Standard](http://encoding.spec.whatwg.org/#windows-1250).

This encoding is known under the following names: cp1250, windows-1250, and x-cp1250.

## Installation

Via [npm](http://npmjs.org/):

```bash
npm install windows-1250
```

Via [Bower](http://bower.io/):

```bash
bower install windows-1250
```

Via [Component](https://github.com/component/component):

```bash
component install mathiasbynens/windows-1250
```

In a browser:

```html
<script src="windows-1250.js"></script>
```

In [Narwhal](http://narwhaljs.org/), [Node.js](http://nodejs.org/), and [RingoJS](http://ringojs.org/):

```js
var windows1250 = require('windows-1250');
```

In [Rhino](http://www.mozilla.org/rhino/):

```js
load('windows1250.js');
```

Using an AMD loader like [RequireJS](http://requirejs.org/):

```js
require(
  {
    'paths': {
      'windows-1250': 'path/to/windows-1250'
    }
  },
  ['windows-1250'],
  function(windows1250) {
    console.log(windows1250);
  }
);
```

## API

### `windows1250.version`

A string representing the semantic version number.

### `windows1250.labels`

An array of strings, each representing a [label](http://encoding.spec.whatwg.org/#label) for this encoding.

### `windows1250.encode(input, options)`

This function takes a plain text string (the `input` parameter) and encodes it according to windows-1250. The return value is a ‘byte string’, i.e. a string of which each item represents an octet as per windows-1250.

```js
var encodedData = windows1250.encode(text);
```

The optional `options` object and its `mode` property can be used to set the [error mode](http://encoding.spec.whatwg.org/#error-mode). For encoding, the error mode can be `'fatal'` (the default) or `'html'`.

```js
var encodedData = windows1250.encode(text, {
  'mode': 'html'
});
// If `text` contains a symbol that cannot be represented in windows-1250,
// instead of throwing an error, it will return an HTML entity for the symbol.
```

### `windows1250.decode(input, options)`

This function takes a byte string (the `input` parameter) and decodes it according to windows-1250.

```js
var text = windows1250.decode(encodedData);
```

The optional `options` object and its `mode` property can be used to set the [error mode](http://encoding.spec.whatwg.org/#error-mode). For decoding, the error mode can be `'replacement'` (the default) or `'fatal'`.

```js
var text = windows1250.decode(encodedData, {
  'mode': 'fatal'
});
// If `encodedData` contains an invalid byte for the windows-1250 encoding,
// instead of replacing it with U+FFFD in the output, an error is thrown.
```

## Support

_windows-1250_ is designed to work in at least Node.js v0.10.0, Narwhal 0.3.2, RingoJS 0.8-0.9, PhantomJS 1.9.0, Rhino 1.7RC4, as well as old and modern versions of Chrome, Firefox, Safari, Opera, and Internet Explorer.

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

_windows-1250_ is available under the [MIT](http://mths.be/mit) license.
