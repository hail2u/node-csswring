#!/usr/bin/env node

"use strict";

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
    "h": "help",
    "v": "version"
  },
  default: {
    "help": false,
    "preserve-hacks": false,
    "remove-all-comments": false,
    "sourcemap": false,
    "version": false
  }
});
const binname = Object.keys(pkg.bin)[0];
const options = {};

function showHelp() {
  console.log(`Usage: ${binname} [options] INPUT [OUTPUT]`);
  console.log("");
  console.log("Description:");
  console.log(`  ${pkg.description}`);
  console.log("");
  console.log("Options:");
  console.log("      --sourcemap            Create source map file.");
  console.log("      --preserve-hacks       Preserve some CSS hacks.");
  console.log("      --remove-all-comments  Remove all comments.");
  console.log("  -h, --help                 Show this message.");
  console.log("  -v, --version              Print version information.");
  console.log("");
  console.log("Use a single dash for INPUT to read CSS from standard input.");
  console.log("");
  console.log("Examples:");
  console.log(`  $ ${binname} foo.css`);
  console.log(`  $ ${binname} foo.css > foo.min.css`);
  console.log(`  $ cat foo.css bar.css baz.css | ${binname} - > fbb.min.css`);

  return;
}

function wring(s, o) {
  csswring.wring(s, o).then(function (result) {
    if (!o.to) {
      process.stdout.write(result.css);

      return;
    }

    fs.writeFileSync(o.to, result.css);

    if (result.map) {
      fs.writeFileSync(`${o.to}.map`, result.map);
    }
  }).catch(function (error) {
    if (error.name === "CssSyntaxError") {
      console.error(`${error.file}:${error.line}:${error.column}: ${error.reason}`);
      process.exit(1);
    }

    throw error;
  });
}

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

default:
  if (argv["preserve-hacks"]) {
    options.preserveHacks = true;
  }

  if (argv["remove-all-comments"]) {
    options.removeAllComments = true;
  }

  if (argv.sourcemap) {
    options.map = true;
  }

  options.from = argv._[0];

  if (argv._[1]) {
    options.to = argv._[1];
  }

  if (options.map && options.to) {
    options.map = {
      inline: false
    };
  }

  if (options.from === "-") {
    delete options.from;
    argv._[0] = process.stdin.fd;
  }

  wring(fs.readFileSync(argv._[0], "utf8"), options);
}
