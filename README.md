# grunt-google-fonts

### Usage examples

After installing the plugin enable it in your Gruntfile.
```js
grunt.loadNpmTasks('grunt-google-fonts');
```

Configure target with needed fonts, styles and subsets. 
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
          svg: false
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