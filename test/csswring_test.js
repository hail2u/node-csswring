/* jshint node: true */
'use strict';

var fs = require('fs');
var path = require('path');
var postcss = require('postcss');

var csswring = require('../index');

var dirFixtures = path.join(__dirname, 'fixtures');
var dirExpected = path.join(__dirname, 'expected');
var input = '';
var expected = '';
var opts = {};
var loadInput = function (name) {
  return fs.readFileSync(path.join(dirFixtures, name + '.css'), {
    encoding: 'utf8'
  });
};
var loadExpected = function (name) {
  return fs.readFileSync(path.join(dirExpected, name + '.css'), {
    encoding: 'utf8'
  });
};

exports.testPublicInterfaces = function (test) {
  test.expect(5);

  input = '.foo{color:black}';
  expected = postcss.parse(input);
  test.strictEqual(csswring.wring(input).css, expected.toString());

  opts.map = true;
  test.deepEqual(
    csswring.wring(input, opts).map,
    expected.toResult(opts).map
  );
  opts.map = undefined;

  test.strictEqual(
    postcss().use(csswring.processor).process(input).css,
    expected.toString()
  );

  var testCase = 'preserve-hacks';
  input = loadInput(testCase);
  expected = loadExpected(testCase);
  test.strictEqual(csswring.wring(input, {}, {
    preserveHacks: true
  }).css, expected);

  opts.map = true;
  testCase = 'remove-all-comments';
  input = loadInput(testCase);
  expected = loadExpected(testCase);
  test.strictEqual(csswring.wring(input, opts, {
    removeAllComments: true
  }).css, expected);
  opts.map = undefined;

  test.done();
};

exports.testRealCSS = function (test) {
  test.expect(6);

  var testCases = [
    'simple',
    'extra-semicolons',
    'empty-declarations',
    'single-charset',
    'value',
    'issue3'
  ];

  for (var i = 0, l = testCases.length; i < l; i++) {
    var testCase = testCases[i];
    input = loadInput(testCase);
    expected = loadExpected(testCase);
    test.strictEqual(csswring.wring(input).css, expected);
  }

  test.done();
};
