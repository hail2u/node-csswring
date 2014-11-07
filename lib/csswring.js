'use strict';

var list = require('postcss/lib/list');
var postcss = require('postcss');
var onecolor = require('onecolor');

var shortColors = require('./color_keywords').short;

var reCalcFunction = /(^|\s|\(|,)calc\((([^()]*(\([^()]*\))?)*)\)/;
var reColorFunction = /(^|\s|\(|,)((?:rgb|hsl)a?\(.*?\))/gi;
var reColorHEX = /(^|\s|\(|,)#([0-9a-f])([0-9a-f])([0-9a-f])([0-9a-f])([0-9a-f])([0-9a-f])/gi;
var reColorTransparent = /(^|\s|\(|,)rgba\(0,0,0,0\)/gi;
var reDecimalWithZeros = /(^|\s|\(|,)(-)?0*([1-9]\d*)?\.(\d*[1-9])0*/g;
var reDeclInParentheses = /\(([-a-zA-Z]+):(([^()]*(\([^()]*\))?)*)\)/g;
var reDescriptorFontFace = /^font-(style|stretch|variant|feature-settings)$/i;
var reNumber = /\d/;
var reNumberLeadingZeros = /(^|\s|\(|,)0+([1-9]\d*(\.\d+)?)/g;
var rePropertyMultipleValues = /^(margin|padding|border-(color|radius|spacing|style|width))$/i;
var reQuotedString = /("|')?(.*)\1/;
var reSelectorAtt = /\[\s*(.*?)(?:\s*([~|^$*]?=)\s*(.*))?\s*\]/g;
var reSelectorFunctions = /:(lang|nth-(?:last-)?(?:child|of-type))\((.*?[^\\])\)/gi;
var reSelectorNegationFunction = /:not\((([^()]*(\([^()]*\))?)*)\)/gi;
var reSelectorCombinators = /\s*(\\?[>+~])\s*/g;
var reSupportsConjunctions = /\)(and|or)/g;
var reUnicodeRangeDefault = /u\+0{1,6}-10ffff/i;
var reURLFunction = /(^|\s|\(|,)url\((.*?[^\\])\)/gi;
var reURLNeedQuote = /[\s()"']/;
var reWhiteSpaces = /\s+/g;
var reZeroValueUnit = /(^|\s|\(|,)(0)(%|em|ex|ch|rem|vw|vh|vmin|vmax|cm|mm|in|pt|pc|px)/gi;

// Check string can unquote or not
var canUnquote = function (str) {
  var firstChar = str.slice(0, 1);

  if (reNumber.test(firstChar)) {
    return false;
  }

  var secondChar = str.slice(1, 2);

  if (
    firstChar === '-' &&
    (secondChar === '-' || reNumber.test(secondChar))
  ) {
    return false;
  }

  if (/^[\w-]+$/.test(str)) {
    return true;
  }

  return false;
};

// Unquote font family name if possible
var unquoteFontFamily = function (family) {
  family = family.replace(reQuotedString, '$2');
  var quote = RegExp.$1 || '"';

  if (!list.space(family).every(canUnquote)) {
    family = quote + family + quote;
  }

  return family;
};

// Convert colors to HEX or `rgba()` notation
var toRGBColor = function (m, leading, color) {
  color = onecolor(color);

  // one.color failed to parse `color`
  if (!color) {
    return m;
  }

  if (color.alpha() < 1) {
    return leading + color.cssa();
  }

  return leading + color.hex() + ' ';
};

// Convert to shortest color
var toShortestColor = function (m, leading, r1, r2, g1, g2, b1, b2) {
  var color = '#' + r1 + r2 + g1 + g2 + b1 + b2;

  if (r1 === r2 && g1 === g2 && b1 === b2) {
    color = '#' + r1 + g1 + b1;
  }

  if (shortColors.hasOwnProperty(color)) {
    color = shortColors[color];
  }

  return leading + color.toLowerCase();
};

// Unquote inside `url()` notation if possible
var unquoteUrl = function (m, leading, url) {
  url = url.replace(reQuotedString, '$2');
  var quote = RegExp.$1 || '"';

  if (reURLNeedQuote.test(url)) {
    url = quote + url + quote;
  }

  return leading + 'url(' + url + ')';
};

// Remove white spaces inside `calc()` notation
var removeCalcWhiteSpaces = function (m, leading, calc) {
  calc = calc.replace(/\s([*/])\s/g, '$1');

  return leading + 'calc(' + calc + ')';
};

// Wring value of declaration
var wringValue = function (value) {
  value = value.replace(reColorFunction, toRGBColor);
  value = value.replace(reColorHEX, toShortestColor);
  value = value.replace(reColorTransparent, '$1transparent ');
  value = value.trim();
  value = value.replace(reWhiteSpaces, ' ');
  value = value.replace(/([(,])\s/g, '$1');
  value = value.replace(/\s([),])/g, '$1');
  value = value.replace(reNumberLeadingZeros, '$1$2');
  value = value.replace(reZeroValueUnit, '$1$2');
  value = value.replace(reDecimalWithZeros, '$1$2$3.$4');
  value = value.replace(reURLFunction, unquoteUrl);
  value = value.replace(reCalcFunction, removeCalcWhiteSpaces);

  return value;
};

// Unquote attribute selector if possible
var unquoteAttributeSelector = function (m, att, con, val) {
  if (!con) {
    return '[' + att + ']';
  }

  if (!val) {
    return '[' + att + con + ']';
  }

  val = val.trim();
  val = val.replace(reQuotedString, '$2');
  var quote = RegExp.$1 || '"';

  if (!canUnquote(val)) {
    val = quote + val + quote;
  }

  return '[' + att + con + val + ']';
};

// Remove white spaces from string
var removeWhiteSpaces = function (string) {
  return string.replace(reWhiteSpaces, '');
};

// Remove white spaces from both ends of `:not()`
var trimNegationFunction = function (m, not) {
  return ':not(' + not.trim() + ')';
};

// Wring selector of ruleset
var wringSelector = function (selector) {
  selector = selector.replace(reWhiteSpaces, ' ');
  selector = selector.replace(reSelectorAtt, unquoteAttributeSelector);
  selector = selector.replace(reSelectorFunctions, removeWhiteSpaces);
  selector = selector.replace(reSelectorNegationFunction, trimNegationFunction);
  selector = selector.replace(reSelectorCombinators, '$1');

  return selector;
};

// Check keyframe is valid or not
var isValidKeyframe = function (keyframe) {
  if (keyframe === 'from' || keyframe === 'to') {
    return true;
  }

  keyframe = parseFloat(keyframe);

  if (!isNaN(keyframe) && keyframe >= 0 && keyframe <= 100) {
    return true;
  }

  return false;
};

// Unique array element
var uniqueArray = function (array) {
  var result = [];

  for (var i = 0, l = array.length; i < l; i++) {
    var value = array[i];

    if (result.indexOf(value) < 0) {
      result.push(value);
    }
  }

  return result;
};

// Remove duplicate declaration
var removeDuplicateDeclaration = function (decl, index) {
  var d = decl.before + decl.prop + decl.between + decl.value;

  if (this.hasOwnProperty(d)) {
    decl.parent.remove(this[d]);
  }

  this[d] = index;
};

// Get first non-comment rule
var getFirstRule = function (rules) {
  var first = null;
  var i = 0;

  while (first === null) {
    first = rules[i];

    if (first && first.type === 'comment') {
      first = null;
    }

    i++;
  }

  return first;
};

// Check required `@font-face` descriptor or not
var isRequiredFontFaceDescriptor = function (decl, index) {
  var prop = decl.prop;

  return (prop === 'src') || (prop === 'font-family');
};

// Remove `@font-face` descriptor with default value
var removeDefaultFontFaceDescriptor = function (decl, index) {
  var prop = decl.prop;
  var value = decl.value;

  if (
    (reDescriptorFontFace.test(prop) && value === 'normal') ||
    (prop === 'unicode-range' && reUnicodeRangeDefault.test(value)) ||
    prop + value === 'font-weight400'
  ) {
    decl.parent.remove(index);
  }
};

// Quote `@import` URL
var quoteImportURL = function (m, quote, url) {
  if (!quote) {
    quote = '"';
  }

  return quote + url + quote;
};

// Quote `@namespace` URL
var quoteNamespaceURL = function (param, index, p) {
  if (param === p[p.length -1]) {
    param = param.replace(reQuotedString, '$2');
    var quote = RegExp.$1 || '"';
    param = quote + param + quote;
  }

  return param;
};

// Wring declaration like string
var wringDeclLike = function (m, prop, value) {
  var decl = postcss.decl({
    prop: prop,
    value: value
  });
  wringDecl.call({}, decl);

  return '(' + decl.toString() + ')';
};

// Wring comment
var wringComment = function (comment) {
  if (
    (this.removeAllComments || comment.text.indexOf('!') !== 0) &&
    comment.text.indexOf('#') !== 0
  ) {
    comment.removeSelf();

    return;
  }

  comment.before = '';
};

// Wring declaration
var wringDecl = function (decl) {
  delete decl._value;

  if (this.preserveHacks && decl.before) {
    decl.before = decl.before.replace(/[;\s]/g, '');
  } else {
    decl.before = '';
  }

  if (this.preserveHacks && decl.between) {
    decl.between = decl.between.replace(reWhiteSpaces, '');
  } else {
    decl.between = ':';
  }

  if (decl.important) {
    decl._important = '!important';
  }

  var prop = decl.prop;
  var value = decl.value;

  if (prop === 'content') {
    return;
  }

  if (prop === 'font-family') {
    decl.value = list.comma(value).map(unquoteFontFamily).join(',');

    return;
  }

  var values = list.comma(value);
  value = values.map(wringValue).join(',');

  if (rePropertyMultipleValues.test(prop)) {
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

    value = values.join(' ');
  }

  if (prop === 'font-weight') {
    if (value === 'normal') {
      value = '400';
    } else if (value === 'bold') {
      value = '700';
    }
  }

  decl.value = value;
};

// Wring ruleset
var wringRule = function (rule) {
  delete rule._selector;
  rule.before = '';
  rule.between = '';
  rule.semicolon = false;
  rule.after = '';

  if (rule.decls.length === 0 || rule.selector === '') {
    rule.removeSelf();

    return;
  }

  var parent = rule.parent;
  var selectors = rule.selectors.map(wringSelector);

  if (parent.type === 'atrule' && parent.name === 'keyframes') {
    selectors = selectors.filter(isValidKeyframe);

    if (selectors.length === 0) {
      rule.removeSelf();

      return;
    }
  }

  rule.selector = uniqueArray(selectors).join(',');
  var decls = {};
  rule.each(removeDuplicateDeclaration.bind(decls));
};

// Filter at-rule
var filterAtrule = function (rule) {
  var type = rule.type;
  var name = rule.name;

  if (type === 'comment') {
    return;
  }

  if (
    type !== 'atrule' ||
    (name !== 'charset' && name !== 'import')
  ) {
    this.filter = true;

    return;
  }

  if (this.filter) {
    rule.removeSelf();

    return;
  }

  if (name === 'charset' && !this.charset) {
    this.charset = true;

    return;
  }

  if (name === 'charset' && this.charset) {
    rule.removeSelf();

    return;
  }
};

// Wring at-rule
var wringAtRule = function (atRule) {
  delete atRule._params;
  atRule.before = '';
  atRule.afterName = ' ';
  atRule.between = '';
  atRule.semicolon = false;
  atRule.after = '';

  if (!atRule.params) {
    atRule.params = '';
  }

  if (atRule.name === 'charset') {
    return;
  }

  if (atRule.name === 'font-face') {
    if (atRule.decls.filter(isRequiredFontFaceDescriptor).length < 2) {
      atRule.removeSelf();

      return;
    }

    atRule.each(removeDefaultFontFaceDescriptor);
  }

  if (
    (atRule.rules && atRule.rules.length === 0) ||
    (atRule.decls && atRule.decls.length === 0)
  ) {
    atRule.removeSelf();

    return;
  }

  var params = atRule.params;
  params = params.replace(reWhiteSpaces, ' ');
  params = params.replace(/([(),:])\s/g, '$1');
  params = params.replace(/\s([),:])/g, '$1');

  if (atRule.name === 'import') {
    params = params.replace(reURLFunction, '$1$2');
    params = params.replace(reQuotedString, quoteImportURL);
  }

  if (atRule.name === 'namespace') {
    params = params.replace(reURLFunction, '$1$2');
    params = list.space(params).map(quoteNamespaceURL).join('');
  }

  if (atRule.name === 'keyframes') {
    params = params.replace(reQuotedString, '$2');
  }

  if (atRule.name === 'supports') {
    params = params.replace(reDeclInParentheses, wringDeclLike);
    params = params.replace(reSupportsConjunctions, ') $1');
  }

  atRule.params = params;

  if (
    atRule.params === '' ||
    params.indexOf('(') === 0 ||
    params.indexOf('"') === 0 ||
    params.indexOf('\'') === 0
  ) {
    atRule.afterName = '';
  }
};

// CSSWring object
var CSSWring = function (opts) {
  opts = opts || {};
  this.preserveHacks = opts.preserveHacks || false;
  this.removeAllComments = opts.removeAllComments || false;
  this.postcss = this.postcss.bind(this);
};

CSSWring.prototype.postcss = function (css) {
  css.after = '';
  css.eachComment(wringComment.bind(this));
  css.eachDecl(wringDecl.bind(this));
  css.eachRule(wringRule);
  css.each(filterAtrule.bind({}));
  css.eachAtRule(wringAtRule);

  return css;
};

CSSWring.prototype.wring = function (css, opts) {
  return postcss().use(this.postcss).process(css, opts);
};

// CSSWring instance
var csswring = function (opts) {
  // Old interfaces
  opts = opts || {};
  opts.preserveHacks = opts.preserveHacks || csswring.preserveHacks;
  opts.removeAllComments = opts.removeAllComments || csswring.removeAllComments;

  return new CSSWring(opts);
};

csswring.postcss = function (css) {
  return csswring().postcss(css);
};

csswring.wring = function (css, opts) {
  return csswring(opts).wring(css, opts);
};

// Old interfaces
csswring.processor = csswring.postcss;
csswring.preserveHacks = false;
csswring.removeAllComments = false;

module.exports = csswring;
