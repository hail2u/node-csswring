const fs = require("fs");
const path = require("path");
const postcss = require("postcss");

const csswring = require("../index");

exports["Public API"] = test => {
  const input = ".foo{color:black}";
  const expected = postcss().process(input).css;

  test.expect(2);

  test.strictEqual(csswring.wring(input).css, expected);

  test.strictEqual(postcss([csswring()]).process(input).css, expected);

  test.done();
};

exports["Option: PostCSS options"] = test => {
  const input = ".foo{color:black}";
  const opts = {
    from: "from.css",
    map: {
      inline: false
    }
  };
  const processed = csswring.wring(input, opts);
  const expected = postcss().process(input, opts);

  test.expect(2);

  test.strictEqual(processed.css, expected.css);

  test.deepEqual(processed.map, expected.map);

  test.done();
};

exports["Option: preserveHacks"] = test => {
  let expected = ".hacks{_color:red}";
  const input = expected;
  const opts = {
    preserveHacks: true
  };

  test.expect(3);

  test.strictEqual(csswring.wring(input, opts).css, expected);

  expected = postcss([csswring()]).process(input).css;
  test.notStrictEqual(postcss([csswring(opts)]).process(input).css, expected);

  expected = "";
  test.strictEqual(csswring.wring(input).css, expected);

  test.done();
};

exports["Option: removeAllComments"] = test => {
  let expected = ".foo{display:block}\n/*# sourceMappingURL=to.css.map */";
  const input =
    "/*!comment*/.foo{display:block}\n/*# sourceMappingURL=to.css.map */";
  const opts = {
    map: {
      inline: false
    },
    removeAllComments: true
  };

  test.expect(3);

  test.strictEqual(csswring.wring(input, opts).css, expected);

  expected = postcss([csswring(opts)]).process(input).css;
  test.notStrictEqual(postcss([csswring()]).process(input).css, expected);

  opts.removeAllComments = false;
  expected = input;
  test.strictEqual(csswring.wring(input, opts).css, expected);

  test.done();
};

exports["Real CSS"] = test => {
  const testCases = fs.readdirSync(path.join(__dirname, "fixtures"));
  const loadExpected = file =>
    fs.readFileSync(path.join(__dirname, "expected", file), "utf8").trim();
  const loadInput = file =>
    fs.readFileSync(path.join(__dirname, "fixtures", file), "utf8");

  test.expect(testCases.length);

  testCases.forEach(testCase => {
    const opts = {};

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
