'use strict';

var csswring;

var list = require('postcss/lib/list');
var onecolor = require('onecolor');
var postcss = require('postcss');
var re = require('./regexp');
var shortColors = require('./color_keywords').short;

// Set quotation mark
var setQuote = function (quote) {
  if (!quote) {
    quote = '"';
  }

  return quote;
};

// Check string can unquote or not
var canUnquote = function (str) {
  var firstChar = str.slice(0, 1);
  var secondChar;

  if (re.number.test(firstChar)) {
    return false;
  }

  secondChar = str.slice(1, 2);

  if (
    firstChar === '-' &&
    (secondChar === '-' || re.number.test(secondChar))
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
  var quote;
  family = family.replace(re.quotedString, '$2');
  quote = setQuote(RegExp.$1);

  if (!list.space(family).every(canUnquote)) {
    family = quote + family + quote;
  }

  return family;
};

// Convert colors to HEX or `rgba()` notation
var toRGBColor = function (m, leading, color) {
  color = onecolor(color);

  /* istanbul ignore if  */
  // Return unmodified value when `one.color` failed to parse `color`
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
var unquoteURL = function (m, leading, url) {
  var quote;
  url = url.replace(re.quotedString, '$2');
  quote = setQuote(RegExp.$1);

  if (re.urlNeedQuote.test(url)) {
    url = quote + url + quote;
  }

  return leading + 'url(' + url + ')';
};

// Remove white spaces inside `calc()` notation
var removeCalcWhiteSpaces = function (m, leading, calc) {
  return leading + 'calc(' + calc.replace(/\s([*/])\s/g, '$1') + ')';
};

// Wring value of declaration
var wringValue = function (value) {
  return value.replace(
    re.colorFunction,
    toRGBColor
  ).replace(
    re.colorHex,
    toShortestColor
  ).replace(
    re.colorTransparent,
    '$1transparent '
  ).trim().replace(
    re.whiteSpaces,
    ' '
  ).replace(
    /([(,])\s/g,
    '$1'
  ).replace(
    /\s([),])/g,
    '$1'
  ).replace(
    re.numberLeadingZeros,
    '$1$2'
  ).replace(
    re.zeroValueUnit,
    '$1$2'
  ).replace(
    re.decimalWithZeros,
    '$1$2$3.$4'
  ).replace(
    re.urlFunction,
    unquoteURL
  ).replace(
    re.calcFunction,
    removeCalcWhiteSpaces
  );
};

// Unquote attribute selector if possible
var unquoteAttributeSelector = function (m, att, con, val) {
  var quote;

  if (!con || !val) {
    return '[' + att + ']';
  }

  val = val.trim().replace(re.quotedString, '$2');
  quote = setQuote(RegExp.$1);

  if (!canUnquote(val)) {
    val = quote + val + quote;
  }

  return '[' + att + con + val + ']';
};

// Remove white spaces from string
var removeWhiteSpaces = function (string) {
  return string.replace(re.whiteSpaces, '');
};

// Remove white spaces from both ends of `:not()`
var trimNegationFunction = function (m, not) {
  return ':not(' + not.trim() + ')';
};

// Wring selector of ruleset
var wringSelector = function (selector) {
  return selector.replace(
    re.whiteSpaces,
    ' '
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
    '$1'
  );
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
  var i;
  var l;
  var result = [];
  var value;

  for (i = 0, l = array.length; i < l; i++) {
    value = array[i];

    if (result.indexOf(value) < 0) {
      result.push(value);
    }
  }

  return result;
};

// Remove duplicate declaration
var removeDuplicateDeclaration = function (decl, index) {
  var declaration    = decl.before + decl.prop + decl.between + decl.value;
  var isDuplicate    = this.hasOwnProperty(declaration);
  var duplicateIndex = this[declaration];

  // take note that this declaration was found at this index
  this[declaration] = index;

  if (!isDuplicate) { return; }

  var indexToRemove = duplicateIndex;

  // this._removals keeps track of data regarding removed declarations.
  //
  // Removing at duplicateIndex is not reliable since siblings indexes
  // can change during an iteration of this function.
  if (this.hasOwnProperty('_removals')) {
    // if this index has been affected by a previous removal, subtract the
    // number of removed declarations from the index
    indexToRemove = duplicateIndex > this._removals.maxIndex ?
      duplicateIndex - this._removals.count : duplicateIndex;
    // increment removal data
    this._removals.count    = this._removals.count + 1;
    this._removals.maxIndex = this._removals.maxIndex + indexToRemove;
  } else {
    this._removals = {
      count:    1,
      maxIndex: duplicateIndex
    };
  }

  decl.parent.remove(indexToRemove);
};

// Check required `@font-face` descriptor or not
var isRequiredFontFaceDescriptor = function (decl) {
  var prop = decl.prop;

  return (prop === 'src') || (prop === 'font-family');
};

// Remove `@font-face` descriptor with default value
var removeDefaultFontFaceDescriptor = function (decl, index) {
  var prop = decl.prop;
  var value = decl.value;

  if (
    (re.descriptorFontFace.test(prop) && value === 'normal') ||
    (prop === 'unicode-range' && re.unicodeRangeDefault.test(value)) ||
    prop + value === 'font-weight400'
  ) {
    decl.parent.remove(index);
  }
};

// Quote `@import` URL
var quoteImportURL = function (m, quote, url) {
  quote = setQuote(quote);

  return quote + url + quote;
};

// Quote `@namespace` URL
var quoteNamespaceURL = function (param, index, p) {
  var quote;

  if (param === p[p.length - 1]) {
    param = param.replace(re.quotedString, '$2');
    quote = setQuote(RegExp.$1);
    param = quote + param + quote;
  }

  return param;
};

// Wring comment
var wringComment = function (removeAllComments, comment) {
  if (
    (removeAllComments || comment.text.indexOf('!') !== 0) &&
    comment.text.indexOf('#') !== 0
  ) {
    comment.removeSelf();

    return;
  }

  comment.before = '';
};

// Wring declaration
var wringDecl = function (preserveHacks, decl) {
  var prop = decl.prop;
  var value = decl.value;
  var values;
  delete decl._value;

  if (preserveHacks && decl.before) {
    decl.before = decl.before.replace(/[;\s]/g, '');
  } else {
    decl.before = '';
  }

  if (preserveHacks && decl.between) {
    decl.between = decl.between.replace(re.whiteSpaces, '');
  } else {
    decl.between = ':';
  }

  if (decl.important) {
    decl._important = '!important';
  }

  if (prop === 'content') {
    return;
  }

  if (prop === 'font-family') {
    decl.value = list.comma(value).map(unquoteFontFamily).join(',');

    return;
  }

  values = list.comma(value);
  value = values.map(wringValue).join(',');

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

// Wring declaration like string
var wringDeclLike = function (m, prop, value) {
  var decl = postcss.decl({
    prop: prop,
    value: value
  });
  wringDecl.call(null, false, decl);

  return '(' + decl.toString() + ')';
};

// Wring ruleset
var wringRule = function (rule) {
  var decls;
  var parent;
  var selectors;
  delete rule._selector;
  rule.before = '';
  rule.between = '';
  rule.semicolon = false;
  rule.after = '';

  if (rule.nodes.length === 0 || rule.selector === '') {
    rule.removeSelf();

    return;
  }

  parent = rule.parent;
  selectors = rule.selectors.map(wringSelector);

  if (parent.type === 'atrule' && parent.name === 'keyframes') {
    selectors = selectors.filter(isValidKeyframe);

    if (selectors.length === 0) {
      rule.removeSelf();

      return;
    }
  }

  rule.selector = uniqueArray(selectors).join(',');
  decls = {};
  rule.each(removeDuplicateDeclaration.bind(decls));
};

// Filter at-rule
var filterAtRule = function (rule) {
  var name = rule.name;
  var type = rule.type;

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

  if (name === 'charset' && !this.charset) {
    this.charset = true;

    return;
  }

  if (this.filter || (name === 'charset' && this.charset)) {
    rule.removeSelf();

    return;
  }
};

// Wring at-rule
var wringAtRule = function (atRule) {
  var params;
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
    if (atRule.nodes.filter(isRequiredFontFaceDescriptor).length < 2) {
      atRule.removeSelf();

      return;
    }

    atRule.each(removeDefaultFontFaceDescriptor);
  }

  if (atRule.nodes && atRule.nodes.length === 0) {
    atRule.removeSelf();

    return;
  }

  params = atRule.params.replace(
    re.whiteSpaces,
    ' '
  ).replace(
    /([(,:])\s/g,
    '$1'
  ).replace(
    /\s([),:])/g,
    '$1'
  );

  if (atRule.name === 'import') {
    params = params.replace(
      re.urlFunction,
      '$1$2'
    ).replace(
      re.quotedString,
      quoteImportURL
    );
  }

  if (atRule.name === 'namespace') {
    params = list.space(
      params.replace(re.urlFunction, '$1$2')
    ).map(quoteNamespaceURL).join('');
  }

  if (atRule.name === 'keyframes') {
    params = params.replace(re.quotedString, '$2');
  }

  if (atRule.name === 'supports') {
    params = params.replace(re.declInParentheses, wringDeclLike);
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
  var preserveHacks = false;
  var removeAllComments = false;

  if (opts && opts.preserveHacks) {
    preserveHacks = opts.preserveHacks;
  }

  if (opts && opts.removeAllComments) {
    removeAllComments = opts.removeAllComments;
  }

  this.postcss = this.postcss.bind(null, preserveHacks, removeAllComments);
};

CSSWring.prototype.postcss = function (preserveHacks, removeAllComments, css) {
  css.semicolon = false;
  css.after = '';
  css.eachComment(wringComment.bind(null, removeAllComments));
  css.eachDecl(wringDecl.bind(null, preserveHacks));
  css.eachRule(wringRule);
  css.each(filterAtRule.bind({}));
  css.eachAtRule(wringAtRule);

  return css;
};

CSSWring.prototype.wring = function (css, opts) {
  return postcss().use(this.postcss).process(css, opts);
};

// CSSWring instance
csswring = function (opts) {
  return new CSSWring(opts);
};

csswring.postcss = function (css) {
  return csswring().postcss(css);
};

csswring.wring = function (css, opts) {
  return csswring(opts).wring(css, opts);
};

module.exports = csswring;

/*eslint no-underscore-dangle:0*/
