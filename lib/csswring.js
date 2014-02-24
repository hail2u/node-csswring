/*jshint node: true*/
'use strict';

exports.version = '0.0.1';

var postcss = require('postcss');


// Declaration
var _wringDecl = function (decl) {
  decl.before = '';
  decl.between = ':';
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
