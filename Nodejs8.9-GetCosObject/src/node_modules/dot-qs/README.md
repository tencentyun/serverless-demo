# dot-querystring

dot notation version of [node-querystring](https://github.com/visionmedia/node-querystring).

## Install 

```
npm install dot-qs
```

## Examples 

### stringify / parse

```js

// set array style to using dot (default).
dotQs.options = {
  arrayStyle : 'DOT'
};

dotQs.stringify({a :{ b : 2}})
// -> 'a.b=2'

dotQs.stringify({a :[1,2,3,4,5]})
// -> 'a.0=1&a.1=2&a.2=3&a.3=4&a.4=5'

dotQs.parse('a.b.c=1&a.b.d=2')
// -> { a: { b: { c: '1', d: '2' } } }

dotQs.parse('a.0=hoge&a.1=fuga')
// -> { a: [ 'hoge', 'fuga' ] }

// set array style to using brancket
dotQs.options = {
  arrayStyle : 'BRANCKET'
};

dotQs.stringify({a :{ b : 2}})
// -> 'a.b=2'

dotQs.stringify({a :[1,2,3,4,5]})
// -> '"a%5B0%5D=1&a%5B1%5D=2&a%5B2%5D=3&a%5B3%5D=4&a%5B4%5D=5"'

dotQs.parse('a.b.c=1&a.b.d=2')
// -> { a: { b: { c: '1', d: '2' } } }

dotQs.parse('a[0]=hoge&a[1]=fuga')
// -> { a: [ 'hoge', 'fuga' ] }

```

### flatten

```js
// set array style to using dot (default).
dotQs.options = {
  arrayStyle : 'DOT'
};

dotQs.flatten({name : 'john', emails : ['john@example.com', 'john2@example.com']})
// ->  { name: 'john',
//     'emails.0': 'john@example.com',
//     'emails.1': 'john2@example.com' }

// set array style to using brancket
dotQs.options = {
  arrayStyle : 'BRANCKET'
};

dotQs.flatten({name : 'john', emails : ['john@example.com', 'john2@example.com']})
// ->  { name: 'john',
//     'emails[0]': 'john@example.com',
//     'emails[1]': 'john2@example.com' }

```

## Browser support

Copy lib/dot-querystring.js to your project.

```
<script type="text/javascript" src="dot-querystring.js"></script>
<!-- optional -->
<script type="text/javascript" src="jQuery.js"></script>

<script type="text/javascript">
  // use with jQuery.ajax
  var obj = {name : 'john', emails : ['john@example.com', 'john2@example.com']};

  // this will access http://example.com/foo?name=john&emails.0=john%40example.com&emails.1=john2%40example.com
  $.ajax({
    url : 'http://example.com/foo',
    data : dotQs.flatten(obj)
  });
</script>
```

## License

The MIT License (MIT)
Copyright (c) 2012 tutuming  &lt;tutuming@gmail.com&gt;

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
