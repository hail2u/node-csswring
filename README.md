CSSWring
========

Minify CSS file. That's only.

Written with [PostCSS][1].


INSTALLATION
------------

    $ npm install csswring


QUICK USAGE
-----------

    #!/usr/bin/env node
    
    'use strict';
    
    var fs = require('fs');
    var csswring = require('csswring');
    
    var css = fs.readFileSync('test.css', {
      encoding: 'utf8'
    });
    fs.writeFileSync('test.min.css', csswring.wring(css).css);

If you want to preserve some CSS hacks, set `preserveHacks` property of
this module to `true`.


CLI USAGE
---------

This package also installs a command line interface.

    $ node ./node_modules/.bin/csswring --help
    Usage:
      csswring [options] [INPUT] [OUTPUT]
    
    Description:
      Minify CSS file. That's only.
    
    Options:
          --sourcemap       Create source map file.
          --preserve-hacks  Preserve some CSS hacks.
      -h, --help            Show this message.
      -v, --version         Print version information.


LICENSE
-------

MIT: http://hail2u.mit-license.org/2014


[1]: https://github.com/ai/postcss
