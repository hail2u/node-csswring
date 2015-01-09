'use strict';

module.exports = function (grunt) {
  var pkg = require('../package.json');

  grunt.registerMultiTask(pkg.name, pkg.description, function () {
    var csswring = require('../index');

    var options = this.options({});

    this.files.forEach(function (file) {
      if (file.src.length !== 1) {
        grunt.fail.warn('This Grunt plugin does not support multiple source files.');
      }

      var src = file.src[0];
      var dest = file.dest;

      if (!grunt.file.exists(src)) {
        grunt.log.warn('Source file "' + src + '" not found.');

        return;
      }

      if (options.map) {
        options.from = src;
        options.to = dest;
      }

      var processed = csswring.wring(grunt.file.read(src), options);
      grunt.file.write(dest, processed.css);
      grunt.log.writeln('File "' + dest + '" created.');

      if (processed.map) {
        var map = dest + '.map';
        grunt.file.write(map, processed.map);
        grunt.log.writeln('File "' + map + '" created.');
      }
    });
  });
};
