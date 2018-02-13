const color = require("./lib/color");
const list = require("postcss/lib/list");
const onecolor = require("onecolor");
const pkg = require("./package.json");
const postcss = require("postcss");
const re = require("./lib/regexp");
const unit = require("./lib/unit");

// Check comment is a source map annotation or not
const isSourceMapAnnotation = comment => {
  if (
    comment.parent.type === "root" &&
    comment.parent.last === comment &&
    comment.text.toLowerCase().indexOf("# sourcemappingurl=") === 0
  ) {
    return true;
  }

  return false;
};

// Set quotation mark
const setQuote = quote => {
  if (!quote) {
    return '"';
  }

  return quote;
};

// Check string can unquote or not
const canUnquote = str => {
  const firstChar = str.slice(0, 1);

  if (re.number.test(firstChar)) {
    return false;
  }

  const secondChar = str.slice(1, 2);

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
};

// Unquote font family name if possible
const unquoteFontFamily = family => {
  if (family.match(re.varFunction)) {
    return family;
  }

  let newFamily = family.replace(re.quotedString, "$2");
  const quote = setQuote(RegExp.$1);

  if (!list.space(newFamily).every(canUnquote)) {
    newFamily = `${quote}${newFamily}${quote}`;
  }

  return newFamily;
};

// Convert colors to HEX or `rgba()` notation
const toRGBColor = (m, leading, c) => {
  const co = onecolor(c);

  /* istanbul ignore if  */
  // Return unmodified value when `one.color` failed to parse `c`
  if (!co) {
    return m;
  }

  if (co.alpha() < 1) {
    return `${leading}${co.cssa()}`;
  }

  return `${leading}${co.hex()} `;
};

// Convert to shortest color
const toShortestColor = (m, leading, r1, r2, g1, g2, b1, b2) => {
  let c = `#${r1}${r2}${g1}${g2}${b1}${b2}`;

  if (r1 === r2 && g1 === g2 && b1 === b2) {
    c = `#${r1}${g1}${b1}`;
  }

  if (color.shortest.hasOwnProperty(c)) {
    c = color.shortest[c];
  }

  return `${leading}${c.toLowerCase()}`;
};

// Remove unit from 0 length and 0 percentage if possible
const removeUnitOfZero = (
  preserveHacks,
  prop,
  m,
  leading,
  num,
  u,
  position,
  value
) => {
  if (
    prop === "flex" ||
    prop === "-ms-flex" ||
    prop === "-webkit-flex" ||
    prop === "flex-basis" ||
    prop === "-webkit-flex-basis" ||
    value.indexOf("calc(") !== -1 ||
    prop.startsWith("--") ||
    (preserveHacks && prop === "min-width" && u === "%")
  ) {
    return m;
  }

  if (unit.forZero.hasOwnProperty(u)) {
    return `${leading}${num}${unit.forZero[u]}`;
  }

  return `${leading}${num}`;
};

// Convert to shortest time
const toShortestTime = (m, leading, n) =>
  `${leading}${(parseInt(n, 10) / 100).toString().replace(/^0+/, "")}s`;

// Convert to shortest angle
const toShortestAngle = (m, leading, n, u) => {
  const num = parseInt(n, 10);

  if (Number.isInteger(num / 10)) {
    return `${leading}${num * (360 / 400)}deg`;
  }

  return `${leading}${num}${u}`;
};

// Unquote inside `url()` notation if possible
const unquoteURL = (m, leading, u) => {
  let url = u.replace(re.quotedString, "$2");
  const quote = setQuote(RegExp.$1);

  url = url.replace(re.escapedBraces, "$1");

  if (re.urlNeedQuote.test(url)) {
    url = `${quote}${url}${quote}`;
  }

  return `${leading}url(${url})`;
};

// Remove white spaces inside `calc()` notation
const removeCalcWhiteSpaces = (m, leading, calc) =>
  `${leading}calc(${calc.replace(re.whiteSpacesBothEndsOfSymbol, "$1")})`;

