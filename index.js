"use strict";

const color = require("./lib/color");
const list = require("postcss/lib/list");
const onecolor = require("onecolor");
const pkg = require("./package.json");
const postcss = require("postcss");
const re = require("./lib/regexp");
const unit = require("./lib/unit");

// Check comment is a source map annotation or not
function isSourceMapAnnotation(comment) {
  if (
    comment.parent.type === "root" &&
    comment.parent.last === comment &&
    comment.text.toLowerCase().indexOf("# sourcemappingurl=") === 0
  ) {
    return true;
  }

  return false;
}

// Set quotation mark
function setQuote(quote) {
  if (!quote) {
    quote = "\"";
  }

  return quote;
}

// Check string can unquote or not
function canUnquote(str) {
  const firstChar = str.slice(0, 1);
  let secondChar;

  if (re.number.test(firstChar)) {
    return false;
  }

  secondChar = str.slice(1, 2);

  if (
    firstChar === "-" &&
    (secondChar === "-" || secondChar === "" || re.number.test(secondChar))
  ) {
    return false;
  }

  if (re.sequenceOfIdentifiers.test(str)) {
    return true;
  }

  return false;
}

// Unquote font family name if possible
function unquoteFontFamily(family) {
  let quote;

  if (family.match(re.varFunction)) {
    return family;
  }

  family = family.replace(re.quotedString, "$2");
  quote = setQuote(RegExp.$1);

  if (!list.space(family).every(canUnquote)) {
    family = `${quote}${family}${quote}`;
  }

  return family;
}

// Convert colors to HEX or `rgba()` notation
function toRGBColor(m, leading, c) {
  c = onecolor(c);

  /* istanbul ignore if  */
  // Return unmodified value when `one.color` failed to parse `c`
  if (!c) {
    return m;
  }

  if (c.alpha() < 1) {
    return `${leading}${c.cssa()}`;
  }

  return `${leading}${c.hex()} `;
}

// Convert to shortest color
function toShortestColor(m, leading, r1, r2, g1, g2, b1, b2) {
  let c = `#${r1}${r2}${g1}${g2}${b1}${b2}`;

  if (r1 === r2 && g1 === g2 && b1 === b2) {
    c = `#${r1}${g1}${b1}`;
  }

  if (color.shortest.hasOwnProperty(c)) {
    c = color.shortest[c];
  }

  return `${leading}${c.toLowerCase()}`;
}

// Remove unit from 0 length and 0 percentage if possible
function removeUnitOfZero(prop, m, leading, num, u, position, value) {
  if (
    prop === "flex" ||
    prop === "-ms-flex" ||
    prop === "-webkit-flex" ||
    prop === "flex-basis" ||
    prop === "-webkit-flex-basis" ||
    value.indexOf("calc(") !== -1
  ) {
    return m;
  }

  if (unit.forZero.hasOwnProperty(u)) {
    num = `${num}${unit.forZero[u]}`;
  }

  return `${leading}${num}`;
}

// Convert to shortest time
function toShortestTime(m, leading, n) {
  return `${leading}${(parseInt(n, 10) / 100).toString().replace(/^0+/, "")}s`;
}

// Convert to shortest angle
function toShortestAngle(m, leading, n, u) {
  n = parseInt(n, 10);

  if (Number.isInteger(n / 10)) {
    return `${leading}${(n * (360 / 400))}deg`;
  }

  return `${leading}${n}${u}`;
}

// Unquote inside `url()` notation if possible
function unquoteURL(m, leading, url) {
  let quote;

  url = url.replace(re.quotedString, "$2");
  quote = setQuote(RegExp.$1);
  url = url.replace(re.escapedBraces, "$1");

  if (re.urlNeedQuote.test(url)) {
    url = `${quote}${url}${quote}`;
  }

  return `${leading}url(${url})`;
}

// Remove white spaces inside `calc()` notation
function removeCalcWhiteSpaces(m, leading, calc) {
  return `${leading}calc(${calc.replace(
    re.whiteSpacesBothEndsOfSymbol,
    "$1"
  )})`;
}

// Wring value of declaration
function wringValue(prop, value) {
  return value.replace(
    re.colorFunction,
    toRGBColor
  ).replace(
    re.colorHex,
    toShortestColor
  ).replace(
    re.colorTransparent,
    "$1transparent "
  ).trim().replace(
    re.whiteSpaces,
    " "
  ).replace(
    re.whiteSpacesAfterSymbol,
    "$1"
  ).replace(
    re.whiteSpacesBeforeSymbol,
    "$1"
  ).replace(
    re.numberLeadingZeros,
    "$1$2"
  ).replace(
    re.zeroValueUnit,
    removeUnitOfZero.bind(null, prop)
  ).replace(
    re.decimalWithZeros,
    "$1$2$3.$4"
  ).replace(
    re.timeEndsWithZero,
    toShortestTime
  ).replace(
    re.angle,
    toShortestAngle
  ).replace(
    re.freqEndsWithThreeZeros,
    "$1$2kHz"
  ).replace(
    re.urlFunction,
    unquoteURL
  ).replace(
    re.calcFunction,
    removeCalcWhiteSpaces
  );
}

