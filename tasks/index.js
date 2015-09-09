/*
 * grunt-google-fonts
 * https://github.com/Mika-/grunt-google-fonts
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
  var cssRules = [];

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
      fontPath: './',
      httpPath: false,
      cssFile: false,
      formats: {
        eot: false,
        ttf: false,
        woff: true,
        woff2: true,
        svg: false
      },
      fonts: []
    });

    if (options.fontPath[options.fontPath.length-1] !== '/')
      options.fontPath += '/';

    if (!options.httpPath && options.fontPath[0] === '.')
      options.httpPath = '/';

    else if (!options.httpPath)
      options.httpPath = options.fontPath;

    if (!options.formats.eot && !options.formats.ttf && !options.formats.woff && !options.formats.woff2 && !options.formats.svg)
      grunt.fail.fatal('No fonts formats specified');

    if (!options.fonts || !options.fonts.length)
      grunt.fail.fatal('No fonts specified');

    var ready = 0;
    var cssString = '';

    async.eachSeries(options.fonts, function(fontOptions, next) {

      getFont(fontOptions, function(cssRules) {

        ready++;

        if (options.cssFile) {

        	cssRules.forEach(function(style) {
        		cssString += createFontCss(style);
        	});

        }

        next();

      });

    }, function() {

    	if (options.cssFile) {

	      fs.writeFile(options.cssFile, cssString, function() {

		      grunt.log.ok(ready + ' ' + grunt.util.pluralize(ready, 'font/fonts') + ' downloaded.');

		      done();

	      });

	    }
	    else {

		      grunt.log.ok(ready + ' ' + grunt.util.pluralize(ready, 'font/fonts') + ' downloaded.');

		      done();

	    }

    });

  });

  var getFont = function(fontOptions, cb) {

    if (!fontOptions.family)
      grunt.fail.fatal('No font family specified');

    if (!fontOptions.styles || !fontOptions.styles.length)
      grunt.fail.fatal('No font styles specified');

    var cssRules = [];
    var localFonts = [];
    var srcFonts = [];
    var formatTotal = 0;
    var formatCount = 0;

    Object.keys(options.formats).forEach(function(format) {
        if (options.formats[format])
          formatTotal++;
    });


    async.eachSeries(fontOptions.styles, function(style, next) {

      formatCount = 0;

      Object.keys(options.formats).forEach(function(format) {

        if (options.formats[format]) {

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

            rules.forEach(function(rule) {

                var fontStyle = rule.declarations['font-style'];
                var fontWeight = rule.declarations['font-weight'];
                var fontUrl = rule.declarations.src.match(/url\((.+?)\)/)[1];
                var fontFormat = rule.declarations.src.match(/format\(\'(.+?)\'\)/);
                var fontFile = fontOptions.family.replace(/\s+/, '-').toLowerCase() + '-' + fontWeight + '-' + fontStyle + '.' + format;
                var fontNameLocal = rule.declarations.src.match(/local\(\'(.+?)\'\)/g);

                if (fontNameLocal !== null) {
                  fontNameLocal.forEach(function(localName) {
                  	localName = localName.match(/local\(\'(.+?)\'\)/)[1];
                    if (localFonts.indexOf(localName) === -1)
                      localFonts.push(localName);
                  });

                }

                srcFonts.push({
                  src: fontFile,
                  format: (fontFormat !== null ? fontFormat[1] : false)
                });

                downloadFont(fontUrl, function(data) {

                  fs.writeFile(options.fontPath + fontFile, data, function() {

                    formatCount++;

                    if (formatCount >= formatTotal) {

                      cssRules.push({
                      	name: fontOptions.family,
                      	style: fontStyle,
                      	weight: fontWeight,
                        local: localFonts,
                        src: srcFonts
                      });

                      localFonts = [];
                      srcFonts = [];

                      next();

                    }

                  });

                });

            });

          });

        }

      });

    }, function() {

        cb(cssRules);

    });

  }

  var createFontCss = function(fontOptions) {

    var cssString = '@font-face {\r\n';
    cssString += '\tfont-family: \'' + fontOptions.name + '\';\r\n';
    cssString += '\tfont-style: ' + fontOptions.style + ';\r\n';
    cssString += '\tfont-weight: ' + fontOptions.weight + ';\r\n';
    cssString += '\tsrc: ';

    var sortMap = function(val) {
      if (val.src.match(/\.eot$/))
        return 0;
      else if (val.src.match(/\.woff2$/))
        return 1;
      else if (val.src.match(/\.woff$/))
        return 2;
      else if (val.src.match(/\.ttf$/))
        return 3;
      return 4;
    };

    fontOptions.src.sort(function(a, b) {
      return sortMap(a) - sortMap(b);
    });

    if (options.formats.eot) {

	    fontOptions.src.forEach(function(src, i) {

	    	if (src.src.match(/\.eot$/)) {

	    		cssString += 'url(' + options.httpPath + src.src + ');\r\n';
    			cssString += '\tsrc: ';

    			fontOptions.src.splice(i, 1);

	    	}

	    });

    }

    fontOptions.local.forEach(function(local, i) {

    	if (i > 0)
    		cssString += ', ';

    	cssString += 'local(\'' + local + '\')';

    });

    if (fontOptions.local.length)
    	cssString += ', ';

    fontOptions.src.forEach(function(src, i) {

    	if (i > 0)
    		cssString += ', ';

      if (src.src.match(/\.svg$/))
    		cssString += 'url(' + options.httpPath + src.src + '#' + fontOptions.name.replace(/[^a-z0-9]/i, '') + ') format(\'' + src.format + '\')';

    	else
    		cssString += 'url(' + options.httpPath + src.src + ') format(\'' + src.format + '\')';

    });

    cssString += ';\r\n}\r\n';

    return cssString;

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
