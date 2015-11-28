"use strict";

var fs = require("fs");
var path = require("path");
var postcss = require("postcss");

var csswring = require("../index");

exports["Public API"] = function (test) {
  var expected;
  var input = ".foo{color:black}";
  expected = postcss().process(input).css;

  test.expect(2);

  test.strictEqual(
    csswring.wring(input).css,
    expected
  );

  test.strictEqual(
    postcss([
      csswring()
    ]).process(input).css,
    expected
  );

  test.done();
};

exports["Option: PostCSS options"] = function (test) {
  var expected;
  var input = ".foo{color:black}";
  var opts = {
    from: "from.css",
    map: {
      inline: false
    }
  };
  var processed = csswring.wring(input, opts);
  expected = postcss().process(input, opts);

  test.expect(2);

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

exports["Option: preserveHacks"] = function (test) {
  var expected = ".hacks{_color:red}";
  var input = expected;
  var opts = {
    preserveHacks: true
  };

  test.expect(3);

  test.strictEqual(
    csswring.wring(input, opts).css,
    expected
  );

  expected = postcss([csswring()]).process(input).css;
  test.notStrictEqual(
    postcss([csswring(opts)]).process(input).css,
    expected
  );

  expected = "";
  test.strictEqual(
    csswring.wring(input).css,
    expected
  );

  test.done();
};

exports["Option: removeAllComments"] = function (test) {
  var expected = ".foo{display:block}\n/*# sourceMappingURL=to.css.map */";
  var input = "/*!comment*/.foo{display:block}\n/*# sourceMappingURL=to.css.map */";
  var opts = {
    map: {
      inline: false
    },
    removeAllComments: true
  };

  test.expect(3);

  test.strictEqual(
    csswring.wring(input, opts).css,
    expected
  );

  expected = postcss([csswring(opts)]).process(input).css;
  test.notStrictEqual(
    postcss([csswring()]).process(input).css,
    expected
  );

  opts.removeAllComments = false;
  expected = input;
  test.strictEqual(
    csswring.wring(input, opts).css,
    expected
  );

  test.done();
};

exports["Real CSS"] = function (test) {
  var testCases = fs.readdirSync(path.join(__dirname, "fixtures"));

  var loadExpected = function (file) {
    file = path.join(__dirname, "expected", file);

    return fs.readFileSync(file, "utf8").trim();
  };

  var loadInput = function (file) {
    file = path.join(__dirname, "fixtures", file);

    return fs.readFileSync(file, "utf8");
  };

  test.expect(testCases.length);

  testCases.forEach(function (testCase) {
    var opts = {};

    if (testCase.indexOf("hacks_") === 0) {
      opts.preserveHacks = true;
    }

    test.strictEqual(
      csswring.wring(loadInput(testCase), opts).css,
      loadExpected(testCase),
      testCase
    );
  });

  test.done();
};
