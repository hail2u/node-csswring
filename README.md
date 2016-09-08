CSSWring
========

Minify CSS using PostCSS


SYNOPSIS
--------

For readability, almost all CSS file contains a lot of white spaces, extra
semicolon, etc.:

    .foo {
      width: 100px;
    }
    
    .bar {
      margin-top: 0px;
    }
    
    .baz {
      color: rgb(255, 0, 0);
      background-color: rgb(36, 36, 36);
    }

This PostCSS plugin removes and converts these non-essential parts of CSS file,
like this:

    .foo{width:100px}.bar{margin-top:0}.baz{color:red;background-color:#242424}


INSTALL
-------

    $ npm install csswring


USAGE
-----

Of course, this package can be used as PostCSS plugin:

    "use strict";
    
    var fs = require("fs");
    var postcss = require("postcss");
    
    var css = fs.readFileSync("test.css", "utf8");
    postcss([
      require("autoprefixer")(),
      require("csswring")()
    ]).process(css).then(function (result) {
      fs.writeFileSync("test.min.css", result.css);
    });


### As standard Node.js package

To minify `test.css` to `test.min.css`:

    #!/usr/bin/env node
    
    "use strict";
    
    var fs = require("fs");
    var csswring = require("csswring");
    
    var css = fs.readFileSync("test.css", "utf8");
    fs.writeFileSync("test.min.css", csswring.wring(css).css);


## As CLI Program

This package also installs a command line interface.

    $ node ./node_modules/.bin/csswring --help
    Usage: csswring [options] INPUT [OUTPUT]
    
    Description:
      Minify CSS file with source maps. That’s only.
    
    Options:
          --sourcemap            Create source map file.
          --preserve-hacks       Preserve some CSS hacks.
          --remove-all-comments  Remove all comments.
      -h, --help                 Show this message.
      -v, --version              Print version information.
    
    Use a single dash for INPUT to read CSS from standard input.

When PostCSS failed to parse INPUT, CLI shows a CSS parse error in GNU error
format instead of Node.js stack trace.


MINIFICATIONS
-------------

CSSWring doesn’t remove only white spaces or comments, but also remove an
unnecessary parts of CSS. See [minification details][2] in our GitHub Wiki.


OPTIONS
-------

### preserveHacks

By default, CSSWring removes all unknown portion of CSS declaration that
includes some CSS hacks (e.g., underscore hacks and star hacks). If you want to
preserve these hacks, pass `preserveHacks: true` to this module.

    postcss([
      csswring({
        preserveHacks: true
      })
    ]).wring(css);


### removeAllComments

By default, CSSWring keeps a comment that start with `/*!`. If you want to
remove all comments, pass `removeAllComments: true` to this module.

    postcss([
      csswring({
        removeAllComments: true
      })
    ]).wring(css);


API
---

### wring(css, [options])

Wring `css` with specified `options`.

The second argument is optional. The `options` is same as the second argument of
PostCSS’s `process()` method. This is useful for generating source map.

    var fs = require("fs");
    var csswring = require("csswring");
    
    var css = fs.readFileSync("from.css", "utf8");
    var result = csswring.wring(css, {
      map: {
        inline: false
      },
      from: "from.css",
      to: "to.css"
    });
    fs.writeFileSync("to.css", result.css);
    fs.writeFileSync("to.css.map", result.map);

See also [Source Map section][3] in PostCSS document for more about this
`options`.

You can also merge CSSWring options mentioned above to the second argument:

    var result = csswring.wring(css, {
      map: true,
      preserveHacks: true
    });


LICENSE
-------

MIT: http://hail2u.mit-license.org/2014


[1]: https://github.com/postcss/postcss
[2]: https://github.com/hail2u/node-csswring/wiki
[3]: https://github.com/postcss/postcss#source-map
