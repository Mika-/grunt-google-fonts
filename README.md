# grunt-google-fonts

> Download Google Fonts in Grunt jobs

## Getting Started
This plugin requires Grunt `>=0.4.5`

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```shell
yarn add -D grunt-google-fonts
```
or
```shell
npm install grunt-google-fonts --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-google-fonts');
```

## The "googlefonts" task

### Options

#### options.fontPath
Type: `String`
Default value: `./`

Specify directory to store fonts.

#### options.cssFile
Type: `String` `Boolean`
Default value: `false`

Path to store the generated css file.

#### options.cssFileLegacy
Type: `String` `Boolean`
Default value: `false`

Path to store the generated legacy (non woff2) css file.

#### options.httpPath
Type: `String` `Boolean`
Default value: `false`

Override http path in css file. This helps if you are hosting fonts from the CDN domain (eg. value `https://my-super-fast.cdn/fonts/` will set the font path as `https://my-super-fast.cdn/fonts/open-sans-300.woff`). On false this will fallback to `fontPath`.

#### options.formats
Type: `Object`
Default value: `{
  eot: false,
  ttf: false,
  woff: false,
  woff2: true,
  svg: false
}`

Set formats to download. Defaults to woff2 that covers all modern browsers.
For more information about format support, see caniuse entries for [EOT](http://caniuse.com/#feat=eot), [TTF](http://caniuse.com/#feat=ttf), [WOFF](http://caniuse.com/#feat=woff), [WOFF2](http://caniuse.com/#feat=woff2) and [SVG](http://caniuse.com/#feat=svg-fonts).

#### options.fonts
Type: `Array`
Default value: `[]`

Fonts to download. This is an array of objects with font specific config.

#### font.family
Type: `String`

Font name.

#### font.styles
Type: `Array`

Array of font styles. Eg. `[300]` or `[300, 400, '400italic']`.

#### font.subsets
Type: `Array`

Array of font subsets. Eg. `['latin', 'cyrillic']`. This option is ommitted on woff2 fonts.

#### font.text
Type: `String`

Restrict font to specified letters to make it smaller.


### Usage Examples

#### Basic Options
This example includes all the functionality needed for basic use.

```js
grunt.initConfig({
  googlefonts: {
    build: {
      options: {
        fontPath: 'fonts/',
        cssFile: 'fonts/fonts.css',
        fonts: [
          {
            family: 'Open Sans',
            styles: [
              400, 700
            ]
          }
        ]
      }
    }
  }
});
```

#### Custom Options
If you need more browser and charset support, this example is for you.

```js
grunt.initConfig({
  googlefonts: {
    build: {
      options: {
        fontPath: 'fonts/',
        cssFile: 'fonts/fonts.css',
        formats: {
          eot: true,
          woff: true,
          svg: true
        },
        fonts: [
          {
            family: 'Open Sans',
            subsets: [
              'latin',
              'cyrillic'
            ],
            styles: [
              300, 400, 700
            ]
          },
          {
            family: 'Droid Sans',
            styles: [
              400, 700
            ]
          },
          {
            family: 'Lato',
            text: 'My logo',
            styles: [
              400
            ]
          }
        ]
      }
    }
  }
});
```
