'use strict';

var fs = require('fs');
var path = require('path');
var postcss = require('postcss');

var csswring = require('../index');

exports.API = function (test) {
  test.expect(5);

  var input = '.foo{color:black}';
  var expected = postcss().process(input, {
    from: 'from.css'
  }).css;

  test.strictEqual(
    csswring.wring(input).css,
    expected
  );

  test.strictEqual(
    csswring().wring(input).css,
    expected
  );

  test.strictEqual(
    postcss().use(csswring.postcss).process(input).css,
    expected
  );

  test.strictEqual(
    postcss().use(csswring().postcss).process(input).css,
    expected
  );

  // Old interfaces
  test.strictEqual(
    postcss().use(csswring.processor).process(input).css,
    expected
  );

  test.done();
};

exports['Option: PostCSS options'] = function (test) {
  test.expect(2);

  var opts = {
    map: true,
    from: 'from.css',
    to: 'to.css'
  };
  var input = '.foo{color:black}';
  var processed = csswring.wring(input, opts);
  var expected = postcss().process(input, opts);

  test.strictEqual(
    processed.css,
    expected.css
  );

  test.deepEqual(
    processed.map,
    expected.map
  );

  test.done();
};

exports['Option: preserveHacks'] = function (test) {
  test.expect(5);

  var testCase = 'preserve-hacks';
  var input = '.hacks{*color:black;_background:white;font-size/**/:big}';
  var expected = '.hacks{*color:black;_background:white;font-size/**/:big}';
  var opts = {
    preserveHacks: true
  };

  test.notStrictEqual(
    csswring.wring(input).css,
    expected
  );

  test.strictEqual(
    csswring(opts).wring(input).css,
    expected
  );

  test.strictEqual(
    csswring.wring(input, opts).css,
    expected
  );

  var a = csswring(opts);
  var b = csswring();

  test.notStrictEqual(
    postcss().use(a.postcss).process(input).css,
    postcss().use(b.postcss).process(expected).css
  );

  // Old interfaces
  csswring.preserveHacks = true;
  test.strictEqual(
    csswring.wring(input).css,
    expected
  );
  csswring.preserveHacks = false;

  test.done();
};

exports['Option: removeAllComments'] = function (test) {
  test.expect(3);

  var testCase = 'remove-all-comments';
  var input = '/*!comment*/.foo{display:block}\n/*# sourceMappingURL=to.css.map */';
  var expected = '.foo{display:block}\n/*# sourceMappingURL=to.css.map */';
  var opts= {
    map: true
  };

  test.notStrictEqual(
    csswring.wring(input, opts).css,
    expected
  );

  test.strictEqual(
    csswring({
      removeAllComments: true
    }).wring(input, opts).css,
    expected
  );

  // Old interfaces
  csswring.removeAllComments = true;
  test.strictEqual(
    csswring.wring(input, opts).css,
    expected
  );
  csswring.removeAllComments = false;

  test.done();
};

exports["Real CSS"] = function (test) {
  var testCases = fs.readdirSync(path.join(__dirname, 'fixtures'));
  var loadInput = function (file) {
    file = path.join(__dirname, 'fixtures', file);

    return fs.readFileSync(file, 'utf8');
  };
  var loadExpected = function (file) {
    file = path.join(__dirname, 'expected', file);

    return fs.readFileSync(file, 'utf8');
  };

  testCases.forEach(function (testCase) {
    test.strictEqual(
      csswring.wring(loadInput(testCase)).css,
      loadExpected(testCase),
      testCase
    );
  });

  test.done();
};
