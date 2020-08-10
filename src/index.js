import packageJson from '../package.json'
import CanvasKitInit from './canvaskitoc'

export function init(wasmLibURL) {
    return wasmLibURL ?
        CanvasKitInit({locateFile: () => wasmLibURL}) :
        CanvasKitInit({locateFile: () => `https://unpkg.com/canvaskit-oc@${packageJson.version}/lib/canvaskit.wasm`})
}
