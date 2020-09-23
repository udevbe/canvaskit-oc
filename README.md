# canvaskit-oc

![npm](https://img.shields.io/npm/v/canvaskit-oc)

[Fork of Skia's canvaskit](https://github.com/udevbe/skia/tree/canvaskit-oc) with changes to support offscreen canvas, releases kept in sync with upstream.

Current canvaskit sync version: 0.17.3

Created for use with [React-CanvasKit](https://github.com/udevbe/react-canvaskit)

# (Minor) Changes
- Force the use of WebGL1 (because of broken Emscripten WebGL detection for offscreen canvas) 
- Easy consuming of the canvaskit library (so no copy steps required)
- ES6 module
- Includes (incomplete) typescript definitions based on https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/canvaskit-wasm

# Installation

`yarn add canaskit-oc`

The WASM part included in this library is by default not directly used when bundled. Instead, the (same) wasm library is downloaded 
from [unpkg](https://unpkg.com/) at runtime. The reason for this is the often [broken](https://github.com/webpack/webpack/issues/7352) [way](https://github.com/rollup/rollup/issues/1636) bundlers and Emscripten resolve WASM libraries.

# Usage
```javascript
import { init } from 'canvaskit-oc'
init().then(canvasKit => {
    // do your canvaskit thing
})
```

# Customizing the WASM URL
If needed, you can still tell canvaskit-oc to use a different URL to resolve the WASM library. The  `canvaskit.wasm` WASM file is still present
in `node_modules` so you can copy it and use ie. the webpack file-loader plugin and import the WASM library, which will resolve to a local URL.
Make sure to give it a different extension than `.wasm` or webpack will try to import it directly.
```javascript
import { init as canvasKitInit } from 'canvaskit-oc'
import canvaskitWasmURL from './canvaskit.wasm.asset'
canvasKitInit({locateFile: () => canvaskitWasmURL})
```

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