// Wring value of declaration
const wringValue = (preserveHacks, prop, value) =>
  value
    .replace(re.colorFunction, toRGBColor)
    .replace(re.colorHex, toShortestColor)
    .replace(re.colorTransparent, "$1transparent ")
    .trim()
    .replace(re.whiteSpaces, " ")
    .replace(re.whiteSpacesAfterSymbol, "$1")
    .replace(re.whiteSpacesBeforeSymbol, "$1")
    .replace(re.numberLeadingZeros, "$1$2")
    .replace(re.zeroValueUnit, removeUnitOfZero.bind(null, preserveHacks, prop))
    .replace(re.decimalWithZeros, "$1$2$3.$4")
    .replace(re.timeEndsWithZero, toShortestTime)
    .replace(re.angle, toShortestAngle)
    .replace(re.freqEndsWithThreeZeros, "$1$2kHz")
    .replace(re.urlFunction, unquoteURL)
    .replace(re.calcFunction, removeCalcWhiteSpaces);

// Unquote attribute selector if possible
const unquoteAttributeSelector = (m, att, con, val, oq, f) => {
  if (!con || !val) {
    return `[${att}]`;
  }

  let value = val.trim().replace(re.quotedString, "$2");
  const quote = setQuote(RegExp.$1);

  if (!canUnquote(value)) {
    value = `${quote}${value}${quote}`;
  }

  let flag = f;

  if (!flag) {
    flag = "";
  }

  if (flag && !value.startsWith(quote)) {
    flag = ` ${flag}`;
  }

  return `[${att}${con}${value}${flag}]`;
};

// Remove white spaces from string
const removeWhiteSpaces = string => string.replace(re.whiteSpaces, "");

// Remove white spaces from both ends of `:not()`
const trimNegationFunction = (m, not) => `:not(${not.trim()})`;

// Remove white spaces around `>`, `+`, and `~`, but not `\>`, `\+`, and `\~`
const trimSelectorCombinator = (m, combinator, backslash) => {
  if (backslash) {
    return ` ${combinator} `;
  }

  return combinator;
};

// Wring selector of ruleset
const wringSelector = selector =>
  selector
    .replace(re.whiteSpaces, " ")
    .replace(re.selectorAtt, unquoteAttributeSelector)
    .replace(re.selectorFunctions, removeWhiteSpaces)
    .replace(re.selectorNegationFunction, trimNegationFunction)
    .replace(re.selectorCombinators, trimSelectorCombinator)
    .replace(re.selectorPseudoElements, "$1")
    .replace(re.selectorVerboseUniversal, "$1");

// Check keyframe is valid or not
const isValidKeyframe = k => {
  if (k === "from" || k === "to") {
    return true;
  }

  const keyframe = parseFloat(k);

  if (!isNaN(keyframe) && keyframe >= 0 && keyframe <= 100) {
    return true;
  }

  return false;
};

// Unique array element
const uniqueArray = array => {
  const l = array.length;
  const result = [];

  for (let i = 0; i < l; i = i + 1) {
    const value = array[i];

    if (result.indexOf(value) < 0) {
      result.push(value);
    }
  }

  return result;
};

// Remove duplicate declaration
const removeDuplicateDeclaration = (decls, decl) => {
  const d = `${decl.raws.before}${decl.prop}${decl.raws.between}${decl.value}`;

  if (decls.hasOwnProperty(d)) {
    decls[d].remove();
  }

  decls[d] = decl;
};

// Check required `@font-face` descriptor or not
const isRequiredFontFaceDescriptor = decl => {
  const { prop } = decl;

  return prop === "src" || prop === "font-family";
};

// Remove `@font-face` descriptor with default value
const removeDefaultFontFaceDescriptor = decl => {
  const { prop, value } = decl;

  if (
    (re.descriptorFontFace.test(prop) && value === "normal") ||
    (prop === "unicode-range" && re.unicodeRangeDefault.test(value)) ||
    `${prop}${value}` === "font-weight400"
  ) {
    decl.remove();
  }
};

// Quote `@import` URL
const quoteImportURL = (m, quote, url) => {
  const newQuote = setQuote(quote);

  return `${newQuote}${url}${newQuote}`;
};

// Quote `@namespace` URL
const quoteNamespaceURL = (param, index, params) => {
  if (param !== params[params.length - 1]) {
    return param;
  }

  const newParam = param.replace(re.quotedString, "$2");
  const quote = setQuote(RegExp.$1);

  return `${quote}${newParam}${quote}`;
};

