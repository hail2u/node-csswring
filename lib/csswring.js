'use strict';

var list = require('postcss/lib/list');
var postcss = require('postcss');
var onecolor = require('onecolor');

var shortColors = require('./color_keywords').short;

var _reColorFunction = /(^|\s|\(|,)((?:rgb|hsl)a?\s*\(\s*(?:[\d.]+%?(?:\s*,\s*|\s*\))){3,4})/gi;
var _reColorHex = /(^|\s|\(|,)#([0-9a-f])([0-9a-f])([0-9a-f])([0-9a-f])([0-9a-f])([0-9a-f])/gi;
var _reColorTransparent = /(^|\s|\(|,)rgba\(0,0,0,0\)/gi;
var _reDecimalWithZero = /(^|\s|\(|,)(-)?0*([1-9]\d*)?\.(\d*[1-9])0*/g;
var _reDescriptorFontFace = /^font-(style|stretch|variant|feature-settings)$/i;
var _reLeadingZeros = /(^|\s|\(|,)0+([1-9]\d*(\.\d+)?)/g;
var _reNotIdentifier = /([\x21-\x2c\x2e\x2f\x3a-\x40\x5b-\x5e\x60\x7b-\x9f]|^([0-9]|-(-|[0-9])))/;
var _rePropertyMultipleValues = /^(margin|padding|border-(color|radius|spacing|style|width))$/i;
var _reQuotedString = /("|')?(.*)\1/;
var _reSelectorCombinators = /\s*(\\?[>+~])\s*/g;
var _reUrlFunction = /(^|\s|\(|,)url\s*\(\s*(.*?)\s*\)/gi;
var _reWhiteSpaces = /\s+/g;
var _reZeroValueUnit = /(^|\s|\(|,)(0)(%|em|ex|ch|rem|vw|vh|vmin|vmax|cm|mm|in|pt|pc|px)/gi;

// Check string is identifier or not
var _isNotIdentifier = function (str) {
  return _reNotIdentifier.test(str);
};

// Unquote font family name if possible
var _unquoteFontFamily = function (family) {
  family = family.replace(_reQuotedString, '$2');
  var quote = RegExp.$1 || '"';

  if (list.space(family).some(_isNotIdentifier)) {
    family = quote + family + quote;
  }

  return family;
};

// Convert colors to HEX or `rgba()` notation
var _toRGBColor = function (m, leading, color) {
  color = onecolor(color);

  if (color.alpha() < 1) {
    return leading + color.cssa();
  }

  return leading + color.hex();
};

// Convert to shortest color
var _toShortestColor = function (m, leading, r1, r2, g1, g2, b1, b2) {
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
var _unquoteUrl = function (m, leading, url) {
  url = url.replace(_reQuotedString, '$2');
  var quote = RegExp.$1 || '"';

  if (!/^[\x21-\x7d]+$/.test(url)) {
    url = quote + url + quote;
  }

  return leading + 'url(' + url + ')';
};

// Remove duplicate declaration
var decls = {};
var _removeDuplicateDeclaration = function (decl, index) {
  var d = decl.before + decl.prop + decl.between + decl.value;

  if (decls.hasOwnProperty(d)) {
    decl.parent.remove(decls[d]);
  }

  decls[d] = index;
};

// Remove `@font-face` descriptor with default value
var _removeDefaultFontFaceDescriptor = function (decl, index) {
  var prop = decl.prop;
  var value = decl.value;

  if (
    (_reDescriptorFontFace.test(prop) && value === 'normal') ||
    prop + value === 'font-weight400'
  ) {
    decl.parent.remove(index);
  }
};

// Quote `@import` URL
var _quoteImportURL = function (m, quote, url) {
  if (!quote) {
    quote = '"';
  }

  return quote + url + quote;
};

// Quote `@namespace` URL
var _quoteNamespaceURL = function (param, index, p) {
  if (param === p[p.length -1]) {
    param = param.replace(_reQuotedString, '$2');
    var quote = RegExp.$1 || '"';
    param = quote + param + quote;
  }

  return param;
};

// Wring comment
var _wringComment = function (comment) {
  if (
    (this.removeAllComments || comment.text.indexOf('!') !== 0) &&
    comment.text.indexOf('#') !== 0
  ) {
    comment.removeSelf();

    return;
  }

  comment.before = '';
};

// Wring value of declaration
var _wringValue = function (value) {
  value = value.replace(_reWhiteSpaces, ' ');
  value = value.replace(_reColorFunction, _toRGBColor);
  value = value.replace(_reColorHex, _toShortestColor);
  value = value.replace(_reColorTransparent, '$1transparent');
  value = value.replace(_reLeadingZeros, '$1$2');
  value = value.replace(_reZeroValueUnit, '$1$2');
  value = value.replace(_reDecimalWithZero, '$1$2$3.$4');
  value = value.replace(_reUrlFunction, _unquoteUrl);
  value = value.replace(/([(,])\s/g, '$1');
  value = value.replace(/\s([),])/g, '$1');

  return value;
};

// Wring declaration
var _wringDecl = function (decl) {
  delete decl._value;

  if (this.preserveHacks && decl.before) {
    decl.before = decl.before.replace(/[;\s]/g, '');
  } else {
    decl.before = '';
  }

  if (this.preserveHacks && decl.between) {
    decl.between = decl.between.replace(_reWhiteSpaces, '');
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
    decl.value = list.comma(value).map(_unquoteFontFamily).join(',');

    return;
  }

  var values = list.comma(value);
  value = values.map(_wringValue).join(',');

  if (_rePropertyMultipleValues.test(prop)) {
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
var _wringRule = function (rule) {
  delete rule._selector;
  rule.before = '';
  rule.between = '';
  rule.semicolon = false;
  rule.after = '';

  if (rule.decls.length === 0) {
    rule.removeSelf();

    return;
  }

  var selector = rule.selectors.join(',');
  selector = selector.replace(_reWhiteSpaces, ' ');
  selector = selector.replace(_reSelectorCombinators, '$1');
  rule.selector = selector;
  decls = {};
  rule.each(_removeDuplicateDeclaration);
};

// Wring at-rule
var _wringAtRule = function (atRule) {
  delete atRule._params;
  atRule.before = '';
  atRule.afterName = ' ';
  atRule.between = '';
  atRule.semicolon = false;
  atRule.after = '';

  if (atRule.name === 'charset') {
    atRule.removeSelf();
    var first = atRule.parent.first;

    if (first.type !== 'arule' && first.name !== 'charset') {
      atRule.parent.prepend(atRule);
    }

    return;
  }

  if (atRule.name === 'font-face') {
    atRule.each(_removeDefaultFontFaceDescriptor);
  }

  if (
    (atRule.rules && atRule.rules.length === 0) ||
    (atRule.decls && atRule.decls.length === 0)
  ) {
    atRule.removeSelf();

    return;
  }

  var params = atRule.params;
  params = params.replace(_reWhiteSpaces, ' ');
  params = params.replace(/([(,:])\s/g, '$1');
  params = params.replace(/\s([),:])/g, '$1');

  if (atRule.name === 'import') {
    params = params.replace(_reUrlFunction, '$1$2');
    params = params.replace(_reQuotedString, _quoteImportURL);
  }

  if (atRule.name === 'namespace') {
    params = params.replace(_reUrlFunction, '$1$2');
    params = list.space(params).map(_quoteNamespaceURL).join('');
  }

  if (atRule.name === 'keyframes') {
    params = params.replace(_reQuotedString, '$2');
  }

  atRule.params = params;

  if (
    !atRule.params ||
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
  css.eachComment(_wringComment.bind(this));
  css.eachDecl(_wringDecl.bind(this));
  css.eachRule(_wringRule.bind(this));
  css.eachAtRule(_wringAtRule.bind(this));

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
