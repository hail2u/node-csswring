/*jshint node:true*/
'use strict';

var fs = require('fs');

var pkg = require('../package.json');
var csswring = require('../index');

var _printVersion = function () {
  console.log('csswring v' + csswring.version);
};

var _showHelp = function () {
  console.log('Usage:');
  console.log('  csswring [options] [INPUT] [OUTPUT]');
  console.log('');
  console.log('Description:');
  console.log('  ' + pkg.description);
  console.log('');
  console.log('Options:');
  console.log('      --sourcemap  Create source map file.');
  console.log('  -h, --help       Show this message.');
  console.log('  -v, --version    Print version information.');
};

exports.cli = function (args) {
  if (args.length) {
    switch (args[0]) {
      case '-v':
      case '--version':
        _printVersion();

        break;

      case '-h':
      case '--help':
        _showHelp();

        break;

      default:
        var opts = {};

        if (args[0] === '--sourcemap') {
          args.shift();
          opts.map = true;
        }

        opts.from = args[0];

        if (args[1]) {
          opts.to = args[1];
        }

        var wringed = csswring.wring(fs.readFileSync(args[0], {
          encoding: 'utf8'
        }), opts);

        if (opts.to) {
          fs.writeFileSync(args[1], wringed.css);

          if (opts.map) {
            fs.writeFileSync(opts.to + '.map', wringed.map);
          }
        } else {
          process.stdout.write(wringed.css);
        }
    }
  } else {
    _showHelp();
  }
};
