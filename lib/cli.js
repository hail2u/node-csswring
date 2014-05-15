/* jshint node: true */
'use strict';

var fs = require('fs');
var minimist = require('minimist');

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
  console.log('      --sourcemap       Create source map file.');
  console.log('  -p, --preserve-hacks  Preserve hacks before declaration like "*zoom: 1"');
  console.log('  -h, --help            Show this message.');
  console.log('  -v, --version         Print version information.');
};

exports.cli = function (args) {
  if (!args.length) {
    _showHelp();

    process.exit(1);
  }

  var argv = minimist(args, {
    boolean: [
      'sourcemap',
      'preserve-hacks',
      'help',
      'version'
    ],
    alias: {
      p: 'preserve-hacks',
      h: 'help',
      v: 'version'
    },
    default: {
      sourcemap: false,
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
      var parserOpts = {};
      var opts = {};

      if (argv['preserve-hacks']) {
        opts.preserveHacks = true;
      }

      if (argv.sourcemap) {
        parserOpts.map = true;
      }

      parserOpts.from = argv._[0];

      if (argv._[1]) {
        parserOpts.to = argv._[1];
      }

      var wringed = csswring.wring(fs.readFileSync(parserOpts.from, {
        encoding: 'utf8'
      }), parserOpts, opts);

      if (parserOpts.to) {
        fs.writeFileSync(parserOpts.to, wringed.css);

        if (parserOpts.map) {
          fs.writeFileSync(parserOpts.to + '.map', wringed.map);
        }
      } else {
        process.stdout.write(wringed.css);
      }
    }
  }
};
