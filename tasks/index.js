/*
 * grunt-google-fonts
 *
 * Copyright (c) 2015 Mika Simanainen
 * Licensed under the MIT license.
 */

'use strict';

var async = require('async');
var http = require('http');
var url = require('url');
var fs = require('fs');
var querystring = require('querystring');
var cssparser = require('cssparser');
var parser = new cssparser.Parser();

module.exports = function(grunt) {

  var options = {};

  var userAgents = {
    eot: 'Mozilla/5.0 (compatible; MSIE 8.0; Windows NT 6.1; Trident/4.0)',
    ttf: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
    woff: 'Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; Trident/5.0)',
    woff2: 'Mozilla/5.0 (Windows NT 6.3; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/37.0.2049.0 Safari/537.36',
    svg: 'Mozilla/4.0 (iPad; CPU OS 4_0_1 like Mac OS X) AppleWebKit/534.46 (KHTML, like Gecko) Version/4.1 Mobile/9A405 Safari/7534.48.3'
  };

  grunt.registerMultiTask('googlefonts', 'Download Google Fonts', function() {

    var done = this.async();

    options = this.options({
      fontDir: './',
      formats: {
        eot: false,
        ttf: false,
        woff: true,
        woff2: false,
        svg: false
      },
      fonts: []
    });

    if (options.fontDir[options.fontDir.length-1] !== '/')
      options.fontDir += '/';

    if (!options.formats.eot && !options.formats.ttf && !options.formats.woff && !options.formats.woff2 && !options.formats.svg)
      grunt.fail.fatal('No fonts formats specified');

    if (!options.fonts || !options.fonts.length)
      grunt.fail.fatal('No fonts specified');

    var ready = 0;

    async.eachSeries(options.fonts, function(fontOptions, next) {

      getFont(fontOptions, function() {

        ready++;

        next();

      });

    }, function() {

      grunt.log.ok(ready + ' ' + grunt.util.pluralize(ready, 'font/fonts') + ' downloaded.');

      done();

    });

  });

  var getFont = function(fontOptions, cb) {

    if (!fontOptions.family)
      grunt.fail.fatal('No font family specified');

    if (!fontOptions.styles || !fontOptions.styles.length)
      grunt.fail.fatal('No font styles specified');

    var formatTotal = 0;
    var formatCount = 0;

    Object.keys(options.formats).forEach(function(format) {
        if (options.formats[format])
          formatTotal++;
    });

    formatTotal *= fontOptions.styles.length;

    Object.keys(options.formats).forEach(function(format) {

      if (options.formats[format]) {

        fontOptions.styles.forEach(function(style) {

          var path = '/css?family=' + querystring.escape(fontOptions.family) + ':' + style;

          if (fontOptions.subset && fontOptions.subset.length) {

            if (fontOptions.subset.indexOf('latin'))
              fontOptions.subset.push('latin');

            path += '&subset=' + fontOptions.subset.join(',');

          }

          downloadFontCss(userAgents[format], path, function(css) {

            var fileTotal = 0;
            var fileCount = 0;

            var rules = parser.parse(css).rulelist.filter(function(rule) {
              return rule.type === 'fontface';
            });

            async.eachSeries(rules, function(rule, next) {

                var fontUrl = rule.declarations.src.match(/url\((.+?)\)/)[1];
                var fontFile = fontOptions.family.replace(/\s+/, '-').toLowerCase() + '-' + rule.declarations['font-weight'] + '.' + format;

                downloadFont(fontUrl, function(data) {

                  fs.writeFile(options.fontDir + fontFile, data, function() {

                    fileCount++;

                    if (fileCount >= fileTotal)
                      next();

                  });

                });

            }, function() {

              formatCount++;

              if (formatCount >= formatTotal)
                cb();

            });

          });

        });

      }

    });

  }

  var downloadFontCss = function(userAgent, path, cb) {

    var req = http.get({
      host: 'fonts.googleapis.com',
      path: path,
      headers: {
        'User-Agent': userAgent
      }
    }, function(res) {

      var buffer = '';

      res.on('data', function(chunk) {
        buffer += chunk;
      });

      res.on('end', function() {

        if (res.statusCode === 200)
          cb(buffer);

      });

    });

  }

  var downloadFont = function(path, cb) {

    path = url.parse(path);

    var req = http.get({
      host: path.hostname,
      path: path.path
    }, function(res) {

      res.setEncoding('binary');

      var buffer = '';

      res.on('data', function(chunk) {
        buffer += chunk;
      });

      res.on('end', function() {

        if (res.statusCode === 200)
          cb(new Buffer(buffer, 'binary'));

      });

    });

  }

};
