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
var loadInput = function (name) {
  return fs.readFileSync(path.join(dirFixtures, name + '.css'), 'utf8');
};
var loadExpected = function (name) {
  return fs.readFileSync(path.join(dirExpected, name + '.css'), 'utf8');
};

exports['Public Interfaces'] = function (test) {
  test.expect(6);

  input = '.foo{color:black}';
  expected = postcss.parse(input);

  // csswring.wring()
  test.strictEqual(
    csswring.wring(input).css,
    expected.toString()
  );

  // csswring().wring()
  test.strictEqual(
    csswring().wring(input).css,
    expected.toString()
  );

  // csswring.wring({ map: true })
  var opts = {
    map: true
  };
  test.deepEqual(
    csswring.wring(input, opts).map,
    expected.toResult(opts).map
  );

  // csswring.postcss
  test.strictEqual(
    postcss().use(csswring.postcss).process(input).css,
    expected.toString()
  );

  // csswring().postcss
  test.strictEqual(
    postcss().use(csswring().postcss).process(input).css,
    expected.toString()
  );

  // csswring.processor alias
  test.strictEqual(
    postcss().use(csswring.processor).process(input).css,
    expected.toString()
  );

  test.done();
};

exports['Option: preserveHacks'] = function (test) {
  test.expect(5);

  var testCase = 'preserve-hacks';
  input = loadInput(testCase);
  expected = loadExpected(testCase);
  var opts = {
    preserveHacks: true
  };

  // csswring(options).wring()
  test.strictEqual(
    csswring(opts).wring(input).css,
    expected
  );

  // csswring.wring(css, options)
  test.strictEqual(
    csswring.wring(input, opts).css,
    expected
  );

  // csswring(options).postcss
  test.strictEqual(
    postcss().use(csswring(opts).postcss).process(input).css,
    expected
  );

  // options per instance
  var a = csswring(opts);
  var b = csswring();

  test.notStrictEqual(
    postcss().use(a.postcss).process(input).css,
    postcss().use(b.postcss).process(expected).css
  );

  // csswring.preserveHacks
  csswring.preserveHacks = true;
  test.strictEqual(
    csswring.wring(input).css,
    expected
  );
  csswring.preserveHacks = false;

  test.done();
};

exports['Option: removeAllComments'] = function (test) {
  test.expect(2);

  var testCase = 'remove-all-comments';
  input = loadInput(testCase);
  expected = loadExpected(testCase);
  var opts = {
    map: true
  };

  // csswring(options).wring()
  test.strictEqual(
    csswring({
      removeAllComments: true
    }).wring(input, opts).css,
    expected
  );

  // csswring.removeAllComments
  csswring.removeAllComments = true;
  test.strictEqual(
    csswring.wring(input, opts).css,
    expected
  );
  csswring.removeAllComments = false;

  test.done();
};

exports['Real CSS'] = function (test) {
  test.expect(8);

  [
    'simple',
    'extra-semicolons',
    'empty-declarations',
    'single-charset',
    'value',
    'issue3',
    'issue11',
    'duplicate-decl'
  ].forEach(function (testCase) {
    input = loadInput(testCase);
    expected = loadExpected(testCase);
    test.strictEqual(
      csswring.wring(input).css,
      expected
    );
  });

  test.done();
};
