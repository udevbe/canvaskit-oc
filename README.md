# canvaskit-oc

![npm](https://img.shields.io/npm/v/canvaskit-oc)

Fork of Skia's canvaskit with changes to support offscreen canvas, releases kept in sync with upstream.

Current canvaskit sync version: 0.17.3

Created for use with [React-CanvasKit](https://github.com/udevbe/react-canvaskit)

# (Minor) Changes
- Force the use of WebGL1 (because of broken Emscripten WebGL detection for offscreen canvas) 
- Easy consuming of the canvaskit library (so no copy steps required)
- ES6 module
- Includes (incomplete) typescript definitions based on https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/canvaskit-wasm

# Installation

`yarn add canaskit-oc`

This library expects
`import canvaskitWasmURL from './canvaskit.wasm.asset'`
to be resolved to a URL by the bundler resolving the `canvaskit-oc` module. This is required so bundlers don't bypass the
JavaScript responsible for loading the wasm file.

This example Webpack config configures a loader to get a URL from the wasm asset file. The name part is optional but does speed up the processing of the wasm file by the browser as
it will be served using application/wasm mimetype which enables the browser to do streaming compilation.
```javascript
const path = require('path')

module.exports = {
  entry: './src/index.js',
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'dist'),
  },
  module: {
    rules: [
      {
        test: /\.(asset)$/i,
        use: [
          {
            loader: 'file-loader',
            options: {
                name: '[contenthash].wasm'
              }
          },
        ],
      }
    ]
  }
}
```

# Usage
```javascript
import { init } from 'canvaskit-oc'
init().then(canvasKit => {
    // do your canvaskit thing
})
```
