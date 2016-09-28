'use strict';

var Plugin   = require('broccoli-plugin');
var FSTree   = require('fs-tree-diff');
var RSVP     = require('rsvp');
var walkSync = require('walk-sync');
var debugGenerator = require('heimdalljs-logger');

DiffingWriter.prototype = Object.create(Plugin.prototype);
DiffingWriter.prototype.constructor = DiffingWriter;
function DiffingWriter (inputNode, options) {
  options = options || {};

  if (Array.isArray(inputNode)) {
    throw new Error('DiffingWriter accepts only a single input node. Do not pass an array of nodes.');
  }

  Plugin.call(this, [inputNode], {
    name: options.name,
    annotation: options.annotation,
    persistentOutput: true
  });

  this._lastTree = FSTree.fromPaths([]);
}

Object.defineProperty(DiffingWriter.prototype, 'debug', {
  get: function() {
    return this._debug || (this._debug = debugGenerator(
      'broccoli-diffing-writer:' +
        this._name +
        (this._annotation ? (' > [' + this._annotation + ']') : '')));
  }
});

DiffingWriter.prototype.getCallbackObject = function() {
  return {
    build: this._diffingBuild.bind(this)
  };
};

DiffingWriter.prototype.build = function() {
  throw new Error('You must override build() when extending DiffingWriter');
};

DiffingWriter.prototype._diffingBuild = function() {
  var writer = this;
  var start = new Date();
  var dir = writer.inputPaths[0];
  var entries = walkSync.entries(dir);
  var newTree = FSTree.fromEntries(entries);
  var diff = this._lastTree.calculatePatch(newTree);

  writer._lastTree = newTree;

  return RSVP.Promise.resolve().then(function() {
    return writer.build(diff);
  }).finally( function() {
    this.debug.trace('recomputing diff in %dms', new Date() - start);
  }.bind(this));
};

module.exports = DiffingWriter;
