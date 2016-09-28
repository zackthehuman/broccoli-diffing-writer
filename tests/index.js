'use strict';

var fs = require('fs');
var path = require('path');
var chai = require('chai'), expect = chai.expect;
var chaiAsPromised = require('chai-as-promised');
var chaiFiles = require('chai-files'), file = chaiFiles.file;
chai.use(chaiAsPromised);
chai.use(chaiFiles);
var broccoli = require('broccoli');
var DiffingWriter = require('..');

var builder, diffingWriter;

function setupDiffingWriter(inputNodes, options, buildCallback) {
  if (!buildCallback) buildCallback = function() { };

  diffingWriter = new DiffingWriter(inputNodes, options);
  diffingWriter.build = function(diff) {
    return buildCallback.call(this, diff);
  };
  builder = new broccoli.Builder(diffingWriter);
}

function build() {
  return builder.build()
    .then(function(hash) {
      return hash.directory;
    });
}

describe('broccoli-caching-writer', function() {
  var sourcePath = 'tests/fixtures/sample-project';
  var secondaryPath = 'tests/fixtures/other-tree';

  var existingJSFile = sourcePath + '/core.js';
  var dummyChangedFile = sourcePath + '/dummy-changed-file.txt';
  var dummyJSChangedFile = sourcePath + '/dummy-changed-file.js';

  afterEach(function() {
    if (fs.existsSync(dummyChangedFile)) {
      fs.unlinkSync(dummyChangedFile);
    }

    if (fs.existsSync(dummyJSChangedFile)) {
      fs.unlinkSync(dummyJSChangedFile);
    }

    if (builder) {
      return builder.cleanup();
    }
  });

  describe('constructor', function() {
    it('throws if passed an array of inputs', function() {
      function explode() {
        return new DiffingWriter([sourcePath]);
      }

      expect(explode).to.throw(/DiffingWriter accepts only a single input node\. Do not pass an array of nodes\./);
    });
  });

  describe('build', function() {
    it('calls build with an array', function() {
      var diff;

      setupDiffingWriter(sourcePath, {}, function captureDiff(_diff) {
        diff = _diff;
      });

      return build().then(function(directory) {
        expect(diff).to.be.an('Array', 'expected the diff to be an array');
      });
    });

    it('calls build with an array containing diffs', function() {
      var diff;

      setupDiffingWriter(sourcePath, {}, function captureDiff(_diff) {
        diff = _diff;
      });

      return build().then(function(directory) {
        expect(diff.length).to.equal(2, 'expected there to be 2 entries');
        expect(diff.map(function(entry) { return entry.slice(0, 2); })).to.eql([
          ['create', 'core.js'],
          ['create', 'main.js']
        ], 'expected the entries to reflect the actual files changed');
      });
    });

    it('calls build with changed files only', function() {
      var diff;

      setupDiffingWriter(sourcePath, {}, function captureDiff(_diff) {
        diff = _diff;
      });

      return build()
        .then(function(directory) {
          expect(diff.length).to.equal(2, 'expected there to be 2 entries');
          expect(diff.map(function(entry) { return entry.slice(0, 2); })).to.eql([
            ['create', 'core.js'],
            ['create', 'main.js']
          ], 'expected the entries to reflect the actual files changed');
        })
        .then(build)
        .then(function(directory) {
          expect(diff.length).to.equal(0, 'expected no diff when not files changed');
          expect(diff).to.eql([], 'expected the diff to be empty because nothing changed');
        })
        .then(function() { fs.writeFileSync(existingJSFile, 'bergh'); })
        .then(build)
        .then(function(directory) {
          expect(diff.length).to.equal(1, 'expected diff to contain one entry');
          expect(diff[0].slice(0, 2)).to.eql(
            ['change', 'core.js'],
            'expected the diff to contain a "change" for "core.js"'
          );
        })
        .then(function() {
          fs.writeFileSync(dummyChangedFile, 'salami');
        })
        .then(build)
        .then(function(directory) {
          expect(diff.length).to.equal(1, 'expected diff to contain one entry');
          expect(diff[0].slice(0, 2)).to.eql(
            ['create', 'dummy-changed-file.txt'],
            'expected the diff to contain a "create" for "dummy-changed-file.js"'
          );
        })
        .then(function() {
          fs.unlinkSync(dummyChangedFile);
        })
        .then(build)
        .then(function(directory) {
          expect(diff.length).to.equal(1, 'expected diff to contain one entry');
          expect(diff[0].slice(0, 2)).to.eql(
            ['unlink', 'dummy-changed-file.txt'],
            'expected the diff to contain a "unlink" for "dummy-changed-file.js"'
          );
        })
        .finally(function() { fs.writeFileSync(existingJSFile, '"YIPPIE"\n'); });
    });
  });
});
