/*
 * grunt-google-fonts
 * https://github.com/Mika-/grunt-google-fonts
 *
 * Copyright (c) 2015 Mika Simanainen
 * Licensed under the MIT license.
 */

'use strict';

var async = require('async');
var request = require('request');
var path = require('path');
var url = require('url');
var fs = require('fs');
var querystring = require('querystring');
var parser = require('css');

module.exports = function(grunt) {

    var options = {};
    var cssRules = [];

    var userAgents = {
        eot: 'Mozilla/5.0 (compatible; MSIE 8.0; Windows NT 6.1; Trident/4.0)',
        ttf: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
        woff: 'Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; Trident/5.0)',
        woff2: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:52.0) Gecko/20100101 Firefox/52.0',
        svg: 'Mozilla/4.0 (iPad; CPU OS 4_0_1 like Mac OS X) AppleWebKit/534.46 (KHTML, like Gecko) Version/4.1 Mobile/9A405 Safari/7534.48.3'
    };

    grunt.registerMultiTask('googlefonts', 'Download Google Fonts', function() {

        var done = this.async();

        options = this.options({
            fontPath: './',
            httpPath: false,
            cssFile: false,
            cssFileLegacy: false,
            formats: {
                eot: false,
                ttf: false,
                woff: false,
                woff2: true,
                svg: false
            },
            fonts: []
        });

        if (options.fontPath[options.fontPath.length - 1] !== '/')
            options.fontPath += '/';

        if (!options.httpPath && options.fontPath === './')
            options.httpPath = '/';

        else if (!options.httpPath)
            options.httpPath = options.fontPath;

        if (!options.formats.eot && !options.formats.ttf && !options.formats.woff && !options.formats.woff2 && !options.formats.svg)
            grunt.fail.fatal('No fonts formats specified');

        if (!options.fonts || !options.fonts.length)
            grunt.fail.fatal('No fonts specified');

        checkDirExists(options.fontPath);

        if (options.cssFile)
            checkDirExists(path.dirname(options.cssFile));

        if (options.cssFileLegacy)
            checkDirExists(path.dirname(options.cssFileLegacy));

        var ready = 0;
        var cssString = '';
        var cssStringLegacy = '';

        async.eachSeries(options.fonts, function(fontOptions, next) {

            getFont(fontOptions, function(cssRules) {

                ready++;

                if (options.cssFile) {

                    for (var key in cssRules) {
                        if (!options.formats.woff2 || cssRules[key].unicodeRange)
                            cssString += createFontCss(cssRules[key]);
                        else
                            cssStringLegacy += createFontCss(cssRules[key]);
                    }

                }

                next();

            });

        }, function() {

            if (options.cssFile) {

                fs.writeFile(options.cssFile, cssString, function() {

                    if (cssStringLegacy !== '') {
                        if (options.cssFileLegacy === false)
                            options.cssFileLegacy = options.cssFile.replace(/(.+?)\.(.+?)$/, '$1_legacy.$2');

                        fs.writeFileSync(options.cssFileLegacy, cssStringLegacy);
                    }

                    grunt.log.ok(ready + ' ' + grunt.util.pluralize(ready, 'font/fonts') + ' downloaded.');

                    done();

                });

            } else {

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

        var cssRules = {};
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

                    var fontUrl = '/css?family=' + querystring.escape(fontOptions.family) + ':' + style;

                    if (fontOptions.subsets && fontOptions.subsets.length) {

                        if (fontOptions.subsets.indexOf('latin'))
                            fontOptions.subsets.push('latin');

                        fontUrl += '&subset=' + fontOptions.subsets.join(',');

                    }

                    if (fontOptions.text && fontOptions.text.length)
                        fontUrl += '&text=' + querystring.escape(fontOptions.text);

                    downloadFontCss(userAgents[format], fontUrl, function(css) {

                        var fileCount = 0;
                        var localFonts = [];

                        var comments = parser.parse(css).stylesheet.rules.filter(function(rule) {
                            return rule.type === 'comment';
                        });
                        var rules = parser.parse(css).stylesheet.rules.filter(function(rule) {
                            return rule.type === 'font-face';
                        });

                        rules.forEach(function(rule, i) {

                            var fontStyle = rule.declarations.find(function(declaration) {
                                return declaration.property === 'font-style';
                            }).value;
                            var fontWeight = rule.declarations.find(function(declaration) {
                                return declaration.property === 'font-weight';
                            }).value;

                            var fontSrc = rule.declarations.find(function(declaration) {
                                return declaration.property === 'src';
                            }).value;
                            var fontUrl = fontSrc.match(/url\((.+?)\)/)[1];
                            var fontFormat = fontSrc.match(/format\(\'(.+?)\'\)/);
                            var fontNameLocal = fontSrc.match(/local\(\'(.+?)\'\)/g);

                            var unicodeRange = rule.declarations.find(function(declaration) {
                                return declaration.property === 'unicode-range';
                            });

                            var fontSubset = '';
                            if (comments[i])
                                fontSubset = '-' + comments[i].comment.replace(/\s+/g, '');

                            var fontFile = fontOptions.family.replace(/\s+/g, '-').toLowerCase() + '-' + fontWeight + '-' + fontStyle + fontSubset + '.' + format;

                            if (fontNameLocal !== null) {
                                fontNameLocal.forEach(function(localName) {
                                    localName = localName.match(/local\(\'(.+?)\'\)/)[1];
                                    if (localFonts.indexOf(localName) === -1)
                                        localFonts.push(localName);
                                });

                            }

                            var key = (unicodeRange ? unicodeRange.value + '-' + fontStyle + '-' + fontWeight : fontStyle + '-' + fontWeight);

                            if (cssRules[key]) {
                                cssRules[key].src.push({
                                    src: fontFile,
                                    format: (fontFormat !== null ? fontFormat[1] : null)
                                });
                            } else {
                                cssRules[key] = {
                                    name: fontOptions.family,
                                    style: fontStyle,
                                    weight: fontWeight,
                                    local: localFonts,
                                    src: [{
                                        src: fontFile,
                                        format: (fontFormat !== null ? fontFormat[1] : null)
                                    }],
                                    unicodeRange: (unicodeRange ? unicodeRange.value : null)
                                };
                            }

                            downloadFont(fontUrl, function(data) {

                                fs.writeFile(options.fontPath + fontFile, data, function() {

                                    fileCount++;

                                    if (fileCount >= rules.length)
                                        formatCount++;

                                    if (formatCount >= formatTotal)
                                        next();

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

                    cssString += 'url(\'' + options.httpPath + src.src + '\');\r\n';
                    cssString += '\tsrc: ';

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

            if (src.src.match(/\.eot$/))
                cssString += 'url(\'' + options.httpPath + src.src + '#iefix\') format(\'embedded-opentype\')';

            else if (src.src.match(/\.svg$/))
                cssString += 'url(\'' + options.httpPath + src.src + '#' + fontOptions.name.replace(/[^a-z0-9]/i, '') + '\') format(\'' + src.format + '\')';

            else
                cssString += 'url(\'' + options.httpPath + src.src + '\') format(\'' + src.format + '\')';

        });

        cssString += ';\r\n';

        if (fontOptions.unicodeRange !== null)
            cssString += '\tunicode-range: ' + fontOptions.unicodeRange + ';\r\n';

        cssString += '}\r\n';

        return cssString;

    }

    var downloadFontCss = function(userAgent, fontUrl, cb) {
        var url = 'https://fonts.googleapis.com' + fontUrl;
        var options = {
            url: url,
            headers: {
                'User-Agent': userAgent
            }
        };
        request(options, function(error, response, body) {
            if (error)
                grunt.fail.fatal('GET ' + url + ' failed: ' + error);
            else if (response.statusCode !== 200)
                grunt.fail.fatal('GET ' + fontUrl + ' failed: ' + response.statusCode);
            else
                cb(body);
        });
    }

    var downloadFont = function(fontUrl, cb) {
        var options = {
            url: fontUrl,
            encoding: null
        };
        request(options, function(error, response, body) {
            if (error)
                grunt.fail.fatal('GET ' + fontUrl + ' failed: ' + error);
            else if (response.statusCode !== 200)
                grunt.fail.fatal('GET ' + fontUrl + ' failed: ' + response.statusCode);
            else
                cb(body);
        });
    }

    var checkDirExists = function(dirPath) {

        dirPath = dirPath.split('/');

        var tmp = '';

        dirPath.forEach(function(dir) {

            tmp += dir + '/';

            if (!fs.existsSync(tmp))
                fs.mkdirSync(tmp);

        });

    }

};