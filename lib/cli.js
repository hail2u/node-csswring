/* jshint node: true */
'use strict';

var fs = require('fs');
var minimist = require('minimist');
var path = require('path');

var pkg = require('../package.json');
var csswring = require('../index');

var _printVersion = function () {
  console.log('csswring v' + pkg.version);
};

var _showHelp = function () {
  console.log('Usage:');
  console.log('  csswring [options] [INPUT] [OUTPUT]');
  console.log('');
  console.log('Description:');
  console.log('  ' + pkg.description);
  console.log('');
  console.log('Options:');
  console.log('      --sourcemap            Create source map file.');
  console.log('      --preserve-hacks       Preserve some CSS hacks.');
  console.log('      --remove-all-comments  Remove all comments.');
  console.log('  -h, --help                 Show this message.');
  console.log('  -v, --version              Print version information.');
};

exports.cli = function (args) {
  if (args.length === 0) {
    _showHelp();

    process.exit(1);
  }

  var argv = minimist(args, {
    boolean: [
      'sourcemap',
      'preserve-hacks',
      'remove-all-comments',
      'help',
      'version'
    ],
    alias: {
      h: 'help',
      v: 'version'
    },
    default: {
      sourcemap: false,
      'preserve-hacks': false,
      'remove-all-comments': false,
      help: false,
      version: false
    }
  });

  switch (true) {
    case argv.version: {
      _printVersion();

      break;
    }

    case argv.help: {
      _showHelp();

      break;
    }

    default: {
      var opts = {};

      if (argv.sourcemap) {
        opts.map = true;
      }

      if (argv['preserve-hacks']) {
        csswring.preserveHacks = true;
      }

      if (argv['remove-all-comments']) {
        csswring.removeAllComments = true;
      }

      opts.from = argv._[0];

      if (argv._[1]) {
        opts.to = argv._[1];
      }

      var wringed = csswring.wring(fs.readFileSync(opts.from, {
        encoding: 'utf8'
      }), opts);

      if (opts.to) {
        fs.writeFileSync(opts.to, wringed.css);

        if (opts.map) {
          fs.writeFileSync(opts.to + '.map', wringed.map);
        }
      } else {
        process.stdout.write(wringed.css);
      }
    }
  }
};