// Unquote attribute selector if possible
function unquoteAttributeSelector(m, att, con, val) {
  let quote;

  if (!con || !val) {
    return `[${att}]`;
  }

  val = val.trim().replace(re.quotedString, "$2");
  quote = setQuote(RegExp.$1);

  if (!canUnquote(val)) {
    val = `${quote}${val}${quote}`;
  }

  return `[${att}${con}${val}]`;
}

// Remove white spaces from string
function removeWhiteSpaces(string) {
  return string.replace(re.whiteSpaces, "");
}

// Remove white spaces from both ends of `:not()`
function trimNegationFunction(m, not) {
  return `:not(${  not.trim()  })`;
}

// Remove white spaces around `>`, `+`, and `~`, but not `\>`, `\+`, and `\~`
function trimSelectorCombinator(m, combinator, backslash) {
  if (backslash) {
    return ` ${  combinator  } `;
  }

  return combinator;
}

// Wring selector of ruleset
function wringSelector(selector) {
  return selector.replace(
    re.whiteSpaces,
    " "
  ).replace(
    re.selectorAtt,
    unquoteAttributeSelector
  ).replace(
    re.selectorFunctions,
    removeWhiteSpaces
  ).replace(
    re.selectorNegationFunction,
    trimNegationFunction
  ).replace(
    re.selectorCombinators,
    trimSelectorCombinator
  ).replace(
    re.selectorPseudoElements,
    "$1"
  ).replace(
    re.selectorVerboseUniversal,
    "$1"
  );
}

// Check keyframe is valid or not
function isValidKeyframe(keyframe) {
  if (keyframe === "from" || keyframe === "to") {
    return true;
  }

  keyframe = parseFloat(keyframe);

  if (!isNaN(keyframe) && keyframe >= 0 && keyframe <= 100) {
    return true;
  }

  return false;
}

// Unique array element
function uniqueArray(array) {
  let i;
  let l;
  const result = [];
  let value;

  for (i = 0, l = array.length; i < l; i++) {
    value = array[i];

    if (result.indexOf(value) < 0) {
      result.push(value);
    }
  }

  return result;
}

// Remove duplicate declaration
function removeDuplicateDeclaration(decls, decl) {
  const d = `${decl.raws.before}${decl.prop}${decl.raws.between}${decl.value}`;

  if (decls.hasOwnProperty(d)) {
    decls[d].remove();
  }

  decls[d] = decl;
}

// Check required `@font-face` descriptor or not
function isRequiredFontFaceDescriptor(decl) {
  const prop = decl.prop;

  return (prop === "src") || (prop === "font-family");
}

// Remove `@font-face` descriptor with default value
function removeDefaultFontFaceDescriptor(decl) {
  const prop = decl.prop;
  const value = decl.value;

  if (
    (re.descriptorFontFace.test(prop) && value === "normal") ||
    (prop === "unicode-range" && re.unicodeRangeDefault.test(value)) ||
    `${prop}${value}` === "font-weight400"
  ) {
    decl.remove();
  }
}

// Quote `@import` URL
function quoteImportURL(m, quote, url) {
  quote = setQuote(quote);

  return `${quote}${url}${quote}`;
}

// Quote `@namespace` URL
function quoteNamespaceURL(param, index, p) {
  let quote;

  if (param === p[p.length - 1]) {
    param = param.replace(re.quotedString, "$2");
    quote = setQuote(RegExp.$1);
    param = `${quote}${param}${quote}`;
  }

  return param;
}

// Wring comment
function wringComment(removeAllComments, comment) {
  if (
    (removeAllComments || comment.text.indexOf("!") !== 0) &&
    !isSourceMapAnnotation(comment)
  ) {
    comment.remove();

    return;
  }

  comment.raws.before = "";
}

// Wring declaration
function wringDecl(preserveHacks, decl) {
  const prop = decl.prop;

  let before = decl.raws.before;
  let between = decl.raws.between;
  let value = decl.value;
  let values;

  if (!prop.match(re.validProp)) {
    decl.remove();

    return;
  }

  if (
    !preserveHacks &&
    (
      (before && before.match(re.hackSignProp) !== null) ||
      (between && between.match(re.hackPropComment) !== null)
    )
  ) {
    decl.remove();

    return;
  }

  if (preserveHacks && before) {
    before = before.replace(
      re.semicolons,
      ""
    ).replace(
      re.whiteSpaces,
      ""
    );
  } else {
    before = "";
  }

  decl.raws.before = before;

  if (preserveHacks && between) {
    between = between.replace(re.whiteSpaces, "");
  } else {
    between = ":";
  }

  decl.raws.between = between;

  if (decl.important) {
    decl.raws.important = "!important";
  }

  if (decl.raws.value) {
    decl.raws.value = decl.raws.value.raw.trim();
  }

  if (prop === "content") {
    return;
  }

  if (prop === "font-family") {
    decl.value = list.comma(value).map(unquoteFontFamily).join(",");

    return;
  }

  values = list.comma(value);
  value = values.map(wringValue.bind(null, prop)).join(",");

  if (re.propertyMultipleValues.test(prop)) {
    values = list.space(value);

    if (values.length === 4 && values[1] === values[3]) {
      values.splice(3, 1);
    }

    if (values.length === 3 && values[0] === values[2]) {
      values.splice(2, 1);
    }

    if (values.length === 2 && values[0] === values[1]) {
      values.splice(1, 1);
    }

    value = values.join(" ");
  }

  if (prop === "font-weight") {
    if (value === "normal") {
      value = "400";
    } else if (value === "bold") {
      value = "700";
    }
  }

  decl.value = value;
}

