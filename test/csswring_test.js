/*jshint node:true */
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
  test.expect(3);

  input = '.foo{color:black}';
  expected = postcss.parse(input);
  test.strictEqual(csswring.wring(input).css, expected.toString());

  opts.map = true;
  test.strictEqual(
    csswring.wring(input, opts).map,
    expected.toResult(opts).map
  );

  test.strictEqual(
    postcss().use(csswring.processor).process(input).css,
    expected.toString()
  );

  test.done();
};

exports.testRealCSS = function (test) {
  test.expect(4);

  var testCases = [
    'simple',
    'extra-semicolons',
    'empty-declarations',
    'single-charset'
  ];

  for (var i = 0, l = testCases.length; i < l; i++) {
    var testCase = testCases[i];
    input = loadInput(testCase);
    expected = loadExpected(testCase);
    test.strictEqual(csswring.wring(input).css, expected);
  }

  test.done();
};
