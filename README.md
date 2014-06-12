CSSWring
========

Minify CSS file. That's only.

Written with [PostCSS][1]. See also [grunt-csswring][2] by [@princed][3].


INSTALLATION
------------

    $ npm install csswring


QUICK USAGE
-----------

    #!/usr/bin/env node
    
    'use strict';
    
    var fs = require('fs');
    var csswring = require('csswring');
    
    var css = fs.readFileSync('test.css', 'utf8');
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


API
---

### wring(css, [options])

Wring `css`.

The second argument is optional. The `options` is same as the second argument of
PostCSS's `process()` method. This is useful for generating Source Map.

    var fs = require('fs');
    var csswring = require('csswring');
    
    var css = fs.readFileSync('from.css', 'utf8');
    var result = csswring.wring(css, {
      map: true,
      from: 'from.css',
      to: 'to.css'
    });
    fs.writeFileSync('to.css', result.css);
    fs.writeFileSync('to.css.map', result.map);

See also [PostCSS document][4] for more about this `options`.


### processor

Returns a [PostCSS processor][5].

You can use this property for combining with other PostCSS processors
such as [Autoprefixer][6].

    var fs = require('fs');
    var postcss = require('postcss');
    var autoprefixer = require('autoprefixer');
    var csswring = require('csswring');
    
    var css = fs.readFileSync('test.css', 'utf8');
    postcss().use(
      autoprefixer.postcss
    ).use(
      csswring.processor
    ).process(css);


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
[4]: https://github.com/ai/postcss#source-map-1
[5]: https://github.com/ai/postcss#processor
[6]: https://github.com/ai/autoprefixer