// Wring declaration like string
function wringDeclLike(m, prop, value) {
  const decl = postcss.decl({
    prop: prop,
    value: value
  });

  wringDecl.call(null, false, decl);

  return `(${  decl.toString()  })`;
}

// Wring ruleset
function wringRule(rule) {
  let decls;
  let parent;
  let selectors;

  rule.raws.before = "";
  rule.raws.between = "";
  rule.raws.semicolon = false;
  rule.raws.after = "";

  if (rule.nodes.length === 0 || rule.selector === "") {
    rule.remove();

    return;
  }

  parent = rule.parent;
  selectors = rule.selectors.map(wringSelector);

  if (parent.type === "atrule" && parent.name === "keyframes") {
    selectors = selectors.filter(isValidKeyframe);

    if (selectors.length === 0) {
      rule.remove();

      return;
    }
  }

  rule.selector = uniqueArray(selectors).join(",");
  decls = {};
  rule.each(removeDuplicateDeclaration.bind(null, decls));
}

// Filter at-rule
function filterAtRule(flag, rule) {
  const name = rule.name;
  const type = rule.type;

  if (type === "comment") {
    return;
  }

  if (
    type !== "atrule" ||
    (name !== "charset" && name !== "import")
  ) {
    flag.filter = true;

    return;
  }

  if (name === "charset" && !flag.charset) {
    flag.charset = true;

    return;
  }

  if (flag.filter || (name === "charset" && flag.charset)) {
    rule.remove();

    return;
  }
}

// Wring at-rule
function wringAtRule(atRule) {
  let params;

  atRule.raws.before = "";
  atRule.raws.afterName = " ";
  atRule.raws.between = "";
  atRule.raws.semicolon = false;
  atRule.raws.after = "";

  if (!atRule.params) {
    atRule.params = "";
  }

  if (atRule.name === "charset") {
    return;
  }

  if (atRule.name === "font-face") {
    if (atRule.nodes.filter(isRequiredFontFaceDescriptor).length < 2) {
      atRule.remove();

      return;
    }

    atRule.each(removeDefaultFontFaceDescriptor);
  }

  if (atRule.nodes && atRule.nodes.length === 0) {
    atRule.remove();

    return;
  }

  params = atRule.params.replace(
    re.whiteSpaces,
    " "
  ).replace(
    re.whiteSpacesAfterSymbol,
    "$1"
  ).replace(
    re.whiteSpacesBeforeSymbol,
    "$1"
  );

  if (atRule.name === "import") {
    params = params.replace(
      re.urlFunction,
      "$1$2"
    ).replace(
      re.quotedString,
      quoteImportURL
    );
  }

  if (atRule.name === "namespace") {
    params = list.space(
      params.replace(re.urlFunction, "$1$2")
    ).map(quoteNamespaceURL).join("");
  }

  if (atRule.name === "keyframes") {
    params = params.replace(re.quotedString, "$2");
  }

  if (atRule.name === "supports") {
    params = params.replace(re.declInParentheses, wringDeclLike);
  }

  atRule.params = params;

  if (
    atRule.params === "" ||
    params.indexOf("(") === 0 ||
    params.indexOf("\"") === 0 ||
    params.indexOf("'") === 0
  ) {
    atRule.raws.afterName = "";
  }
}

module.exports = postcss.plugin(pkg.name, function (opts) {
  if (!opts) {
    opts = {};
  }

  if (!opts.preserveHacks) {
    opts.preserveHacks = false;
  }

  if (!opts.removeAllComments) {
    opts.removeAllComments = false;
  }

  return function (css) {
    css.raws.semicolon = false;
    css.raws.after = "";
    css.walkComments(wringComment.bind(null, opts.removeAllComments));
    css.walkDecls(wringDecl.bind(null, opts.preserveHacks));
    css.walkRules(wringRule);
    css.each(filterAtRule.bind(null, {
      charset: false,
      filter: false
    }));
    css.walkAtRules(wringAtRule);

    return css;
  };
});

module.exports.wring = function (css, opts) {
  return postcss([
    this(opts)
  ]).process(css, opts);
};
