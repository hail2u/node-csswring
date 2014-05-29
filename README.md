CSSWring
========

Minify CSS file. That's only.

Written with [PostCSS][1]. See also [grunt-csswring][2] created by [@princed][3].


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


OPTIONS
-------

### `preserveHacks`

By default, CSSWring removes all unknown portion of CSS declaration that
includes some CSS hacks (e.g., underscore hacks and star hacks). If you want to
preserve these hacks, set `preserveHacks` property of this module to `true`.

    var csswring = require('csswring');
    csswring.preserveHacks = true;


### `removeAllComments`

By default, CSSWring keeps a comment that start with `/*!`. If you want to
remove all comments, set `removeAllComments` property of this module to `true`.

    var csswring = require('csswring');
    csswring.removeAllComments = true;


CLI USAGE
---------

This package also installs a command line interface.

    $ node ./node_modules/.bin/csswring --help
    Usage:
      csswring [options] [INPUT] [OUTPUT]
    
    Description:
      Minify CSS file. That's only.
    
    Options:
          --sourcemap            Create source map file.
          --preserve-hacks       Preserve some CSS hacks.
          --remove-all-comments  Remove all comments.
      -h, --help                 Show this message.
      -v, --version              Print version information.


LICENSE
-------

MIT: http://hail2u.mit-license.org/2014


[1]: https://github.com/ai/postcss
[2]: https://github.com/princed/grunt-csswring
[3]: https://github.com/princed
