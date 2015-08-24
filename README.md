# grunt-google-fonts

## Getting Started
You can install this plugin directly from Github:
```shell
npm install mika-/grunt-google-fonts
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:
```js
grunt.loadNpmTasks('grunt-google-fonts');
```

### Usage examples

Configure target with needed fonts and styles
```js
// Project configuration.
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

If you need more browser and charset support, this example is for you
```js
// Project configuration.
grunt.initConfig({
  googlefonts: {
    build: {
      options: {
        fontPath: 'fonts/',
        cssFile: 'fonts/fonts.css',
        formats: {
          eot: true,
          ttf: true,
          woff: true,
          woff2: true,
          svg: true
        },
        fonts: [
          {
            family: 'Open Sans',
            subset: [
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
          }
        ]
      }
    }
  }
});
```