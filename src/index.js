import CanvasKitInit from './canvaskit'
import canvaskitWasmURL from './canvaskit.wasm.asset'

export function init() {
    return CanvasKitInit({locateFile: _ => canvaskitWasmURL})
}
