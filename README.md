# Broccoli Diffing Writer

A flavor of [broccoli-writer](https://github.com/broccolijs/broccoli-writer)
which diffs its input between rebuilds. When the `build` method is called, it
is called with an array of entry objects that represent any changes that took
place.

## Example


```js
var Plugin = require('broccoli-diffing-writer');

MyPlugin.prototype = Object.create(Plugin.prototype);
MyPlugin.prototype.constructor = MyPlugin;
function MyPlugin(inputNode, options) {
  options = options || {};

  Plugin.call(this, inputNode, {
    annotation: options.annotation
  });
}

MyPlugin.prototype.build = function(diff) {
  // diff is an array containing changes
  // [
  //   ['create', 'some/file.js', { ... }],
  //   ['unlink', 'deleted/file/here.js', { ... }],
  //   ['change', 'some/changed/file.js', { ... }]
  // ]
};
```

## Documentation

### `new DiffingWriter(inputNode, options)`

Call this base class constructor from your subclass constructor.

* `inputNode`: A single input node.

* `options`:

    * `name`, `annotation`, `persistentOutput`: Same as
      [broccoli-plugin](https://github.com/broccolijs/broccoli-plugin#new-plugininputnodes-options);
      see there.

## Tests

Running the tests:

```javascript
npm install
npm test
```

## License

This project is distributed under the MIT license.
