/*jshint node: true*/
'use strict';

exports.version = '0.0.2';

var postcss = require('postcss');
var onecolor = require('onecolor');


// Declaration
var _rePropString = /^(content|font-family)$/i;
var _rePropTwoZeros = /^(background-position|(-(moz|webkit|o|ms)-)?transform-origin)$/i;
var _reValueZero = /(^|\s)(0)(%|em|ex|ch|rem|vw|vh|vmin|vmax|cm|mm|in|pt|pc|px|deg|grad|rad|turn|s|ms|Hz|kHz|dpi|dpcm|dppx)/gi;
var _reValueSeriesOfZeros = /^0(\s0){1,3}$/;
var _reValueFloatWithZero = /(^|\s)0+\.(\d+)/g;
var _reValueColor = /(?:^|\s)(rgb|hsl)\s*\(\s*([\d.]+%?(\s*,\s*|\s*\))){3}/g;
var _reValueColorHex = /(?:^|\s)#([0-9a-f])([0-9a-f])([0-9a-f])([0-9a-f])([0-9a-f])([0-9a-f])/g;
var _toHex = function (color) {
  return onecolor(color).hex();
};
var _wringHex = function (hex, r1, r2, g1, g2, b1, b2) {
  if (r1 === r2 && g1 === g2 && b1 === b2) {
    hex = '#' + r1 + g1 + b1;
  }

  return hex;
};

var _wringDecl = function (decl) {
  decl.before = '';
  decl.between = ':';
  var value = decl.value;

  if (!_rePropString.test(decl.prop)) {
    value = value.replace(_reValueZero, '$1$2');

    if (!_rePropTwoZeros.test(decl.prop)) {
      value = value.replace(_reValueSeriesOfZeros, '0');
    }

    value = value.replace(_reValueFloatWithZero, '$1.$2');
  }

  value = value.replace(_reValueColor, _toHex);

  value = value.replace(_reValueColorHex, _wringHex);

  decl.value = value;
};


// Ruleset
var _isDecl = function (decl) {
  return (decl.type === 'decl');
};

var _wringRule = function (rule) {
  if (rule.decls.length === 0 || !rule.decls.some(_isDecl)) {
    rule.removeSelf();

    return;
  }

  rule.before = '';
  rule.selector = rule.selectors.join(',');
  rule.between = '';
  rule.semicolon = false;
  rule.after = '';
};


// At-Rule
var _metCharset = false;

var _wringAtRule = function (atRule) {
  if (atRule.name === 'charset') {
    if (_metCharset) {
      atRule.removeSelf();

      return;
    }

    _metCharset = true;
  }

  atRule.before = '';
  atRule.between = '';
  atRule.after = '';
};


// Comment
var _wringComment = function (comment) {
  if (comment.text.indexOf('!') !== 0) {
    comment.removeSelf();

    return;
  }

  comment.before = '';
};


// PostCSS Processor
exports.processor = function (css) {
  css.eachDecl(_wringDecl);
  css.eachRule(_wringRule);
  _metCharset = false;
  css.eachAtRule(_wringAtRule);
  css.eachComment(_wringComment);
  css.after = '';

  return css;
};


// Wring CSS codes
exports.wring = function (css, opts) {
  return postcss().use(this.processor).process(css, opts);
};
