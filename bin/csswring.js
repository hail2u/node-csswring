#!/usr/bin/env node

const csswring = require("../index");
const fs = require("fs");
const minimist = require("minimist");
const pkg = require("../package.json");

const argv = minimist(process.argv.slice(2), {
  boolean: [
    "help",
    "preserve-hacks",
    "remove-all-comments",
    "sourcemap",
    "version"
  ],
  alias: {
    h: "help"
  },
  default: {
    help: false,
    "preserve-hacks": false,
    "remove-all-comments": false,
    sourcemap: false,
    version: false
  }
});
const [binname] = Object.keys(pkg.bin);
const options = {};

const showHelp = () => {
  console.log(`Usage: ${binname} [options] INPUT [OUTPUT]

Description:
  ${pkg.description}

Options:
      --sourcemap            Create source map file.
      --preserve-hacks       Preserve some CSS hacks.
      --remove-all-comments  Remove all comments.
  -h, --help                 Show this message.
      --version              Print version information.

Use a single dash for INPUT to read CSS from standard input.

Examples:
  $ ${binname} foo.css
  $ ${binname} foo.css > foo.min.css
  $ cat foo.css bar.css baz.css | ${binname} - > fbb.min.css`);
};

const wring = (s, o) => {
  csswring
    .wring(s, o)
    .then(result => {
      if (!o.to) {
        process.stdout.write(result.css);

        return;
      }

      fs.writeFileSync(o.to, result.css);

      if (result.map) {
        fs.writeFileSync(`${o.to}.map`, result.map);
      }
    })
    .catch(error => {
      if (error.name !== "CssSyntaxError") {
        throw error;
      }

      process.exitCode = 1;
      console.error(
        `${error.file}:${error.line}:${error.column}: ${error.reason}`
      );
    });
};

if (argv._.length < 1) {
  argv.help = true;
}

switch (true) {
  case argv.version:
    console.log(`${binname} v${pkg.version}`);

    break;

  case argv.help:
    showHelp();

    break;

  default: {
    if (argv["preserve-hacks"]) {
      options.preserveHacks = true;
    }

    if (argv["remove-all-comments"]) {
      options.removeAllComments = true;
    }

    if (argv.sourcemap) {
      options.map = true;
    }

    [options.from, options.to] = argv._;
    let input = options.from;

    if (input === "-") {
      delete options.from;
      input = process.stdin.fd;
    }

    if (!options.to) {
      delete options.to;
    }

    if (options.map && options.to) {
      options.map = {
        inline: false
      };
    }

    wring(fs.readFileSync(input, "utf8"), options);
  }
}

/* eslint no-console: "off" */