// Wring comment
const wringComment = (removeAllComments, comment) => {
  if (
    (removeAllComments || comment.text.indexOf("!") !== 0) &&
    !isSourceMapAnnotation(comment)
  ) {
    comment.remove();

    return;
  }

  comment.raws.before = "";
};

// Wring declaration
const wringDecl = (preserveHacks, decl) => {
  const { prop } = decl;

  let { before, between } = decl.raws;
  let { value } = decl;

  if (!prop.match(re.validProp)) {
    decl.remove();

    return;
  }

  if (
    !preserveHacks &&
    ((before && before.match(re.hackSignProp) !== null) ||
      (between && between.match(re.hackPropComment) !== null))
  ) {
    decl.remove();

    return;
  }

  if (preserveHacks && before) {
    before = before.replace(re.semicolons, "").replace(re.whiteSpaces, "");
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
    decl.value = list
      .comma(value)
      .map(unquoteFontFamily)
      .join(",");

    return;
  }

  let values = list.comma(value);

  value = values.map(wringValue.bind(null, preserveHacks, prop)).join(",");

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
};

// Wring declaration like string
const wringDeclLike = (m, prop, value) => {
  const decl = postcss.decl({
    prop: prop,
    value: value
  });

  wringDecl.call(null, false, decl);

  return `(${decl.toString()})`;
};

// Wring ruleset
const wringRule = rule => {
  rule.raws.before = "";
  rule.raws.between = "";
  rule.raws.semicolon = false;
  rule.raws.after = "";

  if (rule.nodes.length === 0 || rule.selector === "") {
    rule.remove();

    return;
  }

  const { parent } = rule;
  let selectors = rule.selectors.map(wringSelector);

  if (parent.type === "atrule" && parent.name === "keyframes") {
    selectors = selectors.filter(isValidKeyframe);

    if (selectors.length === 0) {
      rule.remove();

      return;
    }
  }

  rule.selector = uniqueArray(selectors).join(",");
  const decls = {};

  rule.each(removeDuplicateDeclaration.bind(null, decls));
};

// Filter at-rule
const filterAtRule = (flag, rule) => {
  const { name, type } = rule;

  if (type === "comment") {
    return;
  }

  if (type !== "atrule" || (name !== "charset" && name !== "import")) {
    flag.filter = true;

    return;
  }

  if (name === "charset" && !flag.charset) {
    flag.charset = true;

    return;
  }

  if (flag.filter || (name === "charset" && flag.charset)) {
    rule.remove();
  }
};

// Wring at-rule
const wringAtRule = atRule => {
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

  let params = atRule.params
    .replace(re.whiteSpaces, " ")
    .replace(re.whiteSpacesAfterSymbol, "$1")
    .replace(re.whiteSpacesBeforeSymbol, "$1");

  if (atRule.name === "import") {
    params = params
      .replace(re.urlFunction, "$1$2")
      .replace(re.quotedString, quoteImportURL);
  }

  if (atRule.name === "namespace") {
    params = list
      .space(params.replace(re.urlFunction, "$1$2"))
      .map(quoteNamespaceURL)
      .join("");
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
    params.indexOf('"') === 0 ||
    params.indexOf("'") === 0
  ) {
    atRule.raws.afterName = "";
  }
};

module.exports = postcss.plugin(pkg.name, options => {
  const opts = {
    preserveHacks: false,
    removeAllComments: false,
    ...options
  };

  return css => {
    css.raws.semicolon = false;
    css.raws.after = "";
    css.walkComments(wringComment.bind(null, opts.removeAllComments));
    css.walkDecls(wringDecl.bind(null, opts.preserveHacks));
    css.walkRules(wringRule);
    css.each(
      filterAtRule.bind(null, {
        charset: false,
        filter: false
      })
    );
    css.walkAtRules(wringAtRule);
  };
});

module.exports.wring = function(css, opts) {
  return postcss([this(opts)]).process(css, opts);
};

/* eslint no-param-reassign: [ "error", { "props": true, "ignorePropertyModificationsFor": [ "decls", "comment", "decl", "rule", "flag", "atRule", "css" ] } ] */
