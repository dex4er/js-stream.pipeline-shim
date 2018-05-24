# stream.pipeline-shim

<!-- markdownlint-disable MD013 -->
[![Build Status](https://secure.travis-ci.org/dex4er/js-stream.pipeline-shim.svg)](http://travis-ci.org/dex4er/js-stream.pipeline-shim) [![npm](https://img.shields.io/npm/v/stream.pipeline-shim.svg)](https://www.npmjs.com/package/stream.pipeline-shim)
<!-- markdownlint-enable MD013 -->

Polyfill for stream.pipeline in node versions &lt; v10

node v10.0.0 added support for a built-in `stream.pipeline`:
<https://github.com/nodejs/node/pull/19828>

This package provides the built-in `stream.pipeline` in node v10.0.0 and later,
and a replacement in other environments.

This module requires Node >= 5.

This package implements the [es-shim API](https://github.com/es-shims/api)
interface. It works in an ES5-supported environment and complies with the
[spec](http://www.ecma-international.org/ecma-262/6.0/).

## Usage

### Direct

```js
const pipeline = require('stream.pipeline-shim');
// Use `pipeline` just like the built-in method on `stream`
```

### Shim

```js
require('stream.pipeline-shim/shim')();
// `stream.pipeline` is now defined
const stream = require('stream');
// Use `stream.pipeline`
```

or:

```js
require('stream.pipeline-shim/auto');
// `stream.pipeline` is now defined
const stream = require('stream');
// Use `stream.pipeline`
```

## Warning

This package had to be named just `stream.pipeline`, but there is already some
package with similar name and then I've got:

<!-- markdownlint-disable MD013 -->

```console
npm ERR! Package name too similar to existing packages; try renaming your package to 'stream.pipeline-shim' and publishing with 'npm publish --access=public' instead : stream.pipeline
```

<!-- markdownlint-enable MD013 -->
