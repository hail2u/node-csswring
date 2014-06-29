/* jshint node: true */
'use strict';

var postcss = require('postcss');
var onecolor = require('onecolor');

// Declaration
var _rePropString = /^(content|font-family)$/i;
var _rePropTwoZeros = /^(background-position|(-(moz|webkit|o|ms)-)?transform-origin)$/i;
var _reValueZero = /(^|\s)(0)(%|em|ex|ch|rem|vw|vh|vmin|vmax|cm|mm|in|pt|pc|px|deg|grad|rad|turn|s|ms|Hz|kHz|dpi|dpcm|dppx)/gi;
var _reValueSeriesOfZeros = /^0(\s0){1,3}$/;
var _reValueFloatWithZero = /(^|\s)0+\.(\d+)/g;
var _reValueColorFunction = /(^|\s)((?:rgb|hsl)\s*\(\s*(?:[\d.]+%?(?:\s*,\s*|\s*\))){3})/g;
var _reValueColorHex = /(^|\s)#([0-9a-f])([0-9a-f])([0-9a-f])([0-9a-f])([0-9a-f])([0-9a-f])/g;
var _toHex = function (m, space, color) {
  return space + onecolor(color).hex();
};
var _wringHex = function (m, space, r1, r2, g1, g2, b1, b2) {
  if (r1 === r2 && g1 === g2 && b1 === b2) {
    m = space + '#' + r1 + g1 + b1;
  }

  return m;
};

var _wringDecl = function (decl) {
  if (this.preserveHacks) {
    decl.before = decl.before.replace(/[;\s]/g, '');
    decl.between = decl.between.replace(/\s/g, '');
  } else {
    decl.before = '';
    decl.between = ':';
  }

  var value = decl.value;

  if (!_rePropString.test(decl.prop)) {
    value = value.replace(_reValueZero, '$1$2');

    if (!_rePropTwoZeros.test(decl.prop)) {
      value = value.replace(_reValueSeriesOfZeros, '0');
    }

    value = value.replace(_reValueFloatWithZero, '$1.$2');
  }

  value = value.replace(_reValueColorFunction, _toHex);
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
var _wringAtRule = function (atRule) {
  if (atRule.name === 'charset') {
    if (this._metCharset) {
      atRule.removeSelf();

      return;
    }

    this._metCharset = true;
  }

  atRule.before = '';
  atRule.between = '';
  atRule.after = '';
};

// Comment
var _wringComment = function (comment) {
  if ((this.removeAllComments || comment.text.indexOf('!') !== 0) && comment.text.indexOf('#') !== 0) {
    comment.removeSelf();

    return;
  }

  comment.before = '';
};

// 
var _bind = function (bThis, bFunc) {
  return function () {
    return bFunc.apply(bThis, arguments);
  };
};

var CSSWring = function (opts) {
  opts = opts || {};
  this.preserveHacks = opts.preserveHacks || false;
  this.removeAllComments = opts.removeAllComments || false;

  // Bind processor to this so it can be passed to postcss with context
  this.postcss = _bind(this, this.postcss);
};

// PostCSS Processor
CSSWring.prototype.postcss = function (css) {
  css.eachDecl(_bind(this, _wringDecl));
  css.eachRule(_bind(this, _wringRule));
  this._metCharset = false;
  css.eachAtRule(_bind(this, _wringAtRule));
  css.eachComment(_bind(this, _wringComment));
  css.after = '';

  return css;
};

// Wring CSS codes
CSSWring.prototype.wring = function (css, opts) {
  return postcss().use(this.postcss).process(css, opts);
};

// 
var csswring = function (opts) {
  opts = opts || {};
  opts.preserveHacks = opts.preserveHacks || csswring.preserveHacks;
  opts.removeAllComments = opts.removeAllComments || csswring.removeAllComments;

  return new CSSWring(opts);
};

// Preserve CSS hacks
csswring.preserveHacks = false;

// Remove all comments
csswring.removeAllComments = false;

// PostCSS Processor
csswring.processor =
csswring.postcss = function (css) {
  return csswring().postcss(css);
};

csswring.wring = function (css, opts) {
  return csswring(opts).wring(css, opts);
};

module.exports = csswring;
