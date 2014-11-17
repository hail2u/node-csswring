'use strict';

var fs = require('fs');
var minimist = require('minimist');
var path = require('path');

var pkg = require('../package.json');
var csswring = require('../index');

var _showHelp = function () {
  console.log('Usage:');
  console.log('  csswring [options] INPUT [OUTPUT]');
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
  console.log('');
  console.log('Use a single dash for INPUT to read input from standard input.');
};

var _wring = function (css, conf, opts) {
  var wringed = csswring(conf).wring(css, opts);

  if (!opts.to) {
    process.stdout.write(wringed.css);

    return;
  }

  fs.writeFileSync(opts.to, wringed.css);

  if (wringed.map) {
    fs.writeFileSync(opts.to + '.map', wringed.map);
  }
};

exports.cli = function (args) {
  if (args.length === 0) {
    _showHelp();

    return;
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
    case argv.version:
      console.log('csswring v' + pkg.version);

      break;

    case argv.help:
      _showHelp();

      break;

    default:
      var conf = {};
      var opts = {};

      if (argv['preserve-hacks']) {
        conf.preserveHacks = true;
      }

      if (argv['remove-all-comments']) {
        conf.removeAllComments = true;
      }

      if (argv.sourcemap) {
        opts.map = true;
      }

      opts.from = argv._[0];

      if (argv._[1]) {
        opts.to = argv._[1];
      }

      if (opts.map && opts.to) {
        opts.map = {
          inline: false
        };
      }

      var css = '';

      if (opts.from !== '-') {
        css = fs.readFileSync(opts.from, 'utf8');
        _wring(css, conf, opts);
      } else {
        delete opts.from;
        var stdin = process.openStdin();
        stdin.setEncoding('utf-8');
        stdin.on('data', function(chunk) {
          css += chunk;
        });
        stdin.on('end', function() {
          _wring(css, conf, opts);
        });
      }
  }
};
