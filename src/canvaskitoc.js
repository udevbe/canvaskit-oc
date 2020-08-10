var CanvasKitInit = (function() {
  var _scriptDir = typeof document !== 'undefined' && document.currentScript ? document.currentScript.src : undefined;
  
  return (
function(CanvasKitInit) {
  CanvasKitInit = CanvasKitInit || {};

null;

var Module = typeof CanvasKitInit !== "undefined" ? CanvasKitInit : {};

var readyPromiseResolve, readyPromiseReject;

Module["ready"] = new Promise(function(resolve, reject) {
 readyPromiseResolve = resolve;
 readyPromiseReject = reject;
});

function SkDebug(msg) {}

var skIsDebug = false;

(function(CanvasKit) {
 CanvasKit._extraInitializations = CanvasKit._extraInitializations || [];
 CanvasKit._extraInitializations.push(function() {
  CanvasKit.MakeSWCanvasSurface = function(idOrElement) {
   var canvas = idOrElement;
   if (canvas.tagName !== "CANVAS") {
    canvas = document.getElementById(idOrElement);
    if (!canvas) {
     throw "Canvas with id " + idOrElement + " was not found";
    }
   }
   var surface = CanvasKit.MakeSurface(canvas.width, canvas.height);
   if (surface) {
    surface._canvas = canvas;
   }
   return surface;
  };
  if (!CanvasKit.MakeCanvasSurface) {
   CanvasKit.MakeCanvasSurface = CanvasKit.MakeSWCanvasSurface;
  }
  CanvasKit.MakeSurface = function(width, height) {
   var imageInfo = {
    "width": width,
    "height": height,
    "colorType": CanvasKit.ColorType.RGBA_8888,
    "alphaType": CanvasKit.AlphaType.Unpremul,
    "colorSpace": CanvasKit.SkColorSpace.SRGB
   };
   var pixelLen = width * height * 4;
   var pixelPtr = CanvasKit._malloc(pixelLen);
   var surface = this._getRasterDirectSurface(imageInfo, pixelPtr, width * 4);
   if (surface) {
    surface._canvas = null;
    surface._width = width;
    surface._height = height;
    surface._pixelLen = pixelLen;
    surface._pixelPtr = pixelPtr;
    surface.getCanvas().clear(CanvasKit.TRANSPARENT);
   }
   return surface;
  };
  CanvasKit.SkSurface.prototype.flush = function(dirtyRect) {
   this._flush();
   if (this._canvas) {
    var pixels = new Uint8ClampedArray(CanvasKit.HEAPU8.buffer, this._pixelPtr, this._pixelLen);
    var imageData = new ImageData(pixels, this._width, this._height);
    if (!dirtyRect) {
     this._canvas.getContext("2d").putImageData(imageData, 0, 0);
    } else {
     this._canvas.getContext("2d").putImageData(imageData, 0, 0, dirtyRect.fLeft, dirtyRect.fTop, dirtyRect.fRight - dirtyRect.fLeft, dirtyRect.fBottom - dirtyRect.fTop);
    }
   }
  };
  CanvasKit.SkSurface.prototype.dispose = function() {
   if (this._pixelPtr) {
    CanvasKit._free(this._pixelPtr);
   }
   this.delete();
  };
  CanvasKit.currentContext = CanvasKit.currentContext || function() {};
  CanvasKit.setCurrentContext = CanvasKit.setCurrentContext || function() {};
 });
})(Module);

(function(CanvasKit) {
 CanvasKit._extraInitializations = CanvasKit._extraInitializations || [];
 CanvasKit._extraInitializations.push(function() {
  function get(obj, attr, defaultValue) {
   if (obj && obj.hasOwnProperty(attr)) {
    return obj[attr];
   }
   return defaultValue;
  }
  CanvasKit.makeWebGLContextAsCurrent = function(canvas, attrs) {
   if (!canvas) {
    throw "null canvas passed into makeWebGLContext";
   }
   var contextAttributes = {
    "alpha": get(attrs, "alpha", 1),
    "depth": get(attrs, "depth", 1),
    "stencil": get(attrs, "stencil", 8),
    "antialias": get(attrs, "antialias", 0),
    "premultipliedAlpha": get(attrs, "premultipliedAlpha", 1),
    "preserveDrawingBuffer": get(attrs, "preserveDrawingBuffer", 0),
    "preferLowPowerToHighPerformance": get(attrs, "preferLowPowerToHighPerformance", 0),
    "failIfMajorPerformanceCaveat": get(attrs, "failIfMajorPerformanceCaveat", 0),
    "enableExtensionsByDefault": get(attrs, "enableExtensionsByDefault", 1),
    "explicitSwapControl": get(attrs, "explicitSwapControl", 0),
    "renderViaOffscreenBackBuffer": get(attrs, "renderViaOffscreenBackBuffer", 0)
   };
   if (attrs && attrs["majorVersion"]) {
    contextAttributes["majorVersion"] = attrs["majorVersion"];
   }
   if (contextAttributes["explicitSwapControl"]) {
    throw "explicitSwapControl is not supported";
   }
   this.createContext(canvas, true, true, contextAttributes);
  };
  CanvasKit.GetWebGLContext = function(canvas, attrs) {
   this.makeWebGLContextAsCurrent(canvas, attrs);
   return CanvasKit.currentContext() || 0;
  };
  CanvasKit.MakeWebGLCanvasSurface = function(idOrElement, colorSpace, attrs) {
   colorSpace = colorSpace || null;
   var canvas = idOrElement;
   var isHTMLCanvas = typeof HTMLCanvasElement !== "undefined" && canvas instanceof HTMLCanvasElement;
   var isOffscreenCanvas = canvas instanceof OffscreenCanvas;
   if (!isHTMLCanvas && !isOffscreenCanvas) {
    canvas = document.getElementById(idOrElement);
    if (!canvas) {
     throw "Canvas with id " + idOrElement + " was not found";
    }
   }
   var ctx = this.GetWebGLContext(canvas, attrs);
   var openGLversion = canvas.GLctxObject.version;
   if (!ctx || ctx < 0) {
    throw "failed to create webgl context: err " + ctx;
   }
   var grcontext = this.MakeGrContext(ctx);
   var surface = this.MakeOnScreenGLSurface(grcontext, canvas.width, canvas.height, colorSpace);
   if (!surface) {
    SkDebug("falling back from GPU implementation to a SW based one");
    var newCanvas = canvas.cloneNode(true);
    var parent = canvas.parentNode;
    parent.replaceChild(newCanvas, canvas);
    newCanvas.classList.add("ck-replaced");
    return CanvasKit.MakeSWCanvasSurface(newCanvas);
   }
   surface._context = ctx;
   surface.grContext = grcontext;
   surface.openGLversion = openGLversion;
   return surface;
  };
  CanvasKit.MakeCanvasSurface = CanvasKit.MakeWebGLCanvasSurface;
 });
})(Module);

(function(CanvasKit) {
 function clamp(c) {
  return Math.round(Math.max(0, Math.min(c || 0, 255)));
 }
 CanvasKit.Color = function(r, g, b, a) {
  if (a === undefined) {
   a = 1;
  }
  return CanvasKit.Color4f(clamp(r) / 255, clamp(g) / 255, clamp(b) / 255, a);
 };
 CanvasKit.ColorAsInt = function(r, g, b, a) {
  if (a === undefined) {
   a = 255;
  }
  return (clamp(a) << 24 | clamp(r) << 16 | clamp(g) << 8 | clamp(b) << 0 & 268435455) >>> 0;
 };
 CanvasKit.Color4f = function(r, g, b, a) {
  if (a === undefined) {
   a = 1;
  }
  return Float32Array.of(r, g, b, a);
 };
 Object.defineProperty(CanvasKit, "TRANSPARENT", {
  get: function() {
   return CanvasKit.Color4f(0, 0, 0, 0);
  }
 });
 Object.defineProperty(CanvasKit, "BLACK", {
  get: function() {
   return CanvasKit.Color4f(0, 0, 0, 1);
  }
 });
 Object.defineProperty(CanvasKit, "WHITE", {
  get: function() {
   return CanvasKit.Color4f(1, 1, 1, 1);
  }
 });
 Object.defineProperty(CanvasKit, "RED", {
  get: function() {
   return CanvasKit.Color4f(1, 0, 0, 1);
  }
 });
 Object.defineProperty(CanvasKit, "GREEN", {
  get: function() {
   return CanvasKit.Color4f(0, 1, 0, 1);
  }
 });
 Object.defineProperty(CanvasKit, "BLUE", {
  get: function() {
   return CanvasKit.Color4f(0, 0, 1, 1);
  }
 });
 Object.defineProperty(CanvasKit, "YELLOW", {
  get: function() {
   return CanvasKit.Color4f(1, 1, 0, 1);
  }
 });
 Object.defineProperty(CanvasKit, "CYAN", {
  get: function() {
   return CanvasKit.Color4f(0, 1, 1, 1);
  }
 });
 Object.defineProperty(CanvasKit, "MAGENTA", {
  get: function() {
   return CanvasKit.Color4f(1, 0, 1, 1);
  }
 });
 CanvasKit.getColorComponents = function(color) {
  return [ Math.floor(color[0] * 255), Math.floor(color[1] * 255), Math.floor(color[2] * 255), color[3] ];
 };
 CanvasKit.parseColorString = function(colorStr, colorMap) {
  colorStr = colorStr.toLowerCase();
  if (colorStr.startsWith("#")) {
   var r, g, b, a = 255;
   switch (colorStr.length) {
   case 9:
    a = parseInt(colorStr.slice(7, 9), 16);

   case 7:
    r = parseInt(colorStr.slice(1, 3), 16);
    g = parseInt(colorStr.slice(3, 5), 16);
    b = parseInt(colorStr.slice(5, 7), 16);
    break;

   case 5:
    a = parseInt(colorStr.slice(4, 5), 16) * 17;

   case 4:
    r = parseInt(colorStr.slice(1, 2), 16) * 17;
    g = parseInt(colorStr.slice(2, 3), 16) * 17;
    b = parseInt(colorStr.slice(3, 4), 16) * 17;
    break;
   }
   return CanvasKit.Color(r, g, b, a / 255);
  } else if (colorStr.startsWith("rgba")) {
   colorStr = colorStr.slice(5, -1);
   var nums = colorStr.split(",");
   return CanvasKit.Color(+nums[0], +nums[1], +nums[2], valueOrPercent(nums[3]));
  } else if (colorStr.startsWith("rgb")) {
   colorStr = colorStr.slice(4, -1);
   var nums = colorStr.split(",");
   return CanvasKit.Color(+nums[0], +nums[1], +nums[2], valueOrPercent(nums[3]));
  } else if (colorStr.startsWith("gray(")) {} else if (colorStr.startsWith("hsl")) {} else if (colorMap) {
   var nc = colorMap[colorStr];
   if (nc !== undefined) {
    return nc;
   }
  }
  SkDebug("unrecognized color " + colorStr);
  return CanvasKit.BLACK;
 };
 function isCanvasKitColor(ob) {
  if (!ob) {
   return false;
  }
  return ob.constructor === Float32Array && ob.length === 4;
 }
 function toUint32Color(c) {
  return (clamp(c[3] * 255) << 24 | clamp(c[0] * 255) << 16 | clamp(c[1] * 255) << 8 | clamp(c[2] * 255) << 0) >>> 0;
 }
 function assureIntColors(arr) {
  if (arr instanceof Float32Array) {
   var count = Math.floor(arr.length / 4);
   var result = new Uint32Array(count);
   for (var i = 0; i < count; i++) {
    result[i] = toUint32Color(arr.slice(i * 4, (i + 1) * 4));
   }
   return result;
  } else if (arr instanceof Uint32Array) {
   return arr;
  } else if (arr instanceof Array && arr[0] instanceof Float32Array) {
   return arr.map(toUint32Color);
  }
 }
 function valueOrPercent(aStr) {
  if (aStr === undefined) {
   return 1;
  }
  var a = parseFloat(aStr);
  if (aStr && aStr.indexOf("%") !== -1) {
   return a / 100;
  }
  return a;
 }
 CanvasKit.multiplyByAlpha = function(color, alpha) {
  var result = color.slice();
  result[3] = Math.max(0, Math.min(result[3] * alpha, 1));
  return result;
 };
 function radiansToDegrees(rad) {
  return rad / Math.PI * 180;
 }
 var isNode = !new Function("try {return this===window;}catch(e){ return false;}")();
 function almostEqual(floata, floatb) {
  return Math.abs(floata - floatb) < 1e-5;
 }
 var nullptr = 0;
 function copy1dArray(arr, dest, ptr) {
  if (!arr || !arr.length) {
   return nullptr;
  }
  if (arr["_ck"]) {
   return arr.byteOffset;
  }
  var bytesPerElement = CanvasKit[dest].BYTES_PER_ELEMENT;
  if (!ptr) {
   ptr = CanvasKit._malloc(arr.length * bytesPerElement);
  }
  CanvasKit[dest].set(arr, ptr / bytesPerElement);
  return ptr;
 }
 function copy2dArray(arr, dest, ptr) {
  if (!arr || !arr.length) {
   return nullptr;
  }
  var bytesPerElement = CanvasKit[dest].BYTES_PER_ELEMENT;
  if (!ptr) {
   ptr = CanvasKit._malloc(arr.length * arr[0].length * bytesPerElement);
  }
  dest = CanvasKit[dest];
  var idx = 0;
  var adjustedPtr = ptr / bytesPerElement;
  for (var r = 0; r < arr.length; r++) {
   for (var c = 0; c < arr[0].length; c++) {
    dest[adjustedPtr + idx] = arr[r][c];
    idx++;
   }
  }
  return ptr;
 }
 function copyFlexibleColorArray(colors) {
  var result = {
   colorPtr: nullptr,
   count: colors.length,
   colorType: CanvasKit.ColorType.RGBA_F32
  };
  if (colors instanceof Float32Array) {
   result.colorPtr = copy1dArray(colors, "HEAPF32");
   result.count = colors.length / 4;
  } else if (colors instanceof Uint32Array) {
   result.colorPtr = copy1dArray(colors, "HEAPU32");
   result.colorType = CanvasKit.ColorType.RGBA_8888;
  } else if (colors instanceof Array && colors[0] instanceof Float32Array) {
   result.colorPtr = copy2dArray(colors, "HEAPF32");
  } else {
   throw "Invalid argument to copyFlexibleColorArray, Not a color array " + typeof colors;
  }
  return result;
 }
 var defaultPerspective = Float32Array.of(0, 0, 1);
 var _scratch3x3MatrixPtr = nullptr;
 var _scratch3x3Matrix;
 function copy3x3MatrixToWasm(matr) {
  if (!matr) {
   return nullptr;
  }
  if (matr.length) {
   if (matr.length !== 6 && matr.length !== 9) {
    throw "invalid matrix size";
   }
   var mPtr = copy1dArray(matr, "HEAPF32", _scratch3x3MatrixPtr);
   if (matr.length === 6) {
    CanvasKit.HEAPF32.set(defaultPerspective, 6 + mPtr / 4);
   }
   return mPtr;
  }
  var wasm3x3Matrix = _scratch3x3Matrix["toTypedArray"]();
  wasm3x3Matrix[0] = matr.m11;
  wasm3x3Matrix[1] = matr.m21;
  wasm3x3Matrix[2] = matr.m41;
  wasm3x3Matrix[3] = matr.m12;
  wasm3x3Matrix[4] = matr.m22;
  wasm3x3Matrix[5] = matr.m42;
  wasm3x3Matrix[6] = matr.m14;
  wasm3x3Matrix[7] = matr.m24;
  wasm3x3Matrix[8] = matr.m44;
  return _scratch3x3MatrixPtr;
 }
 var _scratch4x4MatrixPtr = nullptr;
 var _scratch4x4Matrix;
 function copy4x4MatrixToWasm(matr) {
  if (!matr) {
   return nullptr;
  }
  var wasm4x4Matrix = _scratch4x4Matrix["toTypedArray"]();
  if (matr.length) {
   if (matr.length !== 16 && matr.length !== 6 && matr.length !== 9) {
    throw "invalid matrix size";
   }
   if (matr.length === 16) {
    return copy1dArray(matr, "HEAPF32", _scratch4x4MatrixPtr);
   }
   wasm4x4Matrix.fill(0);
   wasm4x4Matrix[0] = matr[0];
   wasm4x4Matrix[1] = matr[1];
   wasm4x4Matrix[3] = matr[2];
   wasm4x4Matrix[4] = matr[3];
   wasm4x4Matrix[5] = matr[4];
   wasm4x4Matrix[7] = matr[5];
   wasm4x4Matrix[12] = matr[6];
   wasm4x4Matrix[13] = matr[7];
   wasm4x4Matrix[15] = matr[8];
   if (matr.length === 6) {
    wasm4x4Matrix[12] = 0;
    wasm4x4Matrix[13] = 0;
    wasm4x4Matrix[15] = 1;
   }
   return _scratch4x4MatrixPtr;
  }
  wasm4x4Matrix[0] = matr.m11;
  wasm4x4Matrix[1] = matr.m21;
  wasm4x4Matrix[2] = matr.m31;
  wasm4x4Matrix[3] = matr.m41;
  wasm4x4Matrix[4] = matr.m12;
  wasm4x4Matrix[5] = matr.m22;
  wasm4x4Matrix[6] = matr.m32;
  wasm4x4Matrix[7] = matr.m42;
  wasm4x4Matrix[8] = matr.m13;
  wasm4x4Matrix[9] = matr.m23;
  wasm4x4Matrix[10] = matr.m33;
  wasm4x4Matrix[11] = matr.m43;
  wasm4x4Matrix[12] = matr.m14;
  wasm4x4Matrix[13] = matr.m24;
  wasm4x4Matrix[14] = matr.m34;
  wasm4x4Matrix[15] = matr.m44;
  return _scratch4x4MatrixPtr;
 }
 function copy4x4MatrixFromWasm(matrPtr) {
  var rv = new Array(16);
  for (var i = 0; i < 16; i++) {
   rv[i] = CanvasKit.HEAPF32[matrPtr / 4 + i];
  }
  return rv;
 }
 var _scratchColorPtr = nullptr;
 var _scratchColor;
 function copyColorToWasm(color4f, ptr) {
  return copy1dArray(color4f, "HEAPF32", ptr || _scratchColorPtr);
 }
 function copyColorComponentsToWasm(r, g, b, a) {
  var colors = _scratchColor["toTypedArray"]();
  colors[0] = r;
  colors[1] = g;
  colors[2] = b;
  colors[3] = a;
  return _scratchColorPtr;
 }
 function copyColorToWasmNoScratch(color4f) {
  return copy1dArray(color4f, "HEAPF32");
 }
 function copyColorFromWasm(colorPtr) {
  var rv = new Float32Array(4);
  for (var i = 0; i < 4; i++) {
   rv[i] = CanvasKit.HEAPF32[colorPtr / 4 + i];
  }
  return rv;
 }
 var Float32ArrayCache = {};
 function loadCmdsTypedArray(arr) {
  var len = 0;
  for (var r = 0; r < arr.length; r++) {
   len += arr[r].length;
  }
  var ta;
  if (Float32ArrayCache[len]) {
   ta = Float32ArrayCache[len];
  } else {
   ta = new Float32Array(len);
   Float32ArrayCache[len] = ta;
  }
  var i = 0;
  for (var r = 0; r < arr.length; r++) {
   for (var c = 0; c < arr[r].length; c++) {
    var item = arr[r][c];
    ta[i] = item;
    i++;
   }
  }
  var ptr = copy1dArray(ta, "HEAPF32");
  return [ ptr, len ];
 }
 function saveBytesToFile(bytes, fileName) {
  if (!isNode) {
   var blob = new Blob([ bytes ], {
    type: "application/octet-stream"
   });
   url = window.URL.createObjectURL(blob);
   var a = document.createElement("a");
   document.body.appendChild(a);
   a.href = url;
   a.download = fileName;
   a.click();
   setTimeout(function() {
    URL.revokeObjectURL(url);
    a.remove();
   }, 50);
  } else {
   var fs = require("fs");
   fs.writeFile(fileName, new Buffer(bytes), function(err) {
    if (err) throw err;
   });
  }
 }
 CanvasKit.FourFloatArrayHelper = function() {
  this._floats = [];
  this._ptr = null;
  Object.defineProperty(this, "length", {
   enumerable: true,
   get: function() {
    return this._floats.length / 4;
   }
  });
 };
 CanvasKit.FourFloatArrayHelper.prototype.push = function(f1, f2, f3, f4) {
  if (this._ptr) {
   SkDebug("Cannot push more points - already built");
   return;
  }
  this._floats.push(f1, f2, f3, f4);
 };
 CanvasKit.FourFloatArrayHelper.prototype.set = function(idx, f1, f2, f3, f4) {
  if (idx < 0 || idx >= this._floats.length / 4) {
   SkDebug("Cannot set index " + idx + ", it is out of range", this._floats.length / 4);
   return;
  }
  idx *= 4;
  var BYTES_PER_ELEMENT = 4;
  if (this._ptr) {
   var floatPtr = this._ptr / BYTES_PER_ELEMENT + idx;
   CanvasKit.HEAPF32[floatPtr] = f1;
   CanvasKit.HEAPF32[floatPtr + 1] = f2;
   CanvasKit.HEAPF32[floatPtr + 2] = f3;
   CanvasKit.HEAPF32[floatPtr + 3] = f4;
   return;
  }
  this._floats[idx] = f1;
  this._floats[idx + 1] = f2;
  this._floats[idx + 2] = f3;
  this._floats[idx + 3] = f4;
 };
 CanvasKit.FourFloatArrayHelper.prototype.build = function() {
  if (this._ptr) {
   return this._ptr;
  }
  this._ptr = copy1dArray(this._floats, "HEAPF32");
  return this._ptr;
 };
 CanvasKit.FourFloatArrayHelper.prototype.delete = function() {
  if (this._ptr) {
   CanvasKit._free(this._ptr);
   this._ptr = null;
  }
 };
 CanvasKit.OneUIntArrayHelper = function() {
  this._uints = [];
  this._ptr = null;
  Object.defineProperty(this, "length", {
   enumerable: true,
   get: function() {
    return this._uints.length;
   }
  });
 };
 CanvasKit.OneUIntArrayHelper.prototype.push = function(u) {
  if (this._ptr) {
   SkDebug("Cannot push more points - already built");
   return;
  }
  this._uints.push(u);
 };
 CanvasKit.OneUIntArrayHelper.prototype.set = function(idx, u) {
  if (idx < 0 || idx >= this._uints.length) {
   SkDebug("Cannot set index " + idx + ", it is out of range", this._uints.length);
   return;
  }
  idx *= 4;
  var BYTES_PER_ELEMENT = 4;
  if (this._ptr) {
   var uintPtr = this._ptr / BYTES_PER_ELEMENT + idx;
   CanvasKit.HEAPU32[uintPtr] = u;
   return;
  }
  this._uints[idx] = u;
 };
 CanvasKit.OneUIntArrayHelper.prototype.build = function() {
  if (this._ptr) {
   return this._ptr;
  }
  this._ptr = copy1dArray(this._uints, "HEAPU32");
  return this._ptr;
 };
 CanvasKit.OneUIntArrayHelper.prototype.delete = function() {
  if (this._ptr) {
   CanvasKit._free(this._ptr);
   this._ptr = null;
  }
 };
 CanvasKit.SkRectBuilder = CanvasKit.FourFloatArrayHelper;
 CanvasKit.RSXFormBuilder = CanvasKit.FourFloatArrayHelper;
 CanvasKit.SkColorBuilder = CanvasKit.OneUIntArrayHelper;
 CanvasKit.Malloc = function(typedArray, len) {
  var byteLen = len * typedArray.BYTES_PER_ELEMENT;
  var ptr = CanvasKit._malloc(byteLen);
  return {
   "_ck": true,
   "length": len,
   "byteOffset": ptr,
   typedArray: null,
   "subarray": function(start, end) {
    var sa = this["toTypedArray"]().subarray(start, end);
    sa["_ck"] = true;
    return sa;
   },
   "toTypedArray": function() {
    if (this.typedArray && this.typedArray.length) {
     return this.typedArray;
    }
    this.typedArray = new typedArray(CanvasKit.HEAPU8.buffer, ptr, len);
    this.typedArray["_ck"] = true;
    return this.typedArray;
   }
  };
 };
 CanvasKit.Free = function(mallocObj) {
  CanvasKit._free(mallocObj["byteOffset"]);
  mallocObj["byteOffset"] = nullptr;
  mallocObj["toTypedArray"] = null;
  mallocObj.typedArray = null;
 };
 function freeArraysThatAreNotMallocedByUsers(ptr, arr) {
  if (arr && !arr["_ck"]) {
   CanvasKit._free(ptr);
  }
 }
 CanvasKit.onRuntimeInitialized = function() {
  _scratchColor = CanvasKit.Malloc(Float32Array, 4);
  _scratchColorPtr = _scratchColor["byteOffset"];
  _scratch4x4Matrix = CanvasKit.Malloc(Float32Array, 16);
  _scratch4x4MatrixPtr = _scratch4x4Matrix["byteOffset"];
  _scratch3x3Matrix = CanvasKit.Malloc(Float32Array, 9);
  _scratch3x3MatrixPtr = _scratch3x3Matrix["byteOffset"];
  CanvasKit.SkColorSpace.SRGB = CanvasKit.SkColorSpace._MakeSRGB();
  CanvasKit.SkColorSpace.DISPLAY_P3 = CanvasKit.SkColorSpace._MakeDisplayP3();
  CanvasKit.SkColorSpace.ADOBE_RGB = CanvasKit.SkColorSpace._MakeAdobeRGB();
  CanvasKit.SkMatrix = {};
  function sdot() {
   var acc = 0;
   for (var i = 0; i < arguments.length - 1; i += 2) {
    acc += arguments[i] * arguments[i + 1];
   }
   return acc;
  }
  var identityN = function(n) {
   var size = n * n;
   var m = new Array(size);
   while (size--) {
    m[size] = size % (n + 1) == 0 ? 1 : 0;
   }
   return m;
  };
  var stride = function(v, m, width, offset, colStride) {
   for (var i = 0; i < v.length; i++) {
    m[i * width + (i * colStride + offset + width) % width] = v[i];
   }
   return m;
  };
  CanvasKit.SkMatrix.identity = function() {
   return identityN(3);
  };
  CanvasKit.SkMatrix.invert = function(m) {
   var det = m[0] * m[4] * m[8] + m[1] * m[5] * m[6] + m[2] * m[3] * m[7] - m[2] * m[4] * m[6] - m[1] * m[3] * m[8] - m[0] * m[5] * m[7];
   if (!det) {
    SkDebug("Warning, uninvertible matrix");
    return null;
   }
   return [ (m[4] * m[8] - m[5] * m[7]) / det, (m[2] * m[7] - m[1] * m[8]) / det, (m[1] * m[5] - m[2] * m[4]) / det, (m[5] * m[6] - m[3] * m[8]) / det, (m[0] * m[8] - m[2] * m[6]) / det, (m[2] * m[3] - m[0] * m[5]) / det, (m[3] * m[7] - m[4] * m[6]) / det, (m[1] * m[6] - m[0] * m[7]) / det, (m[0] * m[4] - m[1] * m[3]) / det ];
  };
  CanvasKit.SkMatrix.mapPoints = function(matrix, ptArr) {
   if (skIsDebug && ptArr.length % 2) {
    throw "mapPoints requires an even length arr";
   }
   for (var i = 0; i < ptArr.length; i += 2) {
    var x = ptArr[i], y = ptArr[i + 1];
    var denom = matrix[6] * x + matrix[7] * y + matrix[8];
    var xTrans = matrix[0] * x + matrix[1] * y + matrix[2];
    var yTrans = matrix[3] * x + matrix[4] * y + matrix[5];
    ptArr[i] = xTrans / denom;
    ptArr[i + 1] = yTrans / denom;
   }
   return ptArr;
  };
  function isnumber(val) {
   return val !== NaN;
  }
  function multiply(m1, m2, size) {
   if (skIsDebug && (!m1.every(isnumber) || !m2.every(isnumber))) {
    throw "Some members of matrices are NaN m1=" + m1 + ", m2=" + m2 + "";
   }
   if (skIsDebug && m1.length !== m2.length) {
    throw "Undefined for matrices of different sizes. m1.length=" + m1.length + ", m2.length=" + m2.length;
   }
   if (skIsDebug && size * size !== m1.length) {
    throw "Undefined for non-square matrices. array size was " + size;
   }
   var result = Array(m1.length);
   for (var r = 0; r < size; r++) {
    for (var c = 0; c < size; c++) {
     var acc = 0;
     for (var k = 0; k < size; k++) {
      acc += m1[size * r + k] * m2[size * k + c];
     }
     result[r * size + c] = acc;
    }
   }
   return result;
  }
  function multiplyMany(size, listOfMatrices) {
   if (skIsDebug && listOfMatrices.length < 2) {
    throw "multiplication expected two or more matrices";
   }
   var result = multiply(listOfMatrices[0], listOfMatrices[1], size);
   var next = 2;
   while (next < listOfMatrices.length) {
    result = multiply(result, listOfMatrices[next], size);
    next++;
   }
   return result;
  }
  CanvasKit.SkMatrix.multiply = function() {
   return multiplyMany(3, arguments);
  };
  CanvasKit.SkMatrix.rotated = function(radians, px, py) {
   px = px || 0;
   py = py || 0;
   var sinV = Math.sin(radians);
   var cosV = Math.cos(radians);
   return [ cosV, -sinV, sdot(sinV, py, 1 - cosV, px), sinV, cosV, sdot(-sinV, px, 1 - cosV, py), 0, 0, 1 ];
  };
  CanvasKit.SkMatrix.scaled = function(sx, sy, px, py) {
   px = px || 0;
   py = py || 0;
   var m = stride([ sx, sy ], identityN(3), 3, 0, 1);
   return stride([ px - sx * px, py - sy * py ], m, 3, 2, 0);
  };
  CanvasKit.SkMatrix.skewed = function(kx, ky, px, py) {
   px = px || 0;
   py = py || 0;
   var m = stride([ kx, ky ], identityN(3), 3, 1, -1);
   return stride([ -kx * px, -ky * py ], m, 3, 2, 0);
  };
  CanvasKit.SkMatrix.translated = function(dx, dy) {
   return stride(arguments, identityN(3), 3, 2, 0);
  };
  CanvasKit.SkVector = {};
  CanvasKit.SkVector.dot = function(a, b) {
   if (skIsDebug && a.length !== b.length) {
    throw "Cannot perform dot product on arrays of different length (" + a.length + " vs " + b.length + ")";
   }
   return a.map(function(v, i) {
    return v * b[i];
   }).reduce(function(acc, cur) {
    return acc + cur;
   });
  };
  CanvasKit.SkVector.lengthSquared = function(v) {
   return CanvasKit.SkVector.dot(v, v);
  };
  CanvasKit.SkVector.length = function(v) {
   return Math.sqrt(CanvasKit.SkVector.lengthSquared(v));
  };
  CanvasKit.SkVector.mulScalar = function(v, s) {
   return v.map(function(i) {
    return i * s;
   });
  };
  CanvasKit.SkVector.add = function(a, b) {
   return a.map(function(v, i) {
    return v + b[i];
   });
  };
  CanvasKit.SkVector.sub = function(a, b) {
   return a.map(function(v, i) {
    return v - b[i];
   });
  };
  CanvasKit.SkVector.dist = function(a, b) {
   return CanvasKit.SkVector.length(CanvasKit.SkVector.sub(a, b));
  };
  CanvasKit.SkVector.normalize = function(v) {
   return CanvasKit.SkVector.mulScalar(v, 1 / CanvasKit.SkVector.length(v));
  };
  CanvasKit.SkVector.cross = function(a, b) {
   if (skIsDebug && (a.length !== 3 || a.length !== 3)) {
    throw "Cross product is only defined for 3-dimensional vectors (a.length=" + a.length + ", b.length=" + b.length + ")";
   }
   return [ a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0] ];
  };
  CanvasKit.SkM44 = {};
  CanvasKit.SkM44.identity = function() {
   return identityN(4);
  };
  CanvasKit.SkM44.translated = function(vec) {
   return stride(vec, identityN(4), 4, 3, 0);
  };
  CanvasKit.SkM44.scaled = function(vec) {
   return stride(vec, identityN(4), 4, 0, 1);
  };
  CanvasKit.SkM44.rotated = function(axisVec, radians) {
   return CanvasKit.SkM44.rotatedUnitSinCos(CanvasKit.SkVector.normalize(axisVec), Math.sin(radians), Math.cos(radians));
  };
  CanvasKit.SkM44.rotatedUnitSinCos = function(axisVec, sinAngle, cosAngle) {
   var x = axisVec[0];
   var y = axisVec[1];
   var z = axisVec[2];
   var c = cosAngle;
   var s = sinAngle;
   var t = 1 - c;
   return [ t * x * x + c, t * x * y - s * z, t * x * z + s * y, 0, t * x * y + s * z, t * y * y + c, t * y * z - s * x, 0, t * x * z - s * y, t * y * z + s * x, t * z * z + c, 0, 0, 0, 0, 1 ];
  };
  CanvasKit.SkM44.lookat = function(eyeVec, centerVec, upVec) {
   var f = CanvasKit.SkVector.normalize(CanvasKit.SkVector.sub(centerVec, eyeVec));
   var u = CanvasKit.SkVector.normalize(upVec);
   var s = CanvasKit.SkVector.normalize(CanvasKit.SkVector.cross(f, u));
   var m = CanvasKit.SkM44.identity();
   stride(s, m, 4, 0, 0);
   stride(CanvasKit.SkVector.cross(s, f), m, 4, 1, 0);
   stride(CanvasKit.SkVector.mulScalar(f, -1), m, 4, 2, 0);
   stride(eyeVec, m, 4, 3, 0);
   var m2 = CanvasKit.SkM44.invert(m);
   if (m2 === null) {
    return CanvasKit.SkM44.identity();
   }
   return m2;
  };
  CanvasKit.SkM44.perspective = function(near, far, angle) {
   if (skIsDebug && far <= near) {
    throw "far must be greater than near when constructing SkM44 using perspective.";
   }
   var dInv = 1 / (far - near);
   var halfAngle = angle / 2;
   var cot = Math.cos(halfAngle) / Math.sin(halfAngle);
   return [ cot, 0, 0, 0, 0, cot, 0, 0, 0, 0, (far + near) * dInv, 2 * far * near * dInv, 0, 0, -1, 1 ];
  };
  CanvasKit.SkM44.rc = function(m, r, c) {
   return m[r * 4 + c];
  };
  CanvasKit.SkM44.multiply = function() {
   return multiplyMany(4, arguments);
  };
  CanvasKit.SkM44.invert = function(m) {
   if (skIsDebug && !m.every(isnumber)) {
    throw "some members of matrix are NaN m=" + m;
   }
   var a00 = m[0];
   var a01 = m[4];
   var a02 = m[8];
   var a03 = m[12];
   var a10 = m[1];
   var a11 = m[5];
   var a12 = m[9];
   var a13 = m[13];
   var a20 = m[2];
   var a21 = m[6];
   var a22 = m[10];
   var a23 = m[14];
   var a30 = m[3];
   var a31 = m[7];
   var a32 = m[11];
   var a33 = m[15];
   var b00 = a00 * a11 - a01 * a10;
   var b01 = a00 * a12 - a02 * a10;
   var b02 = a00 * a13 - a03 * a10;
   var b03 = a01 * a12 - a02 * a11;
   var b04 = a01 * a13 - a03 * a11;
   var b05 = a02 * a13 - a03 * a12;
   var b06 = a20 * a31 - a21 * a30;
   var b07 = a20 * a32 - a22 * a30;
   var b08 = a20 * a33 - a23 * a30;
   var b09 = a21 * a32 - a22 * a31;
   var b10 = a21 * a33 - a23 * a31;
   var b11 = a22 * a33 - a23 * a32;
   var det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
   var invdet = 1 / det;
   if (det === 0 || invdet === Infinity) {
    SkDebug("Warning, uninvertible matrix");
    return null;
   }
   b00 *= invdet;
   b01 *= invdet;
   b02 *= invdet;
   b03 *= invdet;
   b04 *= invdet;
   b05 *= invdet;
   b06 *= invdet;
   b07 *= invdet;
   b08 *= invdet;
   b09 *= invdet;
   b10 *= invdet;
   b11 *= invdet;
   var tmp = [ a11 * b11 - a12 * b10 + a13 * b09, a12 * b08 - a10 * b11 - a13 * b07, a10 * b10 - a11 * b08 + a13 * b06, a11 * b07 - a10 * b09 - a12 * b06, a02 * b10 - a01 * b11 - a03 * b09, a00 * b11 - a02 * b08 + a03 * b07, a01 * b08 - a00 * b10 - a03 * b06, a00 * b09 - a01 * b07 + a02 * b06, a31 * b05 - a32 * b04 + a33 * b03, a32 * b02 - a30 * b05 - a33 * b01, a30 * b04 - a31 * b02 + a33 * b00, a31 * b01 - a30 * b03 - a32 * b00, a22 * b04 - a21 * b05 - a23 * b03, a20 * b05 - a22 * b02 + a23 * b01, a21 * b02 - a20 * b04 - a23 * b00, a20 * b03 - a21 * b01 + a22 * b00 ];
   if (!tmp.every(function(val) {
    return val !== NaN && val !== Infinity && val !== -Infinity;
   })) {
    SkDebug("inverted matrix contains infinities or NaN " + tmp);
    return null;
   }
   return tmp;
  };
  CanvasKit.SkM44.transpose = function(m) {
   return [ m[0], m[4], m[8], m[12], m[1], m[5], m[9], m[13], m[2], m[6], m[10], m[14], m[3], m[7], m[11], m[15] ];
  };
  CanvasKit.SkM44.mustInvert = function(m) {
   var m2 = CanvasKit.SkM44.invert(m);
   if (m2 === null) {
    throw "Matrix not invertible";
   }
   return m2;
  };
  CanvasKit.SkM44.setupCamera = function(area, zscale, cam) {
   var camera = CanvasKit.SkM44.lookat(cam["eye"], cam["coa"], cam["up"]);
   var perspective = CanvasKit.SkM44.perspective(cam["near"], cam["far"], cam["angle"]);
   var center = [ (area.fLeft + area.fRight) / 2, (area.fTop + area.fBottom) / 2, 0 ];
   var viewScale = [ (area.fRight - area.fLeft) / 2, (area.fBottom - area.fTop) / 2, zscale ];
   var viewport = CanvasKit.SkM44.multiply(CanvasKit.SkM44.translated(center), CanvasKit.SkM44.scaled(viewScale));
   return CanvasKit.SkM44.multiply(viewport, perspective, camera, CanvasKit.SkM44.mustInvert(viewport));
  };
  var rScale = 0;
  var gScale = 6;
  var bScale = 12;
  var aScale = 18;
  var rPostTrans = 4;
  var gPostTrans = 9;
  var bPostTrans = 14;
  var aPostTrans = 19;
  CanvasKit.SkColorMatrix = {};
  CanvasKit.SkColorMatrix.identity = function() {
   var m = new Float32Array(20);
   m[rScale] = 1;
   m[gScale] = 1;
   m[bScale] = 1;
   m[aScale] = 1;
   return m;
  };
  CanvasKit.SkColorMatrix.scaled = function(rs, gs, bs, as) {
   var m = new Float32Array(20);
   m[rScale] = rs;
   m[gScale] = gs;
   m[bScale] = bs;
   m[aScale] = as;
   return m;
  };
  var rotateIndices = [ [ 6, 7, 11, 12 ], [ 0, 10, 2, 12 ], [ 0, 1, 5, 6 ] ];
  CanvasKit.SkColorMatrix.rotated = function(axis, sine, cosine) {
   var m = CanvasKit.SkColorMatrix.identity();
   var indices = rotateIndices[axis];
   m[indices[0]] = cosine;
   m[indices[1]] = sine;
   m[indices[2]] = -sine;
   m[indices[3]] = cosine;
   return m;
  };
  CanvasKit.SkColorMatrix.postTranslate = function(m, dr, dg, db, da) {
   m[rPostTrans] += dr;
   m[gPostTrans] += dg;
   m[bPostTrans] += db;
   m[aPostTrans] += da;
   return m;
  };
  CanvasKit.SkColorMatrix.concat = function(outer, inner) {
   var m = new Float32Array(20);
   var index = 0;
   for (var j = 0; j < 20; j += 5) {
    for (var i = 0; i < 4; i++) {
     m[index++] = outer[j + 0] * inner[i + 0] + outer[j + 1] * inner[i + 5] + outer[j + 2] * inner[i + 10] + outer[j + 3] * inner[i + 15];
    }
    m[index++] = outer[j + 0] * inner[4] + outer[j + 1] * inner[9] + outer[j + 2] * inner[14] + outer[j + 3] * inner[19] + outer[j + 4];
   }
   return m;
  };
  CanvasKit.SkPath.MakeFromCmds = function(cmds) {
   var ptrLen = loadCmdsTypedArray(cmds);
   var path = CanvasKit.SkPath._MakeFromCmds(ptrLen[0], ptrLen[1]);
   CanvasKit._free(ptrLen[0]);
   return path;
  };
  CanvasKit.MakePathFromCmds = CanvasKit.SkPath.MakeFromCmds;
  CanvasKit.SkPath.MakeFromVerbsPointsWeights = function(verbs, pts, weights) {
   var verbsPtr = copy1dArray(verbs, "HEAPU8");
   var pointsPtr = copy1dArray(pts, "HEAPF32");
   var weightsPtr = copy1dArray(weights, "HEAPF32");
   var numWeights = weights && weights.length || 0;
   var path = CanvasKit.SkPath._MakeFromVerbsPointsWeights(verbsPtr, verbs.length, pointsPtr, pts.length, weightsPtr, numWeights);
   freeArraysThatAreNotMallocedByUsers(verbsPtr, verbs);
   freeArraysThatAreNotMallocedByUsers(pointsPtr, pts);
   freeArraysThatAreNotMallocedByUsers(weightsPtr, weights);
   return path;
  };
  CanvasKit.SkPath.prototype.addArc = function(oval, startAngle, sweepAngle) {
   this._addArc(oval, startAngle, sweepAngle);
   return this;
  };
  CanvasKit.SkPath.prototype.addOval = function(oval, isCCW, startIndex) {
   if (startIndex === undefined) {
    startIndex = 1;
   }
   this._addOval(oval, !!isCCW, startIndex);
   return this;
  };
  CanvasKit.SkPath.prototype.addPath = function() {
   var args = Array.prototype.slice.call(arguments);
   var path = args[0];
   var extend = false;
   if (typeof args[args.length - 1] === "boolean") {
    extend = args.pop();
   }
   if (args.length === 1) {
    this._addPath(path, 1, 0, 0, 0, 1, 0, 0, 0, 1, extend);
   } else if (args.length === 2) {
    var a = args[1];
    this._addPath(path, a[0], a[1], a[2], a[3], a[4], a[5], a[6] || 0, a[7] || 0, a[8] || 1, extend);
   } else if (args.length === 7 || args.length === 10) {
    var a = args;
    this._addPath(path, a[1], a[2], a[3], a[4], a[5], a[6], a[7] || 0, a[8] || 0, a[9] || 1, extend);
   } else {
    SkDebug("addPath expected to take 1, 2, 7, or 10 required args. Got " + args.length);
    return null;
   }
   return this;
  };
  CanvasKit.SkPath.prototype.addPoly = function(points, close) {
   var ptr;
   var n;
   if (points["_ck"]) {
    ptr = points.byteOffset;
    n = points.length / 2;
   } else {
    ptr = copy2dArray(points, "HEAPF32");
    n = points.length;
   }
   this._addPoly(ptr, n, close);
   freeArraysThatAreNotMallocedByUsers(ptr, points);
   return this;
  };
  CanvasKit.SkPath.prototype.addRect = function() {
   if (arguments.length === 1 || arguments.length === 2) {
    var r = arguments[0];
    var ccw = arguments[1] || false;
    this._addRect(r.fLeft, r.fTop, r.fRight, r.fBottom, ccw);
   } else if (arguments.length === 4 || arguments.length === 5) {
    var a = arguments;
    this._addRect(a[0], a[1], a[2], a[3], a[4] || false);
   } else {
    SkDebug("addRect expected to take 1, 2, 4, or 5 args. Got " + arguments.length);
    return null;
   }
   return this;
  };
  CanvasKit.SkPath.prototype.addRoundRect = function() {
   var args = arguments;
   if (args.length === 3 || args.length === 6) {
    var radii = args[args.length - 2];
   } else if (args.length === 4 || args.length === 7) {
    var rx = args[args.length - 3];
    var ry = args[args.length - 2];
    var radii = [ rx, ry, rx, ry, rx, ry, rx, ry ];
   } else {
    SkDebug("addRoundRect expected to take 3, 4, 6, or 7 args. Got " + args.length);
    return null;
   }
   if (radii.length !== 8) {
    SkDebug("addRoundRect needs 8 radii provided. Got " + radii.length);
    return null;
   }
   var rptr = copy1dArray(radii, "HEAPF32");
   if (args.length === 3 || args.length === 4) {
    var r = args[0];
    var ccw = args[args.length - 1];
    this._addRoundRect(r.fLeft, r.fTop, r.fRight, r.fBottom, rptr, ccw);
   } else if (args.length === 6 || args.length === 7) {
    var a = args;
    this._addRoundRect(a[0], a[1], a[2], a[3], rptr, ccw);
   }
   freeArraysThatAreNotMallocedByUsers(rptr, radii);
   return this;
  };
  CanvasKit.SkPath.prototype.addVerbsPointsWeights = function(verbs, points, weights) {
   var verbsPtr = copy1dArray(verbs, "HEAPU8");
   var pointsPtr = copy1dArray(points, "HEAPF32");
   var weightsPtr = copy1dArray(weights, "HEAPF32");
   var numWeights = weights && weights.length || 0;
   this._addVerbsPointsWeights(verbsPtr, verbs.length, pointsPtr, points.length, weightsPtr, numWeights);
   freeArraysThatAreNotMallocedByUsers(verbsPtr, verbs);
   freeArraysThatAreNotMallocedByUsers(pointsPtr, points);
   freeArraysThatAreNotMallocedByUsers(weightsPtr, weights);
  };
  CanvasKit.SkPath.prototype.arc = function(x, y, radius, startAngle, endAngle, ccw) {
   var bounds = CanvasKit.LTRBRect(x - radius, y - radius, x + radius, y + radius);
   var sweep = radiansToDegrees(endAngle - startAngle) - 360 * !!ccw;
   var temp = new CanvasKit.SkPath();
   temp.addArc(bounds, radiansToDegrees(startAngle), sweep);
   this.addPath(temp, true);
   temp.delete();
   return this;
  };
  CanvasKit.SkPath.prototype.arcTo = function() {
   var args = arguments;
   if (args.length === 5) {
    this._arcToTangent(args[0], args[1], args[2], args[3], args[4]);
   } else if (args.length === 4) {
    this._arcToOval(args[0], args[1], args[2], args[3]);
   } else if (args.length === 7) {
    this._arcToRotated(args[0], args[1], args[2], !!args[3], !!args[4], args[5], args[6]);
   } else {
    throw "Invalid args for arcTo. Expected 4, 5, or 7, got " + args.length;
   }
   return this;
  };
  CanvasKit.SkPath.prototype.arcToOval = function(oval, startAngle, sweepAngle, forceMoveTo) {
   this._arcToOval(oval, startAngle, sweepAngle, forceMoveTo);
   return this;
  };
  CanvasKit.SkPath.prototype.arcToRotated = function(rx, ry, xAxisRotate, useSmallArc, isCCW, x, y) {
   this._arcToRotated(rx, ry, xAxisRotate, !!useSmallArc, !!isCCW, x, y);
   return this;
  };
  CanvasKit.SkPath.prototype.arcToTangent = function(x1, y1, x2, y2, radius) {
   this._arcToTangent(x1, y1, x2, y2, radius);
   return this;
  };
  CanvasKit.SkPath.prototype.close = function() {
   this._close();
   return this;
  };
  CanvasKit.SkPath.prototype.conicTo = function(x1, y1, x2, y2, w) {
   this._conicTo(x1, y1, x2, y2, w);
   return this;
  };
  CanvasKit.SkPath.prototype.cubicTo = function(cp1x, cp1y, cp2x, cp2y, x, y) {
   this._cubicTo(cp1x, cp1y, cp2x, cp2y, x, y);
   return this;
  };
  CanvasKit.SkPath.prototype.dash = function(on, off, phase) {
   if (this._dash(on, off, phase)) {
    return this;
   }
   return null;
  };
  CanvasKit.SkPath.prototype.lineTo = function(x, y) {
   this._lineTo(x, y);
   return this;
  };
  CanvasKit.SkPath.prototype.moveTo = function(x, y) {
   this._moveTo(x, y);
   return this;
  };
  CanvasKit.SkPath.prototype.offset = function(dx, dy) {
   this._transform(1, 0, dx, 0, 1, dy, 0, 0, 1);
   return this;
  };
  CanvasKit.SkPath.prototype.quadTo = function(cpx, cpy, x, y) {
   this._quadTo(cpx, cpy, x, y);
   return this;
  };
  CanvasKit.SkPath.prototype.rArcTo = function(rx, ry, xAxisRotate, useSmallArc, isCCW, dx, dy) {
   this._rArcTo(rx, ry, xAxisRotate, useSmallArc, isCCW, dx, dy);
   return this;
  };
  CanvasKit.SkPath.prototype.rConicTo = function(dx1, dy1, dx2, dy2, w) {
   this._rConicTo(dx1, dy1, dx2, dy2, w);
   return this;
  };
  CanvasKit.SkPath.prototype.rCubicTo = function(cp1x, cp1y, cp2x, cp2y, x, y) {
   this._rCubicTo(cp1x, cp1y, cp2x, cp2y, x, y);
   return this;
  };
  CanvasKit.SkPath.prototype.rLineTo = function(dx, dy) {
   this._rLineTo(dx, dy);
   return this;
  };
  CanvasKit.SkPath.prototype.rMoveTo = function(dx, dy) {
   this._rMoveTo(dx, dy);
   return this;
  };
  CanvasKit.SkPath.prototype.rQuadTo = function(cpx, cpy, x, y) {
   this._rQuadTo(cpx, cpy, x, y);
   return this;
  };
  CanvasKit.SkPath.prototype.stroke = function(opts) {
   opts = opts || {};
   opts["width"] = opts["width"] || 1;
   opts["miter_limit"] = opts["miter_limit"] || 4;
   opts["cap"] = opts["cap"] || CanvasKit.StrokeCap.Butt;
   opts["join"] = opts["join"] || CanvasKit.StrokeJoin.Miter;
   opts["precision"] = opts["precision"] || 1;
   if (this._stroke(opts)) {
    return this;
   }
   return null;
  };
  CanvasKit.SkPath.prototype.transform = function() {
   if (arguments.length === 1) {
    var a = arguments[0];
    this._transform(a[0], a[1], a[2], a[3], a[4], a[5], a[6] || 0, a[7] || 0, a[8] || 1);
   } else if (arguments.length === 6 || arguments.length === 9) {
    var a = arguments;
    this._transform(a[0], a[1], a[2], a[3], a[4], a[5], a[6] || 0, a[7] || 0, a[8] || 1);
   } else {
    throw "transform expected to take 1 or 9 arguments. Got " + arguments.length;
   }
   return this;
  };
  CanvasKit.SkPath.prototype.trim = function(startT, stopT, isComplement) {
   if (this._trim(startT, stopT, !!isComplement)) {
    return this;
   }
   return null;
  };
  CanvasKit.SkImage.prototype.encodeToData = function() {
   if (!arguments.length) {
    return this._encodeToData();
   }
   if (arguments.length === 2) {
    var a = arguments;
    return this._encodeToDataWithFormat(a[0], a[1]);
   }
   throw "encodeToData expected to take 0 or 2 arguments. Got " + arguments.length;
  };
  CanvasKit.SkImage.prototype.makeShader = function(xTileMode, yTileMode, localMatrix) {
   var localMatrixPtr = copy3x3MatrixToWasm(localMatrix);
   return this._makeShader(xTileMode, yTileMode, localMatrixPtr);
  };
  CanvasKit.SkImage.prototype.readPixels = function(imageInfo, srcX, srcY) {
   var rowBytes;
   switch (imageInfo["colorType"]) {
   case CanvasKit.ColorType.RGBA_8888:
    rowBytes = imageInfo.width * 4;
    break;

   case CanvasKit.ColorType.RGBA_F32:
    rowBytes = imageInfo.width * 16;
    break;

   default:
    SkDebug("Colortype not yet supported");
    return;
   }
   var pBytes = rowBytes * imageInfo.height;
   var pPtr = CanvasKit._malloc(pBytes);
   if (!this._readPixels(imageInfo, pPtr, rowBytes, srcX, srcY)) {
    SkDebug("Could not read pixels with the given inputs");
    return null;
   }
   var retVal = null;
   switch (imageInfo["colorType"]) {
   case CanvasKit.ColorType.RGBA_8888:
    retVal = new Uint8Array(CanvasKit.HEAPU8.buffer, pPtr, pBytes).slice();
    break;

   case CanvasKit.ColorType.RGBA_F32:
    retVal = new Float32Array(CanvasKit.HEAPU8.buffer, pPtr, pBytes).slice();
    break;
   }
   CanvasKit._free(pPtr);
   return retVal;
  };
  CanvasKit.SkCanvas.prototype.clear = function(color4f) {
   var cPtr = copyColorToWasm(color4f);
   this._clear(cPtr);
  };
  CanvasKit.SkCanvas.prototype.concat = function(matr) {
   var matrPtr = copy4x4MatrixToWasm(matr);
   this._concat(matrPtr);
  };
  CanvasKit.SkCanvas.prototype.concat44 = CanvasKit.SkCanvas.prototype.concat;
  CanvasKit.SkCanvas.prototype.drawAtlas = function(atlas, srcRects, dstXforms, paint, blendMode, colors) {
   if (!atlas || !paint || !srcRects || !dstXforms) {
    SkDebug("Doing nothing since missing a required input");
    return;
   }
   if (srcRects.length !== dstXforms.length) {
    SkDebug("Doing nothing since input arrays length mismatches");
    return;
   }
   if (!blendMode) {
    blendMode = CanvasKit.BlendMode.SrcOver;
   }
   var srcRectPtr;
   if (srcRects.build) {
    srcRectPtr = srcRects.build();
   } else {
    srcRectPtr = copy1dArray(srcRects, "HEAPF32");
   }
   var count = 1;
   var dstXformPtr;
   if (dstXforms.build) {
    dstXformPtr = dstXforms.build();
    count = dstXforms.length;
   } else {
    dstXformPtr = copy1dArray(dstXforms, "HEAPF32");
    count = dstXforms.length / 4;
   }
   var colorPtr = nullptr;
   if (colors) {
    if (colors.build) {
     colorPtr = colors.build();
    } else {
     colorPtr = copy1dArray(assureIntColors(colors), "HEAPU32");
    }
   }
   this._drawAtlas(atlas, dstXformPtr, srcRectPtr, colorPtr, count, blendMode, paint);
   if (srcRectPtr && !srcRects.build) {
    freeArraysThatAreNotMallocedByUsers(srcRectPtr, srcRects);
   }
   if (dstXformPtr && !dstXforms.build) {
    freeArraysThatAreNotMallocedByUsers(dstXformPtr, dstXforms);
   }
   if (colorPtr && !colors.build) {
    freeArraysThatAreNotMallocedByUsers(colorPtr, colors);
   }
  };
  CanvasKit.SkCanvas.prototype.drawColor = function(color4f, mode) {
   var cPtr = copyColorToWasm(color4f);
   if (mode !== undefined) {
    this._drawColor(cPtr, mode);
   } else {
    this._drawColor(cPtr);
   }
  };
  CanvasKit.SkCanvas.prototype.drawColorComponents = function(r, g, b, a, mode) {
   var cPtr = copyColorComponentsToWasm(r, g, b, a);
   if (mode !== undefined) {
    this._drawColor(cPtr, mode);
   } else {
    this._drawColor(cPtr);
   }
  };
  CanvasKit.SkCanvas.prototype.drawPoints = function(mode, points, paint) {
   var ptr;
   var n;
   if (points["_ck"]) {
    ptr = points.byteOffset;
    n = points.length / 2;
   } else {
    ptr = copy2dArray(points, "HEAPF32");
    n = points.length;
   }
   this._drawPoints(mode, ptr, n, paint);
   freeArraysThatAreNotMallocedByUsers(ptr, points);
  };
  CanvasKit.SkCanvas.prototype.drawShadow = function(path, zPlaneParams, lightPos, lightRadius, ambientColor, spotColor, flags) {
   var ambiPtr = copyColorToWasmNoScratch(ambientColor);
   var spotPtr = copyColorToWasmNoScratch(spotColor);
   this._drawShadow(path, zPlaneParams, lightPos, lightRadius, ambiPtr, spotPtr, flags);
   freeArraysThatAreNotMallocedByUsers(ambiPtr, ambientColor);
   freeArraysThatAreNotMallocedByUsers(spotPtr, spotColor);
  };
  CanvasKit.SkCanvas.prototype.getLocalToDevice = function() {
   this._getLocalToDevice(_scratch4x4MatrixPtr);
   return copy4x4MatrixFromWasm(_scratch4x4MatrixPtr);
  };
  CanvasKit.SkCanvas.prototype.findMarkedCTM = function(marker) {
   var found = this._findMarkedCTM(marker, _scratch4x4MatrixPtr);
   if (!found) {
    return null;
   }
   return copy4x4MatrixFromWasm(_scratch4x4MatrixPtr);
  };
  CanvasKit.SkCanvas.prototype.getTotalMatrix = function() {
   this._getTotalMatrix(_scratch3x3MatrixPtr);
   var rv = new Array(9);
   for (var i = 0; i < 9; i++) {
    rv[i] = CanvasKit.HEAPF32[_scratch3x3MatrixPtr / 4 + i];
   }
   return rv;
  };
  CanvasKit.SkCanvas.prototype.readPixels = function(x, y, w, h, alphaType, colorType, colorSpace, dstRowBytes) {
   alphaType = alphaType || CanvasKit.AlphaType.Unpremul;
   colorType = colorType || CanvasKit.ColorType.RGBA_8888;
   colorSpace = colorSpace || CanvasKit.SkColorSpace.SRGB;
   var pixBytes = 4;
   if (colorType === CanvasKit.ColorType.RGBA_F16) {
    pixBytes = 8;
   }
   dstRowBytes = dstRowBytes || pixBytes * w;
   var len = h * dstRowBytes;
   var pptr = CanvasKit._malloc(len);
   var ok = this._readPixels({
    "width": w,
    "height": h,
    "colorType": colorType,
    "alphaType": alphaType,
    "colorSpace": colorSpace
   }, pptr, dstRowBytes, x, y);
   if (!ok) {
    CanvasKit._free(pptr);
    return null;
   }
   var pixels = new Uint8Array(CanvasKit.HEAPU8.buffer, pptr, len).slice();
   CanvasKit._free(pptr);
   return pixels;
  };
  CanvasKit.SkCanvas.prototype.writePixels = function(pixels, srcWidth, srcHeight, destX, destY, alphaType, colorType, colorSpace) {
   if (pixels.byteLength % (srcWidth * srcHeight)) {
    throw "pixels length must be a multiple of the srcWidth * srcHeight";
   }
   var bytesPerPixel = pixels.byteLength / (srcWidth * srcHeight);
   alphaType = alphaType || CanvasKit.AlphaType.Unpremul;
   colorType = colorType || CanvasKit.ColorType.RGBA_8888;
   colorSpace = colorSpace || CanvasKit.SkColorSpace.SRGB;
   var srcRowBytes = bytesPerPixel * srcWidth;
   var pptr = copy1dArray(pixels, "HEAPU8");
   var ok = this._writePixels({
    "width": srcWidth,
    "height": srcHeight,
    "colorType": colorType,
    "alphaType": alphaType,
    "colorSpace": colorSpace
   }, pptr, srcRowBytes, destX, destY);
   freeArraysThatAreNotMallocedByUsers(pptr, pixels);
   return ok;
  };
  CanvasKit.SkColorFilter.MakeBlend = function(color4f, mode) {
   var cPtr = copyColorToWasm(color4f);
   var result = CanvasKit.SkColorFilter._MakeBlend(cPtr, mode);
   return result;
  };
  CanvasKit.SkColorFilter.MakeMatrix = function(colorMatrix) {
   if (!colorMatrix || colorMatrix.length !== 20) {
    throw "invalid color matrix";
   }
   var fptr = copy1dArray(colorMatrix, "HEAPF32");
   var m = CanvasKit.SkColorFilter._makeMatrix(fptr);
   freeArraysThatAreNotMallocedByUsers(fptr, colorMatrix);
   return m;
  };
  CanvasKit.SkImageFilter.MakeMatrixTransform = function(matr, filterQuality, input) {
   var matrPtr = copy3x3MatrixToWasm(matr);
   return CanvasKit.SkImageFilter._MakeMatrixTransform(matrPtr, filterQuality, input);
  };
  CanvasKit.SkPaint.prototype.getColor = function() {
   this._getColor(_scratchColorPtr);
   return copyColorFromWasm(_scratchColorPtr);
  };
  CanvasKit.SkPaint.prototype.setColor = function(color4f, colorSpace) {
   colorSpace = colorSpace || null;
   var cPtr = copyColorToWasm(color4f);
   this._setColor(cPtr, colorSpace);
  };
  CanvasKit.SkPaint.prototype.setColorComponents = function(r, g, b, a, colorSpace) {
   colorSpace = colorSpace || null;
   var cPtr = copyColorComponentsToWasm(r, g, b, a);
   this._setColor(cPtr, colorSpace);
  };
  CanvasKit.SkSurface.prototype.captureFrameAsSkPicture = function(drawFrame) {
   var spr = new CanvasKit.SkPictureRecorder();
   var canvas = spr.beginRecording(CanvasKit.LTRBRect(0, 0, this.width(), this.height()));
   drawFrame(canvas);
   var pic = spr.finishRecordingAsPicture();
   spr.delete();
   return pic;
  };
  CanvasKit.SkSurface.prototype.requestAnimationFrame = function(callback, dirtyRect) {
   if (!this._cached_canvas) {
    this._cached_canvas = this.getCanvas();
   }
   requestAnimationFrame(function() {
    if (this._context !== undefined) {
     CanvasKit.setCurrentContext(this._context);
    }
    callback(this._cached_canvas);
    this.flush(dirtyRect);
   }.bind(this));
  };
  CanvasKit.SkSurface.prototype.drawOnce = function(callback, dirtyRect) {
   if (!this._cached_canvas) {
    this._cached_canvas = this.getCanvas();
   }
   requestAnimationFrame(function() {
    if (this._context !== undefined) {
     CanvasKit.setCurrentContext(this._context);
    }
    callback(this._cached_canvas);
    this.flush(dirtyRect);
    this.dispose();
   }.bind(this));
  };
  CanvasKit.SkPathEffect.MakeDash = function(intervals, phase) {
   if (!phase) {
    phase = 0;
   }
   if (!intervals.length || intervals.length % 2 === 1) {
    throw "Intervals array must have even length";
   }
   var ptr = copy1dArray(intervals, "HEAPF32");
   var dpe = CanvasKit.SkPathEffect._MakeDash(ptr, intervals.length, phase);
   freeArraysThatAreNotMallocedByUsers(ptr, intervals);
   return dpe;
  };
  CanvasKit.SkShader.Color = function(color4f, colorSpace) {
   colorSpace = colorSpace || null;
   var cPtr = copyColorToWasm(color4f);
   var result = CanvasKit.SkShader._Color(cPtr, colorSpace);
   return result;
  };
  CanvasKit.SkShader.MakeLinearGradient = function(start, end, colors, pos, mode, localMatrix, flags, colorSpace) {
   colorSpace = colorSpace || null;
   var cPtrInfo = copyFlexibleColorArray(colors);
   var posPtr = copy1dArray(pos, "HEAPF32");
   flags = flags || 0;
   var localMatrixPtr = copy3x3MatrixToWasm(localMatrix);
   var lgs = CanvasKit._MakeLinearGradientShader(start, end, cPtrInfo.colorPtr, cPtrInfo.colorType, posPtr, cPtrInfo.count, mode, flags, localMatrixPtr, colorSpace);
   freeArraysThatAreNotMallocedByUsers(cPtrInfo.colorPtr, colors);
   pos && freeArraysThatAreNotMallocedByUsers(posPtr, pos);
   return lgs;
  };
  CanvasKit.SkShader.MakeRadialGradient = function(center, radius, colors, pos, mode, localMatrix, flags, colorSpace) {
   colorSpace = colorSpace || null;
   var cPtrInfo = copyFlexibleColorArray(colors);
   var posPtr = copy1dArray(pos, "HEAPF32");
   flags = flags || 0;
   var localMatrixPtr = copy3x3MatrixToWasm(localMatrix);
   var rgs = CanvasKit._MakeRadialGradientShader(center, radius, cPtrInfo.colorPtr, cPtrInfo.colorType, posPtr, cPtrInfo.count, mode, flags, localMatrixPtr, colorSpace);
   freeArraysThatAreNotMallocedByUsers(cPtrInfo.colorPtr, colors);
   pos && freeArraysThatAreNotMallocedByUsers(posPtr, pos);
   return rgs;
  };
  CanvasKit.SkShader.MakeSweepGradient = function(cx, cy, colors, pos, mode, localMatrix, flags, startAngle, endAngle, colorSpace) {
   colorSpace = colorSpace || null;
   var cPtrInfo = copyFlexibleColorArray(colors);
   var posPtr = copy1dArray(pos, "HEAPF32");
   flags = flags || 0;
   startAngle = startAngle || 0;
   endAngle = endAngle || 360;
   var localMatrixPtr = copy3x3MatrixToWasm(localMatrix);
   var sgs = CanvasKit._MakeSweepGradientShader(cx, cy, cPtrInfo.colorPtr, cPtrInfo.colorType, posPtr, cPtrInfo.count, mode, startAngle, endAngle, flags, localMatrixPtr, colorSpace);
   freeArraysThatAreNotMallocedByUsers(cPtrInfo.colorPtr, colors);
   pos && freeArraysThatAreNotMallocedByUsers(posPtr, pos);
   return sgs;
  };
  CanvasKit.SkShader.MakeTwoPointConicalGradient = function(start, startRadius, end, endRadius, colors, pos, mode, localMatrix, flags, colorSpace) {
   colorSpace = colorSpace || null;
   var cPtrInfo = copyFlexibleColorArray(colors);
   var posPtr = copy1dArray(pos, "HEAPF32");
   flags = flags || 0;
   var localMatrixPtr = copy3x3MatrixToWasm(localMatrix);
   var rgs = CanvasKit._MakeTwoPointConicalGradientShader(start, startRadius, end, endRadius, cPtrInfo.colorPtr, cPtrInfo.colorType, posPtr, cPtrInfo.count, mode, flags, localMatrixPtr, colorSpace);
   freeArraysThatAreNotMallocedByUsers(cPtrInfo.colorPtr, colors);
   pos && freeArraysThatAreNotMallocedByUsers(posPtr, pos);
   return rgs;
  };
  CanvasKit.MakeSkDashPathEffect = CanvasKit.SkPathEffect.MakeDash;
  CanvasKit.MakeLinearGradientShader = CanvasKit.SkShader.MakeLinearGradient;
  CanvasKit.MakeRadialGradientShader = CanvasKit.SkShader.MakeRadialGradient;
  CanvasKit.MakeTwoPointConicalGradientShader = CanvasKit.SkShader.MakeTwoPointConicalGradient;
  if (CanvasKit._extraInitializations) {
   CanvasKit._extraInitializations.forEach(function(init) {
    init();
   });
  }
 };
 CanvasKit.computeTonalColors = function(tonalColors) {
  var cPtrAmbi = copyColorToWasmNoScratch(tonalColors["ambient"]);
  var cPtrSpot = copyColorToWasmNoScratch(tonalColors["spot"]);
  this._computeTonalColors(cPtrAmbi, cPtrSpot);
  var result = {
   "ambient": copyColorFromWasm(cPtrAmbi),
   "spot": copyColorFromWasm(cPtrSpot)
  };
  freeArraysThatAreNotMallocedByUsers(cPtrAmbi, tonalColors["ambient"]);
  freeArraysThatAreNotMallocedByUsers(cPtrSpot, tonalColors["spot"]);
  return result;
 };
 CanvasKit.LTRBRect = function(l, t, r, b) {
  return {
   fLeft: l,
   fTop: t,
   fRight: r,
   fBottom: b
  };
 };
 CanvasKit.XYWHRect = function(x, y, w, h) {
  return {
   fLeft: x,
   fTop: y,
   fRight: x + w,
   fBottom: y + h
  };
 };
 CanvasKit.RRectXY = function(rect, rx, ry) {
  return {
   rect: rect,
   rx1: rx,
   ry1: ry,
   rx2: rx,
   ry2: ry,
   rx3: rx,
   ry3: ry,
   rx4: rx,
   ry4: ry
  };
 };
 CanvasKit.MakeAnimatedImageFromEncoded = function(data) {
  data = new Uint8Array(data);
  var iptr = CanvasKit._malloc(data.byteLength);
  CanvasKit.HEAPU8.set(data, iptr);
  var img = CanvasKit._decodeAnimatedImage(iptr, data.byteLength);
  if (!img) {
   SkDebug("Could not decode animated image");
   return null;
  }
  return img;
 };
 CanvasKit.MakeImageFromEncoded = function(data) {
  data = new Uint8Array(data);
  var iptr = CanvasKit._malloc(data.byteLength);
  CanvasKit.HEAPU8.set(data, iptr);
  var img = CanvasKit._decodeImage(iptr, data.byteLength);
  if (!img) {
   SkDebug("Could not decode image");
   return null;
  }
  return img;
 };
 var memoizedCanvas2dElement = null;
 CanvasKit.MakeImageFromCanvasImageSource = function(canvasImageSource) {
  var width = canvasImageSource.width;
  var height = canvasImageSource.height;
  if (!memoizedCanvas2dElement) {
   memoizedCanvas2dElement = document.createElement("canvas");
  }
  memoizedCanvas2dElement.width = width;
  memoizedCanvas2dElement.height = height;
  var ctx2d = memoizedCanvas2dElement.getContext("2d");
  ctx2d.drawImage(canvasImageSource, 0, 0);
  var imageData = ctx2d.getImageData(0, 0, width, height);
  return CanvasKit.MakeImage(imageData.data, width, height, CanvasKit.AlphaType.Unpremul, CanvasKit.ColorType.RGBA_8888, CanvasKit.SkColorSpace.SRGB);
 };
 CanvasKit.MakeImage = function(pixels, width, height, alphaType, colorType, colorSpace) {
  var bytesPerPixel = pixels.length / (width * height);
  var info = {
   "width": width,
   "height": height,
   "alphaType": alphaType,
   "colorType": colorType,
   "colorSpace": colorSpace
  };
  var pptr = copy1dArray(pixels, "HEAPU8");
  return CanvasKit._MakeImage(info, pptr, pixels.length, width * bytesPerPixel);
 };
 CanvasKit.MakeSkVertices = function(mode, positions, textureCoordinates, colors, indices, isVolatile) {
  isVolatile = isVolatile === undefined ? true : isVolatile;
  var idxCount = indices && indices.length || 0;
  var flags = 0;
  if (textureCoordinates && textureCoordinates.length) {
   flags |= 1 << 0;
  }
  if (colors && colors.length) {
   flags |= 1 << 1;
  }
  if (!isVolatile) {
   flags |= 1 << 2;
  }
  var builder = new CanvasKit._SkVerticesBuilder(mode, positions.length, idxCount, flags);
  copy2dArray(positions, "HEAPF32", builder.positions());
  if (builder.texCoords()) {
   copy2dArray(textureCoordinates, "HEAPF32", builder.texCoords());
  }
  if (builder.colors()) {
   if (colors.build) {
    throw "Color builder not accepted by MakeSkVertices, use array of ints";
   } else {
    copy1dArray(assureIntColors(colors), "HEAPU32", builder.colors());
   }
  }
  if (builder.indices()) {
   copy1dArray(indices, "HEAPU16", builder.indices());
  }
  return builder.detach();
 };
 (function(CanvasKit) {
  CanvasKit._extraInitializations = CanvasKit._extraInitializations || [];
  CanvasKit._extraInitializations.push(function() {
   CanvasKit.Paragraph.prototype.getRectsForRange = function(start, end, hStyle, wStyle) {
    var floatArray = this._getRectsForRange(start, end, hStyle, wStyle);
    if (!floatArray || !floatArray.length) {
     return [];
    }
    var ret = [];
    for (var i = 0; i < floatArray.length; i += 5) {
     var r = CanvasKit.LTRBRect(floatArray[i], floatArray[i + 1], floatArray[i + 2], floatArray[i + 3]);
     if (floatArray[i + 4] === 0) {
      r["direction"] = CanvasKit.TextDirection.RTL;
     } else {
      r["direction"] = CanvasKit.TextDirection.LTR;
     }
     ret.push(r);
    }
    CanvasKit._free(floatArray.byteOffset);
    return ret;
   };
   CanvasKit.TypefaceFontProvider.prototype.registerFont = function(font, family) {
    var typeface = CanvasKit.SkFontMgr.RefDefault().MakeTypefaceFromData(font);
    if (!typeface) {
     SkDebug("Could not decode font data");
     return null;
    }
    var familyPtr = cacheOrCopyString(family);
    this._registerFont(typeface, familyPtr);
   };
   CanvasKit.ParagraphStyle = function(s) {
    s["disableHinting"] = s["disableHinting"] || false;
    if (s["ellipsis"]) {
     var str = s["ellipsis"];
     s["_ellipsisPtr"] = cacheOrCopyString(str);
     s["_ellipsisLen"] = lengthBytesUTF8(str) + 1;
    } else {
     s["_ellipsisPtr"] = nullptr;
     s["_ellipsisLen"] = 0;
    }
    s["heightMultiplier"] = s["heightMultiplier"] || 0;
    s["maxLines"] = s["maxLines"] || 0;
    s["textAlign"] = s["textAlign"] || CanvasKit.TextAlign.Start;
    s["textDirection"] = s["textDirection"] || CanvasKit.TextDirection.LTR;
    s["textStyle"] = CanvasKit.TextStyle(s["textStyle"]);
    return s;
   };
   function fontStyle(s) {
    s = s || {};
    if (s["weight"] === undefined) {
     s["weight"] = CanvasKit.FontWeight.Normal;
    }
    s["width"] = s["width"] || CanvasKit.FontWidth.Normal;
    s["slant"] = s["slant"] || CanvasKit.FontSlant.Upright;
    return s;
   }
   CanvasKit.TextStyle = function(s) {
    if (!s["color"]) {
     s["color"] = CanvasKit.BLACK;
    }
    s["decoration"] = s["decoration"] || 0;
    s["decorationThickness"] = s["decorationThickness"] || 0;
    s["fontSize"] = s["fontSize"] || 0;
    s["fontStyle"] = fontStyle(s["fontStyle"]);
    return s;
   };
   function naiveCopyStrArray(strings) {
    if (!strings || !strings.length) {
     return nullptr;
    }
    var sPtrs = [];
    for (var i = 0; i < strings.length; i++) {
     var strPtr = cacheOrCopyString(strings[i]);
     sPtrs.push(strPtr);
    }
    return copy1dArray(sPtrs, "HEAPU32");
   }
   var stringCache = {};
   function cacheOrCopyString(str) {
    if (stringCache[str]) {
     return stringCache[str];
    }
    var strLen = lengthBytesUTF8(str) + 1;
    var strPtr = CanvasKit._malloc(strLen);
    stringToUTF8(str, strPtr, strLen);
    stringCache[str] = strPtr;
    return strPtr;
   }
   var scratchForegroundColorPtr = CanvasKit._malloc(4 * 4);
   var scratchBackgroundColorPtr = CanvasKit._malloc(4 * 4);
   function copyArrays(textStyle) {
    textStyle["_colorPtr"] = copyColorToWasm(textStyle["color"]);
    textStyle["_foregroundColorPtr"] = nullptr;
    textStyle["_backgroundColorPtr"] = nullptr;
    if (textStyle["foregroundColor"]) {
     textStyle["_foregroundColorPtr"] = copyColorToWasm(textStyle["foregroundColor"], scratchForegroundColorPtr);
    }
    if (textStyle["backgroundColor"]) {
     textStyle["_backgroundColorPtr"] = copyColorToWasm(textStyle["backgroundColor"], scratchBackgroundColorPtr);
    }
    if (Array.isArray(textStyle["fontFamilies"]) && textStyle["fontFamilies"].length) {
     textStyle["_fontFamiliesPtr"] = naiveCopyStrArray(textStyle["fontFamilies"]);
     textStyle["_fontFamiliesLen"] = textStyle["fontFamilies"].length;
    } else {
     textStyle["_fontFamiliesPtr"] = nullptr;
     textStyle["_fontFamiliesLen"] = 0;
     SkDebug("no font families provided, text may draw wrong or not at all");
    }
   }
   function freeArrays(textStyle) {
    CanvasKit._free(textStyle["_fontFamiliesPtr"]);
   }
   CanvasKit.ParagraphBuilder.Make = function(paragraphStyle, fontManager) {
    copyArrays(paragraphStyle["textStyle"]);
    var result = CanvasKit.ParagraphBuilder._Make(paragraphStyle, fontManager);
    freeArrays(paragraphStyle["textStyle"]);
    return result;
   };
   CanvasKit.ParagraphBuilder.MakeFromFontProvider = function(paragraphStyle, fontProvider) {
    copyArrays(paragraphStyle["textStyle"]);
    var result = CanvasKit.ParagraphBuilder._MakeFromFontProvider(paragraphStyle, fontProvider);
    freeArrays(paragraphStyle["textStyle"]);
    return result;
   };
   CanvasKit.ParagraphBuilder.prototype.pushStyle = function(textStyle) {
    copyArrays(textStyle);
    this._pushStyle(textStyle);
    freeArrays(textStyle);
   };
   CanvasKit.ParagraphBuilder.prototype.pushPaintStyle = function(textStyle, fg, bg) {
    copyArrays(textStyle);
    this._pushPaintStyle(textStyle, fg, bg);
    freeArrays(textStyle);
   };
  });
 })(Module);
 CanvasKit.MakeManagedAnimation = function(json, assets) {
  if (!CanvasKit._MakeManagedAnimation) {
   throw "Not compiled with MakeManagedAnimation";
  }
  if (!assets) {
   return CanvasKit._MakeManagedAnimation(json, 0, nullptr, nullptr, nullptr);
  }
  var assetNamePtrs = [];
  var assetDataPtrs = [];
  var assetSizes = [];
  var assetKeys = Object.keys(assets || {});
  for (var i = 0; i < assetKeys.length; i++) {
   var key = assetKeys[i];
   var buffer = assets[key];
   var data = new Uint8Array(buffer);
   var iptr = CanvasKit._malloc(data.byteLength);
   CanvasKit.HEAPU8.set(data, iptr);
   assetDataPtrs.push(iptr);
   assetSizes.push(data.byteLength);
   var strLen = lengthBytesUTF8(key) + 1;
   var strPtr = CanvasKit._malloc(strLen);
   stringToUTF8(key, strPtr, strLen);
   assetNamePtrs.push(strPtr);
  }
  var namesPtr = copy1dArray(assetNamePtrs, "HEAPU32");
  var assetsPtr = copy1dArray(assetDataPtrs, "HEAPU32");
  var assetSizesPtr = copy1dArray(assetSizes, "HEAPU32");
  var anim = CanvasKit._MakeManagedAnimation(json, assetKeys.length, namesPtr, assetsPtr, assetSizesPtr);
  CanvasKit._free(namesPtr);
  CanvasKit._free(assetsPtr);
  CanvasKit._free(assetSizesPtr);
  return anim;
 };
 (function(CanvasKit) {
  CanvasKit._extraInitializations = CanvasKit._extraInitializations || [];
  CanvasKit._extraInitializations.push(function() {
   CanvasKit.ManagedAnimation.prototype.setColor = function(key, color) {
    var cPtr = copyColorToWasm(color);
    this._setColor(key, cPtr);
   };
  });
 })(Module);
 CanvasKit.MakeParticles = function(json, assets) {
  if (!CanvasKit._MakeParticles) {
   throw "Not compiled with MakeParticles";
  }
  if (!assets) {
   return CanvasKit._MakeParticles(json, 0, nullptr, nullptr, nullptr);
  }
  var assetNamePtrs = [];
  var assetDataPtrs = [];
  var assetSizes = [];
  var assetKeys = Object.keys(assets || {});
  for (var i = 0; i < assetKeys.length; i++) {
   var key = assetKeys[i];
   var buffer = assets[key];
   var data = new Uint8Array(buffer);
   var iptr = CanvasKit._malloc(data.byteLength);
   CanvasKit.HEAPU8.set(data, iptr);
   assetDataPtrs.push(iptr);
   assetSizes.push(data.byteLength);
   var strLen = lengthBytesUTF8(key) + 1;
   var strPtr = CanvasKit._malloc(strLen);
   stringToUTF8(key, strPtr, strLen);
   assetNamePtrs.push(strPtr);
  }
  var namesPtr = copy1dArray(assetNamePtrs, "HEAPU32");
  var assetsPtr = copy1dArray(assetDataPtrs, "HEAPU32");
  var assetSizesPtr = copy1dArray(assetSizes, "HEAPU32");
  var particles = CanvasKit._MakeParticles(json, assetKeys.length, namesPtr, assetsPtr, assetSizesPtr);
  CanvasKit._free(namesPtr);
  CanvasKit._free(assetsPtr);
  CanvasKit._free(assetSizesPtr);
  return particles;
 };
 CanvasKit._extraInitializations = CanvasKit._extraInitializations || [];
 CanvasKit._extraInitializations.push(function() {
  CanvasKit.SkParticleEffect.prototype.effectUniforms = function() {
   var fptr = this._effectUniformPtr();
   var numFloats = this.getEffectUniformFloatCount();
   if (!fptr || numFloats <= 0) {
    return new Float32Array();
   }
   return new Float32Array(CanvasKit.HEAPU8.buffer, fptr, numFloats);
  };
  CanvasKit.SkParticleEffect.prototype.particleUniforms = function() {
   var fptr = this._particleUniformPtr();
   var numFloats = this.getParticleUniformFloatCount();
   if (!fptr || numFloats <= 0) {
    return new Float32Array();
   }
   return new Float32Array(CanvasKit.HEAPU8.buffer, fptr, numFloats);
  };
 });
 CanvasKit._extraInitializations = CanvasKit._extraInitializations || [];
 CanvasKit._extraInitializations.push(function() {
  CanvasKit.SkPath.prototype.op = function(otherPath, op) {
   if (this._op(otherPath, op)) {
    return this;
   }
   return null;
  };
  CanvasKit.SkPath.prototype.simplify = function() {
   if (this._simplify()) {
    return this;
   }
   return null;
  };
 });
 CanvasKit._extraInitializations = CanvasKit._extraInitializations || [];
 CanvasKit._extraInitializations.push(function() {
  CanvasKit.SkCanvas.prototype.drawText = function(str, x, y, paint, font) {
   if (typeof str === "string") {
    var strLen = lengthBytesUTF8(str);
    var strPtr = CanvasKit._malloc(strLen + 1);
    stringToUTF8(str, strPtr, strLen + 1);
    this._drawSimpleText(strPtr, strLen, x, y, font, paint);
   } else {
    this._drawShapedText(str, x, y, paint);
   }
  };
  CanvasKit.SkFont.prototype.getWidths = function(str) {
   var codePoints = str.length + 1;
   var strBytes = lengthBytesUTF8(str) + 1;
   var strPtr = CanvasKit._malloc(strBytes);
   stringToUTF8(str, strPtr, strBytes);
   var bytesPerFloat = 4;
   var widthPtr = CanvasKit._malloc(codePoints * bytesPerFloat);
   if (!this._getWidths(strPtr, strBytes, codePoints, widthPtr)) {
    SkDebug("Could not compute widths");
    CanvasKit._free(strPtr);
    CanvasKit._free(widthPtr);
    return null;
   }
   var widths = new Float32Array(CanvasKit.HEAPU8.buffer, widthPtr, codePoints);
   var retVal = Array.from(widths);
   CanvasKit._free(strPtr);
   CanvasKit._free(widthPtr);
   return retVal;
  };
  CanvasKit.SkFontMgr.FromData = function() {
   if (!arguments.length) {
    SkDebug("Could not make SkFontMgr from no font sources");
    return null;
   }
   var fonts = arguments;
   if (fonts.length === 1 && Array.isArray(fonts[0])) {
    fonts = arguments[0];
   }
   if (!fonts.length) {
    SkDebug("Could not make SkFontMgr from no font sources");
    return null;
   }
   var dPtrs = [];
   var sizes = [];
   for (var i = 0; i < fonts.length; i++) {
    var data = new Uint8Array(fonts[i]);
    var dptr = copy1dArray(data, "HEAPU8");
    dPtrs.push(dptr);
    sizes.push(data.byteLength);
   }
   var datasPtr = copy1dArray(dPtrs, "HEAPU32");
   var sizesPtr = copy1dArray(sizes, "HEAPU32");
   var fm = CanvasKit.SkFontMgr._fromData(datasPtr, sizesPtr, fonts.length);
   CanvasKit._free(datasPtr);
   CanvasKit._free(sizesPtr);
   return fm;
  };
  CanvasKit.SkFontMgr.prototype.MakeTypefaceFromData = function(fontData) {
   var data = new Uint8Array(fontData);
   var fptr = copy1dArray(data, "HEAPU8");
   var font = this._makeTypefaceFromData(fptr, data.byteLength);
   if (!font) {
    SkDebug("Could not decode font data");
    return null;
   }
   return font;
  };
  CanvasKit.SkTextBlob.MakeOnPath = function(str, path, font, initialOffset) {
   if (!str || !str.length) {
    SkDebug("ignoring 0 length string");
    return;
   }
   if (!path || !path.countPoints()) {
    SkDebug("ignoring empty path");
    return;
   }
   if (path.countPoints() === 1) {
    SkDebug("path has 1 point, returning normal textblob");
    return this.MakeFromText(str, font);
   }
   if (!initialOffset) {
    initialOffset = 0;
   }
   var widths = font.getWidths(str);
   var rsx = new CanvasKit.RSXFormBuilder();
   var meas = new CanvasKit.SkPathMeasure(path, false, 1);
   var dist = initialOffset;
   for (var i = 0; i < str.length; i++) {
    var width = widths[i];
    dist += width / 2;
    if (dist > meas.getLength()) {
     if (!meas.nextContour()) {
      str = str.substring(0, i);
      break;
     }
     dist = width / 2;
    }
    var xycs = meas.getPosTan(dist);
    var cx = xycs[0];
    var cy = xycs[1];
    var cosT = xycs[2];
    var sinT = xycs[3];
    var adjustedX = cx - width / 2 * cosT;
    var adjustedY = cy - width / 2 * sinT;
    rsx.push(cosT, sinT, adjustedX, adjustedY);
    dist += width / 2;
   }
   var retVal = this.MakeFromRSXform(str, rsx, font);
   rsx.delete();
   meas.delete();
   return retVal;
  };
  CanvasKit.SkTextBlob.MakeFromRSXform = function(str, rsxBuilder, font) {
   var strLen = lengthBytesUTF8(str) + 1;
   var strPtr = CanvasKit._malloc(strLen);
   stringToUTF8(str, strPtr, strLen);
   var rptr = rsxBuilder.build();
   var blob = CanvasKit.SkTextBlob._MakeFromRSXform(strPtr, strLen - 1, rptr, font);
   if (!blob) {
    SkDebug('Could not make textblob from string "' + str + '"');
    return null;
   }
   var origDelete = blob.delete.bind(blob);
   blob.delete = function() {
    CanvasKit._free(strPtr);
    origDelete();
   };
   return blob;
  };
  CanvasKit.SkTextBlob.MakeFromText = function(str, font) {
   var strLen = lengthBytesUTF8(str) + 1;
   var strPtr = CanvasKit._malloc(strLen);
   stringToUTF8(str, strPtr, strLen);
   var blob = CanvasKit.SkTextBlob._MakeFromText(strPtr, strLen - 1, font);
   if (!blob) {
    SkDebug('Could not make textblob from string "' + str + '"');
    return null;
   }
   var origDelete = blob.delete.bind(blob);
   blob.delete = function() {
    CanvasKit._free(strPtr);
    origDelete();
   };
   return blob;
  };
 });
 CanvasKit._extraInitializations = CanvasKit._extraInitializations || [];
 CanvasKit._extraInitializations.push(function() {
  CanvasKit.MakeSkPicture = function(data) {
   data = new Uint8Array(data);
   var iptr = CanvasKit._malloc(data.byteLength);
   CanvasKit.HEAPU8.set(data, iptr);
   var pic = CanvasKit._MakeSkPicture(iptr, data.byteLength);
   if (!pic) {
    SkDebug("Could not decode picture");
    return null;
   }
   return pic;
  };
  CanvasKit.SkPicture.prototype.saveAsFile = function(skpName) {
   var data = this.serialize();
   if (!data) {
    SkDebug("Could not serialize to skpicture.");
    return;
   }
   var bytes = CanvasKit.getSkDataBytes(data);
   saveBytesToFile(bytes, skpName);
   data.delete();
  };
 });
 CanvasKit._extraInitializations = CanvasKit._extraInitializations || [];
 CanvasKit._extraInitializations.push(function() {
  CanvasKit.SkRuntimeEffect.prototype.makeShader = function(floats, isOpaque, localMatrix) {
   var fptr = copy1dArray(floats, "HEAPF32");
   var localMatrixPtr = copy3x3MatrixToWasm(localMatrix);
   return this._makeShader(fptr, floats.length * 4, !!isOpaque, localMatrixPtr);
  };
  CanvasKit.SkRuntimeEffect.prototype.makeShaderWithChildren = function(floats, isOpaque, childrenShaders, localMatrix) {
   var fptr = copy1dArray(floats, "HEAPF32");
   var localMatrixPtr = copy3x3MatrixToWasm(localMatrix);
   var barePointers = [];
   for (var i = 0; i < childrenShaders.length; i++) {
    barePointers.push(childrenShaders[i].$$.ptr);
   }
   var childrenPointers = copy1dArray(barePointers, "HEAPU32");
   return this._makeShaderWithChildren(fptr, floats.length * 4, !!isOpaque, childrenPointers, barePointers.length, localMatrixPtr);
  };
 });
 (function() {
  CanvasKit._testing = {};
  function allAreFinite(args) {
   for (var i = 0; i < args.length; i++) {
    if (args[i] !== undefined && !Number.isFinite(args[i])) {
     return false;
    }
   }
   return true;
  }
  function toBase64String(bytes) {
   if (isNode) {
    return Buffer.from(bytes).toString("base64");
   } else {
    var CHUNK_SIZE = 32768;
    var index = 0;
    var length = bytes.length;
    var result = "";
    var slice;
    while (index < length) {
     slice = bytes.slice(index, Math.min(index + CHUNK_SIZE, length));
     result += String.fromCharCode.apply(null, slice);
     index += CHUNK_SIZE;
    }
    return btoa(result);
   }
  }
  var colorMap = {
   "aliceblue": Float32Array.of(.941, .973, 1, 1),
   "antiquewhite": Float32Array.of(.98, .922, .843, 1),
   "aqua": Float32Array.of(0, 1, 1, 1),
   "aquamarine": Float32Array.of(.498, 1, .831, 1),
   "azure": Float32Array.of(.941, 1, 1, 1),
   "beige": Float32Array.of(.961, .961, .863, 1),
   "bisque": Float32Array.of(1, .894, .769, 1),
   "black": Float32Array.of(0, 0, 0, 1),
   "blanchedalmond": Float32Array.of(1, .922, .804, 1),
   "blue": Float32Array.of(0, 0, 1, 1),
   "blueviolet": Float32Array.of(.541, .169, .886, 1),
   "brown": Float32Array.of(.647, .165, .165, 1),
   "burlywood": Float32Array.of(.871, .722, .529, 1),
   "cadetblue": Float32Array.of(.373, .62, .627, 1),
   "chartreuse": Float32Array.of(.498, 1, 0, 1),
   "chocolate": Float32Array.of(.824, .412, .118, 1),
   "coral": Float32Array.of(1, .498, .314, 1),
   "cornflowerblue": Float32Array.of(.392, .584, .929, 1),
   "cornsilk": Float32Array.of(1, .973, .863, 1),
   "crimson": Float32Array.of(.863, .078, .235, 1),
   "cyan": Float32Array.of(0, 1, 1, 1),
   "darkblue": Float32Array.of(0, 0, .545, 1),
   "darkcyan": Float32Array.of(0, .545, .545, 1),
   "darkgoldenrod": Float32Array.of(.722, .525, .043, 1),
   "darkgray": Float32Array.of(.663, .663, .663, 1),
   "darkgreen": Float32Array.of(0, .392, 0, 1),
   "darkgrey": Float32Array.of(.663, .663, .663, 1),
   "darkkhaki": Float32Array.of(.741, .718, .42, 1),
   "darkmagenta": Float32Array.of(.545, 0, .545, 1),
   "darkolivegreen": Float32Array.of(.333, .42, .184, 1),
   "darkorange": Float32Array.of(1, .549, 0, 1),
   "darkorchid": Float32Array.of(.6, .196, .8, 1),
   "darkred": Float32Array.of(.545, 0, 0, 1),
   "darksalmon": Float32Array.of(.914, .588, .478, 1),
   "darkseagreen": Float32Array.of(.561, .737, .561, 1),
   "darkslateblue": Float32Array.of(.282, .239, .545, 1),
   "darkslategray": Float32Array.of(.184, .31, .31, 1),
   "darkslategrey": Float32Array.of(.184, .31, .31, 1),
   "darkturquoise": Float32Array.of(0, .808, .82, 1),
   "darkviolet": Float32Array.of(.58, 0, .827, 1),
   "deeppink": Float32Array.of(1, .078, .576, 1),
   "deepskyblue": Float32Array.of(0, .749, 1, 1),
   "dimgray": Float32Array.of(.412, .412, .412, 1),
   "dimgrey": Float32Array.of(.412, .412, .412, 1),
   "dodgerblue": Float32Array.of(.118, .565, 1, 1),
   "firebrick": Float32Array.of(.698, .133, .133, 1),
   "floralwhite": Float32Array.of(1, .98, .941, 1),
   "forestgreen": Float32Array.of(.133, .545, .133, 1),
   "fuchsia": Float32Array.of(1, 0, 1, 1),
   "gainsboro": Float32Array.of(.863, .863, .863, 1),
   "ghostwhite": Float32Array.of(.973, .973, 1, 1),
   "gold": Float32Array.of(1, .843, 0, 1),
   "goldenrod": Float32Array.of(.855, .647, .125, 1),
   "gray": Float32Array.of(.502, .502, .502, 1),
   "green": Float32Array.of(0, .502, 0, 1),
   "greenyellow": Float32Array.of(.678, 1, .184, 1),
   "grey": Float32Array.of(.502, .502, .502, 1),
   "honeydew": Float32Array.of(.941, 1, .941, 1),
   "hotpink": Float32Array.of(1, .412, .706, 1),
   "indianred": Float32Array.of(.804, .361, .361, 1),
   "indigo": Float32Array.of(.294, 0, .51, 1),
   "ivory": Float32Array.of(1, 1, .941, 1),
   "khaki": Float32Array.of(.941, .902, .549, 1),
   "lavender": Float32Array.of(.902, .902, .98, 1),
   "lavenderblush": Float32Array.of(1, .941, .961, 1),
   "lawngreen": Float32Array.of(.486, .988, 0, 1),
   "lemonchiffon": Float32Array.of(1, .98, .804, 1),
   "lightblue": Float32Array.of(.678, .847, .902, 1),
   "lightcoral": Float32Array.of(.941, .502, .502, 1),
   "lightcyan": Float32Array.of(.878, 1, 1, 1),
   "lightgoldenrodyellow": Float32Array.of(.98, .98, .824, 1),
   "lightgray": Float32Array.of(.827, .827, .827, 1),
   "lightgreen": Float32Array.of(.565, .933, .565, 1),
   "lightgrey": Float32Array.of(.827, .827, .827, 1),
   "lightpink": Float32Array.of(1, .714, .757, 1),
   "lightsalmon": Float32Array.of(1, .627, .478, 1),
   "lightseagreen": Float32Array.of(.125, .698, .667, 1),
   "lightskyblue": Float32Array.of(.529, .808, .98, 1),
   "lightslategray": Float32Array.of(.467, .533, .6, 1),
   "lightslategrey": Float32Array.of(.467, .533, .6, 1),
   "lightsteelblue": Float32Array.of(.69, .769, .871, 1),
   "lightyellow": Float32Array.of(1, 1, .878, 1),
   "lime": Float32Array.of(0, 1, 0, 1),
   "limegreen": Float32Array.of(.196, .804, .196, 1),
   "linen": Float32Array.of(.98, .941, .902, 1),
   "magenta": Float32Array.of(1, 0, 1, 1),
   "maroon": Float32Array.of(.502, 0, 0, 1),
   "mediumaquamarine": Float32Array.of(.4, .804, .667, 1),
   "mediumblue": Float32Array.of(0, 0, .804, 1),
   "mediumorchid": Float32Array.of(.729, .333, .827, 1),
   "mediumpurple": Float32Array.of(.576, .439, .859, 1),
   "mediumseagreen": Float32Array.of(.235, .702, .443, 1),
   "mediumslateblue": Float32Array.of(.482, .408, .933, 1),
   "mediumspringgreen": Float32Array.of(0, .98, .604, 1),
   "mediumturquoise": Float32Array.of(.282, .82, .8, 1),
   "mediumvioletred": Float32Array.of(.78, .082, .522, 1),
   "midnightblue": Float32Array.of(.098, .098, .439, 1),
   "mintcream": Float32Array.of(.961, 1, .98, 1),
   "mistyrose": Float32Array.of(1, .894, .882, 1),
   "moccasin": Float32Array.of(1, .894, .71, 1),
   "navajowhite": Float32Array.of(1, .871, .678, 1),
   "navy": Float32Array.of(0, 0, .502, 1),
   "oldlace": Float32Array.of(.992, .961, .902, 1),
   "olive": Float32Array.of(.502, .502, 0, 1),
   "olivedrab": Float32Array.of(.42, .557, .137, 1),
   "orange": Float32Array.of(1, .647, 0, 1),
   "orangered": Float32Array.of(1, .271, 0, 1),
   "orchid": Float32Array.of(.855, .439, .839, 1),
   "palegoldenrod": Float32Array.of(.933, .91, .667, 1),
   "palegreen": Float32Array.of(.596, .984, .596, 1),
   "paleturquoise": Float32Array.of(.686, .933, .933, 1),
   "palevioletred": Float32Array.of(.859, .439, .576, 1),
   "papayawhip": Float32Array.of(1, .937, .835, 1),
   "peachpuff": Float32Array.of(1, .855, .725, 1),
   "peru": Float32Array.of(.804, .522, .247, 1),
   "pink": Float32Array.of(1, .753, .796, 1),
   "plum": Float32Array.of(.867, .627, .867, 1),
   "powderblue": Float32Array.of(.69, .878, .902, 1),
   "purple": Float32Array.of(.502, 0, .502, 1),
   "rebeccapurple": Float32Array.of(.4, .2, .6, 1),
   "red": Float32Array.of(1, 0, 0, 1),
   "rosybrown": Float32Array.of(.737, .561, .561, 1),
   "royalblue": Float32Array.of(.255, .412, .882, 1),
   "saddlebrown": Float32Array.of(.545, .271, .075, 1),
   "salmon": Float32Array.of(.98, .502, .447, 1),
   "sandybrown": Float32Array.of(.957, .643, .376, 1),
   "seagreen": Float32Array.of(.18, .545, .341, 1),
   "seashell": Float32Array.of(1, .961, .933, 1),
   "sienna": Float32Array.of(.627, .322, .176, 1),
   "silver": Float32Array.of(.753, .753, .753, 1),
   "skyblue": Float32Array.of(.529, .808, .922, 1),
   "slateblue": Float32Array.of(.416, .353, .804, 1),
   "slategray": Float32Array.of(.439, .502, .565, 1),
   "slategrey": Float32Array.of(.439, .502, .565, 1),
   "snow": Float32Array.of(1, .98, .98, 1),
   "springgreen": Float32Array.of(0, 1, .498, 1),
   "steelblue": Float32Array.of(.275, .51, .706, 1),
   "tan": Float32Array.of(.824, .706, .549, 1),
   "teal": Float32Array.of(0, .502, .502, 1),
   "thistle": Float32Array.of(.847, .749, .847, 1),
   "tomato": Float32Array.of(1, .388, .278, 1),
   "transparent": Float32Array.of(0, 0, 0, 0),
   "turquoise": Float32Array.of(.251, .878, .816, 1),
   "violet": Float32Array.of(.933, .51, .933, 1),
   "wheat": Float32Array.of(.961, .871, .702, 1),
   "white": Float32Array.of(1, 1, 1, 1),
   "whitesmoke": Float32Array.of(.961, .961, .961, 1),
   "yellow": Float32Array.of(1, 1, 0, 1),
   "yellowgreen": Float32Array.of(.604, .804, .196, 1)
  };
  function colorToString(skcolor) {
   var components = CanvasKit.getColorComponents(skcolor);
   var r = components[0];
   var g = components[1];
   var b = components[2];
   var a = components[3];
   if (a === 1) {
    r = r.toString(16).toLowerCase();
    g = g.toString(16).toLowerCase();
    b = b.toString(16).toLowerCase();
    r = r.length === 1 ? "0" + r : r;
    g = g.length === 1 ? "0" + g : g;
    b = b.length === 1 ? "0" + b : b;
    return "#" + r + g + b;
   } else {
    a = a === 0 || a === 1 ? a : a.toFixed(8);
    return "rgba(" + r + ", " + g + ", " + b + ", " + a + ")";
   }
  }
  function parseColor(colorStr) {
   return CanvasKit.parseColorString(colorStr, colorMap);
  }
  CanvasKit._testing["parseColor"] = parseColor;
  CanvasKit._testing["colorToString"] = colorToString;
  var fontStringRegex = new RegExp("(italic|oblique|normal|)\\s*" + "(small-caps|normal|)\\s*" + "(bold|bolder|lighter|[1-9]00|normal|)\\s*" + "([\\d\\.]+)" + "(px|pt|pc|in|cm|mm|%|em|ex|ch|rem|q)" + "(.+)");
  var defaultHeight = 16;
  function parseFontString(fontStr) {
   var font = fontStringRegex.exec(fontStr);
   if (!font) {
    SkDebug("Invalid font string " + fontStr);
    return null;
   }
   var size = parseFloat(font[4]);
   var sizePx = defaultHeight;
   var unit = font[5];
   switch (unit) {
   case "em":
   case "rem":
    sizePx = size * defaultHeight;
    break;

   case "pt":
    sizePx = size * 4 / 3;
    break;

   case "px":
    sizePx = size;
    break;

   case "pc":
    sizePx = size * defaultHeight;
    break;

   case "in":
    sizePx = size * 96;
    break;

   case "cm":
    sizePx = size * 96 / 2.54;
    break;

   case "mm":
    sizePx = size * (96 / 25.4);
    break;

   case "q":
    sizePx = size * (96 / 25.4 / 4);
    break;

   case "%":
    sizePx = size * (defaultHeight / 75);
    break;
   }
   return {
    "style": font[1],
    "variant": font[2],
    "weight": font[3],
    "sizePx": sizePx,
    "family": font[6].trim()
   };
  }
  function getTypeface(fontstr) {
   var descriptors = parseFontString(fontstr);
   var typeface = getFromFontCache(descriptors);
   descriptors["typeface"] = typeface;
   return descriptors;
  }
  var fontCache = {
   "Noto Mono": {
    "*": null
   },
   "monospace": {
    "*": null
   }
  };
  function addToFontCache(typeface, descriptors) {
   var key = (descriptors["style"] || "normal") + "|" + (descriptors["variant"] || "normal") + "|" + (descriptors["weight"] || "normal");
   var fam = descriptors["family"];
   if (!fontCache[fam]) {
    fontCache[fam] = {
     "*": typeface
    };
   }
   fontCache[fam][key] = typeface;
  }
  function getFromFontCache(descriptors) {
   var key = (descriptors["style"] || "normal") + "|" + (descriptors["variant"] || "normal") + "|" + (descriptors["weight"] || "normal");
   var fam = descriptors["family"];
   if (!fontCache[fam]) {
    return null;
   }
   return fontCache[fam][key] || fontCache[fam]["*"];
  }
  CanvasKit._testing["parseFontString"] = parseFontString;
  function CanvasRenderingContext2D(skcanvas) {
   this._canvas = skcanvas;
   this._paint = new CanvasKit.SkPaint();
   this._paint.setAntiAlias(true);
   this._paint.setStrokeMiter(10);
   this._paint.setStrokeCap(CanvasKit.StrokeCap.Butt);
   this._paint.setStrokeJoin(CanvasKit.StrokeJoin.Miter);
   this._fontString = "10px monospace";
   this._font = new CanvasKit.SkFont(null, 10);
   this._font.setSubpixel(true);
   this._strokeStyle = CanvasKit.BLACK;
   this._fillStyle = CanvasKit.BLACK;
   this._shadowBlur = 0;
   this._shadowColor = CanvasKit.TRANSPARENT;
   this._shadowOffsetX = 0;
   this._shadowOffsetY = 0;
   this._globalAlpha = 1;
   this._strokeWidth = 1;
   this._lineDashOffset = 0;
   this._lineDashList = [];
   this._globalCompositeOperation = CanvasKit.BlendMode.SrcOver;
   this._imageFilterQuality = CanvasKit.FilterQuality.Low;
   this._imageSmoothingEnabled = true;
   this._paint.setStrokeWidth(this._strokeWidth);
   this._paint.setBlendMode(this._globalCompositeOperation);
   this._currentPath = new CanvasKit.SkPath();
   this._currentTransform = CanvasKit.SkMatrix.identity();
   this._canvasStateStack = [];
   this._toCleanUp = [];
   this._dispose = function() {
    this._currentPath.delete();
    this._paint.delete();
    this._font.delete();
    this._toCleanUp.forEach(function(c) {
     c._dispose();
    });
   };
   Object.defineProperty(this, "currentTransform", {
    enumerable: true,
    get: function() {
     return {
      "a": this._currentTransform[0],
      "c": this._currentTransform[1],
      "e": this._currentTransform[2],
      "b": this._currentTransform[3],
      "d": this._currentTransform[4],
      "f": this._currentTransform[5]
     };
    },
    set: function(matrix) {
     if (matrix.a) {
      this.setTransform(matrix.a, matrix.b, matrix.c, matrix.d, matrix.e, matrix.f);
     }
    }
   });
   Object.defineProperty(this, "fillStyle", {
    enumerable: true,
    get: function() {
     if (isCanvasKitColor(this._fillStyle)) {
      return colorToString(this._fillStyle);
     }
     return this._fillStyle;
    },
    set: function(newStyle) {
     if (typeof newStyle === "string") {
      this._fillStyle = parseColor(newStyle);
     } else if (newStyle._getShader) {
      this._fillStyle = newStyle;
     }
    }
   });
   Object.defineProperty(this, "font", {
    enumerable: true,
    get: function() {
     return this._fontString;
    },
    set: function(newFont) {
     var tf = getTypeface(newFont);
     if (tf) {
      this._font.setSize(tf["sizePx"]);
      this._font.setTypeface(tf["typeface"]);
      this._fontString = newFont;
     }
    }
   });
   Object.defineProperty(this, "globalAlpha", {
    enumerable: true,
    get: function() {
     return this._globalAlpha;
    },
    set: function(newAlpha) {
     if (!isFinite(newAlpha) || newAlpha < 0 || newAlpha > 1) {
      return;
     }
     this._globalAlpha = newAlpha;
    }
   });
   Object.defineProperty(this, "globalCompositeOperation", {
    enumerable: true,
    get: function() {
     switch (this._globalCompositeOperation) {
     case CanvasKit.BlendMode.SrcOver:
      return "source-over";

     case CanvasKit.BlendMode.DstOver:
      return "destination-over";

     case CanvasKit.BlendMode.Src:
      return "copy";

     case CanvasKit.BlendMode.Dst:
      return "destination";

     case CanvasKit.BlendMode.Clear:
      return "clear";

     case CanvasKit.BlendMode.SrcIn:
      return "source-in";

     case CanvasKit.BlendMode.DstIn:
      return "destination-in";

     case CanvasKit.BlendMode.SrcOut:
      return "source-out";

     case CanvasKit.BlendMode.DstOut:
      return "destination-out";

     case CanvasKit.BlendMode.SrcATop:
      return "source-atop";

     case CanvasKit.BlendMode.DstATop:
      return "destination-atop";

     case CanvasKit.BlendMode.Xor:
      return "xor";

     case CanvasKit.BlendMode.Plus:
      return "lighter";

     case CanvasKit.BlendMode.Multiply:
      return "multiply";

     case CanvasKit.BlendMode.Screen:
      return "screen";

     case CanvasKit.BlendMode.Overlay:
      return "overlay";

     case CanvasKit.BlendMode.Darken:
      return "darken";

     case CanvasKit.BlendMode.Lighten:
      return "lighten";

     case CanvasKit.BlendMode.ColorDodge:
      return "color-dodge";

     case CanvasKit.BlendMode.ColorBurn:
      return "color-burn";

     case CanvasKit.BlendMode.HardLight:
      return "hard-light";

     case CanvasKit.BlendMode.SoftLight:
      return "soft-light";

     case CanvasKit.BlendMode.Difference:
      return "difference";

     case CanvasKit.BlendMode.Exclusion:
      return "exclusion";

     case CanvasKit.BlendMode.Hue:
      return "hue";

     case CanvasKit.BlendMode.Saturation:
      return "saturation";

     case CanvasKit.BlendMode.Color:
      return "color";

     case CanvasKit.BlendMode.Luminosity:
      return "luminosity";
     }
    },
    set: function(newMode) {
     switch (newMode) {
     case "source-over":
      this._globalCompositeOperation = CanvasKit.BlendMode.SrcOver;
      break;

     case "destination-over":
      this._globalCompositeOperation = CanvasKit.BlendMode.DstOver;
      break;

     case "copy":
      this._globalCompositeOperation = CanvasKit.BlendMode.Src;
      break;

     case "destination":
      this._globalCompositeOperation = CanvasKit.BlendMode.Dst;
      break;

     case "clear":
      this._globalCompositeOperation = CanvasKit.BlendMode.Clear;
      break;

     case "source-in":
      this._globalCompositeOperation = CanvasKit.BlendMode.SrcIn;
      break;

     case "destination-in":
      this._globalCompositeOperation = CanvasKit.BlendMode.DstIn;
      break;

     case "source-out":
      this._globalCompositeOperation = CanvasKit.BlendMode.SrcOut;
      break;

     case "destination-out":
      this._globalCompositeOperation = CanvasKit.BlendMode.DstOut;
      break;

     case "source-atop":
      this._globalCompositeOperation = CanvasKit.BlendMode.SrcATop;
      break;

     case "destination-atop":
      this._globalCompositeOperation = CanvasKit.BlendMode.DstATop;
      break;

     case "xor":
      this._globalCompositeOperation = CanvasKit.BlendMode.Xor;
      break;

     case "lighter":
      this._globalCompositeOperation = CanvasKit.BlendMode.Plus;
      break;

     case "plus-lighter":
      this._globalCompositeOperation = CanvasKit.BlendMode.Plus;
      break;

     case "plus-darker":
      throw "plus-darker is not supported";

     case "multiply":
      this._globalCompositeOperation = CanvasKit.BlendMode.Multiply;
      break;

     case "screen":
      this._globalCompositeOperation = CanvasKit.BlendMode.Screen;
      break;

     case "overlay":
      this._globalCompositeOperation = CanvasKit.BlendMode.Overlay;
      break;

     case "darken":
      this._globalCompositeOperation = CanvasKit.BlendMode.Darken;
      break;

     case "lighten":
      this._globalCompositeOperation = CanvasKit.BlendMode.Lighten;
      break;

     case "color-dodge":
      this._globalCompositeOperation = CanvasKit.BlendMode.ColorDodge;
      break;

     case "color-burn":
      this._globalCompositeOperation = CanvasKit.BlendMode.ColorBurn;
      break;

     case "hard-light":
      this._globalCompositeOperation = CanvasKit.BlendMode.HardLight;
      break;

     case "soft-light":
      this._globalCompositeOperation = CanvasKit.BlendMode.SoftLight;
      break;

     case "difference":
      this._globalCompositeOperation = CanvasKit.BlendMode.Difference;
      break;

     case "exclusion":
      this._globalCompositeOperation = CanvasKit.BlendMode.Exclusion;
      break;

     case "hue":
      this._globalCompositeOperation = CanvasKit.BlendMode.Hue;
      break;

     case "saturation":
      this._globalCompositeOperation = CanvasKit.BlendMode.Saturation;
      break;

     case "color":
      this._globalCompositeOperation = CanvasKit.BlendMode.Color;
      break;

     case "luminosity":
      this._globalCompositeOperation = CanvasKit.BlendMode.Luminosity;
      break;

     default:
      return;
     }
     this._paint.setBlendMode(this._globalCompositeOperation);
    }
   });
   Object.defineProperty(this, "imageSmoothingEnabled", {
    enumerable: true,
    get: function() {
     return this._imageSmoothingEnabled;
    },
    set: function(newVal) {
     this._imageSmoothingEnabled = !!newVal;
    }
   });
   Object.defineProperty(this, "imageSmoothingQuality", {
    enumerable: true,
    get: function() {
     switch (this._imageFilterQuality) {
     case CanvasKit.FilterQuality.Low:
      return "low";

     case CanvasKit.FilterQuality.Medium:
      return "medium";

     case CanvasKit.FilterQuality.High:
      return "high";
     }
    },
    set: function(newQuality) {
     switch (newQuality) {
     case "low":
      this._imageFilterQuality = CanvasKit.FilterQuality.Low;
      return;

     case "medium":
      this._imageFilterQuality = CanvasKit.FilterQuality.Medium;
      return;

     case "high":
      this._imageFilterQuality = CanvasKit.FilterQuality.High;
      return;
     }
    }
   });
   Object.defineProperty(this, "lineCap", {
    enumerable: true,
    get: function() {
     switch (this._paint.getStrokeCap()) {
     case CanvasKit.StrokeCap.Butt:
      return "butt";

     case CanvasKit.StrokeCap.Round:
      return "round";

     case CanvasKit.StrokeCap.Square:
      return "square";
     }
    },
    set: function(newCap) {
     switch (newCap) {
     case "butt":
      this._paint.setStrokeCap(CanvasKit.StrokeCap.Butt);
      return;

     case "round":
      this._paint.setStrokeCap(CanvasKit.StrokeCap.Round);
      return;

     case "square":
      this._paint.setStrokeCap(CanvasKit.StrokeCap.Square);
      return;
     }
    }
   });
   Object.defineProperty(this, "lineDashOffset", {
    enumerable: true,
    get: function() {
     return this._lineDashOffset;
    },
    set: function(newOffset) {
     if (!isFinite(newOffset)) {
      return;
     }
     this._lineDashOffset = newOffset;
    }
   });
   Object.defineProperty(this, "lineJoin", {
    enumerable: true,
    get: function() {
     switch (this._paint.getStrokeJoin()) {
     case CanvasKit.StrokeJoin.Miter:
      return "miter";

     case CanvasKit.StrokeJoin.Round:
      return "round";

     case CanvasKit.StrokeJoin.Bevel:
      return "bevel";
     }
    },
    set: function(newJoin) {
     switch (newJoin) {
     case "miter":
      this._paint.setStrokeJoin(CanvasKit.StrokeJoin.Miter);
      return;

     case "round":
      this._paint.setStrokeJoin(CanvasKit.StrokeJoin.Round);
      return;

     case "bevel":
      this._paint.setStrokeJoin(CanvasKit.StrokeJoin.Bevel);
      return;
     }
    }
   });
   Object.defineProperty(this, "lineWidth", {
    enumerable: true,
    get: function() {
     return this._paint.getStrokeWidth();
    },
    set: function(newWidth) {
     if (newWidth <= 0 || !newWidth) {
      return;
     }
     this._strokeWidth = newWidth;
     this._paint.setStrokeWidth(newWidth);
    }
   });
   Object.defineProperty(this, "miterLimit", {
    enumerable: true,
    get: function() {
     return this._paint.getStrokeMiter();
    },
    set: function(newLimit) {
     if (newLimit <= 0 || !newLimit) {
      return;
     }
     this._paint.setStrokeMiter(newLimit);
    }
   });
   Object.defineProperty(this, "shadowBlur", {
    enumerable: true,
    get: function() {
     return this._shadowBlur;
    },
    set: function(newBlur) {
     if (newBlur < 0 || !isFinite(newBlur)) {
      return;
     }
     this._shadowBlur = newBlur;
    }
   });
   Object.defineProperty(this, "shadowColor", {
    enumerable: true,
    get: function() {
     return colorToString(this._shadowColor);
    },
    set: function(newColor) {
     this._shadowColor = parseColor(newColor);
    }
   });
   Object.defineProperty(this, "shadowOffsetX", {
    enumerable: true,
    get: function() {
     return this._shadowOffsetX;
    },
    set: function(newOffset) {
     if (!isFinite(newOffset)) {
      return;
     }
     this._shadowOffsetX = newOffset;
    }
   });
   Object.defineProperty(this, "shadowOffsetY", {
    enumerable: true,
    get: function() {
     return this._shadowOffsetY;
    },
    set: function(newOffset) {
     if (!isFinite(newOffset)) {
      return;
     }
     this._shadowOffsetY = newOffset;
    }
   });
   Object.defineProperty(this, "strokeStyle", {
    enumerable: true,
    get: function() {
     return colorToString(this._strokeStyle);
    },
    set: function(newStyle) {
     if (typeof newStyle === "string") {
      this._strokeStyle = parseColor(newStyle);
     } else if (newStyle._getShader) {
      this._strokeStyle = newStyle;
     }
    }
   });
   this.arc = function(x, y, radius, startAngle, endAngle, ccw) {
    arc(this._currentPath, x, y, radius, startAngle, endAngle, ccw);
   };
   this.arcTo = function(x1, y1, x2, y2, radius) {
    arcTo(this._currentPath, x1, y1, x2, y2, radius);
   };
   this.beginPath = function() {
    this._currentPath.delete();
    this._currentPath = new CanvasKit.SkPath();
   };
   this.bezierCurveTo = function(cp1x, cp1y, cp2x, cp2y, x, y) {
    bezierCurveTo(this._currentPath, cp1x, cp1y, cp2x, cp2y, x, y);
   };
   this.clearRect = function(x, y, width, height) {
    this._paint.setStyle(CanvasKit.PaintStyle.Fill);
    this._paint.setBlendMode(CanvasKit.BlendMode.Clear);
    this._canvas.drawRect(CanvasKit.XYWHRect(x, y, width, height), this._paint);
    this._paint.setBlendMode(this._globalCompositeOperation);
   };
   this.clip = function(path, fillRule) {
    if (typeof path === "string") {
     fillRule = path;
     path = this._currentPath;
    } else if (path && path._getPath) {
     path = path._getPath();
    }
    if (!path) {
     path = this._currentPath;
    }
    var clip = path.copy();
    if (fillRule && fillRule.toLowerCase() === "evenodd") {
     clip.setFillType(CanvasKit.FillType.EvenOdd);
    } else {
     clip.setFillType(CanvasKit.FillType.Winding);
    }
    this._canvas.clipPath(clip, CanvasKit.ClipOp.Intersect, true);
    clip.delete();
   };
   this.closePath = function() {
    closePath(this._currentPath);
   };
   this.createImageData = function() {
    if (arguments.length === 1) {
     var oldData = arguments[0];
     var byteLength = 4 * oldData.width * oldData.height;
     return new ImageData(new Uint8ClampedArray(byteLength), oldData.width, oldData.height);
    } else if (arguments.length === 2) {
     var width = arguments[0];
     var height = arguments[1];
     var byteLength = 4 * width * height;
     return new ImageData(new Uint8ClampedArray(byteLength), width, height);
    } else {
     throw "createImageData expects 1 or 2 arguments, got " + arguments.length;
    }
   };
   this.createLinearGradient = function(x1, y1, x2, y2) {
    if (!allAreFinite(arguments)) {
     return;
    }
    var lcg = new LinearCanvasGradient(x1, y1, x2, y2);
    this._toCleanUp.push(lcg);
    return lcg;
   };
   this.createPattern = function(image, repetition) {
    var cp = new CanvasPattern(image, repetition);
    this._toCleanUp.push(cp);
    return cp;
   };
   this.createRadialGradient = function(x1, y1, r1, x2, y2, r2) {
    if (!allAreFinite(arguments)) {
     return;
    }
    var rcg = new RadialCanvasGradient(x1, y1, r1, x2, y2, r2);
    this._toCleanUp.push(rcg);
    return rcg;
   };
   this._imagePaint = function() {
    var iPaint = this._fillPaint();
    if (!this._imageSmoothingEnabled) {
     iPaint.setFilterQuality(CanvasKit.FilterQuality.None);
    } else {
     iPaint.setFilterQuality(this._imageFilterQuality);
    }
    return iPaint;
   };
   this.drawImage = function(img) {
    var iPaint = this._imagePaint();
    if (arguments.length === 3 || arguments.length === 5) {
     var destRect = CanvasKit.XYWHRect(arguments[1], arguments[2], arguments[3] || img.width(), arguments[4] || img.height());
     var srcRect = CanvasKit.XYWHRect(0, 0, img.width(), img.height());
    } else if (arguments.length === 9) {
     var destRect = CanvasKit.XYWHRect(arguments[5], arguments[6], arguments[7], arguments[8]);
     var srcRect = CanvasKit.XYWHRect(arguments[1], arguments[2], arguments[3], arguments[4]);
    } else {
     throw "invalid number of args for drawImage, need 3, 5, or 9; got " + arguments.length;
    }
    this._canvas.drawImageRect(img, srcRect, destRect, iPaint, false);
    iPaint.dispose();
   };
   this.ellipse = function(x, y, radiusX, radiusY, rotation, startAngle, endAngle, ccw) {
    ellipse(this._currentPath, x, y, radiusX, radiusY, rotation, startAngle, endAngle, ccw);
   };
   this._fillPaint = function() {
    var paint = this._paint.copy();
    paint.setStyle(CanvasKit.PaintStyle.Fill);
    if (isCanvasKitColor(this._fillStyle)) {
     var alphaColor = CanvasKit.multiplyByAlpha(this._fillStyle, this._globalAlpha);
     paint.setColor(alphaColor);
    } else {
     var shader = this._fillStyle._getShader(this._currentTransform);
     paint.setColor(CanvasKit.Color(0, 0, 0, this._globalAlpha));
     paint.setShader(shader);
    }
    paint.dispose = function() {
     this.delete();
    };
    return paint;
   };
   this.fill = function(path, fillRule) {
    if (typeof path === "string") {
     fillRule = path;
     path = this._currentPath;
    } else if (path && path._getPath) {
     path = path._getPath();
    }
    if (fillRule === "evenodd") {
     this._currentPath.setFillType(CanvasKit.FillType.EvenOdd);
    } else if (fillRule === "nonzero" || !fillRule) {
     this._currentPath.setFillType(CanvasKit.FillType.Winding);
    } else {
     throw "invalid fill rule";
    }
    if (!path) {
     path = this._currentPath;
    }
    var fillPaint = this._fillPaint();
    var shadowPaint = this._shadowPaint(fillPaint);
    if (shadowPaint) {
     this._canvas.save();
     this._applyShadowOffsetMatrix();
     this._canvas.drawPath(path, shadowPaint);
     this._canvas.restore();
     shadowPaint.dispose();
    }
    this._canvas.drawPath(path, fillPaint);
    fillPaint.dispose();
   };
   this.fillRect = function(x, y, width, height) {
    var fillPaint = this._fillPaint();
    var shadowPaint = this._shadowPaint(fillPaint);
    if (shadowPaint) {
     this._canvas.save();
     this._applyShadowOffsetMatrix();
     this._canvas.drawRect(CanvasKit.XYWHRect(x, y, width, height), shadowPaint);
     this._canvas.restore();
     shadowPaint.dispose();
    }
    this._canvas.drawRect(CanvasKit.XYWHRect(x, y, width, height), fillPaint);
    fillPaint.dispose();
   };
   this.fillText = function(text, x, y, maxWidth) {
    var fillPaint = this._fillPaint();
    var blob = CanvasKit.SkTextBlob.MakeFromText(text, this._font);
    var shadowPaint = this._shadowPaint(fillPaint);
    if (shadowPaint) {
     this._canvas.save();
     this._applyShadowOffsetMatrix();
     this._canvas.drawTextBlob(blob, x, y, shadowPaint);
     this._canvas.restore();
     shadowPaint.dispose();
    }
    this._canvas.drawTextBlob(blob, x, y, fillPaint);
    blob.delete();
    fillPaint.dispose();
   };
   this.getImageData = function(x, y, w, h) {
    var pixels = this._canvas.readPixels(x, y, w, h);
    if (!pixels) {
     return null;
    }
    return new ImageData(new Uint8ClampedArray(pixels.buffer), w, h);
   };
   this.getLineDash = function() {
    return this._lineDashList.slice();
   };
   this._mapToLocalCoordinates = function(pts) {
    var inverted = CanvasKit.SkMatrix.invert(this._currentTransform);
    CanvasKit.SkMatrix.mapPoints(inverted, pts);
    return pts;
   };
   this.isPointInPath = function(x, y, fillmode) {
    var args = arguments;
    if (args.length === 3) {
     var path = this._currentPath;
    } else if (args.length === 4) {
     var path = args[0];
     x = args[1];
     y = args[2];
     fillmode = args[3];
    } else {
     throw "invalid arg count, need 3 or 4, got " + args.length;
    }
    if (!isFinite(x) || !isFinite(y)) {
     return false;
    }
    fillmode = fillmode || "nonzero";
    if (!(fillmode === "nonzero" || fillmode === "evenodd")) {
     return false;
    }
    var pts = this._mapToLocalCoordinates([ x, y ]);
    x = pts[0];
    y = pts[1];
    path.setFillType(fillmode === "nonzero" ? CanvasKit.FillType.Winding : CanvasKit.FillType.EvenOdd);
    return path.contains(x, y);
   };
   this.isPointInStroke = function(x, y) {
    var args = arguments;
    if (args.length === 2) {
     var path = this._currentPath;
    } else if (args.length === 3) {
     var path = args[0];
     x = args[1];
     y = args[2];
    } else {
     throw "invalid arg count, need 2 or 3, got " + args.length;
    }
    if (!isFinite(x) || !isFinite(y)) {
     return false;
    }
    var pts = this._mapToLocalCoordinates([ x, y ]);
    x = pts[0];
    y = pts[1];
    var temp = path.copy();
    temp.setFillType(CanvasKit.FillType.Winding);
    temp.stroke({
     "width": this.lineWidth,
     "miter_limit": this.miterLimit,
     "cap": this._paint.getStrokeCap(),
     "join": this._paint.getStrokeJoin(),
     "precision": .3
    });
    var retVal = temp.contains(x, y);
    temp.delete();
    return retVal;
   };
   this.lineTo = function(x, y) {
    lineTo(this._currentPath, x, y);
   };
   this.measureText = function(text) {
    return {
     width: this._font.measureText(text)
    };
   };
   this.moveTo = function(x, y) {
    moveTo(this._currentPath, x, y);
   };
   this.putImageData = function(imageData, x, y, dirtyX, dirtyY, dirtyWidth, dirtyHeight) {
    if (!allAreFinite([ x, y, dirtyX, dirtyY, dirtyWidth, dirtyHeight ])) {
     return;
    }
    if (dirtyX === undefined) {
     this._canvas.writePixels(imageData.data, imageData.width, imageData.height, x, y);
     return;
    }
    dirtyX = dirtyX || 0;
    dirtyY = dirtyY || 0;
    dirtyWidth = dirtyWidth || imageData.width;
    dirtyHeight = dirtyHeight || imageData.height;
    if (dirtyWidth < 0) {
     dirtyX = dirtyX + dirtyWidth;
     dirtyWidth = Math.abs(dirtyWidth);
    }
    if (dirtyHeight < 0) {
     dirtyY = dirtyY + dirtyHeight;
     dirtyHeight = Math.abs(dirtyHeight);
    }
    if (dirtyX < 0) {
     dirtyWidth = dirtyWidth + dirtyX;
     dirtyX = 0;
    }
    if (dirtyY < 0) {
     dirtyHeight = dirtyHeight + dirtyY;
     dirtyY = 0;
    }
    if (dirtyWidth <= 0 || dirtyHeight <= 0) {
     return;
    }
    var img = CanvasKit.MakeImage(imageData.data, imageData.width, imageData.height, CanvasKit.AlphaType.Unpremul, CanvasKit.ColorType.RGBA_8888, CanvasKit.SkColorSpace.SRGB);
    var src = CanvasKit.XYWHRect(dirtyX, dirtyY, dirtyWidth, dirtyHeight);
    var dst = CanvasKit.XYWHRect(x + dirtyX, y + dirtyY, dirtyWidth, dirtyHeight);
    var inverted = CanvasKit.SkMatrix.invert(this._currentTransform);
    this._canvas.save();
    this._canvas.concat(inverted);
    this._canvas.drawImageRect(img, src, dst, null, false);
    this._canvas.restore();
    img.delete();
   };
   this.quadraticCurveTo = function(cpx, cpy, x, y) {
    quadraticCurveTo(this._currentPath, cpx, cpy, x, y);
   };
   this.rect = function(x, y, width, height) {
    rect(this._currentPath, x, y, width, height);
   };
   this.resetTransform = function() {
    this._currentPath.transform(this._currentTransform);
    var inverted = CanvasKit.SkMatrix.invert(this._currentTransform);
    this._canvas.concat(inverted);
    this._currentTransform = this._canvas.getTotalMatrix();
   };
   this.restore = function() {
    var newState = this._canvasStateStack.pop();
    if (!newState) {
     return;
    }
    var combined = CanvasKit.SkMatrix.multiply(this._currentTransform, CanvasKit.SkMatrix.invert(newState.ctm));
    this._currentPath.transform(combined);
    this._paint.delete();
    this._paint = newState.paint;
    this._lineDashList = newState.ldl;
    this._strokeWidth = newState.sw;
    this._strokeStyle = newState.ss;
    this._fillStyle = newState.fs;
    this._shadowOffsetX = newState.sox;
    this._shadowOffsetY = newState.soy;
    this._shadowBlur = newState.sb;
    this._shadowColor = newState.shc;
    this._globalAlpha = newState.ga;
    this._globalCompositeOperation = newState.gco;
    this._lineDashOffset = newState.ldo;
    this._imageSmoothingEnabled = newState.ise;
    this._imageFilterQuality = newState.isq;
    this._fontString = newState.fontstr;
    this._canvas.restore();
    this._currentTransform = this._canvas.getTotalMatrix();
   };
   this.rotate = function(radians) {
    if (!isFinite(radians)) {
     return;
    }
    var inverted = CanvasKit.SkMatrix.rotated(-radians);
    this._currentPath.transform(inverted);
    this._canvas.rotate(radiansToDegrees(radians), 0, 0);
    this._currentTransform = this._canvas.getTotalMatrix();
   };
   this.save = function() {
    if (this._fillStyle._copy) {
     var fs = this._fillStyle._copy();
     this._toCleanUp.push(fs);
    } else {
     var fs = this._fillStyle;
    }
    if (this._strokeStyle._copy) {
     var ss = this._strokeStyle._copy();
     this._toCleanUp.push(ss);
    } else {
     var ss = this._strokeStyle;
    }
    this._canvasStateStack.push({
     ctm: this._currentTransform.slice(),
     ldl: this._lineDashList.slice(),
     sw: this._strokeWidth,
     ss: ss,
     fs: fs,
     sox: this._shadowOffsetX,
     soy: this._shadowOffsetY,
     sb: this._shadowBlur,
     shc: this._shadowColor,
     ga: this._globalAlpha,
     ldo: this._lineDashOffset,
     gco: this._globalCompositeOperation,
     ise: this._imageSmoothingEnabled,
     isq: this._imageFilterQuality,
     paint: this._paint.copy(),
     fontstr: this._fontString
    });
    this._canvas.save();
   };
   this.scale = function(sx, sy) {
    if (!allAreFinite(arguments)) {
     return;
    }
    var inverted = CanvasKit.SkMatrix.scaled(1 / sx, 1 / sy);
    this._currentPath.transform(inverted);
    this._canvas.scale(sx, sy);
    this._currentTransform = this._canvas.getTotalMatrix();
   };
   this.setLineDash = function(dashes) {
    for (var i = 0; i < dashes.length; i++) {
     if (!isFinite(dashes[i]) || dashes[i] < 0) {
      SkDebug("dash list must have positive, finite values");
      return;
     }
    }
    if (dashes.length % 2 === 1) {
     Array.prototype.push.apply(dashes, dashes);
    }
    this._lineDashList = dashes;
   };
   this.setTransform = function(a, b, c, d, e, f) {
    if (!allAreFinite(arguments)) {
     return;
    }
    this.resetTransform();
    this.transform(a, b, c, d, e, f);
   };
   this._applyShadowOffsetMatrix = function() {
    var inverted = CanvasKit.SkMatrix.invert(this._currentTransform);
    this._canvas.concat(inverted);
    this._canvas.concat(CanvasKit.SkMatrix.translated(this._shadowOffsetX, this._shadowOffsetY));
    this._canvas.concat(this._currentTransform);
   };
   this._shadowPaint = function(basePaint) {
    var alphaColor = CanvasKit.multiplyByAlpha(this._shadowColor, this._globalAlpha);
    if (!CanvasKit.getColorComponents(alphaColor)[3]) {
     return null;
    }
    if (!(this._shadowBlur || this._shadowOffsetY || this._shadowOffsetX)) {
     return null;
    }
    var shadowPaint = basePaint.copy();
    shadowPaint.setColor(alphaColor);
    var blurEffect = CanvasKit.SkMaskFilter.MakeBlur(CanvasKit.BlurStyle.Normal, SkBlurRadiusToSigma(this._shadowBlur), false);
    shadowPaint.setMaskFilter(blurEffect);
    shadowPaint.dispose = function() {
     blurEffect.delete();
     this.delete();
    };
    return shadowPaint;
   };
   this._strokePaint = function() {
    var paint = this._paint.copy();
    paint.setStyle(CanvasKit.PaintStyle.Stroke);
    if (isCanvasKitColor(this._strokeStyle)) {
     var alphaColor = CanvasKit.multiplyByAlpha(this._strokeStyle, this._globalAlpha);
     paint.setColor(alphaColor);
    } else {
     var shader = this._strokeStyle._getShader(this._currentTransform);
     paint.setColor(CanvasKit.Color(0, 0, 0, this._globalAlpha));
     paint.setShader(shader);
    }
    paint.setStrokeWidth(this._strokeWidth);
    if (this._lineDashList.length) {
     var dashedEffect = CanvasKit.SkPathEffect.MakeDash(this._lineDashList, this._lineDashOffset);
     paint.setPathEffect(dashedEffect);
    }
    paint.dispose = function() {
     dashedEffect && dashedEffect.delete();
     this.delete();
    };
    return paint;
   };
   this.stroke = function(path) {
    path = path ? path._getPath() : this._currentPath;
    var strokePaint = this._strokePaint();
    var shadowPaint = this._shadowPaint(strokePaint);
    if (shadowPaint) {
     this._canvas.save();
     this._applyShadowOffsetMatrix();
     this._canvas.drawPath(path, shadowPaint);
     this._canvas.restore();
     shadowPaint.dispose();
    }
    this._canvas.drawPath(path, strokePaint);
    strokePaint.dispose();
   };
   this.strokeRect = function(x, y, width, height) {
    var strokePaint = this._strokePaint();
    var shadowPaint = this._shadowPaint(strokePaint);
    if (shadowPaint) {
     this._canvas.save();
     this._applyShadowOffsetMatrix();
     this._canvas.drawRect(CanvasKit.XYWHRect(x, y, width, height), shadowPaint);
     this._canvas.restore();
     shadowPaint.dispose();
    }
    this._canvas.drawRect(CanvasKit.XYWHRect(x, y, width, height), strokePaint);
    strokePaint.dispose();
   };
   this.strokeText = function(text, x, y, maxWidth) {
    var strokePaint = this._strokePaint();
    var blob = CanvasKit.SkTextBlob.MakeFromText(text, this._font);
    var shadowPaint = this._shadowPaint(strokePaint);
    if (shadowPaint) {
     this._canvas.save();
     this._applyShadowOffsetMatrix();
     this._canvas.drawTextBlob(blob, x, y, shadowPaint);
     this._canvas.restore();
     shadowPaint.dispose();
    }
    this._canvas.drawTextBlob(blob, x, y, strokePaint);
    blob.delete();
    strokePaint.dispose();
   };
   this.translate = function(dx, dy) {
    if (!allAreFinite(arguments)) {
     return;
    }
    var inverted = CanvasKit.SkMatrix.translated(-dx, -dy);
    this._currentPath.transform(inverted);
    this._canvas.translate(dx, dy);
    this._currentTransform = this._canvas.getTotalMatrix();
   };
   this.transform = function(a, b, c, d, e, f) {
    var newTransform = [ a, c, e, b, d, f, 0, 0, 1 ];
    var inverted = CanvasKit.SkMatrix.invert(newTransform);
    this._currentPath.transform(inverted);
    this._canvas.concat(newTransform);
    this._currentTransform = this._canvas.getTotalMatrix();
   };
   this.addHitRegion = function() {};
   this.clearHitRegions = function() {};
   this.drawFocusIfNeeded = function() {};
   this.removeHitRegion = function() {};
   this.scrollPathIntoView = function() {};
   Object.defineProperty(this, "canvas", {
    value: null,
    writable: false
   });
  }
  function SkBlurRadiusToSigma(radius) {
   return radius / 2;
  }
  CanvasKit.MakeCanvas = function(width, height) {
   var surf = CanvasKit.MakeSurface(width, height);
   if (surf) {
    return new HTMLCanvas(surf);
   }
   return null;
  };
  function HTMLCanvas(skSurface) {
   this._surface = skSurface;
   this._context = new CanvasRenderingContext2D(skSurface.getCanvas());
   this._toCleanup = [];
   this._fontmgr = CanvasKit.SkFontMgr.RefDefault();
   this.decodeImage = function(data) {
    var img = CanvasKit.MakeImageFromEncoded(data);
    if (!img) {
     throw "Invalid input";
    }
    this._toCleanup.push(img);
    return img;
   };
   this.loadFont = function(buffer, descriptors) {
    var newFont = this._fontmgr.MakeTypefaceFromData(buffer);
    if (!newFont) {
     SkDebug("font could not be processed", descriptors);
     return null;
    }
    this._toCleanup.push(newFont);
    addToFontCache(newFont, descriptors);
   };
   this.makePath2D = function(path) {
    var p2d = new Path2D(path);
    this._toCleanup.push(p2d._getPath());
    return p2d;
   };
   this.getContext = function(type) {
    if (type === "2d") {
     return this._context;
    }
    return null;
   };
   this.toDataURL = function(codec, quality) {
    this._surface.flush();
    var img = this._surface.makeImageSnapshot();
    if (!img) {
     SkDebug("no snapshot");
     return;
    }
    var codec = codec || "image/png";
    var format = CanvasKit.ImageFormat.PNG;
    if (codec === "image/jpeg") {
     format = CanvasKit.ImageFormat.JPEG;
    }
    var quality = quality || .92;
    var skimg = img.encodeToData(format, quality);
    if (!skimg) {
     SkDebug("encoding failure");
     return;
    }
    var imgBytes = CanvasKit.getSkDataBytes(skimg);
    return "data:" + codec + ";base64," + toBase64String(imgBytes);
   };
   this.dispose = function() {
    this._context._dispose();
    this._toCleanup.forEach(function(i) {
     i.delete();
    });
    this._surface.dispose();
   };
  }
  function ImageData(arr, width, height) {
   if (!width || height === 0) {
    throw "invalid dimensions, width and height must be non-zero";
   }
   if (arr.length % 4) {
    throw "arr must be a multiple of 4";
   }
   height = height || arr.length / (4 * width);
   Object.defineProperty(this, "data", {
    value: arr,
    writable: false
   });
   Object.defineProperty(this, "height", {
    value: height,
    writable: false
   });
   Object.defineProperty(this, "width", {
    value: width,
    writable: false
   });
  }
  CanvasKit.ImageData = function() {
   if (arguments.length === 2) {
    var width = arguments[0];
    var height = arguments[1];
    var byteLength = 4 * width * height;
    return new ImageData(new Uint8ClampedArray(byteLength), width, height);
   } else if (arguments.length === 3) {
    var arr = arguments[0];
    if (arr.prototype.constructor !== Uint8ClampedArray) {
     throw "bytes must be given as a Uint8ClampedArray";
    }
    var width = arguments[1];
    var height = arguments[2];
    if (arr % 4) {
     throw "bytes must be given in a multiple of 4";
    }
    if (arr % width) {
     throw "bytes must divide evenly by width";
    }
    if (height && height !== arr / (width * 4)) {
     throw "invalid height given";
    }
    height = arr / (width * 4);
    return new ImageData(arr, width, height);
   } else {
    throw "invalid number of arguments - takes 2 or 3, saw " + arguments.length;
   }
  };
  function LinearCanvasGradient(x1, y1, x2, y2) {
   this._shader = null;
   this._colors = [];
   this._pos = [];
   this.addColorStop = function(offset, color) {
    if (offset < 0 || offset > 1 || !isFinite(offset)) {
     throw "offset must be between 0 and 1 inclusively";
    }
    color = parseColor(color);
    var idx = this._pos.indexOf(offset);
    if (idx !== -1) {
     this._colors[idx] = color;
    } else {
     for (idx = 0; idx < this._pos.length; idx++) {
      if (this._pos[idx] > offset) {
       break;
      }
     }
     this._pos.splice(idx, 0, offset);
     this._colors.splice(idx, 0, color);
    }
   };
   this._copy = function() {
    var lcg = new LinearCanvasGradient(x1, y1, x2, y2);
    lcg._colors = this._colors.slice();
    lcg._pos = this._pos.slice();
    return lcg;
   };
   this._dispose = function() {
    if (this._shader) {
     this._shader.delete();
     this._shader = null;
    }
   };
   this._getShader = function(currentTransform) {
    var pts = [ x1, y1, x2, y2 ];
    CanvasKit.SkMatrix.mapPoints(currentTransform, pts);
    var sx1 = pts[0];
    var sy1 = pts[1];
    var sx2 = pts[2];
    var sy2 = pts[3];
    this._dispose();
    this._shader = CanvasKit.SkShader.MakeLinearGradient([ sx1, sy1 ], [ sx2, sy2 ], this._colors, this._pos, CanvasKit.TileMode.Clamp);
    return this._shader;
   };
  }
  function arc(skpath, x, y, radius, startAngle, endAngle, ccw) {
   ellipse(skpath, x, y, radius, radius, 0, startAngle, endAngle, ccw);
  }
  function arcTo(skpath, x1, y1, x2, y2, radius) {
   if (!allAreFinite([ x1, y1, x2, y2, radius ])) {
    return;
   }
   if (radius < 0) {
    throw "radii cannot be negative";
   }
   if (skpath.isEmpty()) {
    skpath.moveTo(x1, y1);
   }
   skpath.arcToTangent(x1, y1, x2, y2, radius);
  }
  function bezierCurveTo(skpath, cp1x, cp1y, cp2x, cp2y, x, y) {
   if (!allAreFinite([ cp1x, cp1y, cp2x, cp2y, x, y ])) {
    return;
   }
   if (skpath.isEmpty()) {
    skpath.moveTo(cp1x, cp1y);
   }
   skpath.cubicTo(cp1x, cp1y, cp2x, cp2y, x, y);
  }
  function closePath(skpath) {
   if (skpath.isEmpty()) {
    return;
   }
   var bounds = skpath.getBounds();
   if (bounds.fBottom - bounds.fTop || bounds.fRight - bounds.fLeft) {
    skpath.close();
   }
  }
  function _ellipseHelper(skpath, x, y, radiusX, radiusY, startAngle, endAngle) {
   var sweepDegrees = radiansToDegrees(endAngle - startAngle);
   var startDegrees = radiansToDegrees(startAngle);
   var oval = CanvasKit.LTRBRect(x - radiusX, y - radiusY, x + radiusX, y + radiusY);
   if (almostEqual(Math.abs(sweepDegrees), 360)) {
    var halfSweep = sweepDegrees / 2;
    skpath.arcToOval(oval, startDegrees, halfSweep, false);
    skpath.arcToOval(oval, startDegrees + halfSweep, halfSweep, false);
    return;
   }
   skpath.arcToOval(oval, startDegrees, sweepDegrees, false);
  }
  function ellipse(skpath, x, y, radiusX, radiusY, rotation, startAngle, endAngle, ccw) {
   if (!allAreFinite([ x, y, radiusX, radiusY, rotation, startAngle, endAngle ])) {
    return;
   }
   if (radiusX < 0 || radiusY < 0) {
    throw "radii cannot be negative";
   }
   var tao = 2 * Math.PI;
   var newStartAngle = startAngle % tao;
   if (newStartAngle < 0) {
    newStartAngle += tao;
   }
   var delta = newStartAngle - startAngle;
   startAngle = newStartAngle;
   endAngle += delta;
   if (!ccw && endAngle - startAngle >= tao) {
    endAngle = startAngle + tao;
   } else if (ccw && startAngle - endAngle >= tao) {
    endAngle = startAngle - tao;
   } else if (!ccw && startAngle > endAngle) {
    endAngle = startAngle + (tao - (startAngle - endAngle) % tao);
   } else if (ccw && startAngle < endAngle) {
    endAngle = startAngle - (tao - (endAngle - startAngle) % tao);
   }
   if (!rotation) {
    _ellipseHelper(skpath, x, y, radiusX, radiusY, startAngle, endAngle);
    return;
   }
   var rotated = CanvasKit.SkMatrix.rotated(rotation, x, y);
   var rotatedInvert = CanvasKit.SkMatrix.rotated(-rotation, x, y);
   skpath.transform(rotatedInvert);
   _ellipseHelper(skpath, x, y, radiusX, radiusY, startAngle, endAngle);
   skpath.transform(rotated);
  }
  function lineTo(skpath, x, y) {
   if (!allAreFinite([ x, y ])) {
    return;
   }
   if (skpath.isEmpty()) {
    skpath.moveTo(x, y);
   }
   skpath.lineTo(x, y);
  }
  function moveTo(skpath, x, y) {
   if (!allAreFinite([ x, y ])) {
    return;
   }
   skpath.moveTo(x, y);
  }
  function quadraticCurveTo(skpath, cpx, cpy, x, y) {
   if (!allAreFinite([ cpx, cpy, x, y ])) {
    return;
   }
   if (skpath.isEmpty()) {
    skpath.moveTo(cpx, cpy);
   }
   skpath.quadTo(cpx, cpy, x, y);
  }
  function rect(skpath, x, y, width, height) {
   if (!allAreFinite([ x, y, width, height ])) {
    return;
   }
   skpath.addRect(x, y, x + width, y + height);
  }
  function Path2D(path) {
   this._path = null;
   if (typeof path === "string") {
    this._path = CanvasKit.MakePathFromSVGString(path);
   } else if (path && path._getPath) {
    this._path = path._getPath().copy();
   } else {
    this._path = new CanvasKit.SkPath();
   }
   this._getPath = function() {
    return this._path;
   };
   this.addPath = function(path2d, transform) {
    if (!transform) {
     transform = {
      "a": 1,
      "c": 0,
      "e": 0,
      "b": 0,
      "d": 1,
      "f": 0
     };
    }
    this._path.addPath(path2d._getPath(), [ transform.a, transform.c, transform.e, transform.b, transform.d, transform.f ]);
   };
   this.arc = function(x, y, radius, startAngle, endAngle, ccw) {
    arc(this._path, x, y, radius, startAngle, endAngle, ccw);
   };
   this.arcTo = function(x1, y1, x2, y2, radius) {
    arcTo(this._path, x1, y1, x2, y2, radius);
   };
   this.bezierCurveTo = function(cp1x, cp1y, cp2x, cp2y, x, y) {
    bezierCurveTo(this._path, cp1x, cp1y, cp2x, cp2y, x, y);
   };
   this.closePath = function() {
    closePath(this._path);
   };
   this.ellipse = function(x, y, radiusX, radiusY, rotation, startAngle, endAngle, ccw) {
    ellipse(this._path, x, y, radiusX, radiusY, rotation, startAngle, endAngle, ccw);
   };
   this.lineTo = function(x, y) {
    lineTo(this._path, x, y);
   };
   this.moveTo = function(x, y) {
    moveTo(this._path, x, y);
   };
   this.quadraticCurveTo = function(cpx, cpy, x, y) {
    quadraticCurveTo(this._path, cpx, cpy, x, y);
   };
   this.rect = function(x, y, width, height) {
    rect(this._path, x, y, width, height);
   };
  }
  function CanvasPattern(image, repetition) {
   this._shader = null;
   this._image = image;
   this._transform = CanvasKit.SkMatrix.identity();
   if (repetition === "") {
    repetition = "repeat";
   }
   switch (repetition) {
   case "repeat-x":
    this._tileX = CanvasKit.TileMode.Repeat;
    this._tileY = CanvasKit.TileMode.Decal;
    break;

   case "repeat-y":
    this._tileX = CanvasKit.TileMode.Decal;
    this._tileY = CanvasKit.TileMode.Repeat;
    break;

   case "repeat":
    this._tileX = CanvasKit.TileMode.Repeat;
    this._tileY = CanvasKit.TileMode.Repeat;
    break;

   case "no-repeat":
    this._tileX = CanvasKit.TileMode.Decal;
    this._tileY = CanvasKit.TileMode.Decal;
    break;

   default:
    throw "invalid repetition mode " + repetition;
   }
   this.setTransform = function(m) {
    var t = [ m.a, m.c, m.e, m.b, m.d, m.f, 0, 0, 1 ];
    if (allAreFinite(t)) {
     this._transform = t;
    }
   };
   this._copy = function() {
    var cp = new CanvasPattern();
    cp._tileX = this._tileX;
    cp._tileY = this._tileY;
    return cp;
   };
   this._dispose = function() {
    if (this._shader) {
     this._shader.delete();
     this._shader = null;
    }
   };
   this._getShader = function(currentTransform) {
    this._dispose();
    this._shader = this._image.makeShader(this._tileX, this._tileY, this._transform);
    return this._shader;
   };
  }
  function RadialCanvasGradient(x1, y1, r1, x2, y2, r2) {
   this._shader = null;
   this._colors = [];
   this._pos = [];
   this.addColorStop = function(offset, color) {
    if (offset < 0 || offset > 1 || !isFinite(offset)) {
     throw "offset must be between 0 and 1 inclusively";
    }
    color = parseColor(color);
    var idx = this._pos.indexOf(offset);
    if (idx !== -1) {
     this._colors[idx] = color;
    } else {
     for (idx = 0; idx < this._pos.length; idx++) {
      if (this._pos[idx] > offset) {
       break;
      }
     }
     this._pos.splice(idx, 0, offset);
     this._colors.splice(idx, 0, color);
    }
   };
   this._copy = function() {
    var rcg = new RadialCanvasGradient(x1, y1, r1, x2, y2, r2);
    rcg._colors = this._colors.slice();
    rcg._pos = this._pos.slice();
    return rcg;
   };
   this._dispose = function() {
    if (this._shader) {
     this._shader.delete();
     this._shader = null;
    }
   };
   this._getShader = function(currentTransform) {
    var pts = [ x1, y1, x2, y2 ];
    CanvasKit.SkMatrix.mapPoints(currentTransform, pts);
    var sx1 = pts[0];
    var sy1 = pts[1];
    var sx2 = pts[2];
    var sy2 = pts[3];
    var sx = currentTransform[0];
    var sy = currentTransform[4];
    var scaleFactor = (Math.abs(sx) + Math.abs(sy)) / 2;
    var sr1 = r1 * scaleFactor;
    var sr2 = r2 * scaleFactor;
    this._dispose();
    this._shader = CanvasKit.SkShader.MakeTwoPointConicalGradient([ sx1, sy1 ], sr1, [ sx2, sy2 ], sr2, this._colors, this._pos, CanvasKit.TileMode.Clamp);
    return this._shader;
   };
  }
 })();
})(Module);

var moduleOverrides = {};

var key;

for (key in Module) {
 if (Module.hasOwnProperty(key)) {
  moduleOverrides[key] = Module[key];
 }
}

var arguments_ = [];

var thisProgram = "./this.program";

var quit_ = function(status, toThrow) {
 throw toThrow;
};

var ENVIRONMENT_IS_WEB = false;

var ENVIRONMENT_IS_WORKER = false;

var ENVIRONMENT_IS_NODE = false;

var ENVIRONMENT_IS_SHELL = false;

ENVIRONMENT_IS_WEB = typeof window === "object";

ENVIRONMENT_IS_WORKER = typeof importScripts === "function";

ENVIRONMENT_IS_NODE = typeof process === "object" && typeof process.versions === "object" && typeof process.versions.node === "string";

ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;

var scriptDirectory = "";

function locateFile(path) {
 if (Module["locateFile"]) {
  return Module["locateFile"](path, scriptDirectory);
 }
 return scriptDirectory + path;
}

var read_, readAsync, readBinary, setWindowTitle;

if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
 if (ENVIRONMENT_IS_WORKER) {
  scriptDirectory = self.location.href;
 } else if (document.currentScript) {
  scriptDirectory = document.currentScript.src;
 }
 if (_scriptDir) {
  scriptDirectory = _scriptDir;
 }
 if (scriptDirectory.indexOf("blob:") !== 0) {
  scriptDirectory = scriptDirectory.substr(0, scriptDirectory.lastIndexOf("/") + 1);
 } else {
  scriptDirectory = "";
 }
 {
  read_ = function shell_read(url) {
   var xhr = new XMLHttpRequest();
   xhr.open("GET", url, false);
   xhr.send(null);
   return xhr.responseText;
  };
  if (ENVIRONMENT_IS_WORKER) {
   readBinary = function readBinary(url) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, false);
    xhr.responseType = "arraybuffer";
    xhr.send(null);
    return new Uint8Array(xhr.response);
   };
  }
  readAsync = function readAsync(url, onload, onerror) {
   var xhr = new XMLHttpRequest();
   xhr.open("GET", url, true);
   xhr.responseType = "arraybuffer";
   xhr.onload = function xhr_onload() {
    if (xhr.status == 200 || xhr.status == 0 && xhr.response) {
     onload(xhr.response);
     return;
    }
    onerror();
   };
   xhr.onerror = onerror;
   xhr.send(null);
  };
 }
 setWindowTitle = function(title) {
  document.title = title;
 };
} else {}

var out = Module["print"] || console.log.bind(console);

var err = Module["printErr"] || console.warn.bind(console);

for (key in moduleOverrides) {
 if (moduleOverrides.hasOwnProperty(key)) {
  Module[key] = moduleOverrides[key];
 }
}

moduleOverrides = null;

if (Module["arguments"]) arguments_ = Module["arguments"];

if (Module["thisProgram"]) thisProgram = Module["thisProgram"];

if (Module["quit"]) quit_ = Module["quit"];

function warnOnce(text) {
 if (!warnOnce.shown) warnOnce.shown = {};
 if (!warnOnce.shown[text]) {
  warnOnce.shown[text] = 1;
  err(text);
 }
}

var tempRet0 = 0;

var setTempRet0 = function(value) {
 tempRet0 = value;
};

var getTempRet0 = function() {
 return tempRet0;
};

var wasmBinary;

if (Module["wasmBinary"]) wasmBinary = Module["wasmBinary"];

var noExitRuntime;

if (Module["noExitRuntime"]) noExitRuntime = Module["noExitRuntime"];

if (typeof WebAssembly !== "object") {
 err("no native wasm support detected");
}

var wasmMemory;

var wasmTable = new WebAssembly.Table({
 "initial": 9077,
 "maximum": 9077 + 0,
 "element": "anyfunc"
});

var ABORT = false;

var EXITSTATUS = 0;

function assert(condition, text) {
 if (!condition) {
  abort("Assertion failed: " + text);
 }
}

var UTF8Decoder = typeof TextDecoder !== "undefined" ? new TextDecoder("utf8") : undefined;

function UTF8ArrayToString(heap, idx, maxBytesToRead) {
 var endIdx = idx + maxBytesToRead;
 var endPtr = idx;
 while (heap[endPtr] && !(endPtr >= endIdx)) ++endPtr;
 if (endPtr - idx > 16 && heap.subarray && UTF8Decoder) {
  return UTF8Decoder.decode(heap.subarray(idx, endPtr));
 } else {
  var str = "";
  while (idx < endPtr) {
   var u0 = heap[idx++];
   if (!(u0 & 128)) {
    str += String.fromCharCode(u0);
    continue;
   }
   var u1 = heap[idx++] & 63;
   if ((u0 & 224) == 192) {
    str += String.fromCharCode((u0 & 31) << 6 | u1);
    continue;
   }
   var u2 = heap[idx++] & 63;
   if ((u0 & 240) == 224) {
    u0 = (u0 & 15) << 12 | u1 << 6 | u2;
   } else {
    u0 = (u0 & 7) << 18 | u1 << 12 | u2 << 6 | heap[idx++] & 63;
   }
   if (u0 < 65536) {
    str += String.fromCharCode(u0);
   } else {
    var ch = u0 - 65536;
    str += String.fromCharCode(55296 | ch >> 10, 56320 | ch & 1023);
   }
  }
 }
 return str;
}

function UTF8ToString(ptr, maxBytesToRead) {
 return ptr ? UTF8ArrayToString(HEAPU8, ptr, maxBytesToRead) : "";
}

function stringToUTF8Array(str, heap, outIdx, maxBytesToWrite) {
 if (!(maxBytesToWrite > 0)) return 0;
 var startIdx = outIdx;
 var endIdx = outIdx + maxBytesToWrite - 1;
 for (var i = 0; i < str.length; ++i) {
  var u = str.charCodeAt(i);
  if (u >= 55296 && u <= 57343) {
   var u1 = str.charCodeAt(++i);
   u = 65536 + ((u & 1023) << 10) | u1 & 1023;
  }
  if (u <= 127) {
   if (outIdx >= endIdx) break;
   heap[outIdx++] = u;
  } else if (u <= 2047) {
   if (outIdx + 1 >= endIdx) break;
   heap[outIdx++] = 192 | u >> 6;
   heap[outIdx++] = 128 | u & 63;
  } else if (u <= 65535) {
   if (outIdx + 2 >= endIdx) break;
   heap[outIdx++] = 224 | u >> 12;
   heap[outIdx++] = 128 | u >> 6 & 63;
   heap[outIdx++] = 128 | u & 63;
  } else {
   if (outIdx + 3 >= endIdx) break;
   heap[outIdx++] = 240 | u >> 18;
   heap[outIdx++] = 128 | u >> 12 & 63;
   heap[outIdx++] = 128 | u >> 6 & 63;
   heap[outIdx++] = 128 | u & 63;
  }
 }
 heap[outIdx] = 0;
 return outIdx - startIdx;
}

function stringToUTF8(str, outPtr, maxBytesToWrite) {
 return stringToUTF8Array(str, HEAPU8, outPtr, maxBytesToWrite);
}

function lengthBytesUTF8(str) {
 var len = 0;
 for (var i = 0; i < str.length; ++i) {
  var u = str.charCodeAt(i);
  if (u >= 55296 && u <= 57343) u = 65536 + ((u & 1023) << 10) | str.charCodeAt(++i) & 1023;
  if (u <= 127) ++len; else if (u <= 2047) len += 2; else if (u <= 65535) len += 3; else len += 4;
 }
 return len;
}

var UTF16Decoder = typeof TextDecoder !== "undefined" ? new TextDecoder("utf-16le") : undefined;

function UTF16ToString(ptr, maxBytesToRead) {
 var endPtr = ptr;
 var idx = endPtr >> 1;
 var maxIdx = idx + maxBytesToRead / 2;
 while (!(idx >= maxIdx) && HEAPU16[idx]) ++idx;
 endPtr = idx << 1;
 if (endPtr - ptr > 32 && UTF16Decoder) {
  return UTF16Decoder.decode(HEAPU8.subarray(ptr, endPtr));
 } else {
  var i = 0;
  var str = "";
  while (1) {
   var codeUnit = HEAP16[ptr + i * 2 >> 1];
   if (codeUnit == 0 || i == maxBytesToRead / 2) return str;
   ++i;
   str += String.fromCharCode(codeUnit);
  }
 }
}

function stringToUTF16(str, outPtr, maxBytesToWrite) {
 if (maxBytesToWrite === undefined) {
  maxBytesToWrite = 2147483647;
 }
 if (maxBytesToWrite < 2) return 0;
 maxBytesToWrite -= 2;
 var startPtr = outPtr;
 var numCharsToWrite = maxBytesToWrite < str.length * 2 ? maxBytesToWrite / 2 : str.length;
 for (var i = 0; i < numCharsToWrite; ++i) {
  var codeUnit = str.charCodeAt(i);
  HEAP16[outPtr >> 1] = codeUnit;
  outPtr += 2;
 }
 HEAP16[outPtr >> 1] = 0;
 return outPtr - startPtr;
}

function lengthBytesUTF16(str) {
 return str.length * 2;
}

function UTF32ToString(ptr, maxBytesToRead) {
 var i = 0;
 var str = "";
 while (!(i >= maxBytesToRead / 4)) {
  var utf32 = HEAP32[ptr + i * 4 >> 2];
  if (utf32 == 0) break;
  ++i;
  if (utf32 >= 65536) {
   var ch = utf32 - 65536;
   str += String.fromCharCode(55296 | ch >> 10, 56320 | ch & 1023);
  } else {
   str += String.fromCharCode(utf32);
  }
 }
 return str;
}

function stringToUTF32(str, outPtr, maxBytesToWrite) {
 if (maxBytesToWrite === undefined) {
  maxBytesToWrite = 2147483647;
 }
 if (maxBytesToWrite < 4) return 0;
 var startPtr = outPtr;
 var endPtr = startPtr + maxBytesToWrite - 4;
 for (var i = 0; i < str.length; ++i) {
  var codeUnit = str.charCodeAt(i);
  if (codeUnit >= 55296 && codeUnit <= 57343) {
   var trailSurrogate = str.charCodeAt(++i);
   codeUnit = 65536 + ((codeUnit & 1023) << 10) | trailSurrogate & 1023;
  }
  HEAP32[outPtr >> 2] = codeUnit;
  outPtr += 4;
  if (outPtr + 4 > endPtr) break;
 }
 HEAP32[outPtr >> 2] = 0;
 return outPtr - startPtr;
}

function lengthBytesUTF32(str) {
 var len = 0;
 for (var i = 0; i < str.length; ++i) {
  var codeUnit = str.charCodeAt(i);
  if (codeUnit >= 55296 && codeUnit <= 57343) ++i;
  len += 4;
 }
 return len;
}

function allocateUTF8(str) {
 var size = lengthBytesUTF8(str) + 1;
 var ret = _malloc(size);
 if (ret) stringToUTF8Array(str, HEAP8, ret, size);
 return ret;
}

function writeArrayToMemory(array, buffer) {
 HEAP8.set(array, buffer);
}

function writeAsciiToMemory(str, buffer, dontAddNull) {
 for (var i = 0; i < str.length; ++i) {
  HEAP8[buffer++ >> 0] = str.charCodeAt(i);
 }
 if (!dontAddNull) HEAP8[buffer >> 0] = 0;
}

var WASM_PAGE_SIZE = 65536;

function alignUp(x, multiple) {
 if (x % multiple > 0) {
  x += multiple - x % multiple;
 }
 return x;
}

var buffer, HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;

function updateGlobalBufferAndViews(buf) {
 buffer = buf;
 Module["HEAP8"] = HEAP8 = new Int8Array(buf);
 Module["HEAP16"] = HEAP16 = new Int16Array(buf);
 Module["HEAP32"] = HEAP32 = new Int32Array(buf);
 Module["HEAPU8"] = HEAPU8 = new Uint8Array(buf);
 Module["HEAPU16"] = HEAPU16 = new Uint16Array(buf);
 Module["HEAPU32"] = HEAPU32 = new Uint32Array(buf);
 Module["HEAPF32"] = HEAPF32 = new Float32Array(buf);
 Module["HEAPF64"] = HEAPF64 = new Float64Array(buf);
}

var DYNAMIC_BASE = 7094688, DYNAMICTOP_PTR = 1851648;

var INITIAL_INITIAL_MEMORY = Module["INITIAL_MEMORY"] || 134217728;

if (Module["wasmMemory"]) {
 wasmMemory = Module["wasmMemory"];
} else {
 wasmMemory = new WebAssembly.Memory({
  "initial": INITIAL_INITIAL_MEMORY / WASM_PAGE_SIZE,
  "maximum": 2147483648 / WASM_PAGE_SIZE
 });
}

if (wasmMemory) {
 buffer = wasmMemory.buffer;
}

INITIAL_INITIAL_MEMORY = buffer.byteLength;

updateGlobalBufferAndViews(buffer);

HEAP32[DYNAMICTOP_PTR >> 2] = DYNAMIC_BASE;

function callRuntimeCallbacks(callbacks) {
 while (callbacks.length > 0) {
  var callback = callbacks.shift();
  if (typeof callback == "function") {
   callback(Module);
   continue;
  }
  var func = callback.func;
  if (typeof func === "number") {
   if (callback.arg === undefined) {
    Module["dynCall_v"](func);
   } else {
    Module["dynCall_vi"](func, callback.arg);
   }
  } else {
   func(callback.arg === undefined ? null : callback.arg);
  }
 }
}

var __ATPRERUN__ = [];

var __ATINIT__ = [];

var __ATMAIN__ = [];

var __ATPOSTRUN__ = [];

var runtimeInitialized = false;

var runtimeExited = false;

function preRun() {
 if (Module["preRun"]) {
  if (typeof Module["preRun"] == "function") Module["preRun"] = [ Module["preRun"] ];
  while (Module["preRun"].length) {
   addOnPreRun(Module["preRun"].shift());
  }
 }
 callRuntimeCallbacks(__ATPRERUN__);
}

function initRuntime() {
 runtimeInitialized = true;
 callRuntimeCallbacks(__ATINIT__);
}

function preMain() {
 callRuntimeCallbacks(__ATMAIN__);
}

function exitRuntime() {
 runtimeExited = true;
}

function postRun() {
 if (Module["postRun"]) {
  if (typeof Module["postRun"] == "function") Module["postRun"] = [ Module["postRun"] ];
  while (Module["postRun"].length) {
   addOnPostRun(Module["postRun"].shift());
  }
 }
 callRuntimeCallbacks(__ATPOSTRUN__);
}

function addOnPreRun(cb) {
 __ATPRERUN__.unshift(cb);
}

function addOnPostRun(cb) {
 __ATPOSTRUN__.unshift(cb);
}

var Math_ceil = Math.ceil;

var Math_floor = Math.floor;

var runDependencies = 0;

var runDependencyWatcher = null;

var dependenciesFulfilled = null;

function getUniqueRunDependency(id) {
 return id;
}

function addRunDependency(id) {
 runDependencies++;
 if (Module["monitorRunDependencies"]) {
  Module["monitorRunDependencies"](runDependencies);
 }
}

function removeRunDependency(id) {
 runDependencies--;
 if (Module["monitorRunDependencies"]) {
  Module["monitorRunDependencies"](runDependencies);
 }
 if (runDependencies == 0) {
  if (runDependencyWatcher !== null) {
   clearInterval(runDependencyWatcher);
   runDependencyWatcher = null;
  }
  if (dependenciesFulfilled) {
   var callback = dependenciesFulfilled;
   dependenciesFulfilled = null;
   callback();
  }
 }
}

Module["preloadedImages"] = {};

Module["preloadedAudios"] = {};

function abort(what) {
 if (Module["onAbort"]) {
  Module["onAbort"](what);
 }
 what += "";
 out(what);
 err(what);
 ABORT = true;
 EXITSTATUS = 1;
 what = "abort(" + what + "). Build with -s ASSERTIONS=1 for more info.";
 throw new WebAssembly.RuntimeError(what);
}

function hasPrefix(str, prefix) {
 return String.prototype.startsWith ? str.startsWith(prefix) : str.indexOf(prefix) === 0;
}

var dataURIPrefix = "data:application/octet-stream;base64,";

function isDataURI(filename) {
 return hasPrefix(filename, dataURIPrefix);
}

var wasmBinaryFile = "canvaskit.wasm";

if (!isDataURI(wasmBinaryFile)) {
 wasmBinaryFile = locateFile(wasmBinaryFile);
}

function getBinary() {
 try {
  if (wasmBinary) {
   return new Uint8Array(wasmBinary);
  }
  if (readBinary) {
   return readBinary(wasmBinaryFile);
  } else {
   throw "both async and sync fetching of the wasm failed";
  }
 } catch (err) {
  abort(err);
 }
}

function getBinaryPromise() {
 if (!wasmBinary && (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) && typeof fetch === "function") {
  return fetch(wasmBinaryFile, {
   credentials: "same-origin"
  }).then(function(response) {
   if (!response["ok"]) {
    throw "failed to load wasm binary file at '" + wasmBinaryFile + "'";
   }
   return response["arrayBuffer"]();
  }).catch(function() {
   return getBinary();
  });
 }
 return new Promise(function(resolve, reject) {
  resolve(getBinary());
 });
}

function createWasm() {
 var info = {
  "a": asmLibraryArg
 };
 function receiveInstance(instance, module) {
  var exports = instance.exports;
  Module["asm"] = exports;
  removeRunDependency("wasm-instantiate");
 }
 addRunDependency("wasm-instantiate");
 function receiveInstantiatedSource(output) {
  receiveInstance(output["instance"]);
 }
 function instantiateArrayBuffer(receiver) {
  return getBinaryPromise().then(function(binary) {
   return WebAssembly.instantiate(binary, info);
  }).then(receiver, function(reason) {
   err("failed to asynchronously prepare wasm: " + reason);
   abort(reason);
  });
 }
 function instantiateAsync() {
  if (!wasmBinary && typeof WebAssembly.instantiateStreaming === "function" && !isDataURI(wasmBinaryFile) && typeof fetch === "function") {
   fetch(wasmBinaryFile, {
    credentials: "same-origin"
   }).then(function(response) {
    var result = WebAssembly.instantiateStreaming(response, info);
    return result.then(receiveInstantiatedSource, function(reason) {
     err("wasm streaming compile failed: " + reason);
     err("falling back to ArrayBuffer instantiation");
     instantiateArrayBuffer(receiveInstantiatedSource);
    });
   });
  } else {
   return instantiateArrayBuffer(receiveInstantiatedSource);
  }
 }
 if (Module["instantiateWasm"]) {
  try {
   var exports = Module["instantiateWasm"](info, receiveInstance);
   return exports;
  } catch (e) {
   err("Module.instantiateWasm callback failed with error: " + e);
   return false;
  }
 }
 instantiateAsync();
 return {};
}

__ATINIT__.push({
 func: function() {
  ___wasm_call_ctors();
 }
});

function ___cxa_allocate_exception(size) {
 return _malloc(size);
}

var ___exception_infos = {};

var ___exception_last = 0;

function __ZSt18uncaught_exceptionv() {
 return __ZSt18uncaught_exceptionv.uncaught_exceptions > 0;
}

function ___cxa_throw(ptr, type, destructor) {
 ___exception_infos[ptr] = {
  ptr: ptr,
  adjusted: [ ptr ],
  type: type,
  destructor: destructor,
  refcount: 0,
  caught: false,
  rethrown: false
 };
 ___exception_last = ptr;
 if (!("uncaught_exception" in __ZSt18uncaught_exceptionv)) {
  __ZSt18uncaught_exceptionv.uncaught_exceptions = 1;
 } else {
  __ZSt18uncaught_exceptionv.uncaught_exceptions++;
 }
 throw ptr;
}

function setErrNo(value) {
 HEAP32[___errno_location() >> 2] = value;
 return value;
}

function ___map_file(pathname, size) {
 setErrNo(63);
 return -1;
}

var PATH = {
 splitPath: function(filename) {
  var splitPathRe = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
  return splitPathRe.exec(filename).slice(1);
 },
 normalizeArray: function(parts, allowAboveRoot) {
  var up = 0;
  for (var i = parts.length - 1; i >= 0; i--) {
   var last = parts[i];
   if (last === ".") {
    parts.splice(i, 1);
   } else if (last === "..") {
    parts.splice(i, 1);
    up++;
   } else if (up) {
    parts.splice(i, 1);
    up--;
   }
  }
  if (allowAboveRoot) {
   for (;up; up--) {
    parts.unshift("..");
   }
  }
  return parts;
 },
 normalize: function(path) {
  var isAbsolute = path.charAt(0) === "/", trailingSlash = path.substr(-1) === "/";
  path = PATH.normalizeArray(path.split("/").filter(function(p) {
   return !!p;
  }), !isAbsolute).join("/");
  if (!path && !isAbsolute) {
   path = ".";
  }
  if (path && trailingSlash) {
   path += "/";
  }
  return (isAbsolute ? "/" : "") + path;
 },
 dirname: function(path) {
  var result = PATH.splitPath(path), root = result[0], dir = result[1];
  if (!root && !dir) {
   return ".";
  }
  if (dir) {
   dir = dir.substr(0, dir.length - 1);
  }
  return root + dir;
 },
 basename: function(path) {
  if (path === "/") return "/";
  var lastSlash = path.lastIndexOf("/");
  if (lastSlash === -1) return path;
  return path.substr(lastSlash + 1);
 },
 extname: function(path) {
  return PATH.splitPath(path)[3];
 },
 join: function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return PATH.normalize(paths.join("/"));
 },
 join2: function(l, r) {
  return PATH.normalize(l + "/" + r);
 }
};

var SYSCALLS = {
 mappings: {},
 buffers: [ null, [], [] ],
 printChar: function(stream, curr) {
  var buffer = SYSCALLS.buffers[stream];
  if (curr === 0 || curr === 10) {
   (stream === 1 ? out : err)(UTF8ArrayToString(buffer, 0));
   buffer.length = 0;
  } else {
   buffer.push(curr);
  }
 },
 varargs: undefined,
 get: function() {
  SYSCALLS.varargs += 4;
  var ret = HEAP32[SYSCALLS.varargs - 4 >> 2];
  return ret;
 },
 getStr: function(ptr) {
  var ret = UTF8ToString(ptr);
  return ret;
 },
 get64: function(low, high) {
  return low;
 }
};

function ___sys_fcntl64(fd, cmd, varargs) {
 SYSCALLS.varargs = varargs;
 return 0;
}

function ___sys_fstat64(fd, buf) {}

function ___sys_ioctl(fd, op, varargs) {
 SYSCALLS.varargs = varargs;
 return 0;
}

function syscallMmap2(addr, len, prot, flags, fd, off) {
 off <<= 12;
 var ptr;
 var allocated = false;
 if ((flags & 16) !== 0 && addr % 16384 !== 0) {
  return -28;
 }
 if ((flags & 32) !== 0) {
  ptr = _memalign(16384, len);
  if (!ptr) return -48;
  _memset(ptr, 0, len);
  allocated = true;
 } else {
  return -52;
 }
 SYSCALLS.mappings[ptr] = {
  malloc: ptr,
  len: len,
  allocated: allocated,
  fd: fd,
  prot: prot,
  flags: flags,
  offset: off
 };
 return ptr;
}

function ___sys_mmap2(addr, len, prot, flags, fd, off) {
 return syscallMmap2(addr, len, prot, flags, fd, off);
}

function syscallMunmap(addr, len) {
 if ((addr | 0) === -1 || len === 0) {
  return -28;
 }
 var info = SYSCALLS.mappings[addr];
 if (!info) return 0;
 if (len === info.len) {
  SYSCALLS.mappings[addr] = null;
  if (info.allocated) {
   _free(info.malloc);
  }
 }
 return 0;
}

function ___sys_munmap(addr, len) {
 return syscallMunmap(addr, len);
}

function ___sys_open(path, flags, varargs) {
 SYSCALLS.varargs = varargs;
}

function ___sys_pread64(fd, buf, count, zero, low, high) {}

function ___sys_stat64(path, buf) {}

var tupleRegistrations = {};

function runDestructors(destructors) {
 while (destructors.length) {
  var ptr = destructors.pop();
  var del = destructors.pop();
  del(ptr);
 }
}

function simpleReadValueFromPointer(pointer) {
 return this["fromWireType"](HEAPU32[pointer >> 2]);
}

var awaitingDependencies = {};

var registeredTypes = {};

var typeDependencies = {};

var char_0 = 48;

var char_9 = 57;

function makeLegalFunctionName(name) {
 if (undefined === name) {
  return "_unknown";
 }
 name = name.replace(/[^a-zA-Z0-9_]/g, "$");
 var f = name.charCodeAt(0);
 if (f >= char_0 && f <= char_9) {
  return "_" + name;
 } else {
  return name;
 }
}

function createNamedFunction(name, body) {
 name = makeLegalFunctionName(name);
 return new Function("body", "return function " + name + "() {\n" + '    "use strict";' + "    return body.apply(this, arguments);\n" + "};\n")(body);
}

function extendError(baseErrorType, errorName) {
 var errorClass = createNamedFunction(errorName, function(message) {
  this.name = errorName;
  this.message = message;
  var stack = new Error(message).stack;
  if (stack !== undefined) {
   this.stack = this.toString() + "\n" + stack.replace(/^Error(:[^\n]*)?\n/, "");
  }
 });
 errorClass.prototype = Object.create(baseErrorType.prototype);
 errorClass.prototype.constructor = errorClass;
 errorClass.prototype.toString = function() {
  if (this.message === undefined) {
   return this.name;
  } else {
   return this.name + ": " + this.message;
  }
 };
 return errorClass;
}

var InternalError = undefined;

function throwInternalError(message) {
 throw new InternalError(message);
}

function whenDependentTypesAreResolved(myTypes, dependentTypes, getTypeConverters) {
 myTypes.forEach(function(type) {
  typeDependencies[type] = dependentTypes;
 });
 function onComplete(typeConverters) {
  var myTypeConverters = getTypeConverters(typeConverters);
  if (myTypeConverters.length !== myTypes.length) {
   throwInternalError("Mismatched type converter count");
  }
  for (var i = 0; i < myTypes.length; ++i) {
   registerType(myTypes[i], myTypeConverters[i]);
  }
 }
 var typeConverters = new Array(dependentTypes.length);
 var unregisteredTypes = [];
 var registered = 0;
 dependentTypes.forEach(function(dt, i) {
  if (registeredTypes.hasOwnProperty(dt)) {
   typeConverters[i] = registeredTypes[dt];
  } else {
   unregisteredTypes.push(dt);
   if (!awaitingDependencies.hasOwnProperty(dt)) {
    awaitingDependencies[dt] = [];
   }
   awaitingDependencies[dt].push(function() {
    typeConverters[i] = registeredTypes[dt];
    ++registered;
    if (registered === unregisteredTypes.length) {
     onComplete(typeConverters);
    }
   });
  }
 });
 if (0 === unregisteredTypes.length) {
  onComplete(typeConverters);
 }
}

function __embind_finalize_value_array(rawTupleType) {
 var reg = tupleRegistrations[rawTupleType];
 delete tupleRegistrations[rawTupleType];
 var elements = reg.elements;
 var elementsLength = elements.length;
 var elementTypes = elements.map(function(elt) {
  return elt.getterReturnType;
 }).concat(elements.map(function(elt) {
  return elt.setterArgumentType;
 }));
 var rawConstructor = reg.rawConstructor;
 var rawDestructor = reg.rawDestructor;
 whenDependentTypesAreResolved([ rawTupleType ], elementTypes, function(elementTypes) {
  elements.forEach(function(elt, i) {
   var getterReturnType = elementTypes[i];
   var getter = elt.getter;
   var getterContext = elt.getterContext;
   var setterArgumentType = elementTypes[i + elementsLength];
   var setter = elt.setter;
   var setterContext = elt.setterContext;
   elt.read = function(ptr) {
    return getterReturnType["fromWireType"](getter(getterContext, ptr));
   };
   elt.write = function(ptr, o) {
    var destructors = [];
    setter(setterContext, ptr, setterArgumentType["toWireType"](destructors, o));
    runDestructors(destructors);
   };
  });
  return [ {
   name: reg.name,
   "fromWireType": function(ptr) {
    var rv = new Array(elementsLength);
    for (var i = 0; i < elementsLength; ++i) {
     rv[i] = elements[i].read(ptr);
    }
    rawDestructor(ptr);
    return rv;
   },
   "toWireType": function(destructors, o) {
    if (elementsLength !== o.length) {
     throw new TypeError("Incorrect number of tuple elements for " + reg.name + ": expected=" + elementsLength + ", actual=" + o.length);
    }
    var ptr = rawConstructor();
    for (var i = 0; i < elementsLength; ++i) {
     elements[i].write(ptr, o[i]);
    }
    if (destructors !== null) {
     destructors.push(rawDestructor, ptr);
    }
    return ptr;
   },
   "argPackAdvance": 8,
   "readValueFromPointer": simpleReadValueFromPointer,
   destructorFunction: rawDestructor
  } ];
 });
}

var structRegistrations = {};

function __embind_finalize_value_object(structType) {
 var reg = structRegistrations[structType];
 delete structRegistrations[structType];
 var rawConstructor = reg.rawConstructor;
 var rawDestructor = reg.rawDestructor;
 var fieldRecords = reg.fields;
 var fieldTypes = fieldRecords.map(function(field) {
  return field.getterReturnType;
 }).concat(fieldRecords.map(function(field) {
  return field.setterArgumentType;
 }));
 whenDependentTypesAreResolved([ structType ], fieldTypes, function(fieldTypes) {
  var fields = {};
  fieldRecords.forEach(function(field, i) {
   var fieldName = field.fieldName;
   var getterReturnType = fieldTypes[i];
   var getter = field.getter;
   var getterContext = field.getterContext;
   var setterArgumentType = fieldTypes[i + fieldRecords.length];
   var setter = field.setter;
   var setterContext = field.setterContext;
   fields[fieldName] = {
    read: function(ptr) {
     return getterReturnType["fromWireType"](getter(getterContext, ptr));
    },
    write: function(ptr, o) {
     var destructors = [];
     setter(setterContext, ptr, setterArgumentType["toWireType"](destructors, o));
     runDestructors(destructors);
    }
   };
  });
  return [ {
   name: reg.name,
   "fromWireType": function(ptr) {
    var rv = {};
    for (var i in fields) {
     rv[i] = fields[i].read(ptr);
    }
    rawDestructor(ptr);
    return rv;
   },
   "toWireType": function(destructors, o) {
    for (var fieldName in fields) {
     if (!(fieldName in o)) {
      throw new TypeError("Missing field");
     }
    }
    var ptr = rawConstructor();
    for (fieldName in fields) {
     fields[fieldName].write(ptr, o[fieldName]);
    }
    if (destructors !== null) {
     destructors.push(rawDestructor, ptr);
    }
    return ptr;
   },
   "argPackAdvance": 8,
   "readValueFromPointer": simpleReadValueFromPointer,
   destructorFunction: rawDestructor
  } ];
 });
}

function getShiftFromSize(size) {
 switch (size) {
 case 1:
  return 0;

 case 2:
  return 1;

 case 4:
  return 2;

 case 8:
  return 3;

 default:
  throw new TypeError("Unknown type size: " + size);
 }
}

function embind_init_charCodes() {
 var codes = new Array(256);
 for (var i = 0; i < 256; ++i) {
  codes[i] = String.fromCharCode(i);
 }
 embind_charCodes = codes;
}

var embind_charCodes = undefined;

function readLatin1String(ptr) {
 var ret = "";
 var c = ptr;
 while (HEAPU8[c]) {
  ret += embind_charCodes[HEAPU8[c++]];
 }
 return ret;
}

var BindingError = undefined;

function throwBindingError(message) {
 throw new BindingError(message);
}

function registerType(rawType, registeredInstance, options) {
 options = options || {};
 if (!("argPackAdvance" in registeredInstance)) {
  throw new TypeError("registerType registeredInstance requires argPackAdvance");
 }
 var name = registeredInstance.name;
 if (!rawType) {
  throwBindingError('type "' + name + '" must have a positive integer typeid pointer');
 }
 if (registeredTypes.hasOwnProperty(rawType)) {
  if (options.ignoreDuplicateRegistrations) {
   return;
  } else {
   throwBindingError("Cannot register type '" + name + "' twice");
  }
 }
 registeredTypes[rawType] = registeredInstance;
 delete typeDependencies[rawType];
 if (awaitingDependencies.hasOwnProperty(rawType)) {
  var callbacks = awaitingDependencies[rawType];
  delete awaitingDependencies[rawType];
  callbacks.forEach(function(cb) {
   cb();
  });
 }
}

function __embind_register_bool(rawType, name, size, trueValue, falseValue) {
 var shift = getShiftFromSize(size);
 name = readLatin1String(name);
 registerType(rawType, {
  name: name,
  "fromWireType": function(wt) {
   return !!wt;
  },
  "toWireType": function(destructors, o) {
   return o ? trueValue : falseValue;
  },
  "argPackAdvance": 8,
  "readValueFromPointer": function(pointer) {
   var heap;
   if (size === 1) {
    heap = HEAP8;
   } else if (size === 2) {
    heap = HEAP16;
   } else if (size === 4) {
    heap = HEAP32;
   } else {
    throw new TypeError("Unknown boolean type size: " + name);
   }
   return this["fromWireType"](heap[pointer >> shift]);
  },
  destructorFunction: null
 });
}

function ClassHandle_isAliasOf(other) {
 if (!(this instanceof ClassHandle)) {
  return false;
 }
 if (!(other instanceof ClassHandle)) {
  return false;
 }
 var leftClass = this.$$.ptrType.registeredClass;
 var left = this.$$.ptr;
 var rightClass = other.$$.ptrType.registeredClass;
 var right = other.$$.ptr;
 while (leftClass.baseClass) {
  left = leftClass.upcast(left);
  leftClass = leftClass.baseClass;
 }
 while (rightClass.baseClass) {
  right = rightClass.upcast(right);
  rightClass = rightClass.baseClass;
 }
 return leftClass === rightClass && left === right;
}

function shallowCopyInternalPointer(o) {
 return {
  count: o.count,
  deleteScheduled: o.deleteScheduled,
  preservePointerOnDelete: o.preservePointerOnDelete,
  ptr: o.ptr,
  ptrType: o.ptrType,
  smartPtr: o.smartPtr,
  smartPtrType: o.smartPtrType
 };
}

function throwInstanceAlreadyDeleted(obj) {
 function getInstanceTypeName(handle) {
  return handle.$$.ptrType.registeredClass.name;
 }
 throwBindingError(getInstanceTypeName(obj) + " instance already deleted");
}

var finalizationGroup = false;

function detachFinalizer(handle) {}

function runDestructor($$) {
 if ($$.smartPtr) {
  $$.smartPtrType.rawDestructor($$.smartPtr);
 } else {
  $$.ptrType.registeredClass.rawDestructor($$.ptr);
 }
}

function releaseClassHandle($$) {
 $$.count.value -= 1;
 var toDelete = 0 === $$.count.value;
 if (toDelete) {
  runDestructor($$);
 }
}

function attachFinalizer(handle) {
 if ("undefined" === typeof FinalizationGroup) {
  attachFinalizer = function(handle) {
   return handle;
  };
  return handle;
 }
 finalizationGroup = new FinalizationGroup(function(iter) {
  for (var result = iter.next(); !result.done; result = iter.next()) {
   var $$ = result.value;
   if (!$$.ptr) {
    console.warn("object already deleted: " + $$.ptr);
   } else {
    releaseClassHandle($$);
   }
  }
 });
 attachFinalizer = function(handle) {
  finalizationGroup.register(handle, handle.$$, handle.$$);
  return handle;
 };
 detachFinalizer = function(handle) {
  finalizationGroup.unregister(handle.$$);
 };
 return attachFinalizer(handle);
}

function ClassHandle_clone() {
 if (!this.$$.ptr) {
  throwInstanceAlreadyDeleted(this);
 }
 if (this.$$.preservePointerOnDelete) {
  this.$$.count.value += 1;
  return this;
 } else {
  var clone = attachFinalizer(Object.create(Object.getPrototypeOf(this), {
   $$: {
    value: shallowCopyInternalPointer(this.$$)
   }
  }));
  clone.$$.count.value += 1;
  clone.$$.deleteScheduled = false;
  return clone;
 }
}

function ClassHandle_delete() {
 if (!this.$$.ptr) {
  throwInstanceAlreadyDeleted(this);
 }
 if (this.$$.deleteScheduled && !this.$$.preservePointerOnDelete) {
  throwBindingError("Object already scheduled for deletion");
 }
 detachFinalizer(this);
 releaseClassHandle(this.$$);
 if (!this.$$.preservePointerOnDelete) {
  this.$$.smartPtr = undefined;
  this.$$.ptr = undefined;
 }
}

function ClassHandle_isDeleted() {
 return !this.$$.ptr;
}

var delayFunction = undefined;

var deletionQueue = [];

function flushPendingDeletes() {
 while (deletionQueue.length) {
  var obj = deletionQueue.pop();
  obj.$$.deleteScheduled = false;
  obj["delete"]();
 }
}

function ClassHandle_deleteLater() {
 if (!this.$$.ptr) {
  throwInstanceAlreadyDeleted(this);
 }
 if (this.$$.deleteScheduled && !this.$$.preservePointerOnDelete) {
  throwBindingError("Object already scheduled for deletion");
 }
 deletionQueue.push(this);
 if (deletionQueue.length === 1 && delayFunction) {
  delayFunction(flushPendingDeletes);
 }
 this.$$.deleteScheduled = true;
 return this;
}

function init_ClassHandle() {
 ClassHandle.prototype["isAliasOf"] = ClassHandle_isAliasOf;
 ClassHandle.prototype["clone"] = ClassHandle_clone;
 ClassHandle.prototype["delete"] = ClassHandle_delete;
 ClassHandle.prototype["isDeleted"] = ClassHandle_isDeleted;
 ClassHandle.prototype["deleteLater"] = ClassHandle_deleteLater;
}

function ClassHandle() {}

var registeredPointers = {};

function ensureOverloadTable(proto, methodName, humanName) {
 if (undefined === proto[methodName].overloadTable) {
  var prevFunc = proto[methodName];
  proto[methodName] = function() {
   if (!proto[methodName].overloadTable.hasOwnProperty(arguments.length)) {
    throwBindingError("Function '" + humanName + "' called with an invalid number of arguments (" + arguments.length + ") - expects one of (" + proto[methodName].overloadTable + ")!");
   }
   return proto[methodName].overloadTable[arguments.length].apply(this, arguments);
  };
  proto[methodName].overloadTable = [];
  proto[methodName].overloadTable[prevFunc.argCount] = prevFunc;
 }
}

function exposePublicSymbol(name, value, numArguments) {
 if (Module.hasOwnProperty(name)) {
  if (undefined === numArguments || undefined !== Module[name].overloadTable && undefined !== Module[name].overloadTable[numArguments]) {
   throwBindingError("Cannot register public name '" + name + "' twice");
  }
  ensureOverloadTable(Module, name, name);
  if (Module.hasOwnProperty(numArguments)) {
   throwBindingError("Cannot register multiple overloads of a function with the same number of arguments (" + numArguments + ")!");
  }
  Module[name].overloadTable[numArguments] = value;
 } else {
  Module[name] = value;
  if (undefined !== numArguments) {
   Module[name].numArguments = numArguments;
  }
 }
}

function RegisteredClass(name, constructor, instancePrototype, rawDestructor, baseClass, getActualType, upcast, downcast) {
 this.name = name;
 this.constructor = constructor;
 this.instancePrototype = instancePrototype;
 this.rawDestructor = rawDestructor;
 this.baseClass = baseClass;
 this.getActualType = getActualType;
 this.upcast = upcast;
 this.downcast = downcast;
 this.pureVirtualFunctions = [];
}

function upcastPointer(ptr, ptrClass, desiredClass) {
 while (ptrClass !== desiredClass) {
  if (!ptrClass.upcast) {
   throwBindingError("Expected null or instance of " + desiredClass.name + ", got an instance of " + ptrClass.name);
  }
  ptr = ptrClass.upcast(ptr);
  ptrClass = ptrClass.baseClass;
 }
 return ptr;
}

function constNoSmartPtrRawPointerToWireType(destructors, handle) {
 if (handle === null) {
  if (this.isReference) {
   throwBindingError("null is not a valid " + this.name);
  }
  return 0;
 }
 if (!handle.$$) {
  throwBindingError('Cannot pass "' + _embind_repr(handle) + '" as a ' + this.name);
 }
 if (!handle.$$.ptr) {
  throwBindingError("Cannot pass deleted object as a pointer of type " + this.name);
 }
 var handleClass = handle.$$.ptrType.registeredClass;
 var ptr = upcastPointer(handle.$$.ptr, handleClass, this.registeredClass);
 return ptr;
}

function genericPointerToWireType(destructors, handle) {
 var ptr;
 if (handle === null) {
  if (this.isReference) {
   throwBindingError("null is not a valid " + this.name);
  }
  if (this.isSmartPointer) {
   ptr = this.rawConstructor();
   if (destructors !== null) {
    destructors.push(this.rawDestructor, ptr);
   }
   return ptr;
  } else {
   return 0;
  }
 }
 if (!handle.$$) {
  throwBindingError('Cannot pass "' + _embind_repr(handle) + '" as a ' + this.name);
 }
 if (!handle.$$.ptr) {
  throwBindingError("Cannot pass deleted object as a pointer of type " + this.name);
 }
 if (!this.isConst && handle.$$.ptrType.isConst) {
  throwBindingError("Cannot convert argument of type " + (handle.$$.smartPtrType ? handle.$$.smartPtrType.name : handle.$$.ptrType.name) + " to parameter type " + this.name);
 }
 var handleClass = handle.$$.ptrType.registeredClass;
 ptr = upcastPointer(handle.$$.ptr, handleClass, this.registeredClass);
 if (this.isSmartPointer) {
  if (undefined === handle.$$.smartPtr) {
   throwBindingError("Passing raw pointer to smart pointer is illegal");
  }
  switch (this.sharingPolicy) {
  case 0:
   if (handle.$$.smartPtrType === this) {
    ptr = handle.$$.smartPtr;
   } else {
    throwBindingError("Cannot convert argument of type " + (handle.$$.smartPtrType ? handle.$$.smartPtrType.name : handle.$$.ptrType.name) + " to parameter type " + this.name);
   }
   break;

  case 1:
   ptr = handle.$$.smartPtr;
   break;

  case 2:
   if (handle.$$.smartPtrType === this) {
    ptr = handle.$$.smartPtr;
   } else {
    var clonedHandle = handle["clone"]();
    ptr = this.rawShare(ptr, __emval_register(function() {
     clonedHandle["delete"]();
    }));
    if (destructors !== null) {
     destructors.push(this.rawDestructor, ptr);
    }
   }
   break;

  default:
   throwBindingError("Unsupporting sharing policy");
  }
 }
 return ptr;
}

function nonConstNoSmartPtrRawPointerToWireType(destructors, handle) {
 if (handle === null) {
  if (this.isReference) {
   throwBindingError("null is not a valid " + this.name);
  }
  return 0;
 }
 if (!handle.$$) {
  throwBindingError('Cannot pass "' + _embind_repr(handle) + '" as a ' + this.name);
 }
 if (!handle.$$.ptr) {
  throwBindingError("Cannot pass deleted object as a pointer of type " + this.name);
 }
 if (handle.$$.ptrType.isConst) {
  throwBindingError("Cannot convert argument of type " + handle.$$.ptrType.name + " to parameter type " + this.name);
 }
 var handleClass = handle.$$.ptrType.registeredClass;
 var ptr = upcastPointer(handle.$$.ptr, handleClass, this.registeredClass);
 return ptr;
}

function RegisteredPointer_getPointee(ptr) {
 if (this.rawGetPointee) {
  ptr = this.rawGetPointee(ptr);
 }
 return ptr;
}

function RegisteredPointer_destructor(ptr) {
 if (this.rawDestructor) {
  this.rawDestructor(ptr);
 }
}

function RegisteredPointer_deleteObject(handle) {
 if (handle !== null) {
  handle["delete"]();
 }
}

function downcastPointer(ptr, ptrClass, desiredClass) {
 if (ptrClass === desiredClass) {
  return ptr;
 }
 if (undefined === desiredClass.baseClass) {
  return null;
 }
 var rv = downcastPointer(ptr, ptrClass, desiredClass.baseClass);
 if (rv === null) {
  return null;
 }
 return desiredClass.downcast(rv);
}

function getInheritedInstanceCount() {
 return Object.keys(registeredInstances).length;
}

function getLiveInheritedInstances() {
 var rv = [];
 for (var k in registeredInstances) {
  if (registeredInstances.hasOwnProperty(k)) {
   rv.push(registeredInstances[k]);
  }
 }
 return rv;
}

function setDelayFunction(fn) {
 delayFunction = fn;
 if (deletionQueue.length && delayFunction) {
  delayFunction(flushPendingDeletes);
 }
}

function init_embind() {
 Module["getInheritedInstanceCount"] = getInheritedInstanceCount;
 Module["getLiveInheritedInstances"] = getLiveInheritedInstances;
 Module["flushPendingDeletes"] = flushPendingDeletes;
 Module["setDelayFunction"] = setDelayFunction;
}

var registeredInstances = {};

function getBasestPointer(class_, ptr) {
 if (ptr === undefined) {
  throwBindingError("ptr should not be undefined");
 }
 while (class_.baseClass) {
  ptr = class_.upcast(ptr);
  class_ = class_.baseClass;
 }
 return ptr;
}

function getInheritedInstance(class_, ptr) {
 ptr = getBasestPointer(class_, ptr);
 return registeredInstances[ptr];
}

function makeClassHandle(prototype, record) {
 if (!record.ptrType || !record.ptr) {
  throwInternalError("makeClassHandle requires ptr and ptrType");
 }
 var hasSmartPtrType = !!record.smartPtrType;
 var hasSmartPtr = !!record.smartPtr;
 if (hasSmartPtrType !== hasSmartPtr) {
  throwInternalError("Both smartPtrType and smartPtr must be specified");
 }
 record.count = {
  value: 1
 };
 return attachFinalizer(Object.create(prototype, {
  $$: {
   value: record
  }
 }));
}

function RegisteredPointer_fromWireType(ptr) {
 var rawPointer = this.getPointee(ptr);
 if (!rawPointer) {
  this.destructor(ptr);
  return null;
 }
 var registeredInstance = getInheritedInstance(this.registeredClass, rawPointer);
 if (undefined !== registeredInstance) {
  if (0 === registeredInstance.$$.count.value) {
   registeredInstance.$$.ptr = rawPointer;
   registeredInstance.$$.smartPtr = ptr;
   return registeredInstance["clone"]();
  } else {
   var rv = registeredInstance["clone"]();
   this.destructor(ptr);
   return rv;
  }
 }
 function makeDefaultHandle() {
  if (this.isSmartPointer) {
   return makeClassHandle(this.registeredClass.instancePrototype, {
    ptrType: this.pointeeType,
    ptr: rawPointer,
    smartPtrType: this,
    smartPtr: ptr
   });
  } else {
   return makeClassHandle(this.registeredClass.instancePrototype, {
    ptrType: this,
    ptr: ptr
   });
  }
 }
 var actualType = this.registeredClass.getActualType(rawPointer);
 var registeredPointerRecord = registeredPointers[actualType];
 if (!registeredPointerRecord) {
  return makeDefaultHandle.call(this);
 }
 var toType;
 if (this.isConst) {
  toType = registeredPointerRecord.constPointerType;
 } else {
  toType = registeredPointerRecord.pointerType;
 }
 var dp = downcastPointer(rawPointer, this.registeredClass, toType.registeredClass);
 if (dp === null) {
  return makeDefaultHandle.call(this);
 }
 if (this.isSmartPointer) {
  return makeClassHandle(toType.registeredClass.instancePrototype, {
   ptrType: toType,
   ptr: dp,
   smartPtrType: this,
   smartPtr: ptr
  });
 } else {
  return makeClassHandle(toType.registeredClass.instancePrototype, {
   ptrType: toType,
   ptr: dp
  });
 }
}

function init_RegisteredPointer() {
 RegisteredPointer.prototype.getPointee = RegisteredPointer_getPointee;
 RegisteredPointer.prototype.destructor = RegisteredPointer_destructor;
 RegisteredPointer.prototype["argPackAdvance"] = 8;
 RegisteredPointer.prototype["readValueFromPointer"] = simpleReadValueFromPointer;
 RegisteredPointer.prototype["deleteObject"] = RegisteredPointer_deleteObject;
 RegisteredPointer.prototype["fromWireType"] = RegisteredPointer_fromWireType;
}

function RegisteredPointer(name, registeredClass, isReference, isConst, isSmartPointer, pointeeType, sharingPolicy, rawGetPointee, rawConstructor, rawShare, rawDestructor) {
 this.name = name;
 this.registeredClass = registeredClass;
 this.isReference = isReference;
 this.isConst = isConst;
 this.isSmartPointer = isSmartPointer;
 this.pointeeType = pointeeType;
 this.sharingPolicy = sharingPolicy;
 this.rawGetPointee = rawGetPointee;
 this.rawConstructor = rawConstructor;
 this.rawShare = rawShare;
 this.rawDestructor = rawDestructor;
 if (!isSmartPointer && registeredClass.baseClass === undefined) {
  if (isConst) {
   this["toWireType"] = constNoSmartPtrRawPointerToWireType;
   this.destructorFunction = null;
  } else {
   this["toWireType"] = nonConstNoSmartPtrRawPointerToWireType;
   this.destructorFunction = null;
  }
 } else {
  this["toWireType"] = genericPointerToWireType;
 }
}

function replacePublicSymbol(name, value, numArguments) {
 if (!Module.hasOwnProperty(name)) {
  throwInternalError("Replacing nonexistant public symbol");
 }
 if (undefined !== Module[name].overloadTable && undefined !== numArguments) {
  Module[name].overloadTable[numArguments] = value;
 } else {
  Module[name] = value;
  Module[name].argCount = numArguments;
 }
}

function embind__requireFunction(signature, rawFunction) {
 signature = readLatin1String(signature);
 function makeDynCaller(dynCall) {
  var args = [];
  for (var i = 1; i < signature.length; ++i) {
   args.push("a" + i);
  }
  var name = "dynCall_" + signature + "_" + rawFunction;
  var body = "return function " + name + "(" + args.join(", ") + ") {\n";
  body += "    return dynCall(rawFunction" + (args.length ? ", " : "") + args.join(", ") + ");\n";
  body += "};\n";
  return new Function("dynCall", "rawFunction", body)(dynCall, rawFunction);
 }
 var dc = Module["dynCall_" + signature];
 var fp = makeDynCaller(dc);
 if (typeof fp !== "function") {
  throwBindingError("unknown function pointer with signature " + signature + ": " + rawFunction);
 }
 return fp;
}

var UnboundTypeError = undefined;

function getTypeName(type) {
 var ptr = ___getTypeName(type);
 var rv = readLatin1String(ptr);
 _free(ptr);
 return rv;
}

function throwUnboundTypeError(message, types) {
 var unboundTypes = [];
 var seen = {};
 function visit(type) {
  if (seen[type]) {
   return;
  }
  if (registeredTypes[type]) {
   return;
  }
  if (typeDependencies[type]) {
   typeDependencies[type].forEach(visit);
   return;
  }
  unboundTypes.push(type);
  seen[type] = true;
 }
 types.forEach(visit);
 throw new UnboundTypeError(message + ": " + unboundTypes.map(getTypeName).join([ ", " ]));
}

function __embind_register_class(rawType, rawPointerType, rawConstPointerType, baseClassRawType, getActualTypeSignature, getActualType, upcastSignature, upcast, downcastSignature, downcast, name, destructorSignature, rawDestructor) {
 name = readLatin1String(name);
 getActualType = embind__requireFunction(getActualTypeSignature, getActualType);
 if (upcast) {
  upcast = embind__requireFunction(upcastSignature, upcast);
 }
 if (downcast) {
  downcast = embind__requireFunction(downcastSignature, downcast);
 }
 rawDestructor = embind__requireFunction(destructorSignature, rawDestructor);
 var legalFunctionName = makeLegalFunctionName(name);
 exposePublicSymbol(legalFunctionName, function() {
  throwUnboundTypeError("Cannot construct " + name + " due to unbound types", [ baseClassRawType ]);
 });
 whenDependentTypesAreResolved([ rawType, rawPointerType, rawConstPointerType ], baseClassRawType ? [ baseClassRawType ] : [], function(base) {
  base = base[0];
  var baseClass;
  var basePrototype;
  if (baseClassRawType) {
   baseClass = base.registeredClass;
   basePrototype = baseClass.instancePrototype;
  } else {
   basePrototype = ClassHandle.prototype;
  }
  var constructor = createNamedFunction(legalFunctionName, function() {
   if (Object.getPrototypeOf(this) !== instancePrototype) {
    throw new BindingError("Use 'new' to construct " + name);
   }
   if (undefined === registeredClass.constructor_body) {
    throw new BindingError(name + " has no accessible constructor");
   }
   var body = registeredClass.constructor_body[arguments.length];
   if (undefined === body) {
    throw new BindingError("Tried to invoke ctor of " + name + " with invalid number of parameters (" + arguments.length + ") - expected (" + Object.keys(registeredClass.constructor_body).toString() + ") parameters instead!");
   }
   return body.apply(this, arguments);
  });
  var instancePrototype = Object.create(basePrototype, {
   constructor: {
    value: constructor
   }
  });
  constructor.prototype = instancePrototype;
  var registeredClass = new RegisteredClass(name, constructor, instancePrototype, rawDestructor, baseClass, getActualType, upcast, downcast);
  var referenceConverter = new RegisteredPointer(name, registeredClass, true, false, false);
  var pointerConverter = new RegisteredPointer(name + "*", registeredClass, false, false, false);
  var constPointerConverter = new RegisteredPointer(name + " const*", registeredClass, false, true, false);
  registeredPointers[rawType] = {
   pointerType: pointerConverter,
   constPointerType: constPointerConverter
  };
  replacePublicSymbol(legalFunctionName, constructor);
  return [ referenceConverter, pointerConverter, constPointerConverter ];
 });
}

function new_(constructor, argumentList) {
 if (!(constructor instanceof Function)) {
  throw new TypeError("new_ called with constructor type " + typeof constructor + " which is not a function");
 }
 var dummy = createNamedFunction(constructor.name || "unknownFunctionName", function() {});
 dummy.prototype = constructor.prototype;
 var obj = new dummy();
 var r = constructor.apply(obj, argumentList);
 return r instanceof Object ? r : obj;
}

function craftInvokerFunction(humanName, argTypes, classType, cppInvokerFunc, cppTargetFunc) {
 var argCount = argTypes.length;
 if (argCount < 2) {
  throwBindingError("argTypes array size mismatch! Must at least get return value and 'this' types!");
 }
 var isClassMethodFunc = argTypes[1] !== null && classType !== null;
 var needsDestructorStack = false;
 for (var i = 1; i < argTypes.length; ++i) {
  if (argTypes[i] !== null && argTypes[i].destructorFunction === undefined) {
   needsDestructorStack = true;
   break;
  }
 }
 var returns = argTypes[0].name !== "void";
 var argsList = "";
 var argsListWired = "";
 for (var i = 0; i < argCount - 2; ++i) {
  argsList += (i !== 0 ? ", " : "") + "arg" + i;
  argsListWired += (i !== 0 ? ", " : "") + "arg" + i + "Wired";
 }
 var invokerFnBody = "return function " + makeLegalFunctionName(humanName) + "(" + argsList + ") {\n" + "if (arguments.length !== " + (argCount - 2) + ") {\n" + "throwBindingError('function " + humanName + " called with ' + arguments.length + ' arguments, expected " + (argCount - 2) + " args!');\n" + "}\n";
 if (needsDestructorStack) {
  invokerFnBody += "var destructors = [];\n";
 }
 var dtorStack = needsDestructorStack ? "destructors" : "null";
 var args1 = [ "throwBindingError", "invoker", "fn", "runDestructors", "retType", "classParam" ];
 var args2 = [ throwBindingError, cppInvokerFunc, cppTargetFunc, runDestructors, argTypes[0], argTypes[1] ];
 if (isClassMethodFunc) {
  invokerFnBody += "var thisWired = classParam.toWireType(" + dtorStack + ", this);\n";
 }
 for (var i = 0; i < argCount - 2; ++i) {
  invokerFnBody += "var arg" + i + "Wired = argType" + i + ".toWireType(" + dtorStack + ", arg" + i + "); // " + argTypes[i + 2].name + "\n";
  args1.push("argType" + i);
  args2.push(argTypes[i + 2]);
 }
 if (isClassMethodFunc) {
  argsListWired = "thisWired" + (argsListWired.length > 0 ? ", " : "") + argsListWired;
 }
 invokerFnBody += (returns ? "var rv = " : "") + "invoker(fn" + (argsListWired.length > 0 ? ", " : "") + argsListWired + ");\n";
 if (needsDestructorStack) {
  invokerFnBody += "runDestructors(destructors);\n";
 } else {
  for (var i = isClassMethodFunc ? 1 : 2; i < argTypes.length; ++i) {
   var paramName = i === 1 ? "thisWired" : "arg" + (i - 2) + "Wired";
   if (argTypes[i].destructorFunction !== null) {
    invokerFnBody += paramName + "_dtor(" + paramName + "); // " + argTypes[i].name + "\n";
    args1.push(paramName + "_dtor");
    args2.push(argTypes[i].destructorFunction);
   }
  }
 }
 if (returns) {
  invokerFnBody += "var ret = retType.fromWireType(rv);\n" + "return ret;\n";
 } else {}
 invokerFnBody += "}\n";
 args1.push(invokerFnBody);
 var invokerFunction = new_(Function, args1).apply(null, args2);
 return invokerFunction;
}

function heap32VectorToArray(count, firstElement) {
 var array = [];
 for (var i = 0; i < count; i++) {
  array.push(HEAP32[(firstElement >> 2) + i]);
 }
 return array;
}

function __embind_register_class_class_function(rawClassType, methodName, argCount, rawArgTypesAddr, invokerSignature, rawInvoker, fn) {
 var rawArgTypes = heap32VectorToArray(argCount, rawArgTypesAddr);
 methodName = readLatin1String(methodName);
 rawInvoker = embind__requireFunction(invokerSignature, rawInvoker);
 whenDependentTypesAreResolved([], [ rawClassType ], function(classType) {
  classType = classType[0];
  var humanName = classType.name + "." + methodName;
  function unboundTypesHandler() {
   throwUnboundTypeError("Cannot call " + humanName + " due to unbound types", rawArgTypes);
  }
  var proto = classType.registeredClass.constructor;
  if (undefined === proto[methodName]) {
   unboundTypesHandler.argCount = argCount - 1;
   proto[methodName] = unboundTypesHandler;
  } else {
   ensureOverloadTable(proto, methodName, humanName);
   proto[methodName].overloadTable[argCount - 1] = unboundTypesHandler;
  }
  whenDependentTypesAreResolved([], rawArgTypes, function(argTypes) {
   var invokerArgsArray = [ argTypes[0], null ].concat(argTypes.slice(1));
   var func = craftInvokerFunction(humanName, invokerArgsArray, null, rawInvoker, fn);
   if (undefined === proto[methodName].overloadTable) {
    func.argCount = argCount - 1;
    proto[methodName] = func;
   } else {
    proto[methodName].overloadTable[argCount - 1] = func;
   }
   return [];
  });
  return [];
 });
}

function __embind_register_class_constructor(rawClassType, argCount, rawArgTypesAddr, invokerSignature, invoker, rawConstructor) {
 assert(argCount > 0);
 var rawArgTypes = heap32VectorToArray(argCount, rawArgTypesAddr);
 invoker = embind__requireFunction(invokerSignature, invoker);
 var args = [ rawConstructor ];
 var destructors = [];
 whenDependentTypesAreResolved([], [ rawClassType ], function(classType) {
  classType = classType[0];
  var humanName = "constructor " + classType.name;
  if (undefined === classType.registeredClass.constructor_body) {
   classType.registeredClass.constructor_body = [];
  }
  if (undefined !== classType.registeredClass.constructor_body[argCount - 1]) {
   throw new BindingError("Cannot register multiple constructors with identical number of parameters (" + (argCount - 1) + ") for class '" + classType.name + "'! Overload resolution is currently only performed using the parameter count, not actual type info!");
  }
  classType.registeredClass.constructor_body[argCount - 1] = function unboundTypeHandler() {
   throwUnboundTypeError("Cannot construct " + classType.name + " due to unbound types", rawArgTypes);
  };
  whenDependentTypesAreResolved([], rawArgTypes, function(argTypes) {
   classType.registeredClass.constructor_body[argCount - 1] = function constructor_body() {
    if (arguments.length !== argCount - 1) {
     throwBindingError(humanName + " called with " + arguments.length + " arguments, expected " + (argCount - 1));
    }
    destructors.length = 0;
    args.length = argCount;
    for (var i = 1; i < argCount; ++i) {
     args[i] = argTypes[i]["toWireType"](destructors, arguments[i - 1]);
    }
    var ptr = invoker.apply(null, args);
    runDestructors(destructors);
    return argTypes[0]["fromWireType"](ptr);
   };
   return [];
  });
  return [];
 });
}

function __embind_register_class_function(rawClassType, methodName, argCount, rawArgTypesAddr, invokerSignature, rawInvoker, context, isPureVirtual) {
 var rawArgTypes = heap32VectorToArray(argCount, rawArgTypesAddr);
 methodName = readLatin1String(methodName);
 rawInvoker = embind__requireFunction(invokerSignature, rawInvoker);
 whenDependentTypesAreResolved([], [ rawClassType ], function(classType) {
  classType = classType[0];
  var humanName = classType.name + "." + methodName;
  if (isPureVirtual) {
   classType.registeredClass.pureVirtualFunctions.push(methodName);
  }
  function unboundTypesHandler() {
   throwUnboundTypeError("Cannot call " + humanName + " due to unbound types", rawArgTypes);
  }
  var proto = classType.registeredClass.instancePrototype;
  var method = proto[methodName];
  if (undefined === method || undefined === method.overloadTable && method.className !== classType.name && method.argCount === argCount - 2) {
   unboundTypesHandler.argCount = argCount - 2;
   unboundTypesHandler.className = classType.name;
   proto[methodName] = unboundTypesHandler;
  } else {
   ensureOverloadTable(proto, methodName, humanName);
   proto[methodName].overloadTable[argCount - 2] = unboundTypesHandler;
  }
  whenDependentTypesAreResolved([], rawArgTypes, function(argTypes) {
   var memberFunction = craftInvokerFunction(humanName, argTypes, classType, rawInvoker, context);
   if (undefined === proto[methodName].overloadTable) {
    memberFunction.argCount = argCount - 2;
    proto[methodName] = memberFunction;
   } else {
    proto[methodName].overloadTable[argCount - 2] = memberFunction;
   }
   return [];
  });
  return [];
 });
}

function __embind_register_constant(name, type, value) {
 name = readLatin1String(name);
 whenDependentTypesAreResolved([], [ type ], function(type) {
  type = type[0];
  Module[name] = type["fromWireType"](value);
  return [];
 });
}

var emval_free_list = [];

var emval_handle_array = [ {}, {
 value: undefined
}, {
 value: null
}, {
 value: true
}, {
 value: false
} ];

function __emval_decref(handle) {
 if (handle > 4 && 0 === --emval_handle_array[handle].refcount) {
  emval_handle_array[handle] = undefined;
  emval_free_list.push(handle);
 }
}

function count_emval_handles() {
 var count = 0;
 for (var i = 5; i < emval_handle_array.length; ++i) {
  if (emval_handle_array[i] !== undefined) {
   ++count;
  }
 }
 return count;
}

function get_first_emval() {
 for (var i = 5; i < emval_handle_array.length; ++i) {
  if (emval_handle_array[i] !== undefined) {
   return emval_handle_array[i];
  }
 }
 return null;
}

function init_emval() {
 Module["count_emval_handles"] = count_emval_handles;
 Module["get_first_emval"] = get_first_emval;
}

function __emval_register(value) {
 switch (value) {
 case undefined:
  {
   return 1;
  }

 case null:
  {
   return 2;
  }

 case true:
  {
   return 3;
  }

 case false:
  {
   return 4;
  }

 default:
  {
   var handle = emval_free_list.length ? emval_free_list.pop() : emval_handle_array.length;
   emval_handle_array[handle] = {
    refcount: 1,
    value: value
   };
   return handle;
  }
 }
}

function __embind_register_emval(rawType, name) {
 name = readLatin1String(name);
 registerType(rawType, {
  name: name,
  "fromWireType": function(handle) {
   var rv = emval_handle_array[handle].value;
   __emval_decref(handle);
   return rv;
  },
  "toWireType": function(destructors, value) {
   return __emval_register(value);
  },
  "argPackAdvance": 8,
  "readValueFromPointer": simpleReadValueFromPointer,
  destructorFunction: null
 });
}

function enumReadValueFromPointer(name, shift, signed) {
 switch (shift) {
 case 0:
  return function(pointer) {
   var heap = signed ? HEAP8 : HEAPU8;
   return this["fromWireType"](heap[pointer]);
  };

 case 1:
  return function(pointer) {
   var heap = signed ? HEAP16 : HEAPU16;
   return this["fromWireType"](heap[pointer >> 1]);
  };

 case 2:
  return function(pointer) {
   var heap = signed ? HEAP32 : HEAPU32;
   return this["fromWireType"](heap[pointer >> 2]);
  };

 default:
  throw new TypeError("Unknown integer type: " + name);
 }
}

function __embind_register_enum(rawType, name, size, isSigned) {
 var shift = getShiftFromSize(size);
 name = readLatin1String(name);
 function ctor() {}
 ctor.values = {};
 registerType(rawType, {
  name: name,
  constructor: ctor,
  "fromWireType": function(c) {
   return this.constructor.values[c];
  },
  "toWireType": function(destructors, c) {
   return c.value;
  },
  "argPackAdvance": 8,
  "readValueFromPointer": enumReadValueFromPointer(name, shift, isSigned),
  destructorFunction: null
 });
 exposePublicSymbol(name, ctor);
}

function requireRegisteredType(rawType, humanName) {
 var impl = registeredTypes[rawType];
 if (undefined === impl) {
  throwBindingError(humanName + " has unknown type " + getTypeName(rawType));
 }
 return impl;
}

function __embind_register_enum_value(rawEnumType, name, enumValue) {
 var enumType = requireRegisteredType(rawEnumType, "enum");
 name = readLatin1String(name);
 var Enum = enumType.constructor;
 var Value = Object.create(enumType.constructor.prototype, {
  value: {
   value: enumValue
  },
  constructor: {
   value: createNamedFunction(enumType.name + "_" + name, function() {})
  }
 });
 Enum.values[enumValue] = Value;
 Enum[name] = Value;
}

function _embind_repr(v) {
 if (v === null) {
  return "null";
 }
 var t = typeof v;
 if (t === "object" || t === "array" || t === "function") {
  return v.toString();
 } else {
  return "" + v;
 }
}

function floatReadValueFromPointer(name, shift) {
 switch (shift) {
 case 2:
  return function(pointer) {
   return this["fromWireType"](HEAPF32[pointer >> 2]);
  };

 case 3:
  return function(pointer) {
   return this["fromWireType"](HEAPF64[pointer >> 3]);
  };

 default:
  throw new TypeError("Unknown float type: " + name);
 }
}

function __embind_register_float(rawType, name, size) {
 var shift = getShiftFromSize(size);
 name = readLatin1String(name);
 registerType(rawType, {
  name: name,
  "fromWireType": function(value) {
   return value;
  },
  "toWireType": function(destructors, value) {
   if (typeof value !== "number" && typeof value !== "boolean") {
    throw new TypeError('Cannot convert "' + _embind_repr(value) + '" to ' + this.name);
   }
   return value;
  },
  "argPackAdvance": 8,
  "readValueFromPointer": floatReadValueFromPointer(name, shift),
  destructorFunction: null
 });
}

function __embind_register_function(name, argCount, rawArgTypesAddr, signature, rawInvoker, fn) {
 var argTypes = heap32VectorToArray(argCount, rawArgTypesAddr);
 name = readLatin1String(name);
 rawInvoker = embind__requireFunction(signature, rawInvoker);
 exposePublicSymbol(name, function() {
  throwUnboundTypeError("Cannot call " + name + " due to unbound types", argTypes);
 }, argCount - 1);
 whenDependentTypesAreResolved([], argTypes, function(argTypes) {
  var invokerArgsArray = [ argTypes[0], null ].concat(argTypes.slice(1));
  replacePublicSymbol(name, craftInvokerFunction(name, invokerArgsArray, null, rawInvoker, fn), argCount - 1);
  return [];
 });
}

function integerReadValueFromPointer(name, shift, signed) {
 switch (shift) {
 case 0:
  return signed ? function readS8FromPointer(pointer) {
   return HEAP8[pointer];
  } : function readU8FromPointer(pointer) {
   return HEAPU8[pointer];
  };

 case 1:
  return signed ? function readS16FromPointer(pointer) {
   return HEAP16[pointer >> 1];
  } : function readU16FromPointer(pointer) {
   return HEAPU16[pointer >> 1];
  };

 case 2:
  return signed ? function readS32FromPointer(pointer) {
   return HEAP32[pointer >> 2];
  } : function readU32FromPointer(pointer) {
   return HEAPU32[pointer >> 2];
  };

 default:
  throw new TypeError("Unknown integer type: " + name);
 }
}

function __embind_register_integer(primitiveType, name, size, minRange, maxRange) {
 name = readLatin1String(name);
 if (maxRange === -1) {
  maxRange = 4294967295;
 }
 var shift = getShiftFromSize(size);
 var fromWireType = function(value) {
  return value;
 };
 if (minRange === 0) {
  var bitshift = 32 - 8 * size;
  fromWireType = function(value) {
   return value << bitshift >>> bitshift;
  };
 }
 var isUnsignedType = name.indexOf("unsigned") != -1;
 registerType(primitiveType, {
  name: name,
  "fromWireType": fromWireType,
  "toWireType": function(destructors, value) {
   if (typeof value !== "number" && typeof value !== "boolean") {
    throw new TypeError('Cannot convert "' + _embind_repr(value) + '" to ' + this.name);
   }
   if (value < minRange || value > maxRange) {
    throw new TypeError('Passing a number "' + _embind_repr(value) + '" from JS side to C/C++ side to an argument of type "' + name + '", which is outside the valid range [' + minRange + ", " + maxRange + "]!");
   }
   return isUnsignedType ? value >>> 0 : value | 0;
  },
  "argPackAdvance": 8,
  "readValueFromPointer": integerReadValueFromPointer(name, shift, minRange !== 0),
  destructorFunction: null
 });
}

function __embind_register_memory_view(rawType, dataTypeIndex, name) {
 var typeMapping = [ Int8Array, Uint8Array, Int16Array, Uint16Array, Int32Array, Uint32Array, Float32Array, Float64Array ];
 var TA = typeMapping[dataTypeIndex];
 function decodeMemoryView(handle) {
  handle = handle >> 2;
  var heap = HEAPU32;
  var size = heap[handle];
  var data = heap[handle + 1];
  return new TA(buffer, data, size);
 }
 name = readLatin1String(name);
 registerType(rawType, {
  name: name,
  "fromWireType": decodeMemoryView,
  "argPackAdvance": 8,
  "readValueFromPointer": decodeMemoryView
 }, {
  ignoreDuplicateRegistrations: true
 });
}

function __embind_register_smart_ptr(rawType, rawPointeeType, name, sharingPolicy, getPointeeSignature, rawGetPointee, constructorSignature, rawConstructor, shareSignature, rawShare, destructorSignature, rawDestructor) {
 name = readLatin1String(name);
 rawGetPointee = embind__requireFunction(getPointeeSignature, rawGetPointee);
 rawConstructor = embind__requireFunction(constructorSignature, rawConstructor);
 rawShare = embind__requireFunction(shareSignature, rawShare);
 rawDestructor = embind__requireFunction(destructorSignature, rawDestructor);
 whenDependentTypesAreResolved([ rawType ], [ rawPointeeType ], function(pointeeType) {
  pointeeType = pointeeType[0];
  var registeredPointer = new RegisteredPointer(name, pointeeType.registeredClass, false, false, true, pointeeType, sharingPolicy, rawGetPointee, rawConstructor, rawShare, rawDestructor);
  return [ registeredPointer ];
 });
}

function __embind_register_std_string(rawType, name) {
 name = readLatin1String(name);
 var stdStringIsUTF8 = name === "std::string";
 registerType(rawType, {
  name: name,
  "fromWireType": function(value) {
   var length = HEAPU32[value >> 2];
   var str;
   if (stdStringIsUTF8) {
    var decodeStartPtr = value + 4;
    for (var i = 0; i <= length; ++i) {
     var currentBytePtr = value + 4 + i;
     if (HEAPU8[currentBytePtr] == 0 || i == length) {
      var maxRead = currentBytePtr - decodeStartPtr;
      var stringSegment = UTF8ToString(decodeStartPtr, maxRead);
      if (str === undefined) {
       str = stringSegment;
      } else {
       str += String.fromCharCode(0);
       str += stringSegment;
      }
      decodeStartPtr = currentBytePtr + 1;
     }
    }
   } else {
    var a = new Array(length);
    for (var i = 0; i < length; ++i) {
     a[i] = String.fromCharCode(HEAPU8[value + 4 + i]);
    }
    str = a.join("");
   }
   _free(value);
   return str;
  },
  "toWireType": function(destructors, value) {
   if (value instanceof ArrayBuffer) {
    value = new Uint8Array(value);
   }
   var getLength;
   var valueIsOfTypeString = typeof value === "string";
   if (!(valueIsOfTypeString || value instanceof Uint8Array || value instanceof Uint8ClampedArray || value instanceof Int8Array)) {
    throwBindingError("Cannot pass non-string to std::string");
   }
   if (stdStringIsUTF8 && valueIsOfTypeString) {
    getLength = function() {
     return lengthBytesUTF8(value);
    };
   } else {
    getLength = function() {
     return value.length;
    };
   }
   var length = getLength();
   var ptr = _malloc(4 + length + 1);
   HEAPU32[ptr >> 2] = length;
   if (stdStringIsUTF8 && valueIsOfTypeString) {
    stringToUTF8(value, ptr + 4, length + 1);
   } else {
    if (valueIsOfTypeString) {
     for (var i = 0; i < length; ++i) {
      var charCode = value.charCodeAt(i);
      if (charCode > 255) {
       _free(ptr);
       throwBindingError("String has UTF-16 code units that do not fit in 8 bits");
      }
      HEAPU8[ptr + 4 + i] = charCode;
     }
    } else {
     for (var i = 0; i < length; ++i) {
      HEAPU8[ptr + 4 + i] = value[i];
     }
    }
   }
   if (destructors !== null) {
    destructors.push(_free, ptr);
   }
   return ptr;
  },
  "argPackAdvance": 8,
  "readValueFromPointer": simpleReadValueFromPointer,
  destructorFunction: function(ptr) {
   _free(ptr);
  }
 });
}

function __embind_register_std_wstring(rawType, charSize, name) {
 name = readLatin1String(name);
 var decodeString, encodeString, getHeap, lengthBytesUTF, shift;
 if (charSize === 2) {
  decodeString = UTF16ToString;
  encodeString = stringToUTF16;
  lengthBytesUTF = lengthBytesUTF16;
  getHeap = function() {
   return HEAPU16;
  };
  shift = 1;
 } else if (charSize === 4) {
  decodeString = UTF32ToString;
  encodeString = stringToUTF32;
  lengthBytesUTF = lengthBytesUTF32;
  getHeap = function() {
   return HEAPU32;
  };
  shift = 2;
 }
 registerType(rawType, {
  name: name,
  "fromWireType": function(value) {
   var length = HEAPU32[value >> 2];
   var HEAP = getHeap();
   var str;
   var decodeStartPtr = value + 4;
   for (var i = 0; i <= length; ++i) {
    var currentBytePtr = value + 4 + i * charSize;
    if (HEAP[currentBytePtr >> shift] == 0 || i == length) {
     var maxReadBytes = currentBytePtr - decodeStartPtr;
     var stringSegment = decodeString(decodeStartPtr, maxReadBytes);
     if (str === undefined) {
      str = stringSegment;
     } else {
      str += String.fromCharCode(0);
      str += stringSegment;
     }
     decodeStartPtr = currentBytePtr + charSize;
    }
   }
   _free(value);
   return str;
  },
  "toWireType": function(destructors, value) {
   if (!(typeof value === "string")) {
    throwBindingError("Cannot pass non-string to C++ string type " + name);
   }
   var length = lengthBytesUTF(value);
   var ptr = _malloc(4 + length + charSize);
   HEAPU32[ptr >> 2] = length >> shift;
   encodeString(value, ptr + 4, length + charSize);
   if (destructors !== null) {
    destructors.push(_free, ptr);
   }
   return ptr;
  },
  "argPackAdvance": 8,
  "readValueFromPointer": simpleReadValueFromPointer,
  destructorFunction: function(ptr) {
   _free(ptr);
  }
 });
}

function __embind_register_value_array(rawType, name, constructorSignature, rawConstructor, destructorSignature, rawDestructor) {
 tupleRegistrations[rawType] = {
  name: readLatin1String(name),
  rawConstructor: embind__requireFunction(constructorSignature, rawConstructor),
  rawDestructor: embind__requireFunction(destructorSignature, rawDestructor),
  elements: []
 };
}

function __embind_register_value_array_element(rawTupleType, getterReturnType, getterSignature, getter, getterContext, setterArgumentType, setterSignature, setter, setterContext) {
 tupleRegistrations[rawTupleType].elements.push({
  getterReturnType: getterReturnType,
  getter: embind__requireFunction(getterSignature, getter),
  getterContext: getterContext,
  setterArgumentType: setterArgumentType,
  setter: embind__requireFunction(setterSignature, setter),
  setterContext: setterContext
 });
}

function __embind_register_value_object(rawType, name, constructorSignature, rawConstructor, destructorSignature, rawDestructor) {
 structRegistrations[rawType] = {
  name: readLatin1String(name),
  rawConstructor: embind__requireFunction(constructorSignature, rawConstructor),
  rawDestructor: embind__requireFunction(destructorSignature, rawDestructor),
  fields: []
 };
}

function __embind_register_value_object_field(structType, fieldName, getterReturnType, getterSignature, getter, getterContext, setterArgumentType, setterSignature, setter, setterContext) {
 structRegistrations[structType].fields.push({
  fieldName: readLatin1String(fieldName),
  getterReturnType: getterReturnType,
  getter: embind__requireFunction(getterSignature, getter),
  getterContext: getterContext,
  setterArgumentType: setterArgumentType,
  setter: embind__requireFunction(setterSignature, setter),
  setterContext: setterContext
 });
}

function __embind_register_void(rawType, name) {
 name = readLatin1String(name);
 registerType(rawType, {
  isVoid: true,
  name: name,
  "argPackAdvance": 0,
  "fromWireType": function() {
   return undefined;
  },
  "toWireType": function(destructors, o) {
   return undefined;
  }
 });
}

var emval_symbols = {};

function getStringOrSymbol(address) {
 var symbol = emval_symbols[address];
 if (symbol === undefined) {
  return readLatin1String(address);
 } else {
  return symbol;
 }
}

var emval_methodCallers = [];

function requireHandle(handle) {
 if (!handle) {
  throwBindingError("Cannot use deleted val. handle = " + handle);
 }
 return emval_handle_array[handle].value;
}

function __emval_call_void_method(caller, handle, methodName, args) {
 caller = emval_methodCallers[caller];
 handle = requireHandle(handle);
 methodName = getStringOrSymbol(methodName);
 caller(handle, methodName, null, args);
}

function __emval_addMethodCaller(caller) {
 var id = emval_methodCallers.length;
 emval_methodCallers.push(caller);
 return id;
}

function __emval_lookupTypes(argCount, argTypes) {
 var a = new Array(argCount);
 for (var i = 0; i < argCount; ++i) {
  a[i] = requireRegisteredType(HEAP32[(argTypes >> 2) + i], "parameter " + i);
 }
 return a;
}

function __emval_get_method_caller(argCount, argTypes) {
 var types = __emval_lookupTypes(argCount, argTypes);
 var retType = types[0];
 var signatureName = retType.name + "_$" + types.slice(1).map(function(t) {
  return t.name;
 }).join("_") + "$";
 var params = [ "retType" ];
 var args = [ retType ];
 var argsList = "";
 for (var i = 0; i < argCount - 1; ++i) {
  argsList += (i !== 0 ? ", " : "") + "arg" + i;
  params.push("argType" + i);
  args.push(types[1 + i]);
 }
 var functionName = makeLegalFunctionName("methodCaller_" + signatureName);
 var functionBody = "return function " + functionName + "(handle, name, destructors, args) {\n";
 var offset = 0;
 for (var i = 0; i < argCount - 1; ++i) {
  functionBody += "    var arg" + i + " = argType" + i + ".readValueFromPointer(args" + (offset ? "+" + offset : "") + ");\n";
  offset += types[i + 1]["argPackAdvance"];
 }
 functionBody += "    var rv = handle[name](" + argsList + ");\n";
 for (var i = 0; i < argCount - 1; ++i) {
  if (types[i + 1]["deleteObject"]) {
   functionBody += "    argType" + i + ".deleteObject(arg" + i + ");\n";
  }
 }
 if (!retType.isVoid) {
  functionBody += "    return retType.toWireType(destructors, rv);\n";
 }
 functionBody += "};\n";
 params.push(functionBody);
 var invokerFunction = new_(Function, params).apply(null, args);
 return __emval_addMethodCaller(invokerFunction);
}

function __emval_incref(handle) {
 if (handle > 4) {
  emval_handle_array[handle].refcount += 1;
 }
}

function __emval_new_array() {
 return __emval_register([]);
}

function __emval_new_cstring(v) {
 return __emval_register(getStringOrSymbol(v));
}

function __emval_new_object() {
 return __emval_register({});
}

function __emval_set_property(handle, key, value) {
 handle = requireHandle(handle);
 key = requireHandle(key);
 value = requireHandle(value);
 handle[key] = value;
}

function __emval_take_value(type, argv) {
 type = requireRegisteredType(type, "_emval_take_value");
 var v = type["readValueFromPointer"](argv);
 return __emval_register(v);
}

function _abort() {
 abort();
}

var _emscripten_get_now;

_emscripten_get_now = function() {
 return performance.now();
};

var _emscripten_get_now_is_monotonic = true;

function _clock_gettime(clk_id, tp) {
 var now;
 if (clk_id === 0) {
  now = Date.now();
 } else if ((clk_id === 1 || clk_id === 4) && _emscripten_get_now_is_monotonic) {
  now = _emscripten_get_now();
 } else {
  setErrNo(28);
  return -1;
 }
 HEAP32[tp >> 2] = now / 1e3 | 0;
 HEAP32[tp + 4 >> 2] = now % 1e3 * 1e3 * 1e3 | 0;
 return 0;
}

function _emscripten_set_main_loop_timing(mode, value) {
 Browser.mainLoop.timingMode = mode;
 Browser.mainLoop.timingValue = value;
 if (!Browser.mainLoop.func) {
  return 1;
 }
 if (mode == 0) {
  Browser.mainLoop.scheduler = function Browser_mainLoop_scheduler_setTimeout() {
   var timeUntilNextTick = Math.max(0, Browser.mainLoop.tickStartTime + value - _emscripten_get_now()) | 0;
   setTimeout(Browser.mainLoop.runner, timeUntilNextTick);
  };
  Browser.mainLoop.method = "timeout";
 } else if (mode == 1) {
  Browser.mainLoop.scheduler = function Browser_mainLoop_scheduler_rAF() {
   Browser.requestAnimationFrame(Browser.mainLoop.runner);
  };
  Browser.mainLoop.method = "rAF";
 } else if (mode == 2) {
  if (typeof setImmediate === "undefined") {
   var setImmediates = [];
   var emscriptenMainLoopMessageId = "setimmediate";
   var Browser_setImmediate_messageHandler = function(event) {
    if (event.data === emscriptenMainLoopMessageId || event.data.target === emscriptenMainLoopMessageId) {
     event.stopPropagation();
     setImmediates.shift()();
    }
   };
   addEventListener("message", Browser_setImmediate_messageHandler, true);
   setImmediate = function Browser_emulated_setImmediate(func) {
    setImmediates.push(func);
    if (ENVIRONMENT_IS_WORKER) {
     if (Module["setImmediates"] === undefined) Module["setImmediates"] = [];
     Module["setImmediates"].push(func);
     postMessage({
      target: emscriptenMainLoopMessageId
     });
    } else postMessage(emscriptenMainLoopMessageId, "*");
   };
  }
  Browser.mainLoop.scheduler = function Browser_mainLoop_scheduler_setImmediate() {
   setImmediate(Browser.mainLoop.runner);
  };
  Browser.mainLoop.method = "immediate";
 }
 return 0;
}

function _emscripten_set_main_loop(func, fps, simulateInfiniteLoop, arg, noSetTiming) {
 noExitRuntime = true;
 assert(!Browser.mainLoop.func, "emscripten_set_main_loop: there can only be one main loop function at once: call emscripten_cancel_main_loop to cancel the previous one before setting a new one with different parameters.");
 Browser.mainLoop.func = func;
 Browser.mainLoop.arg = arg;
 var browserIterationFunc;
 if (typeof arg !== "undefined") {
  browserIterationFunc = function() {
   Module["dynCall_vi"](func, arg);
  };
 } else {
  browserIterationFunc = function() {
   Module["dynCall_v"](func);
  };
 }
 var thisMainLoopId = Browser.mainLoop.currentlyRunningMainloop;
 Browser.mainLoop.runner = function Browser_mainLoop_runner() {
  if (ABORT) return;
  if (Browser.mainLoop.queue.length > 0) {
   var start = Date.now();
   var blocker = Browser.mainLoop.queue.shift();
   blocker.func(blocker.arg);
   if (Browser.mainLoop.remainingBlockers) {
    var remaining = Browser.mainLoop.remainingBlockers;
    var next = remaining % 1 == 0 ? remaining - 1 : Math.floor(remaining);
    if (blocker.counted) {
     Browser.mainLoop.remainingBlockers = next;
    } else {
     next = next + .5;
     Browser.mainLoop.remainingBlockers = (8 * remaining + next) / 9;
    }
   }
   console.log('main loop blocker "' + blocker.name + '" took ' + (Date.now() - start) + " ms");
   Browser.mainLoop.updateStatus();
   if (thisMainLoopId < Browser.mainLoop.currentlyRunningMainloop) return;
   setTimeout(Browser.mainLoop.runner, 0);
   return;
  }
  if (thisMainLoopId < Browser.mainLoop.currentlyRunningMainloop) return;
  Browser.mainLoop.currentFrameNumber = Browser.mainLoop.currentFrameNumber + 1 | 0;
  if (Browser.mainLoop.timingMode == 1 && Browser.mainLoop.timingValue > 1 && Browser.mainLoop.currentFrameNumber % Browser.mainLoop.timingValue != 0) {
   Browser.mainLoop.scheduler();
   return;
  } else if (Browser.mainLoop.timingMode == 0) {
   Browser.mainLoop.tickStartTime = _emscripten_get_now();
  }
  Browser.mainLoop.runIter(browserIterationFunc);
  if (thisMainLoopId < Browser.mainLoop.currentlyRunningMainloop) return;
  if (typeof SDL === "object" && SDL.audio && SDL.audio.queueNewAudioData) SDL.audio.queueNewAudioData();
  Browser.mainLoop.scheduler();
 };
 if (!noSetTiming) {
  if (fps && fps > 0) _emscripten_set_main_loop_timing(0, 1e3 / fps); else _emscripten_set_main_loop_timing(1, 1);
  Browser.mainLoop.scheduler();
 }
 if (simulateInfiniteLoop) {
  throw "unwind";
 }
}

var Browser = {
 mainLoop: {
  scheduler: null,
  method: "",
  currentlyRunningMainloop: 0,
  func: null,
  arg: 0,
  timingMode: 0,
  timingValue: 0,
  currentFrameNumber: 0,
  queue: [],
  pause: function() {
   Browser.mainLoop.scheduler = null;
   Browser.mainLoop.currentlyRunningMainloop++;
  },
  resume: function() {
   Browser.mainLoop.currentlyRunningMainloop++;
   var timingMode = Browser.mainLoop.timingMode;
   var timingValue = Browser.mainLoop.timingValue;
   var func = Browser.mainLoop.func;
   Browser.mainLoop.func = null;
   _emscripten_set_main_loop(func, 0, false, Browser.mainLoop.arg, true);
   _emscripten_set_main_loop_timing(timingMode, timingValue);
   Browser.mainLoop.scheduler();
  },
  updateStatus: function() {
   if (Module["setStatus"]) {
    var message = Module["statusMessage"] || "Please wait...";
    var remaining = Browser.mainLoop.remainingBlockers;
    var expected = Browser.mainLoop.expectedBlockers;
    if (remaining) {
     if (remaining < expected) {
      Module["setStatus"](message + " (" + (expected - remaining) + "/" + expected + ")");
     } else {
      Module["setStatus"](message);
     }
    } else {
     Module["setStatus"]("");
    }
   }
  },
  runIter: function(func) {
   if (ABORT) return;
   if (Module["preMainLoop"]) {
    var preRet = Module["preMainLoop"]();
    if (preRet === false) {
     return;
    }
   }
   try {
    func();
   } catch (e) {
    if (e instanceof ExitStatus) {
     return;
    } else {
     if (e && typeof e === "object" && e.stack) err("exception thrown: " + [ e, e.stack ]);
     throw e;
    }
   }
   if (Module["postMainLoop"]) Module["postMainLoop"]();
  }
 },
 isFullscreen: false,
 pointerLock: false,
 moduleContextCreatedCallbacks: [],
 workers: [],
 init: function() {
  if (!Module["preloadPlugins"]) Module["preloadPlugins"] = [];
  if (Browser.initted) return;
  Browser.initted = true;
  try {
   new Blob();
   Browser.hasBlobConstructor = true;
  } catch (e) {
   Browser.hasBlobConstructor = false;
   console.log("warning: no blob constructor, cannot create blobs with mimetypes");
  }
  Browser.BlobBuilder = typeof MozBlobBuilder != "undefined" ? MozBlobBuilder : typeof WebKitBlobBuilder != "undefined" ? WebKitBlobBuilder : !Browser.hasBlobConstructor ? console.log("warning: no BlobBuilder") : null;
  Browser.URLObject = typeof window != "undefined" ? window.URL ? window.URL : window.webkitURL : undefined;
  if (!Module.noImageDecoding && typeof Browser.URLObject === "undefined") {
   console.log("warning: Browser does not support creating object URLs. Built-in browser image decoding will not be available.");
   Module.noImageDecoding = true;
  }
  var imagePlugin = {};
  imagePlugin["canHandle"] = function imagePlugin_canHandle(name) {
   return !Module.noImageDecoding && /\.(jpg|jpeg|png|bmp)$/i.test(name);
  };
  imagePlugin["handle"] = function imagePlugin_handle(byteArray, name, onload, onerror) {
   var b = null;
   if (Browser.hasBlobConstructor) {
    try {
     b = new Blob([ byteArray ], {
      type: Browser.getMimetype(name)
     });
     if (b.size !== byteArray.length) {
      b = new Blob([ new Uint8Array(byteArray).buffer ], {
       type: Browser.getMimetype(name)
      });
     }
    } catch (e) {
     warnOnce("Blob constructor present but fails: " + e + "; falling back to blob builder");
    }
   }
   if (!b) {
    var bb = new Browser.BlobBuilder();
    bb.append(new Uint8Array(byteArray).buffer);
    b = bb.getBlob();
   }
   var url = Browser.URLObject.createObjectURL(b);
   var img = new Image();
   img.onload = function img_onload() {
    assert(img.complete, "Image " + name + " could not be decoded");
    var canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    var ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);
    Module["preloadedImages"][name] = canvas;
    Browser.URLObject.revokeObjectURL(url);
    if (onload) onload(byteArray);
   };
   img.onerror = function img_onerror(event) {
    console.log("Image " + url + " could not be decoded");
    if (onerror) onerror();
   };
   img.src = url;
  };
  Module["preloadPlugins"].push(imagePlugin);
  var audioPlugin = {};
  audioPlugin["canHandle"] = function audioPlugin_canHandle(name) {
   return !Module.noAudioDecoding && name.substr(-4) in {
    ".ogg": 1,
    ".wav": 1,
    ".mp3": 1
   };
  };
  audioPlugin["handle"] = function audioPlugin_handle(byteArray, name, onload, onerror) {
   var done = false;
   function finish(audio) {
    if (done) return;
    done = true;
    Module["preloadedAudios"][name] = audio;
    if (onload) onload(byteArray);
   }
   function fail() {
    if (done) return;
    done = true;
    Module["preloadedAudios"][name] = new Audio();
    if (onerror) onerror();
   }
   if (Browser.hasBlobConstructor) {
    try {
     var b = new Blob([ byteArray ], {
      type: Browser.getMimetype(name)
     });
    } catch (e) {
     return fail();
    }
    var url = Browser.URLObject.createObjectURL(b);
    var audio = new Audio();
    audio.addEventListener("canplaythrough", function() {
     finish(audio);
    }, false);
    audio.onerror = function audio_onerror(event) {
     if (done) return;
     console.log("warning: browser could not fully decode audio " + name + ", trying slower base64 approach");
     function encode64(data) {
      var BASE = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
      var PAD = "=";
      var ret = "";
      var leftchar = 0;
      var leftbits = 0;
      for (var i = 0; i < data.length; i++) {
       leftchar = leftchar << 8 | data[i];
       leftbits += 8;
       while (leftbits >= 6) {
        var curr = leftchar >> leftbits - 6 & 63;
        leftbits -= 6;
        ret += BASE[curr];
       }
      }
      if (leftbits == 2) {
       ret += BASE[(leftchar & 3) << 4];
       ret += PAD + PAD;
      } else if (leftbits == 4) {
       ret += BASE[(leftchar & 15) << 2];
       ret += PAD;
      }
      return ret;
     }
     audio.src = "data:audio/x-" + name.substr(-3) + ";base64," + encode64(byteArray);
     finish(audio);
    };
    audio.src = url;
    Browser.safeSetTimeout(function() {
     finish(audio);
    }, 1e4);
   } else {
    return fail();
   }
  };
  Module["preloadPlugins"].push(audioPlugin);
  function pointerLockChange() {
   Browser.pointerLock = document["pointerLockElement"] === Module["canvas"] || document["mozPointerLockElement"] === Module["canvas"] || document["webkitPointerLockElement"] === Module["canvas"] || document["msPointerLockElement"] === Module["canvas"];
  }
  var canvas = Module["canvas"];
  if (canvas) {
   canvas.requestPointerLock = canvas["requestPointerLock"] || canvas["mozRequestPointerLock"] || canvas["webkitRequestPointerLock"] || canvas["msRequestPointerLock"] || function() {};
   canvas.exitPointerLock = document["exitPointerLock"] || document["mozExitPointerLock"] || document["webkitExitPointerLock"] || document["msExitPointerLock"] || function() {};
   canvas.exitPointerLock = canvas.exitPointerLock.bind(document);
   document.addEventListener("pointerlockchange", pointerLockChange, false);
   document.addEventListener("mozpointerlockchange", pointerLockChange, false);
   document.addEventListener("webkitpointerlockchange", pointerLockChange, false);
   document.addEventListener("mspointerlockchange", pointerLockChange, false);
   if (Module["elementPointerLock"]) {
    canvas.addEventListener("click", function(ev) {
     if (!Browser.pointerLock && Module["canvas"].requestPointerLock) {
      Module["canvas"].requestPointerLock();
      ev.preventDefault();
     }
    }, false);
   }
  }
 },
 createContext: function(canvas, useWebGL, setInModule, webGLContextAttributes) {
  if (useWebGL && Module.ctx && canvas == Module.canvas) return Module.ctx;
  var ctx;
  var contextHandle;
  if (useWebGL) {
   var contextAttributes = {
    antialias: false,
    alpha: false,
    majorVersion: 1
   };
   if (webGLContextAttributes) {
    for (var attribute in webGLContextAttributes) {
     contextAttributes[attribute] = webGLContextAttributes[attribute];
    }
   }
   if (typeof GL !== "undefined") {
    contextHandle = GL.createContext(canvas, contextAttributes);
    if (contextHandle) {
     ctx = GL.getContext(contextHandle).GLctx;
    }
   }
  } else {
   ctx = canvas.getContext("2d");
  }
  if (!ctx) return null;
  if (setInModule) {
   if (!useWebGL) assert(typeof GLctx === "undefined", "cannot set in module if GLctx is used, but we are a non-GL context that would replace it");
   Module.ctx = ctx;
   if (useWebGL) GL.makeContextCurrent(contextHandle);
   Module.useWebGL = useWebGL;
   Browser.moduleContextCreatedCallbacks.forEach(function(callback) {
    callback();
   });
   Browser.init();
  }
  return ctx;
 },
 destroyContext: function(canvas, useWebGL, setInModule) {},
 fullscreenHandlersInstalled: false,
 lockPointer: undefined,
 resizeCanvas: undefined,
 requestFullscreen: function(lockPointer, resizeCanvas) {
  Browser.lockPointer = lockPointer;
  Browser.resizeCanvas = resizeCanvas;
  if (typeof Browser.lockPointer === "undefined") Browser.lockPointer = true;
  if (typeof Browser.resizeCanvas === "undefined") Browser.resizeCanvas = false;
  var canvas = Module["canvas"];
  function fullscreenChange() {
   Browser.isFullscreen = false;
   var canvasContainer = canvas.parentNode;
   if ((document["fullscreenElement"] || document["mozFullScreenElement"] || document["msFullscreenElement"] || document["webkitFullscreenElement"] || document["webkitCurrentFullScreenElement"]) === canvasContainer) {
    canvas.exitFullscreen = Browser.exitFullscreen;
    if (Browser.lockPointer) canvas.requestPointerLock();
    Browser.isFullscreen = true;
    if (Browser.resizeCanvas) {
     Browser.setFullscreenCanvasSize();
    } else {
     Browser.updateCanvasDimensions(canvas);
    }
   } else {
    canvasContainer.parentNode.insertBefore(canvas, canvasContainer);
    canvasContainer.parentNode.removeChild(canvasContainer);
    if (Browser.resizeCanvas) {
     Browser.setWindowedCanvasSize();
    } else {
     Browser.updateCanvasDimensions(canvas);
    }
   }
   if (Module["onFullScreen"]) Module["onFullScreen"](Browser.isFullscreen);
   if (Module["onFullscreen"]) Module["onFullscreen"](Browser.isFullscreen);
  }
  if (!Browser.fullscreenHandlersInstalled) {
   Browser.fullscreenHandlersInstalled = true;
   document.addEventListener("fullscreenchange", fullscreenChange, false);
   document.addEventListener("mozfullscreenchange", fullscreenChange, false);
   document.addEventListener("webkitfullscreenchange", fullscreenChange, false);
   document.addEventListener("MSFullscreenChange", fullscreenChange, false);
  }
  var canvasContainer = document.createElement("div");
  canvas.parentNode.insertBefore(canvasContainer, canvas);
  canvasContainer.appendChild(canvas);
  canvasContainer.requestFullscreen = canvasContainer["requestFullscreen"] || canvasContainer["mozRequestFullScreen"] || canvasContainer["msRequestFullscreen"] || (canvasContainer["webkitRequestFullscreen"] ? function() {
   canvasContainer["webkitRequestFullscreen"](Element["ALLOW_KEYBOARD_INPUT"]);
  } : null) || (canvasContainer["webkitRequestFullScreen"] ? function() {
   canvasContainer["webkitRequestFullScreen"](Element["ALLOW_KEYBOARD_INPUT"]);
  } : null);
  canvasContainer.requestFullscreen();
 },
 exitFullscreen: function() {
  if (!Browser.isFullscreen) {
   return false;
  }
  var CFS = document["exitFullscreen"] || document["cancelFullScreen"] || document["mozCancelFullScreen"] || document["msExitFullscreen"] || document["webkitCancelFullScreen"] || function() {};
  CFS.apply(document, []);
  return true;
 },
 nextRAF: 0,
 fakeRequestAnimationFrame: function(func) {
  var now = Date.now();
  if (Browser.nextRAF === 0) {
   Browser.nextRAF = now + 1e3 / 60;
  } else {
   while (now + 2 >= Browser.nextRAF) {
    Browser.nextRAF += 1e3 / 60;
   }
  }
  var delay = Math.max(Browser.nextRAF - now, 0);
  setTimeout(func, delay);
 },
 requestAnimationFrame: function(func) {
  if (typeof requestAnimationFrame === "function") {
   requestAnimationFrame(func);
   return;
  }
  var RAF = Browser.fakeRequestAnimationFrame;
  RAF(func);
 },
 safeCallback: function(func) {
  return function() {
   if (!ABORT) return func.apply(null, arguments);
  };
 },
 allowAsyncCallbacks: true,
 queuedAsyncCallbacks: [],
 pauseAsyncCallbacks: function() {
  Browser.allowAsyncCallbacks = false;
 },
 resumeAsyncCallbacks: function() {
  Browser.allowAsyncCallbacks = true;
  if (Browser.queuedAsyncCallbacks.length > 0) {
   var callbacks = Browser.queuedAsyncCallbacks;
   Browser.queuedAsyncCallbacks = [];
   callbacks.forEach(function(func) {
    func();
   });
  }
 },
 safeRequestAnimationFrame: function(func) {
  return Browser.requestAnimationFrame(function() {
   if (ABORT) return;
   if (Browser.allowAsyncCallbacks) {
    func();
   } else {
    Browser.queuedAsyncCallbacks.push(func);
   }
  });
 },
 safeSetTimeout: function(func, timeout) {
  noExitRuntime = true;
  return setTimeout(function() {
   if (ABORT) return;
   if (Browser.allowAsyncCallbacks) {
    func();
   } else {
    Browser.queuedAsyncCallbacks.push(func);
   }
  }, timeout);
 },
 safeSetInterval: function(func, timeout) {
  noExitRuntime = true;
  return setInterval(function() {
   if (ABORT) return;
   if (Browser.allowAsyncCallbacks) {
    func();
   }
  }, timeout);
 },
 getMimetype: function(name) {
  return {
   "jpg": "image/jpeg",
   "jpeg": "image/jpeg",
   "png": "image/png",
   "bmp": "image/bmp",
   "ogg": "audio/ogg",
   "wav": "audio/wav",
   "mp3": "audio/mpeg"
  }[name.substr(name.lastIndexOf(".") + 1)];
 },
 getUserMedia: function(func) {
  if (!window.getUserMedia) {
   window.getUserMedia = navigator["getUserMedia"] || navigator["mozGetUserMedia"];
  }
  window.getUserMedia(func);
 },
 getMovementX: function(event) {
  return event["movementX"] || event["mozMovementX"] || event["webkitMovementX"] || 0;
 },
 getMovementY: function(event) {
  return event["movementY"] || event["mozMovementY"] || event["webkitMovementY"] || 0;
 },
 getMouseWheelDelta: function(event) {
  var delta = 0;
  switch (event.type) {
  case "DOMMouseScroll":
   delta = event.detail / 3;
   break;

  case "mousewheel":
   delta = event.wheelDelta / 120;
   break;

  case "wheel":
   delta = event.deltaY;
   switch (event.deltaMode) {
   case 0:
    delta /= 100;
    break;

   case 1:
    delta /= 3;
    break;

   case 2:
    delta *= 80;
    break;

   default:
    throw "unrecognized mouse wheel delta mode: " + event.deltaMode;
   }
   break;

  default:
   throw "unrecognized mouse wheel event: " + event.type;
  }
  return delta;
 },
 mouseX: 0,
 mouseY: 0,
 mouseMovementX: 0,
 mouseMovementY: 0,
 touches: {},
 lastTouches: {},
 calculateMouseEvent: function(event) {
  if (Browser.pointerLock) {
   if (event.type != "mousemove" && "mozMovementX" in event) {
    Browser.mouseMovementX = Browser.mouseMovementY = 0;
   } else {
    Browser.mouseMovementX = Browser.getMovementX(event);
    Browser.mouseMovementY = Browser.getMovementY(event);
   }
   if (typeof SDL != "undefined") {
    Browser.mouseX = SDL.mouseX + Browser.mouseMovementX;
    Browser.mouseY = SDL.mouseY + Browser.mouseMovementY;
   } else {
    Browser.mouseX += Browser.mouseMovementX;
    Browser.mouseY += Browser.mouseMovementY;
   }
  } else {
   var rect = Module["canvas"].getBoundingClientRect();
   var cw = Module["canvas"].width;
   var ch = Module["canvas"].height;
   var scrollX = typeof window.scrollX !== "undefined" ? window.scrollX : window.pageXOffset;
   var scrollY = typeof window.scrollY !== "undefined" ? window.scrollY : window.pageYOffset;
   if (event.type === "touchstart" || event.type === "touchend" || event.type === "touchmove") {
    var touch = event.touch;
    if (touch === undefined) {
     return;
    }
    var adjustedX = touch.pageX - (scrollX + rect.left);
    var adjustedY = touch.pageY - (scrollY + rect.top);
    adjustedX = adjustedX * (cw / rect.width);
    adjustedY = adjustedY * (ch / rect.height);
    var coords = {
     x: adjustedX,
     y: adjustedY
    };
    if (event.type === "touchstart") {
     Browser.lastTouches[touch.identifier] = coords;
     Browser.touches[touch.identifier] = coords;
    } else if (event.type === "touchend" || event.type === "touchmove") {
     var last = Browser.touches[touch.identifier];
     if (!last) last = coords;
     Browser.lastTouches[touch.identifier] = last;
     Browser.touches[touch.identifier] = coords;
    }
    return;
   }
   var x = event.pageX - (scrollX + rect.left);
   var y = event.pageY - (scrollY + rect.top);
   x = x * (cw / rect.width);
   y = y * (ch / rect.height);
   Browser.mouseMovementX = x - Browser.mouseX;
   Browser.mouseMovementY = y - Browser.mouseY;
   Browser.mouseX = x;
   Browser.mouseY = y;
  }
 },
 asyncLoad: function(url, onload, onerror, noRunDep) {
  var dep = !noRunDep ? getUniqueRunDependency("al " + url) : "";
  readAsync(url, function(arrayBuffer) {
   assert(arrayBuffer, 'Loading data file "' + url + '" failed (no arrayBuffer).');
   onload(new Uint8Array(arrayBuffer));
   if (dep) removeRunDependency(dep);
  }, function(event) {
   if (onerror) {
    onerror();
   } else {
    throw 'Loading data file "' + url + '" failed.';
   }
  });
  if (dep) addRunDependency(dep);
 },
 resizeListeners: [],
 updateResizeListeners: function() {
  var canvas = Module["canvas"];
  Browser.resizeListeners.forEach(function(listener) {
   listener(canvas.width, canvas.height);
  });
 },
 setCanvasSize: function(width, height, noUpdates) {
  var canvas = Module["canvas"];
  Browser.updateCanvasDimensions(canvas, width, height);
  if (!noUpdates) Browser.updateResizeListeners();
 },
 windowedWidth: 0,
 windowedHeight: 0,
 setFullscreenCanvasSize: function() {
  if (typeof SDL != "undefined") {
   var flags = HEAPU32[SDL.screen >> 2];
   flags = flags | 8388608;
   HEAP32[SDL.screen >> 2] = flags;
  }
  Browser.updateCanvasDimensions(Module["canvas"]);
  Browser.updateResizeListeners();
 },
 setWindowedCanvasSize: function() {
  if (typeof SDL != "undefined") {
   var flags = HEAPU32[SDL.screen >> 2];
   flags = flags & ~8388608;
   HEAP32[SDL.screen >> 2] = flags;
  }
  Browser.updateCanvasDimensions(Module["canvas"]);
  Browser.updateResizeListeners();
 },
 updateCanvasDimensions: function(canvas, wNative, hNative) {
  if (wNative && hNative) {
   canvas.widthNative = wNative;
   canvas.heightNative = hNative;
  } else {
   wNative = canvas.widthNative;
   hNative = canvas.heightNative;
  }
  var w = wNative;
  var h = hNative;
  if (Module["forcedAspectRatio"] && Module["forcedAspectRatio"] > 0) {
   if (w / h < Module["forcedAspectRatio"]) {
    w = Math.round(h * Module["forcedAspectRatio"]);
   } else {
    h = Math.round(w / Module["forcedAspectRatio"]);
   }
  }
  if ((document["fullscreenElement"] || document["mozFullScreenElement"] || document["msFullscreenElement"] || document["webkitFullscreenElement"] || document["webkitCurrentFullScreenElement"]) === canvas.parentNode && typeof screen != "undefined") {
   var factor = Math.min(screen.width / w, screen.height / h);
   w = Math.round(w * factor);
   h = Math.round(h * factor);
  }
  if (Browser.resizeCanvas) {
   if (canvas.width != w) canvas.width = w;
   if (canvas.height != h) canvas.height = h;
   if (typeof canvas.style != "undefined") {
    canvas.style.removeProperty("width");
    canvas.style.removeProperty("height");
   }
  } else {
   if (canvas.width != wNative) canvas.width = wNative;
   if (canvas.height != hNative) canvas.height = hNative;
   if (typeof canvas.style != "undefined") {
    if (w != wNative || h != hNative) {
     canvas.style.setProperty("width", w + "px", "important");
     canvas.style.setProperty("height", h + "px", "important");
    } else {
     canvas.style.removeProperty("width");
     canvas.style.removeProperty("height");
    }
   }
  }
 },
 wgetRequests: {},
 nextWgetRequestHandle: 0,
 getNextWgetRequestHandle: function() {
  var handle = Browser.nextWgetRequestHandle;
  Browser.nextWgetRequestHandle++;
  return handle;
 }
};

var EGL = {
 errorCode: 12288,
 defaultDisplayInitialized: false,
 currentContext: 0,
 currentReadSurface: 0,
 currentDrawSurface: 0,
 contextAttributes: {
  alpha: false,
  depth: false,
  stencil: false,
  antialias: false
 },
 stringCache: {},
 setErrorCode: function(code) {
  EGL.errorCode = code;
 },
 chooseConfig: function(display, attribList, config, config_size, numConfigs) {
  if (display != 62e3) {
   EGL.setErrorCode(12296);
   return 0;
  }
  if (attribList) {
   for (;;) {
    var param = HEAP32[attribList >> 2];
    if (param == 12321) {
     var alphaSize = HEAP32[attribList + 4 >> 2];
     EGL.contextAttributes.alpha = alphaSize > 0;
    } else if (param == 12325) {
     var depthSize = HEAP32[attribList + 4 >> 2];
     EGL.contextAttributes.depth = depthSize > 0;
    } else if (param == 12326) {
     var stencilSize = HEAP32[attribList + 4 >> 2];
     EGL.contextAttributes.stencil = stencilSize > 0;
    } else if (param == 12337) {
     var samples = HEAP32[attribList + 4 >> 2];
     EGL.contextAttributes.antialias = samples > 0;
    } else if (param == 12338) {
     var samples = HEAP32[attribList + 4 >> 2];
     EGL.contextAttributes.antialias = samples == 1;
    } else if (param == 12544) {
     var requestedPriority = HEAP32[attribList + 4 >> 2];
     EGL.contextAttributes.lowLatency = requestedPriority != 12547;
    } else if (param == 12344) {
     break;
    }
    attribList += 8;
   }
  }
  if ((!config || !config_size) && !numConfigs) {
   EGL.setErrorCode(12300);
   return 0;
  }
  if (numConfigs) {
   HEAP32[numConfigs >> 2] = 1;
  }
  if (config && config_size > 0) {
   HEAP32[config >> 2] = 62002;
  }
  EGL.setErrorCode(12288);
  return 1;
 }
};

function _eglGetCurrentDisplay() {
 return EGL.currentContext ? 62e3 : 0;
}

function _eglGetProcAddress(name_) {
 return _emscripten_GetProcAddress(name_);
}

function _eglQueryString(display, name) {
 if (display != 62e3) {
  EGL.setErrorCode(12296);
  return 0;
 }
 EGL.setErrorCode(12288);
 if (EGL.stringCache[name]) return EGL.stringCache[name];
 var ret;
 switch (name) {
 case 12371:
  ret = allocateUTF8("Emscripten");
  break;

 case 12372:
  ret = allocateUTF8("1.4 Emscripten EGL");
  break;

 case 12373:
  ret = allocateUTF8("");
  break;

 case 12429:
  ret = allocateUTF8("OpenGL_ES");
  break;

 default:
  EGL.setErrorCode(12300);
  return 0;
 }
 EGL.stringCache[name] = ret;
 return ret;
}

function __webgl_enable_ANGLE_instanced_arrays(ctx) {
 var ext = ctx.getExtension("ANGLE_instanced_arrays");
 if (ext) {
  ctx["vertexAttribDivisor"] = function(index, divisor) {
   ext["vertexAttribDivisorANGLE"](index, divisor);
  };
  ctx["drawArraysInstanced"] = function(mode, first, count, primcount) {
   ext["drawArraysInstancedANGLE"](mode, first, count, primcount);
  };
  ctx["drawElementsInstanced"] = function(mode, count, type, indices, primcount) {
   ext["drawElementsInstancedANGLE"](mode, count, type, indices, primcount);
  };
  return 1;
 }
}

function __webgl_enable_OES_vertex_array_object(ctx) {
 var ext = ctx.getExtension("OES_vertex_array_object");
 if (ext) {
  ctx["createVertexArray"] = function() {
   return ext["createVertexArrayOES"]();
  };
  ctx["deleteVertexArray"] = function(vao) {
   ext["deleteVertexArrayOES"](vao);
  };
  ctx["bindVertexArray"] = function(vao) {
   ext["bindVertexArrayOES"](vao);
  };
  ctx["isVertexArray"] = function(vao) {
   return ext["isVertexArrayOES"](vao);
  };
  return 1;
 }
}

function __webgl_enable_WEBGL_draw_buffers(ctx) {
 var ext = ctx.getExtension("WEBGL_draw_buffers");
 if (ext) {
  ctx["drawBuffers"] = function(n, bufs) {
   ext["drawBuffersWEBGL"](n, bufs);
  };
  return 1;
 }
}

var GL = {
 counter: 1,
 lastError: 0,
 buffers: [],
 mappedBuffers: {},
 programs: [],
 framebuffers: [],
 renderbuffers: [],
 textures: [],
 uniforms: [],
 shaders: [],
 vaos: [],
 contexts: [],
 currentContext: null,
 offscreenCanvases: {},
 timerQueriesEXT: [],
 programInfos: {},
 stringCache: {},
 unpackAlignment: 4,
 init: function() {
  var miniTempFloatBuffer = new Float32Array(GL.MINI_TEMP_BUFFER_SIZE);
  for (var i = 0; i < GL.MINI_TEMP_BUFFER_SIZE; i++) {
   GL.miniTempBufferFloatViews[i] = miniTempFloatBuffer.subarray(0, i + 1);
  }
  var miniTempIntBuffer = new Int32Array(GL.MINI_TEMP_BUFFER_SIZE);
  for (var i = 0; i < GL.MINI_TEMP_BUFFER_SIZE; i++) {
   GL.miniTempBufferIntViews[i] = miniTempIntBuffer.subarray(0, i + 1);
  }
 },
 recordError: function recordError(errorCode) {
  if (!GL.lastError) {
   GL.lastError = errorCode;
  }
 },
 getNewId: function(table) {
  var ret = GL.counter++;
  for (var i = table.length; i < ret; i++) {
   table[i] = null;
  }
  return ret;
 },
 MINI_TEMP_BUFFER_SIZE: 256,
 miniTempBufferFloatViews: [ 0 ],
 miniTempBufferIntViews: [ 0 ],
 getSource: function(shader, count, string, length) {
  var source = "";
  for (var i = 0; i < count; ++i) {
   var len = length ? HEAP32[length + i * 4 >> 2] : -1;
   source += UTF8ToString(HEAP32[string + i * 4 >> 2], len < 0 ? undefined : len);
  }
  return source;
 },
 createContext: function(canvas, webGLContextAttributes) {
  var ctx = canvas.getContext("webgl", webGLContextAttributes);
  if (!ctx) return 0;
  var handle = GL.registerContext(ctx, webGLContextAttributes);
  return handle;
 },
 registerContext: function(ctx, webGLContextAttributes) {
  var handle = GL.getNewId(GL.contexts);
  var context = {
   handle: handle,
   attributes: webGLContextAttributes,
   version: webGLContextAttributes.majorVersion,
   GLctx: ctx
  };
  if (ctx.canvas) ctx.canvas.GLctxObject = context;
  GL.contexts[handle] = context;
  if (typeof webGLContextAttributes.enableExtensionsByDefault === "undefined" || webGLContextAttributes.enableExtensionsByDefault) {
   GL.initExtensions(context);
  }
  return handle;
 },
 makeContextCurrent: function(contextHandle) {
  GL.currentContext = GL.contexts[contextHandle];
  Module.ctx = GLctx = GL.currentContext && GL.currentContext.GLctx;
  return !(contextHandle && !GLctx);
 },
 getContext: function(contextHandle) {
  return GL.contexts[contextHandle];
 },
 deleteContext: function(contextHandle) {
  if (GL.currentContext === GL.contexts[contextHandle]) GL.currentContext = null;
  if (typeof JSEvents === "object") JSEvents.removeAllHandlersOnTarget(GL.contexts[contextHandle].GLctx.canvas);
  if (GL.contexts[contextHandle] && GL.contexts[contextHandle].GLctx.canvas) GL.contexts[contextHandle].GLctx.canvas.GLctxObject = undefined;
  GL.contexts[contextHandle] = null;
 },
 initExtensions: function(context) {
  if (!context) context = GL.currentContext;
  if (context.initExtensionsDone) return;
  context.initExtensionsDone = true;
  var GLctx = context.GLctx;
  __webgl_enable_ANGLE_instanced_arrays(GLctx);
  __webgl_enable_OES_vertex_array_object(GLctx);
  __webgl_enable_WEBGL_draw_buffers(GLctx);
  GLctx.disjointTimerQueryExt = GLctx.getExtension("EXT_disjoint_timer_query");
  var automaticallyEnabledExtensions = [ "OES_texture_float", "OES_texture_half_float", "OES_standard_derivatives", "OES_vertex_array_object", "WEBGL_compressed_texture_s3tc", "WEBGL_depth_texture", "OES_element_index_uint", "EXT_texture_filter_anisotropic", "EXT_frag_depth", "WEBGL_draw_buffers", "ANGLE_instanced_arrays", "OES_texture_float_linear", "OES_texture_half_float_linear", "EXT_blend_minmax", "EXT_shader_texture_lod", "EXT_texture_norm16", "WEBGL_compressed_texture_pvrtc", "EXT_color_buffer_half_float", "WEBGL_color_buffer_float", "EXT_sRGB", "WEBGL_compressed_texture_etc1", "EXT_disjoint_timer_query", "WEBGL_compressed_texture_etc", "WEBGL_compressed_texture_astc", "EXT_color_buffer_float", "WEBGL_compressed_texture_s3tc_srgb", "EXT_disjoint_timer_query_webgl2", "WEBKIT_WEBGL_compressed_texture_pvrtc" ];
  var exts = GLctx.getSupportedExtensions() || [];
  exts.forEach(function(ext) {
   if (automaticallyEnabledExtensions.indexOf(ext) != -1) {
    GLctx.getExtension(ext);
   }
  });
 },
 populateUniformTable: function(program) {
  var p = GL.programs[program];
  var ptable = GL.programInfos[program] = {
   uniforms: {},
   maxUniformLength: 0,
   maxAttributeLength: -1,
   maxUniformBlockNameLength: -1
  };
  var utable = ptable.uniforms;
  var numUniforms = GLctx.getProgramParameter(p, 35718);
  for (var i = 0; i < numUniforms; ++i) {
   var u = GLctx.getActiveUniform(p, i);
   var name = u.name;
   ptable.maxUniformLength = Math.max(ptable.maxUniformLength, name.length + 1);
   if (name.slice(-1) == "]") {
    name = name.slice(0, name.lastIndexOf("["));
   }
   var loc = GLctx.getUniformLocation(p, name);
   if (loc) {
    var id = GL.getNewId(GL.uniforms);
    utable[name] = [ u.size, id ];
    GL.uniforms[id] = loc;
    for (var j = 1; j < u.size; ++j) {
     var n = name + "[" + j + "]";
     loc = GLctx.getUniformLocation(p, n);
     id = GL.getNewId(GL.uniforms);
     GL.uniforms[id] = loc;
    }
   }
  }
 }
};

function _emscripten_glActiveTexture(x0) {
 GLctx["activeTexture"](x0);
}

function _emscripten_glAttachShader(program, shader) {
 GLctx.attachShader(GL.programs[program], GL.shaders[shader]);
}

function _emscripten_glBeginQueryEXT(target, id) {
 GLctx.disjointTimerQueryExt["beginQueryEXT"](target, GL.timerQueriesEXT[id]);
}

function _emscripten_glBindAttribLocation(program, index, name) {
 GLctx.bindAttribLocation(GL.programs[program], index, UTF8ToString(name));
}

function _emscripten_glBindBuffer(target, buffer) {
 GLctx.bindBuffer(target, GL.buffers[buffer]);
}

function _emscripten_glBindFramebuffer(target, framebuffer) {
 GLctx.bindFramebuffer(target, GL.framebuffers[framebuffer]);
}

function _emscripten_glBindRenderbuffer(target, renderbuffer) {
 GLctx.bindRenderbuffer(target, GL.renderbuffers[renderbuffer]);
}

function _emscripten_glBindTexture(target, texture) {
 GLctx.bindTexture(target, GL.textures[texture]);
}

function _emscripten_glBindVertexArrayOES(vao) {
 GLctx["bindVertexArray"](GL.vaos[vao]);
}

function _emscripten_glBlendColor(x0, x1, x2, x3) {
 GLctx["blendColor"](x0, x1, x2, x3);
}

function _emscripten_glBlendEquation(x0) {
 GLctx["blendEquation"](x0);
}

function _emscripten_glBlendEquationSeparate(x0, x1) {
 GLctx["blendEquationSeparate"](x0, x1);
}

function _emscripten_glBlendFunc(x0, x1) {
 GLctx["blendFunc"](x0, x1);
}

function _emscripten_glBlendFuncSeparate(x0, x1, x2, x3) {
 GLctx["blendFuncSeparate"](x0, x1, x2, x3);
}

function _emscripten_glBufferData(target, size, data, usage) {
 GLctx.bufferData(target, data ? HEAPU8.subarray(data, data + size) : size, usage);
}

function _emscripten_glBufferSubData(target, offset, size, data) {
 GLctx.bufferSubData(target, offset, HEAPU8.subarray(data, data + size));
}

function _emscripten_glCheckFramebufferStatus(x0) {
 return GLctx["checkFramebufferStatus"](x0);
}

function _emscripten_glClear(x0) {
 GLctx["clear"](x0);
}

function _emscripten_glClearColor(x0, x1, x2, x3) {
 GLctx["clearColor"](x0, x1, x2, x3);
}

function _emscripten_glClearDepthf(x0) {
 GLctx["clearDepth"](x0);
}

function _emscripten_glClearStencil(x0) {
 GLctx["clearStencil"](x0);
}

function _emscripten_glColorMask(red, green, blue, alpha) {
 GLctx.colorMask(!!red, !!green, !!blue, !!alpha);
}

function _emscripten_glCompileShader(shader) {
 GLctx.compileShader(GL.shaders[shader]);
}

function _emscripten_glCompressedTexImage2D(target, level, internalFormat, width, height, border, imageSize, data) {
 GLctx["compressedTexImage2D"](target, level, internalFormat, width, height, border, data ? HEAPU8.subarray(data, data + imageSize) : null);
}

function _emscripten_glCompressedTexSubImage2D(target, level, xoffset, yoffset, width, height, format, imageSize, data) {
 GLctx["compressedTexSubImage2D"](target, level, xoffset, yoffset, width, height, format, data ? HEAPU8.subarray(data, data + imageSize) : null);
}

function _emscripten_glCopyTexImage2D(x0, x1, x2, x3, x4, x5, x6, x7) {
 GLctx["copyTexImage2D"](x0, x1, x2, x3, x4, x5, x6, x7);
}

function _emscripten_glCopyTexSubImage2D(x0, x1, x2, x3, x4, x5, x6, x7) {
 GLctx["copyTexSubImage2D"](x0, x1, x2, x3, x4, x5, x6, x7);
}

function _emscripten_glCreateProgram() {
 var id = GL.getNewId(GL.programs);
 var program = GLctx.createProgram();
 program.name = id;
 GL.programs[id] = program;
 return id;
}

function _emscripten_glCreateShader(shaderType) {
 var id = GL.getNewId(GL.shaders);
 GL.shaders[id] = GLctx.createShader(shaderType);
 return id;
}

function _emscripten_glCullFace(x0) {
 GLctx["cullFace"](x0);
}

function _emscripten_glDeleteBuffers(n, buffers) {
 for (var i = 0; i < n; i++) {
  var id = HEAP32[buffers + i * 4 >> 2];
  var buffer = GL.buffers[id];
  if (!buffer) continue;
  GLctx.deleteBuffer(buffer);
  buffer.name = 0;
  GL.buffers[id] = null;
  if (id == GL.currArrayBuffer) GL.currArrayBuffer = 0;
  if (id == GL.currElementArrayBuffer) GL.currElementArrayBuffer = 0;
 }
}

function _emscripten_glDeleteFramebuffers(n, framebuffers) {
 for (var i = 0; i < n; ++i) {
  var id = HEAP32[framebuffers + i * 4 >> 2];
  var framebuffer = GL.framebuffers[id];
  if (!framebuffer) continue;
  GLctx.deleteFramebuffer(framebuffer);
  framebuffer.name = 0;
  GL.framebuffers[id] = null;
 }
}

function _emscripten_glDeleteProgram(id) {
 if (!id) return;
 var program = GL.programs[id];
 if (!program) {
  GL.recordError(1281);
  return;
 }
 GLctx.deleteProgram(program);
 program.name = 0;
 GL.programs[id] = null;
 GL.programInfos[id] = null;
}

function _emscripten_glDeleteQueriesEXT(n, ids) {
 for (var i = 0; i < n; i++) {
  var id = HEAP32[ids + i * 4 >> 2];
  var query = GL.timerQueriesEXT[id];
  if (!query) continue;
  GLctx.disjointTimerQueryExt["deleteQueryEXT"](query);
  GL.timerQueriesEXT[id] = null;
 }
}

function _emscripten_glDeleteRenderbuffers(n, renderbuffers) {
 for (var i = 0; i < n; i++) {
  var id = HEAP32[renderbuffers + i * 4 >> 2];
  var renderbuffer = GL.renderbuffers[id];
  if (!renderbuffer) continue;
  GLctx.deleteRenderbuffer(renderbuffer);
  renderbuffer.name = 0;
  GL.renderbuffers[id] = null;
 }
}

function _emscripten_glDeleteShader(id) {
 if (!id) return;
 var shader = GL.shaders[id];
 if (!shader) {
  GL.recordError(1281);
  return;
 }
 GLctx.deleteShader(shader);
 GL.shaders[id] = null;
}

function _emscripten_glDeleteTextures(n, textures) {
 for (var i = 0; i < n; i++) {
  var id = HEAP32[textures + i * 4 >> 2];
  var texture = GL.textures[id];
  if (!texture) continue;
  GLctx.deleteTexture(texture);
  texture.name = 0;
  GL.textures[id] = null;
 }
}

function _emscripten_glDeleteVertexArraysOES(n, vaos) {
 for (var i = 0; i < n; i++) {
  var id = HEAP32[vaos + i * 4 >> 2];
  GLctx["deleteVertexArray"](GL.vaos[id]);
  GL.vaos[id] = null;
 }
}

function _emscripten_glDepthFunc(x0) {
 GLctx["depthFunc"](x0);
}

function _emscripten_glDepthMask(flag) {
 GLctx.depthMask(!!flag);
}

function _emscripten_glDepthRangef(x0, x1) {
 GLctx["depthRange"](x0, x1);
}

function _emscripten_glDetachShader(program, shader) {
 GLctx.detachShader(GL.programs[program], GL.shaders[shader]);
}

function _emscripten_glDisable(x0) {
 GLctx["disable"](x0);
}

function _emscripten_glDisableVertexAttribArray(index) {
 GLctx.disableVertexAttribArray(index);
}

function _emscripten_glDrawArrays(mode, first, count) {
 GLctx.drawArrays(mode, first, count);
}

function _emscripten_glDrawArraysInstancedANGLE(mode, first, count, primcount) {
 GLctx["drawArraysInstanced"](mode, first, count, primcount);
}

var __tempFixedLengthArray = [];

function _emscripten_glDrawBuffersWEBGL(n, bufs) {
 var bufArray = __tempFixedLengthArray[n];
 for (var i = 0; i < n; i++) {
  bufArray[i] = HEAP32[bufs + i * 4 >> 2];
 }
 GLctx["drawBuffers"](bufArray);
}

function _emscripten_glDrawElements(mode, count, type, indices) {
 GLctx.drawElements(mode, count, type, indices);
}

function _emscripten_glDrawElementsInstancedANGLE(mode, count, type, indices, primcount) {
 GLctx["drawElementsInstanced"](mode, count, type, indices, primcount);
}

function _emscripten_glEnable(x0) {
 GLctx["enable"](x0);
}

function _emscripten_glEnableVertexAttribArray(index) {
 GLctx.enableVertexAttribArray(index);
}

function _emscripten_glEndQueryEXT(target) {
 GLctx.disjointTimerQueryExt["endQueryEXT"](target);
}

function _emscripten_glFinish() {
 GLctx["finish"]();
}

function _emscripten_glFlush() {
 GLctx["flush"]();
}

function _emscripten_glFramebufferRenderbuffer(target, attachment, renderbuffertarget, renderbuffer) {
 GLctx.framebufferRenderbuffer(target, attachment, renderbuffertarget, GL.renderbuffers[renderbuffer]);
}

function _emscripten_glFramebufferTexture2D(target, attachment, textarget, texture, level) {
 GLctx.framebufferTexture2D(target, attachment, textarget, GL.textures[texture], level);
}

function _emscripten_glFrontFace(x0) {
 GLctx["frontFace"](x0);
}

function __glGenObject(n, buffers, createFunction, objectTable) {
 for (var i = 0; i < n; i++) {
  var buffer = GLctx[createFunction]();
  var id = buffer && GL.getNewId(objectTable);
  if (buffer) {
   buffer.name = id;
   objectTable[id] = buffer;
  } else {
   GL.recordError(1282);
  }
  HEAP32[buffers + i * 4 >> 2] = id;
 }
}

function _emscripten_glGenBuffers(n, buffers) {
 __glGenObject(n, buffers, "createBuffer", GL.buffers);
}

function _emscripten_glGenFramebuffers(n, ids) {
 __glGenObject(n, ids, "createFramebuffer", GL.framebuffers);
}

function _emscripten_glGenQueriesEXT(n, ids) {
 for (var i = 0; i < n; i++) {
  var query = GLctx.disjointTimerQueryExt["createQueryEXT"]();
  if (!query) {
   GL.recordError(1282);
   while (i < n) HEAP32[ids + i++ * 4 >> 2] = 0;
   return;
  }
  var id = GL.getNewId(GL.timerQueriesEXT);
  query.name = id;
  GL.timerQueriesEXT[id] = query;
  HEAP32[ids + i * 4 >> 2] = id;
 }
}

function _emscripten_glGenRenderbuffers(n, renderbuffers) {
 __glGenObject(n, renderbuffers, "createRenderbuffer", GL.renderbuffers);
}

function _emscripten_glGenTextures(n, textures) {
 __glGenObject(n, textures, "createTexture", GL.textures);
}

function _emscripten_glGenVertexArraysOES(n, arrays) {
 __glGenObject(n, arrays, "createVertexArray", GL.vaos);
}

function _emscripten_glGenerateMipmap(x0) {
 GLctx["generateMipmap"](x0);
}

function _emscripten_glGetActiveAttrib(program, index, bufSize, length, size, type, name) {
 program = GL.programs[program];
 var info = GLctx.getActiveAttrib(program, index);
 if (!info) return;
 var numBytesWrittenExclNull = bufSize > 0 && name ? stringToUTF8(info.name, name, bufSize) : 0;
 if (length) HEAP32[length >> 2] = numBytesWrittenExclNull;
 if (size) HEAP32[size >> 2] = info.size;
 if (type) HEAP32[type >> 2] = info.type;
}

function _emscripten_glGetActiveUniform(program, index, bufSize, length, size, type, name) {
 program = GL.programs[program];
 var info = GLctx.getActiveUniform(program, index);
 if (!info) return;
 var numBytesWrittenExclNull = bufSize > 0 && name ? stringToUTF8(info.name, name, bufSize) : 0;
 if (length) HEAP32[length >> 2] = numBytesWrittenExclNull;
 if (size) HEAP32[size >> 2] = info.size;
 if (type) HEAP32[type >> 2] = info.type;
}

function _emscripten_glGetAttachedShaders(program, maxCount, count, shaders) {
 var result = GLctx.getAttachedShaders(GL.programs[program]);
 var len = result.length;
 if (len > maxCount) {
  len = maxCount;
 }
 HEAP32[count >> 2] = len;
 for (var i = 0; i < len; ++i) {
  var id = GL.shaders.indexOf(result[i]);
  HEAP32[shaders + i * 4 >> 2] = id;
 }
}

function _emscripten_glGetAttribLocation(program, name) {
 return GLctx.getAttribLocation(GL.programs[program], UTF8ToString(name));
}

function writeI53ToI64(ptr, num) {
 HEAPU32[ptr >> 2] = num;
 HEAPU32[ptr + 4 >> 2] = (num - HEAPU32[ptr >> 2]) / 4294967296;
}

function emscriptenWebGLGet(name_, p, type) {
 if (!p) {
  GL.recordError(1281);
  return;
 }
 var ret = undefined;
 switch (name_) {
 case 36346:
  ret = 1;
  break;

 case 36344:
  if (type != 0 && type != 1) {
   GL.recordError(1280);
  }
  return;

 case 36345:
  ret = 0;
  break;

 case 34466:
  var formats = GLctx.getParameter(34467);
  ret = formats ? formats.length : 0;
  break;
 }
 if (ret === undefined) {
  var result = GLctx.getParameter(name_);
  switch (typeof result) {
  case "number":
   ret = result;
   break;

  case "boolean":
   ret = result ? 1 : 0;
   break;

  case "string":
   GL.recordError(1280);
   return;

  case "object":
   if (result === null) {
    switch (name_) {
    case 34964:
    case 35725:
    case 34965:
    case 36006:
    case 36007:
    case 32873:
    case 34229:
    case 34068:
     {
      ret = 0;
      break;
     }

    default:
     {
      GL.recordError(1280);
      return;
     }
    }
   } else if (result instanceof Float32Array || result instanceof Uint32Array || result instanceof Int32Array || result instanceof Array) {
    for (var i = 0; i < result.length; ++i) {
     switch (type) {
     case 0:
      HEAP32[p + i * 4 >> 2] = result[i];
      break;

     case 2:
      HEAPF32[p + i * 4 >> 2] = result[i];
      break;

     case 4:
      HEAP8[p + i >> 0] = result[i] ? 1 : 0;
      break;
     }
    }
    return;
   } else {
    try {
     ret = result.name | 0;
    } catch (e) {
     GL.recordError(1280);
     err("GL_INVALID_ENUM in glGet" + type + "v: Unknown object returned from WebGL getParameter(" + name_ + ")! (error: " + e + ")");
     return;
    }
   }
   break;

  default:
   GL.recordError(1280);
   err("GL_INVALID_ENUM in glGet" + type + "v: Native code calling glGet" + type + "v(" + name_ + ") and it returns " + result + " of type " + typeof result + "!");
   return;
  }
 }
 switch (type) {
 case 1:
  writeI53ToI64(p, ret);
  break;

 case 0:
  HEAP32[p >> 2] = ret;
  break;

 case 2:
  HEAPF32[p >> 2] = ret;
  break;

 case 4:
  HEAP8[p >> 0] = ret ? 1 : 0;
  break;
 }
}

function _emscripten_glGetBooleanv(name_, p) {
 emscriptenWebGLGet(name_, p, 4);
}

function _emscripten_glGetBufferParameteriv(target, value, data) {
 if (!data) {
  GL.recordError(1281);
  return;
 }
 HEAP32[data >> 2] = GLctx.getBufferParameter(target, value);
}

function _emscripten_glGetError() {
 var error = GLctx.getError() || GL.lastError;
 GL.lastError = 0;
 return error;
}

function _emscripten_glGetFloatv(name_, p) {
 emscriptenWebGLGet(name_, p, 2);
}

function _emscripten_glGetFramebufferAttachmentParameteriv(target, attachment, pname, params) {
 var result = GLctx.getFramebufferAttachmentParameter(target, attachment, pname);
 if (result instanceof WebGLRenderbuffer || result instanceof WebGLTexture) {
  result = result.name | 0;
 }
 HEAP32[params >> 2] = result;
}

function _emscripten_glGetIntegerv(name_, p) {
 emscriptenWebGLGet(name_, p, 0);
}

function _emscripten_glGetProgramInfoLog(program, maxLength, length, infoLog) {
 var log = GLctx.getProgramInfoLog(GL.programs[program]);
 if (log === null) log = "(unknown error)";
 var numBytesWrittenExclNull = maxLength > 0 && infoLog ? stringToUTF8(log, infoLog, maxLength) : 0;
 if (length) HEAP32[length >> 2] = numBytesWrittenExclNull;
}

function _emscripten_glGetProgramiv(program, pname, p) {
 if (!p) {
  GL.recordError(1281);
  return;
 }
 if (program >= GL.counter) {
  GL.recordError(1281);
  return;
 }
 var ptable = GL.programInfos[program];
 if (!ptable) {
  GL.recordError(1282);
  return;
 }
 if (pname == 35716) {
  var log = GLctx.getProgramInfoLog(GL.programs[program]);
  if (log === null) log = "(unknown error)";
  HEAP32[p >> 2] = log.length + 1;
 } else if (pname == 35719) {
  HEAP32[p >> 2] = ptable.maxUniformLength;
 } else if (pname == 35722) {
  if (ptable.maxAttributeLength == -1) {
   program = GL.programs[program];
   var numAttribs = GLctx.getProgramParameter(program, 35721);
   ptable.maxAttributeLength = 0;
   for (var i = 0; i < numAttribs; ++i) {
    var activeAttrib = GLctx.getActiveAttrib(program, i);
    ptable.maxAttributeLength = Math.max(ptable.maxAttributeLength, activeAttrib.name.length + 1);
   }
  }
  HEAP32[p >> 2] = ptable.maxAttributeLength;
 } else if (pname == 35381) {
  if (ptable.maxUniformBlockNameLength == -1) {
   program = GL.programs[program];
   var numBlocks = GLctx.getProgramParameter(program, 35382);
   ptable.maxUniformBlockNameLength = 0;
   for (var i = 0; i < numBlocks; ++i) {
    var activeBlockName = GLctx.getActiveUniformBlockName(program, i);
    ptable.maxUniformBlockNameLength = Math.max(ptable.maxUniformBlockNameLength, activeBlockName.length + 1);
   }
  }
  HEAP32[p >> 2] = ptable.maxUniformBlockNameLength;
 } else {
  HEAP32[p >> 2] = GLctx.getProgramParameter(GL.programs[program], pname);
 }
}

function _emscripten_glGetQueryObjecti64vEXT(id, pname, params) {
 if (!params) {
  GL.recordError(1281);
  return;
 }
 var query = GL.timerQueriesEXT[id];
 var param = GLctx.disjointTimerQueryExt["getQueryObjectEXT"](query, pname);
 var ret;
 if (typeof param == "boolean") {
  ret = param ? 1 : 0;
 } else {
  ret = param;
 }
 writeI53ToI64(params, ret);
}

function _emscripten_glGetQueryObjectivEXT(id, pname, params) {
 if (!params) {
  GL.recordError(1281);
  return;
 }
 var query = GL.timerQueriesEXT[id];
 var param = GLctx.disjointTimerQueryExt["getQueryObjectEXT"](query, pname);
 var ret;
 if (typeof param == "boolean") {
  ret = param ? 1 : 0;
 } else {
  ret = param;
 }
 HEAP32[params >> 2] = ret;
}

function _emscripten_glGetQueryObjectui64vEXT(id, pname, params) {
 if (!params) {
  GL.recordError(1281);
  return;
 }
 var query = GL.timerQueriesEXT[id];
 var param = GLctx.disjointTimerQueryExt["getQueryObjectEXT"](query, pname);
 var ret;
 if (typeof param == "boolean") {
  ret = param ? 1 : 0;
 } else {
  ret = param;
 }
 writeI53ToI64(params, ret);
}

function _emscripten_glGetQueryObjectuivEXT(id, pname, params) {
 if (!params) {
  GL.recordError(1281);
  return;
 }
 var query = GL.timerQueriesEXT[id];
 var param = GLctx.disjointTimerQueryExt["getQueryObjectEXT"](query, pname);
 var ret;
 if (typeof param == "boolean") {
  ret = param ? 1 : 0;
 } else {
  ret = param;
 }
 HEAP32[params >> 2] = ret;
}

function _emscripten_glGetQueryivEXT(target, pname, params) {
 if (!params) {
  GL.recordError(1281);
  return;
 }
 HEAP32[params >> 2] = GLctx.disjointTimerQueryExt["getQueryEXT"](target, pname);
}

function _emscripten_glGetRenderbufferParameteriv(target, pname, params) {
 if (!params) {
  GL.recordError(1281);
  return;
 }
 HEAP32[params >> 2] = GLctx.getRenderbufferParameter(target, pname);
}

function _emscripten_glGetShaderInfoLog(shader, maxLength, length, infoLog) {
 var log = GLctx.getShaderInfoLog(GL.shaders[shader]);
 if (log === null) log = "(unknown error)";
 var numBytesWrittenExclNull = maxLength > 0 && infoLog ? stringToUTF8(log, infoLog, maxLength) : 0;
 if (length) HEAP32[length >> 2] = numBytesWrittenExclNull;
}

function _emscripten_glGetShaderPrecisionFormat(shaderType, precisionType, range, precision) {
 var result = GLctx.getShaderPrecisionFormat(shaderType, precisionType);
 HEAP32[range >> 2] = result.rangeMin;
 HEAP32[range + 4 >> 2] = result.rangeMax;
 HEAP32[precision >> 2] = result.precision;
}

function _emscripten_glGetShaderSource(shader, bufSize, length, source) {
 var result = GLctx.getShaderSource(GL.shaders[shader]);
 if (!result) return;
 var numBytesWrittenExclNull = bufSize > 0 && source ? stringToUTF8(result, source, bufSize) : 0;
 if (length) HEAP32[length >> 2] = numBytesWrittenExclNull;
}

function _emscripten_glGetShaderiv(shader, pname, p) {
 if (!p) {
  GL.recordError(1281);
  return;
 }
 if (pname == 35716) {
  var log = GLctx.getShaderInfoLog(GL.shaders[shader]);
  if (log === null) log = "(unknown error)";
  HEAP32[p >> 2] = log.length + 1;
 } else if (pname == 35720) {
  var source = GLctx.getShaderSource(GL.shaders[shader]);
  var sourceLength = source === null || source.length == 0 ? 0 : source.length + 1;
  HEAP32[p >> 2] = sourceLength;
 } else {
  HEAP32[p >> 2] = GLctx.getShaderParameter(GL.shaders[shader], pname);
 }
}

function stringToNewUTF8(jsString) {
 var length = lengthBytesUTF8(jsString) + 1;
 var cString = _malloc(length);
 stringToUTF8(jsString, cString, length);
 return cString;
}

function _emscripten_glGetString(name_) {
 if (GL.stringCache[name_]) return GL.stringCache[name_];
 var ret;
 switch (name_) {
 case 7939:
  var exts = GLctx.getSupportedExtensions() || [];
  exts = exts.concat(exts.map(function(e) {
   return "GL_" + e;
  }));
  ret = stringToNewUTF8(exts.join(" "));
  break;

 case 7936:
 case 7937:
 case 37445:
 case 37446:
  var s = GLctx.getParameter(name_);
  if (!s) {
   GL.recordError(1280);
  }
  ret = stringToNewUTF8(s);
  break;

 case 7938:
  var glVersion = GLctx.getParameter(7938);
  {
   glVersion = "OpenGL ES 2.0 (" + glVersion + ")";
  }
  ret = stringToNewUTF8(glVersion);
  break;

 case 35724:
  var glslVersion = GLctx.getParameter(35724);
  var ver_re = /^WebGL GLSL ES ([0-9]\.[0-9][0-9]?)(?:$| .*)/;
  var ver_num = glslVersion.match(ver_re);
  if (ver_num !== null) {
   if (ver_num[1].length == 3) ver_num[1] = ver_num[1] + "0";
   glslVersion = "OpenGL ES GLSL ES " + ver_num[1] + " (" + glslVersion + ")";
  }
  ret = stringToNewUTF8(glslVersion);
  break;

 default:
  GL.recordError(1280);
  return 0;
 }
 GL.stringCache[name_] = ret;
 return ret;
}

function _emscripten_glGetTexParameterfv(target, pname, params) {
 if (!params) {
  GL.recordError(1281);
  return;
 }
 HEAPF32[params >> 2] = GLctx.getTexParameter(target, pname);
}

function _emscripten_glGetTexParameteriv(target, pname, params) {
 if (!params) {
  GL.recordError(1281);
  return;
 }
 HEAP32[params >> 2] = GLctx.getTexParameter(target, pname);
}

function jstoi_q(str) {
 return parseInt(str);
}

function _emscripten_glGetUniformLocation(program, name) {
 name = UTF8ToString(name);
 var arrayIndex = 0;
 if (name[name.length - 1] == "]") {
  var leftBrace = name.lastIndexOf("[");
  arrayIndex = name[leftBrace + 1] != "]" ? jstoi_q(name.slice(leftBrace + 1)) : 0;
  name = name.slice(0, leftBrace);
 }
 var uniformInfo = GL.programInfos[program] && GL.programInfos[program].uniforms[name];
 if (uniformInfo && arrayIndex >= 0 && arrayIndex < uniformInfo[0]) {
  return uniformInfo[1] + arrayIndex;
 } else {
  return -1;
 }
}

function emscriptenWebGLGetUniform(program, location, params, type) {
 if (!params) {
  GL.recordError(1281);
  return;
 }
 var data = GLctx.getUniform(GL.programs[program], GL.uniforms[location]);
 if (typeof data == "number" || typeof data == "boolean") {
  switch (type) {
  case 0:
   HEAP32[params >> 2] = data;
   break;

  case 2:
   HEAPF32[params >> 2] = data;
   break;

  default:
   throw "internal emscriptenWebGLGetUniform() error, bad type: " + type;
  }
 } else {
  for (var i = 0; i < data.length; i++) {
   switch (type) {
   case 0:
    HEAP32[params + i * 4 >> 2] = data[i];
    break;

   case 2:
    HEAPF32[params + i * 4 >> 2] = data[i];
    break;

   default:
    throw "internal emscriptenWebGLGetUniform() error, bad type: " + type;
   }
  }
 }
}

function _emscripten_glGetUniformfv(program, location, params) {
 emscriptenWebGLGetUniform(program, location, params, 2);
}

function _emscripten_glGetUniformiv(program, location, params) {
 emscriptenWebGLGetUniform(program, location, params, 0);
}

function _emscripten_glGetVertexAttribPointerv(index, pname, pointer) {
 if (!pointer) {
  GL.recordError(1281);
  return;
 }
 HEAP32[pointer >> 2] = GLctx.getVertexAttribOffset(index, pname);
}

function emscriptenWebGLGetVertexAttrib(index, pname, params, type) {
 if (!params) {
  GL.recordError(1281);
  return;
 }
 var data = GLctx.getVertexAttrib(index, pname);
 if (pname == 34975) {
  HEAP32[params >> 2] = data && data["name"];
 } else if (typeof data == "number" || typeof data == "boolean") {
  switch (type) {
  case 0:
   HEAP32[params >> 2] = data;
   break;

  case 2:
   HEAPF32[params >> 2] = data;
   break;

  case 5:
   HEAP32[params >> 2] = Math.fround(data);
   break;

  default:
   throw "internal emscriptenWebGLGetVertexAttrib() error, bad type: " + type;
  }
 } else {
  for (var i = 0; i < data.length; i++) {
   switch (type) {
   case 0:
    HEAP32[params + i * 4 >> 2] = data[i];
    break;

   case 2:
    HEAPF32[params + i * 4 >> 2] = data[i];
    break;

   case 5:
    HEAP32[params + i * 4 >> 2] = Math.fround(data[i]);
    break;

   default:
    throw "internal emscriptenWebGLGetVertexAttrib() error, bad type: " + type;
   }
  }
 }
}

function _emscripten_glGetVertexAttribfv(index, pname, params) {
 emscriptenWebGLGetVertexAttrib(index, pname, params, 2);
}

function _emscripten_glGetVertexAttribiv(index, pname, params) {
 emscriptenWebGLGetVertexAttrib(index, pname, params, 5);
}

function _emscripten_glHint(x0, x1) {
 GLctx["hint"](x0, x1);
}

function _emscripten_glIsBuffer(buffer) {
 var b = GL.buffers[buffer];
 if (!b) return 0;
 return GLctx.isBuffer(b);
}

function _emscripten_glIsEnabled(x0) {
 return GLctx["isEnabled"](x0);
}

function _emscripten_glIsFramebuffer(framebuffer) {
 var fb = GL.framebuffers[framebuffer];
 if (!fb) return 0;
 return GLctx.isFramebuffer(fb);
}

function _emscripten_glIsProgram(program) {
 program = GL.programs[program];
 if (!program) return 0;
 return GLctx.isProgram(program);
}

function _emscripten_glIsQueryEXT(id) {
 var query = GL.timerQueriesEXT[id];
 if (!query) return 0;
 return GLctx.disjointTimerQueryExt["isQueryEXT"](query);
}

function _emscripten_glIsRenderbuffer(renderbuffer) {
 var rb = GL.renderbuffers[renderbuffer];
 if (!rb) return 0;
 return GLctx.isRenderbuffer(rb);
}

function _emscripten_glIsShader(shader) {
 var s = GL.shaders[shader];
 if (!s) return 0;
 return GLctx.isShader(s);
}

function _emscripten_glIsTexture(id) {
 var texture = GL.textures[id];
 if (!texture) return 0;
 return GLctx.isTexture(texture);
}

function _emscripten_glIsVertexArrayOES(array) {
 var vao = GL.vaos[array];
 if (!vao) return 0;
 return GLctx["isVertexArray"](vao);
}

function _emscripten_glLineWidth(x0) {
 GLctx["lineWidth"](x0);
}

function _emscripten_glLinkProgram(program) {
 GLctx.linkProgram(GL.programs[program]);
 GL.populateUniformTable(program);
}

function _emscripten_glPixelStorei(pname, param) {
 if (pname == 3317) {
  GL.unpackAlignment = param;
 }
 GLctx.pixelStorei(pname, param);
}

function _emscripten_glPolygonOffset(x0, x1) {
 GLctx["polygonOffset"](x0, x1);
}

function _emscripten_glQueryCounterEXT(id, target) {
 GLctx.disjointTimerQueryExt["queryCounterEXT"](GL.timerQueriesEXT[id], target);
}

function __computeUnpackAlignedImageSize(width, height, sizePerPixel, alignment) {
 function roundedToNextMultipleOf(x, y) {
  return x + y - 1 & -y;
 }
 var plainRowSize = width * sizePerPixel;
 var alignedRowSize = roundedToNextMultipleOf(plainRowSize, alignment);
 return height * alignedRowSize;
}

function __colorChannelsInGlTextureFormat(format) {
 var colorChannels = {
  5: 3,
  6: 4,
  8: 2,
  29502: 3,
  29504: 4
 };
 return colorChannels[format - 6402] || 1;
}

function __heapObjectForWebGLType(type) {
 type -= 5120;
 if (type == 1) return HEAPU8;
 if (type == 4) return HEAP32;
 if (type == 6) return HEAPF32;
 if (type == 5 || type == 28922) return HEAPU32;
 return HEAPU16;
}

function __heapAccessShiftForWebGLHeap(heap) {
 return 31 - Math.clz32(heap.BYTES_PER_ELEMENT);
}

function emscriptenWebGLGetTexPixelData(type, format, width, height, pixels, internalFormat) {
 var heap = __heapObjectForWebGLType(type);
 var shift = __heapAccessShiftForWebGLHeap(heap);
 var byteSize = 1 << shift;
 var sizePerPixel = __colorChannelsInGlTextureFormat(format) * byteSize;
 var bytes = __computeUnpackAlignedImageSize(width, height, sizePerPixel, GL.unpackAlignment);
 return heap.subarray(pixels >> shift, pixels + bytes >> shift);
}

function _emscripten_glReadPixels(x, y, width, height, format, type, pixels) {
 var pixelData = emscriptenWebGLGetTexPixelData(type, format, width, height, pixels, format);
 if (!pixelData) {
  GL.recordError(1280);
  return;
 }
 GLctx.readPixels(x, y, width, height, format, type, pixelData);
}

function _emscripten_glReleaseShaderCompiler() {}

function _emscripten_glRenderbufferStorage(x0, x1, x2, x3) {
 GLctx["renderbufferStorage"](x0, x1, x2, x3);
}

function _emscripten_glSampleCoverage(value, invert) {
 GLctx.sampleCoverage(value, !!invert);
}

function _emscripten_glScissor(x0, x1, x2, x3) {
 GLctx["scissor"](x0, x1, x2, x3);
}

function _emscripten_glShaderBinary() {
 GL.recordError(1280);
}

function _emscripten_glShaderSource(shader, count, string, length) {
 var source = GL.getSource(shader, count, string, length);
 GLctx.shaderSource(GL.shaders[shader], source);
}

function _emscripten_glStencilFunc(x0, x1, x2) {
 GLctx["stencilFunc"](x0, x1, x2);
}

function _emscripten_glStencilFuncSeparate(x0, x1, x2, x3) {
 GLctx["stencilFuncSeparate"](x0, x1, x2, x3);
}

function _emscripten_glStencilMask(x0) {
 GLctx["stencilMask"](x0);
}

function _emscripten_glStencilMaskSeparate(x0, x1) {
 GLctx["stencilMaskSeparate"](x0, x1);
}

function _emscripten_glStencilOp(x0, x1, x2) {
 GLctx["stencilOp"](x0, x1, x2);
}

function _emscripten_glStencilOpSeparate(x0, x1, x2, x3) {
 GLctx["stencilOpSeparate"](x0, x1, x2, x3);
}

function _emscripten_glTexImage2D(target, level, internalFormat, width, height, border, format, type, pixels) {
 GLctx.texImage2D(target, level, internalFormat, width, height, border, format, type, pixels ? emscriptenWebGLGetTexPixelData(type, format, width, height, pixels, internalFormat) : null);
}

function _emscripten_glTexParameterf(x0, x1, x2) {
 GLctx["texParameterf"](x0, x1, x2);
}

function _emscripten_glTexParameterfv(target, pname, params) {
 var param = HEAPF32[params >> 2];
 GLctx.texParameterf(target, pname, param);
}

function _emscripten_glTexParameteri(x0, x1, x2) {
 GLctx["texParameteri"](x0, x1, x2);
}

function _emscripten_glTexParameteriv(target, pname, params) {
 var param = HEAP32[params >> 2];
 GLctx.texParameteri(target, pname, param);
}

function _emscripten_glTexSubImage2D(target, level, xoffset, yoffset, width, height, format, type, pixels) {
 var pixelData = null;
 if (pixels) pixelData = emscriptenWebGLGetTexPixelData(type, format, width, height, pixels, 0);
 GLctx.texSubImage2D(target, level, xoffset, yoffset, width, height, format, type, pixelData);
}

function _emscripten_glUniform1f(location, v0) {
 GLctx.uniform1f(GL.uniforms[location], v0);
}

function _emscripten_glUniform1fv(location, count, value) {
 if (count <= GL.MINI_TEMP_BUFFER_SIZE) {
  var view = GL.miniTempBufferFloatViews[count - 1];
  for (var i = 0; i < count; ++i) {
   view[i] = HEAPF32[value + 4 * i >> 2];
  }
 } else {
  var view = HEAPF32.subarray(value >> 2, value + count * 4 >> 2);
 }
 GLctx.uniform1fv(GL.uniforms[location], view);
}

function _emscripten_glUniform1i(location, v0) {
 GLctx.uniform1i(GL.uniforms[location], v0);
}

function _emscripten_glUniform1iv(location, count, value) {
 if (count <= GL.MINI_TEMP_BUFFER_SIZE) {
  var view = GL.miniTempBufferIntViews[count - 1];
  for (var i = 0; i < count; ++i) {
   view[i] = HEAP32[value + 4 * i >> 2];
  }
 } else {
  var view = HEAP32.subarray(value >> 2, value + count * 4 >> 2);
 }
 GLctx.uniform1iv(GL.uniforms[location], view);
}

function _emscripten_glUniform2f(location, v0, v1) {
 GLctx.uniform2f(GL.uniforms[location], v0, v1);
}

function _emscripten_glUniform2fv(location, count, value) {
 if (2 * count <= GL.MINI_TEMP_BUFFER_SIZE) {
  var view = GL.miniTempBufferFloatViews[2 * count - 1];
  for (var i = 0; i < 2 * count; i += 2) {
   view[i] = HEAPF32[value + 4 * i >> 2];
   view[i + 1] = HEAPF32[value + (4 * i + 4) >> 2];
  }
 } else {
  var view = HEAPF32.subarray(value >> 2, value + count * 8 >> 2);
 }
 GLctx.uniform2fv(GL.uniforms[location], view);
}

function _emscripten_glUniform2i(location, v0, v1) {
 GLctx.uniform2i(GL.uniforms[location], v0, v1);
}

function _emscripten_glUniform2iv(location, count, value) {
 if (2 * count <= GL.MINI_TEMP_BUFFER_SIZE) {
  var view = GL.miniTempBufferIntViews[2 * count - 1];
  for (var i = 0; i < 2 * count; i += 2) {
   view[i] = HEAP32[value + 4 * i >> 2];
   view[i + 1] = HEAP32[value + (4 * i + 4) >> 2];
  }
 } else {
  var view = HEAP32.subarray(value >> 2, value + count * 8 >> 2);
 }
 GLctx.uniform2iv(GL.uniforms[location], view);
}

function _emscripten_glUniform3f(location, v0, v1, v2) {
 GLctx.uniform3f(GL.uniforms[location], v0, v1, v2);
}

function _emscripten_glUniform3fv(location, count, value) {
 if (3 * count <= GL.MINI_TEMP_BUFFER_SIZE) {
  var view = GL.miniTempBufferFloatViews[3 * count - 1];
  for (var i = 0; i < 3 * count; i += 3) {
   view[i] = HEAPF32[value + 4 * i >> 2];
   view[i + 1] = HEAPF32[value + (4 * i + 4) >> 2];
   view[i + 2] = HEAPF32[value + (4 * i + 8) >> 2];
  }
 } else {
  var view = HEAPF32.subarray(value >> 2, value + count * 12 >> 2);
 }
 GLctx.uniform3fv(GL.uniforms[location], view);
}

function _emscripten_glUniform3i(location, v0, v1, v2) {
 GLctx.uniform3i(GL.uniforms[location], v0, v1, v2);
}

function _emscripten_glUniform3iv(location, count, value) {
 if (3 * count <= GL.MINI_TEMP_BUFFER_SIZE) {
  var view = GL.miniTempBufferIntViews[3 * count - 1];
  for (var i = 0; i < 3 * count; i += 3) {
   view[i] = HEAP32[value + 4 * i >> 2];
   view[i + 1] = HEAP32[value + (4 * i + 4) >> 2];
   view[i + 2] = HEAP32[value + (4 * i + 8) >> 2];
  }
 } else {
  var view = HEAP32.subarray(value >> 2, value + count * 12 >> 2);
 }
 GLctx.uniform3iv(GL.uniforms[location], view);
}

function _emscripten_glUniform4f(location, v0, v1, v2, v3) {
 GLctx.uniform4f(GL.uniforms[location], v0, v1, v2, v3);
}

function _emscripten_glUniform4fv(location, count, value) {
 if (4 * count <= GL.MINI_TEMP_BUFFER_SIZE) {
  var view = GL.miniTempBufferFloatViews[4 * count - 1];
  var heap = HEAPF32;
  value >>= 2;
  for (var i = 0; i < 4 * count; i += 4) {
   var dst = value + i;
   view[i] = heap[dst];
   view[i + 1] = heap[dst + 1];
   view[i + 2] = heap[dst + 2];
   view[i + 3] = heap[dst + 3];
  }
 } else {
  var view = HEAPF32.subarray(value >> 2, value + count * 16 >> 2);
 }
 GLctx.uniform4fv(GL.uniforms[location], view);
}

function _emscripten_glUniform4i(location, v0, v1, v2, v3) {
 GLctx.uniform4i(GL.uniforms[location], v0, v1, v2, v3);
}

function _emscripten_glUniform4iv(location, count, value) {
 if (4 * count <= GL.MINI_TEMP_BUFFER_SIZE) {
  var view = GL.miniTempBufferIntViews[4 * count - 1];
  for (var i = 0; i < 4 * count; i += 4) {
   view[i] = HEAP32[value + 4 * i >> 2];
   view[i + 1] = HEAP32[value + (4 * i + 4) >> 2];
   view[i + 2] = HEAP32[value + (4 * i + 8) >> 2];
   view[i + 3] = HEAP32[value + (4 * i + 12) >> 2];
  }
 } else {
  var view = HEAP32.subarray(value >> 2, value + count * 16 >> 2);
 }
 GLctx.uniform4iv(GL.uniforms[location], view);
}

function _emscripten_glUniformMatrix2fv(location, count, transpose, value) {
 if (4 * count <= GL.MINI_TEMP_BUFFER_SIZE) {
  var view = GL.miniTempBufferFloatViews[4 * count - 1];
  for (var i = 0; i < 4 * count; i += 4) {
   view[i] = HEAPF32[value + 4 * i >> 2];
   view[i + 1] = HEAPF32[value + (4 * i + 4) >> 2];
   view[i + 2] = HEAPF32[value + (4 * i + 8) >> 2];
   view[i + 3] = HEAPF32[value + (4 * i + 12) >> 2];
  }
 } else {
  var view = HEAPF32.subarray(value >> 2, value + count * 16 >> 2);
 }
 GLctx.uniformMatrix2fv(GL.uniforms[location], !!transpose, view);
}

function _emscripten_glUniformMatrix3fv(location, count, transpose, value) {
 if (9 * count <= GL.MINI_TEMP_BUFFER_SIZE) {
  var view = GL.miniTempBufferFloatViews[9 * count - 1];
  for (var i = 0; i < 9 * count; i += 9) {
   view[i] = HEAPF32[value + 4 * i >> 2];
   view[i + 1] = HEAPF32[value + (4 * i + 4) >> 2];
   view[i + 2] = HEAPF32[value + (4 * i + 8) >> 2];
   view[i + 3] = HEAPF32[value + (4 * i + 12) >> 2];
   view[i + 4] = HEAPF32[value + (4 * i + 16) >> 2];
   view[i + 5] = HEAPF32[value + (4 * i + 20) >> 2];
   view[i + 6] = HEAPF32[value + (4 * i + 24) >> 2];
   view[i + 7] = HEAPF32[value + (4 * i + 28) >> 2];
   view[i + 8] = HEAPF32[value + (4 * i + 32) >> 2];
  }
 } else {
  var view = HEAPF32.subarray(value >> 2, value + count * 36 >> 2);
 }
 GLctx.uniformMatrix3fv(GL.uniforms[location], !!transpose, view);
}

function _emscripten_glUniformMatrix4fv(location, count, transpose, value) {
 if (16 * count <= GL.MINI_TEMP_BUFFER_SIZE) {
  var view = GL.miniTempBufferFloatViews[16 * count - 1];
  var heap = HEAPF32;
  value >>= 2;
  for (var i = 0; i < 16 * count; i += 16) {
   var dst = value + i;
   view[i] = heap[dst];
   view[i + 1] = heap[dst + 1];
   view[i + 2] = heap[dst + 2];
   view[i + 3] = heap[dst + 3];
   view[i + 4] = heap[dst + 4];
   view[i + 5] = heap[dst + 5];
   view[i + 6] = heap[dst + 6];
   view[i + 7] = heap[dst + 7];
   view[i + 8] = heap[dst + 8];
   view[i + 9] = heap[dst + 9];
   view[i + 10] = heap[dst + 10];
   view[i + 11] = heap[dst + 11];
   view[i + 12] = heap[dst + 12];
   view[i + 13] = heap[dst + 13];
   view[i + 14] = heap[dst + 14];
   view[i + 15] = heap[dst + 15];
  }
 } else {
  var view = HEAPF32.subarray(value >> 2, value + count * 64 >> 2);
 }
 GLctx.uniformMatrix4fv(GL.uniforms[location], !!transpose, view);
}

function _emscripten_glUseProgram(program) {
 GLctx.useProgram(GL.programs[program]);
}

function _emscripten_glValidateProgram(program) {
 GLctx.validateProgram(GL.programs[program]);
}

function _emscripten_glVertexAttrib1f(x0, x1) {
 GLctx["vertexAttrib1f"](x0, x1);
}

function _emscripten_glVertexAttrib1fv(index, v) {
 GLctx.vertexAttrib1f(index, HEAPF32[v >> 2]);
}

function _emscripten_glVertexAttrib2f(x0, x1, x2) {
 GLctx["vertexAttrib2f"](x0, x1, x2);
}

function _emscripten_glVertexAttrib2fv(index, v) {
 GLctx.vertexAttrib2f(index, HEAPF32[v >> 2], HEAPF32[v + 4 >> 2]);
}

function _emscripten_glVertexAttrib3f(x0, x1, x2, x3) {
 GLctx["vertexAttrib3f"](x0, x1, x2, x3);
}

function _emscripten_glVertexAttrib3fv(index, v) {
 GLctx.vertexAttrib3f(index, HEAPF32[v >> 2], HEAPF32[v + 4 >> 2], HEAPF32[v + 8 >> 2]);
}

function _emscripten_glVertexAttrib4f(x0, x1, x2, x3, x4) {
 GLctx["vertexAttrib4f"](x0, x1, x2, x3, x4);
}

function _emscripten_glVertexAttrib4fv(index, v) {
 GLctx.vertexAttrib4f(index, HEAPF32[v >> 2], HEAPF32[v + 4 >> 2], HEAPF32[v + 8 >> 2], HEAPF32[v + 12 >> 2]);
}

function _emscripten_glVertexAttribDivisorANGLE(index, divisor) {
 GLctx["vertexAttribDivisor"](index, divisor);
}

function _emscripten_glVertexAttribPointer(index, size, type, normalized, stride, ptr) {
 GLctx.vertexAttribPointer(index, size, type, !!normalized, stride, ptr);
}

function _emscripten_glViewport(x0, x1, x2, x3) {
 GLctx["viewport"](x0, x1, x2, x3);
}

var setjmpId = 0;

function _saveSetjmp(env, label, table, size) {
 env = env | 0;
 label = label | 0;
 table = table | 0;
 size = size | 0;
 var i = 0;
 setjmpId = setjmpId + 1 | 0;
 HEAP32[env >> 2] = setjmpId;
 while ((i | 0) < (size | 0)) {
  if ((HEAP32[table + (i << 3) >> 2] | 0) == 0) {
   HEAP32[table + (i << 3) >> 2] = setjmpId;
   HEAP32[table + ((i << 3) + 4) >> 2] = label;
   HEAP32[table + ((i << 3) + 8) >> 2] = 0;
   setTempRet0(size | 0);
   return table | 0;
  }
  i = i + 1 | 0;
 }
 size = size * 2 | 0;
 table = _realloc(table | 0, 8 * (size + 1 | 0) | 0) | 0;
 table = _saveSetjmp(env | 0, label | 0, table | 0, size | 0) | 0;
 setTempRet0(size | 0);
 return table | 0;
}

function _testSetjmp(id, table, size) {
 id = id | 0;
 table = table | 0;
 size = size | 0;
 var i = 0, curr = 0;
 while ((i | 0) < (size | 0)) {
  curr = HEAP32[table + (i << 3) >> 2] | 0;
  if ((curr | 0) == 0) break;
  if ((curr | 0) == (id | 0)) {
   return HEAP32[table + ((i << 3) + 4) >> 2] | 0;
  }
  i = i + 1 | 0;
 }
 return 0;
}

function _longjmp(env, value) {
 _setThrew(env, value || 1);
 throw "longjmp";
}

function _emscripten_longjmp(env, value) {
 _longjmp(env, value);
}

function _emscripten_memcpy_big(dest, src, num) {
 HEAPU8.copyWithin(dest, src, src + num);
}

function _emscripten_get_heap_size() {
 return HEAPU8.length;
}

function emscripten_realloc_buffer(size) {
 try {
  wasmMemory.grow(size - buffer.byteLength + 65535 >>> 16);
  updateGlobalBufferAndViews(wasmMemory.buffer);
  return 1;
 } catch (e) {}
}

function _emscripten_resize_heap(requestedSize) {
 requestedSize = requestedSize >>> 0;
 var oldSize = _emscripten_get_heap_size();
 var PAGE_MULTIPLE = 65536;
 var maxHeapSize = 2147483648;
 if (requestedSize > maxHeapSize) {
  return false;
 }
 var minHeapSize = 16777216;
 for (var cutDown = 1; cutDown <= 4; cutDown *= 2) {
  var overGrownHeapSize = oldSize * (1 + .2 / cutDown);
  overGrownHeapSize = Math.min(overGrownHeapSize, requestedSize + 100663296);
  var newSize = Math.min(maxHeapSize, alignUp(Math.max(minHeapSize, requestedSize, overGrownHeapSize), PAGE_MULTIPLE));
  var replacement = emscripten_realloc_buffer(newSize);
  if (replacement) {
   return true;
  }
 }
 return false;
}

function _emscripten_webgl_do_get_current_context() {
 return GL.currentContext ? GL.currentContext.handle : 0;
}

function _emscripten_webgl_get_current_context() {
 return _emscripten_webgl_do_get_current_context();
}

function _emscripten_webgl_make_context_current(contextHandle) {
 var success = GL.makeContextCurrent(contextHandle);
 return success ? 0 : -5;
}

var ENV = {};

function __getExecutableName() {
 return thisProgram || "./this.program";
}

function getEnvStrings() {
 if (!getEnvStrings.strings) {
  var env = {
   "USER": "web_user",
   "LOGNAME": "web_user",
   "PATH": "/",
   "PWD": "/",
   "HOME": "/home/web_user",
   "LANG": (typeof navigator === "object" && navigator.languages && navigator.languages[0] || "C").replace("-", "_") + ".UTF-8",
   "_": __getExecutableName()
  };
  for (var x in ENV) {
   env[x] = ENV[x];
  }
  var strings = [];
  for (var x in env) {
   strings.push(x + "=" + env[x]);
  }
  getEnvStrings.strings = strings;
 }
 return getEnvStrings.strings;
}

function _environ_get(__environ, environ_buf) {
 var bufSize = 0;
 getEnvStrings().forEach(function(string, i) {
  var ptr = environ_buf + bufSize;
  HEAP32[__environ + i * 4 >> 2] = ptr;
  writeAsciiToMemory(string, ptr);
  bufSize += string.length + 1;
 });
 return 0;
}

function _environ_sizes_get(penviron_count, penviron_buf_size) {
 var strings = getEnvStrings();
 HEAP32[penviron_count >> 2] = strings.length;
 var bufSize = 0;
 strings.forEach(function(string) {
  bufSize += string.length + 1;
 });
 HEAP32[penviron_buf_size >> 2] = bufSize;
 return 0;
}

function _exit(status) {
 exit(status);
}

function _fd_close(fd) {
 return 0;
}

function _fd_fdstat_get(fd, pbuf) {
 var type = fd == 1 || fd == 2 ? 2 : abort();
 HEAP8[pbuf >> 0] = type;
 return 0;
}

function _fd_read(fd, iov, iovcnt, pnum) {
 var stream = SYSCALLS.getStreamFromFD(fd);
 var num = SYSCALLS.doReadv(stream, iov, iovcnt);
 HEAP32[pnum >> 2] = num;
 return 0;
}

function _fd_seek(fd, offset_low, offset_high, whence, newOffset) {}

function _fd_write(fd, iov, iovcnt, pnum) {
 var num = 0;
 for (var i = 0; i < iovcnt; i++) {
  var ptr = HEAP32[iov + i * 8 >> 2];
  var len = HEAP32[iov + (i * 8 + 4) >> 2];
  for (var j = 0; j < len; j++) {
   SYSCALLS.printChar(fd, HEAPU8[ptr + j]);
  }
  num += len;
 }
 HEAP32[pnum >> 2] = num;
 return 0;
}

function _getTempRet0() {
 return getTempRet0() | 0;
}

function _glActiveTexture(x0) {
 GLctx["activeTexture"](x0);
}

function _glAttachShader(program, shader) {
 GLctx.attachShader(GL.programs[program], GL.shaders[shader]);
}

function _glBindAttribLocation(program, index, name) {
 GLctx.bindAttribLocation(GL.programs[program], index, UTF8ToString(name));
}

function _glBindBuffer(target, buffer) {
 GLctx.bindBuffer(target, GL.buffers[buffer]);
}

function _glBindFramebuffer(target, framebuffer) {
 GLctx.bindFramebuffer(target, GL.framebuffers[framebuffer]);
}

function _glBindRenderbuffer(target, renderbuffer) {
 GLctx.bindRenderbuffer(target, GL.renderbuffers[renderbuffer]);
}

function _glBindTexture(target, texture) {
 GLctx.bindTexture(target, GL.textures[texture]);
}

function _glBlendColor(x0, x1, x2, x3) {
 GLctx["blendColor"](x0, x1, x2, x3);
}

function _glBlendEquation(x0) {
 GLctx["blendEquation"](x0);
}

function _glBlendFunc(x0, x1) {
 GLctx["blendFunc"](x0, x1);
}

function _glBufferData(target, size, data, usage) {
 GLctx.bufferData(target, data ? HEAPU8.subarray(data, data + size) : size, usage);
}

function _glBufferSubData(target, offset, size, data) {
 GLctx.bufferSubData(target, offset, HEAPU8.subarray(data, data + size));
}

function _glCheckFramebufferStatus(x0) {
 return GLctx["checkFramebufferStatus"](x0);
}

function _glClear(x0) {
 GLctx["clear"](x0);
}

function _glClearColor(x0, x1, x2, x3) {
 GLctx["clearColor"](x0, x1, x2, x3);
}

function _glClearStencil(x0) {
 GLctx["clearStencil"](x0);
}

function _glColorMask(red, green, blue, alpha) {
 GLctx.colorMask(!!red, !!green, !!blue, !!alpha);
}

function _glCompileShader(shader) {
 GLctx.compileShader(GL.shaders[shader]);
}

function _glCompressedTexImage2D(target, level, internalFormat, width, height, border, imageSize, data) {
 GLctx["compressedTexImage2D"](target, level, internalFormat, width, height, border, data ? HEAPU8.subarray(data, data + imageSize) : null);
}

function _glCompressedTexSubImage2D(target, level, xoffset, yoffset, width, height, format, imageSize, data) {
 GLctx["compressedTexSubImage2D"](target, level, xoffset, yoffset, width, height, format, data ? HEAPU8.subarray(data, data + imageSize) : null);
}

function _glCopyTexSubImage2D(x0, x1, x2, x3, x4, x5, x6, x7) {
 GLctx["copyTexSubImage2D"](x0, x1, x2, x3, x4, x5, x6, x7);
}

function _glCreateProgram() {
 var id = GL.getNewId(GL.programs);
 var program = GLctx.createProgram();
 program.name = id;
 GL.programs[id] = program;
 return id;
}

function _glCreateShader(shaderType) {
 var id = GL.getNewId(GL.shaders);
 GL.shaders[id] = GLctx.createShader(shaderType);
 return id;
}

function _glCullFace(x0) {
 GLctx["cullFace"](x0);
}

function _glDeleteBuffers(n, buffers) {
 for (var i = 0; i < n; i++) {
  var id = HEAP32[buffers + i * 4 >> 2];
  var buffer = GL.buffers[id];
  if (!buffer) continue;
  GLctx.deleteBuffer(buffer);
  buffer.name = 0;
  GL.buffers[id] = null;
  if (id == GL.currArrayBuffer) GL.currArrayBuffer = 0;
  if (id == GL.currElementArrayBuffer) GL.currElementArrayBuffer = 0;
 }
}

function _glDeleteFramebuffers(n, framebuffers) {
 for (var i = 0; i < n; ++i) {
  var id = HEAP32[framebuffers + i * 4 >> 2];
  var framebuffer = GL.framebuffers[id];
  if (!framebuffer) continue;
  GLctx.deleteFramebuffer(framebuffer);
  framebuffer.name = 0;
  GL.framebuffers[id] = null;
 }
}

function _glDeleteProgram(id) {
 if (!id) return;
 var program = GL.programs[id];
 if (!program) {
  GL.recordError(1281);
  return;
 }
 GLctx.deleteProgram(program);
 program.name = 0;
 GL.programs[id] = null;
 GL.programInfos[id] = null;
}

function _glDeleteRenderbuffers(n, renderbuffers) {
 for (var i = 0; i < n; i++) {
  var id = HEAP32[renderbuffers + i * 4 >> 2];
  var renderbuffer = GL.renderbuffers[id];
  if (!renderbuffer) continue;
  GLctx.deleteRenderbuffer(renderbuffer);
  renderbuffer.name = 0;
  GL.renderbuffers[id] = null;
 }
}

function _glDeleteShader(id) {
 if (!id) return;
 var shader = GL.shaders[id];
 if (!shader) {
  GL.recordError(1281);
  return;
 }
 GLctx.deleteShader(shader);
 GL.shaders[id] = null;
}

function _glDeleteTextures(n, textures) {
 for (var i = 0; i < n; i++) {
  var id = HEAP32[textures + i * 4 >> 2];
  var texture = GL.textures[id];
  if (!texture) continue;
  GLctx.deleteTexture(texture);
  texture.name = 0;
  GL.textures[id] = null;
 }
}

function _glDepthMask(flag) {
 GLctx.depthMask(!!flag);
}

function _glDisable(x0) {
 GLctx["disable"](x0);
}

function _glDisableVertexAttribArray(index) {
 GLctx.disableVertexAttribArray(index);
}

function _glDrawArrays(mode, first, count) {
 GLctx.drawArrays(mode, first, count);
}

function _glDrawElements(mode, count, type, indices) {
 GLctx.drawElements(mode, count, type, indices);
}

function _glEnable(x0) {
 GLctx["enable"](x0);
}

function _glEnableVertexAttribArray(index) {
 GLctx.enableVertexAttribArray(index);
}

function _glFinish() {
 GLctx["finish"]();
}

function _glFlush() {
 GLctx["flush"]();
}

function _glFramebufferRenderbuffer(target, attachment, renderbuffertarget, renderbuffer) {
 GLctx.framebufferRenderbuffer(target, attachment, renderbuffertarget, GL.renderbuffers[renderbuffer]);
}

function _glFramebufferTexture2D(target, attachment, textarget, texture, level) {
 GLctx.framebufferTexture2D(target, attachment, textarget, GL.textures[texture], level);
}

function _glFrontFace(x0) {
 GLctx["frontFace"](x0);
}

function _glGenBuffers(n, buffers) {
 __glGenObject(n, buffers, "createBuffer", GL.buffers);
}

function _glGenFramebuffers(n, ids) {
 __glGenObject(n, ids, "createFramebuffer", GL.framebuffers);
}

function _glGenRenderbuffers(n, renderbuffers) {
 __glGenObject(n, renderbuffers, "createRenderbuffer", GL.renderbuffers);
}

function _glGenTextures(n, textures) {
 __glGenObject(n, textures, "createTexture", GL.textures);
}

function _glGenerateMipmap(x0) {
 GLctx["generateMipmap"](x0);
}

function _glGetBufferParameteriv(target, value, data) {
 if (!data) {
  GL.recordError(1281);
  return;
 }
 HEAP32[data >> 2] = GLctx.getBufferParameter(target, value);
}

function _glGetError() {
 var error = GLctx.getError() || GL.lastError;
 GL.lastError = 0;
 return error;
}

function _glGetFramebufferAttachmentParameteriv(target, attachment, pname, params) {
 var result = GLctx.getFramebufferAttachmentParameter(target, attachment, pname);
 if (result instanceof WebGLRenderbuffer || result instanceof WebGLTexture) {
  result = result.name | 0;
 }
 HEAP32[params >> 2] = result;
}

function _glGetIntegerv(name_, p) {
 emscriptenWebGLGet(name_, p, 0);
}

function _glGetProgramInfoLog(program, maxLength, length, infoLog) {
 var log = GLctx.getProgramInfoLog(GL.programs[program]);
 if (log === null) log = "(unknown error)";
 var numBytesWrittenExclNull = maxLength > 0 && infoLog ? stringToUTF8(log, infoLog, maxLength) : 0;
 if (length) HEAP32[length >> 2] = numBytesWrittenExclNull;
}

function _glGetProgramiv(program, pname, p) {
 if (!p) {
  GL.recordError(1281);
  return;
 }
 if (program >= GL.counter) {
  GL.recordError(1281);
  return;
 }
 var ptable = GL.programInfos[program];
 if (!ptable) {
  GL.recordError(1282);
  return;
 }
 if (pname == 35716) {
  var log = GLctx.getProgramInfoLog(GL.programs[program]);
  if (log === null) log = "(unknown error)";
  HEAP32[p >> 2] = log.length + 1;
 } else if (pname == 35719) {
  HEAP32[p >> 2] = ptable.maxUniformLength;
 } else if (pname == 35722) {
  if (ptable.maxAttributeLength == -1) {
   program = GL.programs[program];
   var numAttribs = GLctx.getProgramParameter(program, 35721);
   ptable.maxAttributeLength = 0;
   for (var i = 0; i < numAttribs; ++i) {
    var activeAttrib = GLctx.getActiveAttrib(program, i);
    ptable.maxAttributeLength = Math.max(ptable.maxAttributeLength, activeAttrib.name.length + 1);
   }
  }
  HEAP32[p >> 2] = ptable.maxAttributeLength;
 } else if (pname == 35381) {
  if (ptable.maxUniformBlockNameLength == -1) {
   program = GL.programs[program];
   var numBlocks = GLctx.getProgramParameter(program, 35382);
   ptable.maxUniformBlockNameLength = 0;
   for (var i = 0; i < numBlocks; ++i) {
    var activeBlockName = GLctx.getActiveUniformBlockName(program, i);
    ptable.maxUniformBlockNameLength = Math.max(ptable.maxUniformBlockNameLength, activeBlockName.length + 1);
   }
  }
  HEAP32[p >> 2] = ptable.maxUniformBlockNameLength;
 } else {
  HEAP32[p >> 2] = GLctx.getProgramParameter(GL.programs[program], pname);
 }
}

function _glGetRenderbufferParameteriv(target, pname, params) {
 if (!params) {
  GL.recordError(1281);
  return;
 }
 HEAP32[params >> 2] = GLctx.getRenderbufferParameter(target, pname);
}

function _glGetShaderInfoLog(shader, maxLength, length, infoLog) {
 var log = GLctx.getShaderInfoLog(GL.shaders[shader]);
 if (log === null) log = "(unknown error)";
 var numBytesWrittenExclNull = maxLength > 0 && infoLog ? stringToUTF8(log, infoLog, maxLength) : 0;
 if (length) HEAP32[length >> 2] = numBytesWrittenExclNull;
}

function _glGetShaderPrecisionFormat(shaderType, precisionType, range, precision) {
 var result = GLctx.getShaderPrecisionFormat(shaderType, precisionType);
 HEAP32[range >> 2] = result.rangeMin;
 HEAP32[range + 4 >> 2] = result.rangeMax;
 HEAP32[precision >> 2] = result.precision;
}

function _glGetShaderiv(shader, pname, p) {
 if (!p) {
  GL.recordError(1281);
  return;
 }
 if (pname == 35716) {
  var log = GLctx.getShaderInfoLog(GL.shaders[shader]);
  if (log === null) log = "(unknown error)";
  HEAP32[p >> 2] = log.length + 1;
 } else if (pname == 35720) {
  var source = GLctx.getShaderSource(GL.shaders[shader]);
  var sourceLength = source === null || source.length == 0 ? 0 : source.length + 1;
  HEAP32[p >> 2] = sourceLength;
 } else {
  HEAP32[p >> 2] = GLctx.getShaderParameter(GL.shaders[shader], pname);
 }
}

function _glGetString(name_) {
 if (GL.stringCache[name_]) return GL.stringCache[name_];
 var ret;
 switch (name_) {
 case 7939:
  var exts = GLctx.getSupportedExtensions() || [];
  exts = exts.concat(exts.map(function(e) {
   return "GL_" + e;
  }));
  ret = stringToNewUTF8(exts.join(" "));
  break;

 case 7936:
 case 7937:
 case 37445:
 case 37446:
  var s = GLctx.getParameter(name_);
  if (!s) {
   GL.recordError(1280);
  }
  ret = stringToNewUTF8(s);
  break;

 case 7938:
  var glVersion = GLctx.getParameter(7938);
  {
   glVersion = "OpenGL ES 2.0 (" + glVersion + ")";
  }
  ret = stringToNewUTF8(glVersion);
  break;

 case 35724:
  var glslVersion = GLctx.getParameter(35724);
  var ver_re = /^WebGL GLSL ES ([0-9]\.[0-9][0-9]?)(?:$| .*)/;
  var ver_num = glslVersion.match(ver_re);
  if (ver_num !== null) {
   if (ver_num[1].length == 3) ver_num[1] = ver_num[1] + "0";
   glslVersion = "OpenGL ES GLSL ES " + ver_num[1] + " (" + glslVersion + ")";
  }
  ret = stringToNewUTF8(glslVersion);
  break;

 default:
  GL.recordError(1280);
  return 0;
 }
 GL.stringCache[name_] = ret;
 return ret;
}

function _glGetUniformLocation(program, name) {
 name = UTF8ToString(name);
 var arrayIndex = 0;
 if (name[name.length - 1] == "]") {
  var leftBrace = name.lastIndexOf("[");
  arrayIndex = name[leftBrace + 1] != "]" ? jstoi_q(name.slice(leftBrace + 1)) : 0;
  name = name.slice(0, leftBrace);
 }
 var uniformInfo = GL.programInfos[program] && GL.programInfos[program].uniforms[name];
 if (uniformInfo && arrayIndex >= 0 && arrayIndex < uniformInfo[0]) {
  return uniformInfo[1] + arrayIndex;
 } else {
  return -1;
 }
}

function _glIsTexture(id) {
 var texture = GL.textures[id];
 if (!texture) return 0;
 return GLctx.isTexture(texture);
}

function _glLineWidth(x0) {
 GLctx["lineWidth"](x0);
}

function _glLinkProgram(program) {
 GLctx.linkProgram(GL.programs[program]);
 GL.populateUniformTable(program);
}

function _glPixelStorei(pname, param) {
 if (pname == 3317) {
  GL.unpackAlignment = param;
 }
 GLctx.pixelStorei(pname, param);
}

function _glReadPixels(x, y, width, height, format, type, pixels) {
 var pixelData = emscriptenWebGLGetTexPixelData(type, format, width, height, pixels, format);
 if (!pixelData) {
  GL.recordError(1280);
  return;
 }
 GLctx.readPixels(x, y, width, height, format, type, pixelData);
}

function _glRenderbufferStorage(x0, x1, x2, x3) {
 GLctx["renderbufferStorage"](x0, x1, x2, x3);
}

function _glScissor(x0, x1, x2, x3) {
 GLctx["scissor"](x0, x1, x2, x3);
}

function _glShaderSource(shader, count, string, length) {
 var source = GL.getSource(shader, count, string, length);
 GLctx.shaderSource(GL.shaders[shader], source);
}

function _glStencilFunc(x0, x1, x2) {
 GLctx["stencilFunc"](x0, x1, x2);
}

function _glStencilFuncSeparate(x0, x1, x2, x3) {
 GLctx["stencilFuncSeparate"](x0, x1, x2, x3);
}

function _glStencilMask(x0) {
 GLctx["stencilMask"](x0);
}

function _glStencilMaskSeparate(x0, x1) {
 GLctx["stencilMaskSeparate"](x0, x1);
}

function _glStencilOp(x0, x1, x2) {
 GLctx["stencilOp"](x0, x1, x2);
}

function _glStencilOpSeparate(x0, x1, x2, x3) {
 GLctx["stencilOpSeparate"](x0, x1, x2, x3);
}

function _glTexImage2D(target, level, internalFormat, width, height, border, format, type, pixels) {
 GLctx.texImage2D(target, level, internalFormat, width, height, border, format, type, pixels ? emscriptenWebGLGetTexPixelData(type, format, width, height, pixels, internalFormat) : null);
}

function _glTexParameterf(x0, x1, x2) {
 GLctx["texParameterf"](x0, x1, x2);
}

function _glTexParameterfv(target, pname, params) {
 var param = HEAPF32[params >> 2];
 GLctx.texParameterf(target, pname, param);
}

function _glTexParameteri(x0, x1, x2) {
 GLctx["texParameteri"](x0, x1, x2);
}

function _glTexParameteriv(target, pname, params) {
 var param = HEAP32[params >> 2];
 GLctx.texParameteri(target, pname, param);
}

function _glTexSubImage2D(target, level, xoffset, yoffset, width, height, format, type, pixels) {
 var pixelData = null;
 if (pixels) pixelData = emscriptenWebGLGetTexPixelData(type, format, width, height, pixels, 0);
 GLctx.texSubImage2D(target, level, xoffset, yoffset, width, height, format, type, pixelData);
}

function _glUniform1f(location, v0) {
 GLctx.uniform1f(GL.uniforms[location], v0);
}

function _glUniform1fv(location, count, value) {
 if (count <= GL.MINI_TEMP_BUFFER_SIZE) {
  var view = GL.miniTempBufferFloatViews[count - 1];
  for (var i = 0; i < count; ++i) {
   view[i] = HEAPF32[value + 4 * i >> 2];
  }
 } else {
  var view = HEAPF32.subarray(value >> 2, value + count * 4 >> 2);
 }
 GLctx.uniform1fv(GL.uniforms[location], view);
}

function _glUniform1i(location, v0) {
 GLctx.uniform1i(GL.uniforms[location], v0);
}

function _glUniform1iv(location, count, value) {
 if (count <= GL.MINI_TEMP_BUFFER_SIZE) {
  var view = GL.miniTempBufferIntViews[count - 1];
  for (var i = 0; i < count; ++i) {
   view[i] = HEAP32[value + 4 * i >> 2];
  }
 } else {
  var view = HEAP32.subarray(value >> 2, value + count * 4 >> 2);
 }
 GLctx.uniform1iv(GL.uniforms[location], view);
}

function _glUniform2f(location, v0, v1) {
 GLctx.uniform2f(GL.uniforms[location], v0, v1);
}

function _glUniform2fv(location, count, value) {
 if (2 * count <= GL.MINI_TEMP_BUFFER_SIZE) {
  var view = GL.miniTempBufferFloatViews[2 * count - 1];
  for (var i = 0; i < 2 * count; i += 2) {
   view[i] = HEAPF32[value + 4 * i >> 2];
   view[i + 1] = HEAPF32[value + (4 * i + 4) >> 2];
  }
 } else {
  var view = HEAPF32.subarray(value >> 2, value + count * 8 >> 2);
 }
 GLctx.uniform2fv(GL.uniforms[location], view);
}

function _glUniform2i(location, v0, v1) {
 GLctx.uniform2i(GL.uniforms[location], v0, v1);
}

function _glUniform2iv(location, count, value) {
 if (2 * count <= GL.MINI_TEMP_BUFFER_SIZE) {
  var view = GL.miniTempBufferIntViews[2 * count - 1];
  for (var i = 0; i < 2 * count; i += 2) {
   view[i] = HEAP32[value + 4 * i >> 2];
   view[i + 1] = HEAP32[value + (4 * i + 4) >> 2];
  }
 } else {
  var view = HEAP32.subarray(value >> 2, value + count * 8 >> 2);
 }
 GLctx.uniform2iv(GL.uniforms[location], view);
}

function _glUniform3f(location, v0, v1, v2) {
 GLctx.uniform3f(GL.uniforms[location], v0, v1, v2);
}

function _glUniform3fv(location, count, value) {
 if (3 * count <= GL.MINI_TEMP_BUFFER_SIZE) {
  var view = GL.miniTempBufferFloatViews[3 * count - 1];
  for (var i = 0; i < 3 * count; i += 3) {
   view[i] = HEAPF32[value + 4 * i >> 2];
   view[i + 1] = HEAPF32[value + (4 * i + 4) >> 2];
   view[i + 2] = HEAPF32[value + (4 * i + 8) >> 2];
  }
 } else {
  var view = HEAPF32.subarray(value >> 2, value + count * 12 >> 2);
 }
 GLctx.uniform3fv(GL.uniforms[location], view);
}

function _glUniform3i(location, v0, v1, v2) {
 GLctx.uniform3i(GL.uniforms[location], v0, v1, v2);
}

function _glUniform3iv(location, count, value) {
 if (3 * count <= GL.MINI_TEMP_BUFFER_SIZE) {
  var view = GL.miniTempBufferIntViews[3 * count - 1];
  for (var i = 0; i < 3 * count; i += 3) {
   view[i] = HEAP32[value + 4 * i >> 2];
   view[i + 1] = HEAP32[value + (4 * i + 4) >> 2];
   view[i + 2] = HEAP32[value + (4 * i + 8) >> 2];
  }
 } else {
  var view = HEAP32.subarray(value >> 2, value + count * 12 >> 2);
 }
 GLctx.uniform3iv(GL.uniforms[location], view);
}

function _glUniform4f(location, v0, v1, v2, v3) {
 GLctx.uniform4f(GL.uniforms[location], v0, v1, v2, v3);
}

function _glUniform4fv(location, count, value) {
 if (4 * count <= GL.MINI_TEMP_BUFFER_SIZE) {
  var view = GL.miniTempBufferFloatViews[4 * count - 1];
  var heap = HEAPF32;
  value >>= 2;
  for (var i = 0; i < 4 * count; i += 4) {
   var dst = value + i;
   view[i] = heap[dst];
   view[i + 1] = heap[dst + 1];
   view[i + 2] = heap[dst + 2];
   view[i + 3] = heap[dst + 3];
  }
 } else {
  var view = HEAPF32.subarray(value >> 2, value + count * 16 >> 2);
 }
 GLctx.uniform4fv(GL.uniforms[location], view);
}

function _glUniform4i(location, v0, v1, v2, v3) {
 GLctx.uniform4i(GL.uniforms[location], v0, v1, v2, v3);
}

function _glUniform4iv(location, count, value) {
 if (4 * count <= GL.MINI_TEMP_BUFFER_SIZE) {
  var view = GL.miniTempBufferIntViews[4 * count - 1];
  for (var i = 0; i < 4 * count; i += 4) {
   view[i] = HEAP32[value + 4 * i >> 2];
   view[i + 1] = HEAP32[value + (4 * i + 4) >> 2];
   view[i + 2] = HEAP32[value + (4 * i + 8) >> 2];
   view[i + 3] = HEAP32[value + (4 * i + 12) >> 2];
  }
 } else {
  var view = HEAP32.subarray(value >> 2, value + count * 16 >> 2);
 }
 GLctx.uniform4iv(GL.uniforms[location], view);
}

function _glUniformMatrix2fv(location, count, transpose, value) {
 if (4 * count <= GL.MINI_TEMP_BUFFER_SIZE) {
  var view = GL.miniTempBufferFloatViews[4 * count - 1];
  for (var i = 0; i < 4 * count; i += 4) {
   view[i] = HEAPF32[value + 4 * i >> 2];
   view[i + 1] = HEAPF32[value + (4 * i + 4) >> 2];
   view[i + 2] = HEAPF32[value + (4 * i + 8) >> 2];
   view[i + 3] = HEAPF32[value + (4 * i + 12) >> 2];
  }
 } else {
  var view = HEAPF32.subarray(value >> 2, value + count * 16 >> 2);
 }
 GLctx.uniformMatrix2fv(GL.uniforms[location], !!transpose, view);
}

function _glUniformMatrix3fv(location, count, transpose, value) {
 if (9 * count <= GL.MINI_TEMP_BUFFER_SIZE) {
  var view = GL.miniTempBufferFloatViews[9 * count - 1];
  for (var i = 0; i < 9 * count; i += 9) {
   view[i] = HEAPF32[value + 4 * i >> 2];
   view[i + 1] = HEAPF32[value + (4 * i + 4) >> 2];
   view[i + 2] = HEAPF32[value + (4 * i + 8) >> 2];
   view[i + 3] = HEAPF32[value + (4 * i + 12) >> 2];
   view[i + 4] = HEAPF32[value + (4 * i + 16) >> 2];
   view[i + 5] = HEAPF32[value + (4 * i + 20) >> 2];
   view[i + 6] = HEAPF32[value + (4 * i + 24) >> 2];
   view[i + 7] = HEAPF32[value + (4 * i + 28) >> 2];
   view[i + 8] = HEAPF32[value + (4 * i + 32) >> 2];
  }
 } else {
  var view = HEAPF32.subarray(value >> 2, value + count * 36 >> 2);
 }
 GLctx.uniformMatrix3fv(GL.uniforms[location], !!transpose, view);
}

function _glUniformMatrix4fv(location, count, transpose, value) {
 if (16 * count <= GL.MINI_TEMP_BUFFER_SIZE) {
  var view = GL.miniTempBufferFloatViews[16 * count - 1];
  var heap = HEAPF32;
  value >>= 2;
  for (var i = 0; i < 16 * count; i += 16) {
   var dst = value + i;
   view[i] = heap[dst];
   view[i + 1] = heap[dst + 1];
   view[i + 2] = heap[dst + 2];
   view[i + 3] = heap[dst + 3];
   view[i + 4] = heap[dst + 4];
   view[i + 5] = heap[dst + 5];
   view[i + 6] = heap[dst + 6];
   view[i + 7] = heap[dst + 7];
   view[i + 8] = heap[dst + 8];
   view[i + 9] = heap[dst + 9];
   view[i + 10] = heap[dst + 10];
   view[i + 11] = heap[dst + 11];
   view[i + 12] = heap[dst + 12];
   view[i + 13] = heap[dst + 13];
   view[i + 14] = heap[dst + 14];
   view[i + 15] = heap[dst + 15];
  }
 } else {
  var view = HEAPF32.subarray(value >> 2, value + count * 64 >> 2);
 }
 GLctx.uniformMatrix4fv(GL.uniforms[location], !!transpose, view);
}

function _glUseProgram(program) {
 GLctx.useProgram(GL.programs[program]);
}

function _glVertexAttrib1f(x0, x1) {
 GLctx["vertexAttrib1f"](x0, x1);
}

function _glVertexAttrib2fv(index, v) {
 GLctx.vertexAttrib2f(index, HEAPF32[v >> 2], HEAPF32[v + 4 >> 2]);
}

function _glVertexAttrib3fv(index, v) {
 GLctx.vertexAttrib3f(index, HEAPF32[v >> 2], HEAPF32[v + 4 >> 2], HEAPF32[v + 8 >> 2]);
}

function _glVertexAttrib4fv(index, v) {
 GLctx.vertexAttrib4f(index, HEAPF32[v >> 2], HEAPF32[v + 4 >> 2], HEAPF32[v + 8 >> 2], HEAPF32[v + 12 >> 2]);
}

function _glVertexAttribPointer(index, size, type, normalized, stride, ptr) {
 GLctx.vertexAttribPointer(index, size, type, !!normalized, stride, ptr);
}

function _glViewport(x0, x1, x2, x3) {
 GLctx["viewport"](x0, x1, x2, x3);
}

function _round(d) {
 d = +d;
 return d >= +0 ? +Math_floor(d + +.5) : +Math_ceil(d - +.5);
}

function _roundf(d) {
 d = +d;
 return d >= +0 ? +Math_floor(d + +.5) : +Math_ceil(d - +.5);
}

function _sem_destroy() {}

function _sem_init() {}

function _sem_post() {}

function _sem_wait() {}

function _setTempRet0($i) {
 setTempRet0($i | 0);
}

function __isLeapYear(year) {
 return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

function __arraySum(array, index) {
 var sum = 0;
 for (var i = 0; i <= index; sum += array[i++]) {}
 return sum;
}

var __MONTH_DAYS_LEAP = [ 31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31 ];

var __MONTH_DAYS_REGULAR = [ 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31 ];

function __addDays(date, days) {
 var newDate = new Date(date.getTime());
 while (days > 0) {
  var leap = __isLeapYear(newDate.getFullYear());
  var currentMonth = newDate.getMonth();
  var daysInCurrentMonth = (leap ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR)[currentMonth];
  if (days > daysInCurrentMonth - newDate.getDate()) {
   days -= daysInCurrentMonth - newDate.getDate() + 1;
   newDate.setDate(1);
   if (currentMonth < 11) {
    newDate.setMonth(currentMonth + 1);
   } else {
    newDate.setMonth(0);
    newDate.setFullYear(newDate.getFullYear() + 1);
   }
  } else {
   newDate.setDate(newDate.getDate() + days);
   return newDate;
  }
 }
 return newDate;
}

function _strftime(s, maxsize, format, tm) {
 var tm_zone = HEAP32[tm + 40 >> 2];
 var date = {
  tm_sec: HEAP32[tm >> 2],
  tm_min: HEAP32[tm + 4 >> 2],
  tm_hour: HEAP32[tm + 8 >> 2],
  tm_mday: HEAP32[tm + 12 >> 2],
  tm_mon: HEAP32[tm + 16 >> 2],
  tm_year: HEAP32[tm + 20 >> 2],
  tm_wday: HEAP32[tm + 24 >> 2],
  tm_yday: HEAP32[tm + 28 >> 2],
  tm_isdst: HEAP32[tm + 32 >> 2],
  tm_gmtoff: HEAP32[tm + 36 >> 2],
  tm_zone: tm_zone ? UTF8ToString(tm_zone) : ""
 };
 var pattern = UTF8ToString(format);
 var EXPANSION_RULES_1 = {
  "%c": "%a %b %d %H:%M:%S %Y",
  "%D": "%m/%d/%y",
  "%F": "%Y-%m-%d",
  "%h": "%b",
  "%r": "%I:%M:%S %p",
  "%R": "%H:%M",
  "%T": "%H:%M:%S",
  "%x": "%m/%d/%y",
  "%X": "%H:%M:%S",
  "%Ec": "%c",
  "%EC": "%C",
  "%Ex": "%m/%d/%y",
  "%EX": "%H:%M:%S",
  "%Ey": "%y",
  "%EY": "%Y",
  "%Od": "%d",
  "%Oe": "%e",
  "%OH": "%H",
  "%OI": "%I",
  "%Om": "%m",
  "%OM": "%M",
  "%OS": "%S",
  "%Ou": "%u",
  "%OU": "%U",
  "%OV": "%V",
  "%Ow": "%w",
  "%OW": "%W",
  "%Oy": "%y"
 };
 for (var rule in EXPANSION_RULES_1) {
  pattern = pattern.replace(new RegExp(rule, "g"), EXPANSION_RULES_1[rule]);
 }
 var WEEKDAYS = [ "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday" ];
 var MONTHS = [ "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December" ];
 function leadingSomething(value, digits, character) {
  var str = typeof value === "number" ? value.toString() : value || "";
  while (str.length < digits) {
   str = character[0] + str;
  }
  return str;
 }
 function leadingNulls(value, digits) {
  return leadingSomething(value, digits, "0");
 }
 function compareByDay(date1, date2) {
  function sgn(value) {
   return value < 0 ? -1 : value > 0 ? 1 : 0;
  }
  var compare;
  if ((compare = sgn(date1.getFullYear() - date2.getFullYear())) === 0) {
   if ((compare = sgn(date1.getMonth() - date2.getMonth())) === 0) {
    compare = sgn(date1.getDate() - date2.getDate());
   }
  }
  return compare;
 }
 function getFirstWeekStartDate(janFourth) {
  switch (janFourth.getDay()) {
  case 0:
   return new Date(janFourth.getFullYear() - 1, 11, 29);

  case 1:
   return janFourth;

  case 2:
   return new Date(janFourth.getFullYear(), 0, 3);

  case 3:
   return new Date(janFourth.getFullYear(), 0, 2);

  case 4:
   return new Date(janFourth.getFullYear(), 0, 1);

  case 5:
   return new Date(janFourth.getFullYear() - 1, 11, 31);

  case 6:
   return new Date(janFourth.getFullYear() - 1, 11, 30);
  }
 }
 function getWeekBasedYear(date) {
  var thisDate = __addDays(new Date(date.tm_year + 1900, 0, 1), date.tm_yday);
  var janFourthThisYear = new Date(thisDate.getFullYear(), 0, 4);
  var janFourthNextYear = new Date(thisDate.getFullYear() + 1, 0, 4);
  var firstWeekStartThisYear = getFirstWeekStartDate(janFourthThisYear);
  var firstWeekStartNextYear = getFirstWeekStartDate(janFourthNextYear);
  if (compareByDay(firstWeekStartThisYear, thisDate) <= 0) {
   if (compareByDay(firstWeekStartNextYear, thisDate) <= 0) {
    return thisDate.getFullYear() + 1;
   } else {
    return thisDate.getFullYear();
   }
  } else {
   return thisDate.getFullYear() - 1;
  }
 }
 var EXPANSION_RULES_2 = {
  "%a": function(date) {
   return WEEKDAYS[date.tm_wday].substring(0, 3);
  },
  "%A": function(date) {
   return WEEKDAYS[date.tm_wday];
  },
  "%b": function(date) {
   return MONTHS[date.tm_mon].substring(0, 3);
  },
  "%B": function(date) {
   return MONTHS[date.tm_mon];
  },
  "%C": function(date) {
   var year = date.tm_year + 1900;
   return leadingNulls(year / 100 | 0, 2);
  },
  "%d": function(date) {
   return leadingNulls(date.tm_mday, 2);
  },
  "%e": function(date) {
   return leadingSomething(date.tm_mday, 2, " ");
  },
  "%g": function(date) {
   return getWeekBasedYear(date).toString().substring(2);
  },
  "%G": function(date) {
   return getWeekBasedYear(date);
  },
  "%H": function(date) {
   return leadingNulls(date.tm_hour, 2);
  },
  "%I": function(date) {
   var twelveHour = date.tm_hour;
   if (twelveHour == 0) twelveHour = 12; else if (twelveHour > 12) twelveHour -= 12;
   return leadingNulls(twelveHour, 2);
  },
  "%j": function(date) {
   return leadingNulls(date.tm_mday + __arraySum(__isLeapYear(date.tm_year + 1900) ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR, date.tm_mon - 1), 3);
  },
  "%m": function(date) {
   return leadingNulls(date.tm_mon + 1, 2);
  },
  "%M": function(date) {
   return leadingNulls(date.tm_min, 2);
  },
  "%n": function() {
   return "\n";
  },
  "%p": function(date) {
   if (date.tm_hour >= 0 && date.tm_hour < 12) {
    return "AM";
   } else {
    return "PM";
   }
  },
  "%S": function(date) {
   return leadingNulls(date.tm_sec, 2);
  },
  "%t": function() {
   return "\t";
  },
  "%u": function(date) {
   return date.tm_wday || 7;
  },
  "%U": function(date) {
   var janFirst = new Date(date.tm_year + 1900, 0, 1);
   var firstSunday = janFirst.getDay() === 0 ? janFirst : __addDays(janFirst, 7 - janFirst.getDay());
   var endDate = new Date(date.tm_year + 1900, date.tm_mon, date.tm_mday);
   if (compareByDay(firstSunday, endDate) < 0) {
    var februaryFirstUntilEndMonth = __arraySum(__isLeapYear(endDate.getFullYear()) ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR, endDate.getMonth() - 1) - 31;
    var firstSundayUntilEndJanuary = 31 - firstSunday.getDate();
    var days = firstSundayUntilEndJanuary + februaryFirstUntilEndMonth + endDate.getDate();
    return leadingNulls(Math.ceil(days / 7), 2);
   }
   return compareByDay(firstSunday, janFirst) === 0 ? "01" : "00";
  },
  "%V": function(date) {
   var janFourthThisYear = new Date(date.tm_year + 1900, 0, 4);
   var janFourthNextYear = new Date(date.tm_year + 1901, 0, 4);
   var firstWeekStartThisYear = getFirstWeekStartDate(janFourthThisYear);
   var firstWeekStartNextYear = getFirstWeekStartDate(janFourthNextYear);
   var endDate = __addDays(new Date(date.tm_year + 1900, 0, 1), date.tm_yday);
   if (compareByDay(endDate, firstWeekStartThisYear) < 0) {
    return "53";
   }
   if (compareByDay(firstWeekStartNextYear, endDate) <= 0) {
    return "01";
   }
   var daysDifference;
   if (firstWeekStartThisYear.getFullYear() < date.tm_year + 1900) {
    daysDifference = date.tm_yday + 32 - firstWeekStartThisYear.getDate();
   } else {
    daysDifference = date.tm_yday + 1 - firstWeekStartThisYear.getDate();
   }
   return leadingNulls(Math.ceil(daysDifference / 7), 2);
  },
  "%w": function(date) {
   return date.tm_wday;
  },
  "%W": function(date) {
   var janFirst = new Date(date.tm_year, 0, 1);
   var firstMonday = janFirst.getDay() === 1 ? janFirst : __addDays(janFirst, janFirst.getDay() === 0 ? 1 : 7 - janFirst.getDay() + 1);
   var endDate = new Date(date.tm_year + 1900, date.tm_mon, date.tm_mday);
   if (compareByDay(firstMonday, endDate) < 0) {
    var februaryFirstUntilEndMonth = __arraySum(__isLeapYear(endDate.getFullYear()) ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR, endDate.getMonth() - 1) - 31;
    var firstMondayUntilEndJanuary = 31 - firstMonday.getDate();
    var days = firstMondayUntilEndJanuary + februaryFirstUntilEndMonth + endDate.getDate();
    return leadingNulls(Math.ceil(days / 7), 2);
   }
   return compareByDay(firstMonday, janFirst) === 0 ? "01" : "00";
  },
  "%y": function(date) {
   return (date.tm_year + 1900).toString().substring(2);
  },
  "%Y": function(date) {
   return date.tm_year + 1900;
  },
  "%z": function(date) {
   var off = date.tm_gmtoff;
   var ahead = off >= 0;
   off = Math.abs(off) / 60;
   off = off / 60 * 100 + off % 60;
   return (ahead ? "+" : "-") + String("0000" + off).slice(-4);
  },
  "%Z": function(date) {
   return date.tm_zone;
  },
  "%%": function() {
   return "%";
  }
 };
 for (var rule in EXPANSION_RULES_2) {
  if (pattern.indexOf(rule) >= 0) {
   pattern = pattern.replace(new RegExp(rule, "g"), EXPANSION_RULES_2[rule](date));
  }
 }
 var bytes = intArrayFromString(pattern, false);
 if (bytes.length > maxsize) {
  return 0;
 }
 writeArrayToMemory(bytes, s);
 return bytes.length - 1;
}

function _strftime_l(s, maxsize, format, tm) {
 return _strftime(s, maxsize, format, tm);
}

InternalError = Module["InternalError"] = extendError(Error, "InternalError");

embind_init_charCodes();

BindingError = Module["BindingError"] = extendError(Error, "BindingError");

init_ClassHandle();

init_RegisteredPointer();

init_embind();

UnboundTypeError = Module["UnboundTypeError"] = extendError(Error, "UnboundTypeError");

init_emval();

Module["requestFullscreen"] = function Module_requestFullscreen(lockPointer, resizeCanvas) {
 Browser.requestFullscreen(lockPointer, resizeCanvas);
};

Module["requestAnimationFrame"] = function Module_requestAnimationFrame(func) {
 Browser.requestAnimationFrame(func);
};

Module["setCanvasSize"] = function Module_setCanvasSize(width, height, noUpdates) {
 Browser.setCanvasSize(width, height, noUpdates);
};

Module["pauseMainLoop"] = function Module_pauseMainLoop() {
 Browser.mainLoop.pause();
};

Module["resumeMainLoop"] = function Module_resumeMainLoop() {
 Browser.mainLoop.resume();
};

Module["getUserMedia"] = function Module_getUserMedia() {
 Browser.getUserMedia();
};

Module["createContext"] = function Module_createContext(canvas, useWebGL, setInModule, webGLContextAttributes) {
 return Browser.createContext(canvas, useWebGL, setInModule, webGLContextAttributes);
};

var GLctx;

GL.init();

for (var i = 0; i < 32; i++) __tempFixedLengthArray.push(new Array(i));

function intArrayFromString(stringy, dontAddNull, length) {
 var len = length > 0 ? length : lengthBytesUTF8(stringy) + 1;
 var u8array = new Array(len);
 var numBytesWritten = stringToUTF8Array(stringy, u8array, 0, u8array.length);
 if (dontAddNull) u8array.length = numBytesWritten;
 return u8array;
}

var asmLibraryArg = {
 "yc": ___cxa_allocate_exception,
 "nc": ___cxa_throw,
 "Ee": ___map_file,
 "T": ___sys_fcntl64,
 "Be": ___sys_fstat64,
 "De": ___sys_ioctl,
 "Ae": ___sys_mmap2,
 "ze": ___sys_munmap,
 "U": ___sys_open,
 "ye": ___sys_pread64,
 "R": ___sys_stat64,
 "I": __embind_finalize_value_array,
 "w": __embind_finalize_value_object,
 "Ge": __embind_register_bool,
 "i": __embind_register_class,
 "l": __embind_register_class_class_function,
 "y": __embind_register_class_constructor,
 "d": __embind_register_class_function,
 "_": __embind_register_constant,
 "Fe": __embind_register_emval,
 "p": __embind_register_enum,
 "o": __embind_register_enum_value,
 "V": __embind_register_float,
 "n": __embind_register_function,
 "A": __embind_register_integer,
 "z": __embind_register_memory_view,
 "r": __embind_register_smart_ptr,
 "W": __embind_register_std_string,
 "M": __embind_register_std_wstring,
 "K": __embind_register_value_array,
 "J": __embind_register_value_array_element,
 "x": __embind_register_value_object,
 "h": __embind_register_value_object_field,
 "He": __embind_register_void,
 "D": __emval_call_void_method,
 "la": __emval_decref,
 "C": __emval_get_method_caller,
 "bd": __emval_incref,
 "wa": __emval_new_array,
 "Ha": __emval_new_cstring,
 "cc": __emval_new_object,
 "H": __emval_set_property,
 "B": __emval_take_value,
 "e": _abort,
 "ue": _clock_gettime,
 "jb": _eglGetCurrentDisplay,
 "Ne": _eglGetProcAddress,
 "ib": _eglQueryString,
 "Zd": _emscripten_glActiveTexture,
 "Yd": _emscripten_glAttachShader,
 "ne": _emscripten_glBeginQueryEXT,
 "Xd": _emscripten_glBindAttribLocation,
 "Wd": _emscripten_glBindBuffer,
 "Vd": _emscripten_glBindFramebuffer,
 "Ud": _emscripten_glBindRenderbuffer,
 "Td": _emscripten_glBindTexture,
 "fe": _emscripten_glBindVertexArrayOES,
 "Sd": _emscripten_glBlendColor,
 "Rd": _emscripten_glBlendEquation,
 "Qd": _emscripten_glBlendEquationSeparate,
 "Pd": _emscripten_glBlendFunc,
 "Od": _emscripten_glBlendFuncSeparate,
 "Nd": _emscripten_glBufferData,
 "Md": _emscripten_glBufferSubData,
 "Ld": _emscripten_glCheckFramebufferStatus,
 "Kd": _emscripten_glClear,
 "Jd": _emscripten_glClearColor,
 "Id": _emscripten_glClearDepthf,
 "Hd": _emscripten_glClearStencil,
 "Gd": _emscripten_glColorMask,
 "Fd": _emscripten_glCompileShader,
 "Ed": _emscripten_glCompressedTexImage2D,
 "Dd": _emscripten_glCompressedTexSubImage2D,
 "Cd": _emscripten_glCopyTexImage2D,
 "Bd": _emscripten_glCopyTexSubImage2D,
 "Ad": _emscripten_glCreateProgram,
 "zd": _emscripten_glCreateShader,
 "yd": _emscripten_glCullFace,
 "xd": _emscripten_glDeleteBuffers,
 "wd": _emscripten_glDeleteFramebuffers,
 "vd": _emscripten_glDeleteProgram,
 "pe": _emscripten_glDeleteQueriesEXT,
 "ud": _emscripten_glDeleteRenderbuffers,
 "td": _emscripten_glDeleteShader,
 "sd": _emscripten_glDeleteTextures,
 "ee": _emscripten_glDeleteVertexArraysOES,
 "rd": _emscripten_glDepthFunc,
 "qd": _emscripten_glDepthMask,
 "pd": _emscripten_glDepthRangef,
 "od": _emscripten_glDetachShader,
 "nd": _emscripten_glDisable,
 "md": _emscripten_glDisableVertexAttribArray,
 "ld": _emscripten_glDrawArrays,
 "ae": _emscripten_glDrawArraysInstancedANGLE,
 "be": _emscripten_glDrawBuffersWEBGL,
 "kd": _emscripten_glDrawElements,
 "$d": _emscripten_glDrawElementsInstancedANGLE,
 "jd": _emscripten_glEnable,
 "id": _emscripten_glEnableVertexAttribArray,
 "me": _emscripten_glEndQueryEXT,
 "hd": _emscripten_glFinish,
 "gd": _emscripten_glFlush,
 "fd": _emscripten_glFramebufferRenderbuffer,
 "ed": _emscripten_glFramebufferTexture2D,
 "dd": _emscripten_glFrontFace,
 "cd": _emscripten_glGenBuffers,
 "$c": _emscripten_glGenFramebuffers,
 "qe": _emscripten_glGenQueriesEXT,
 "_c": _emscripten_glGenRenderbuffers,
 "Zc": _emscripten_glGenTextures,
 "de": _emscripten_glGenVertexArraysOES,
 "ad": _emscripten_glGenerateMipmap,
 "Yc": _emscripten_glGetActiveAttrib,
 "Xc": _emscripten_glGetActiveUniform,
 "Wc": _emscripten_glGetAttachedShaders,
 "Vc": _emscripten_glGetAttribLocation,
 "Uc": _emscripten_glGetBooleanv,
 "Tc": _emscripten_glGetBufferParameteriv,
 "Sc": _emscripten_glGetError,
 "Rc": _emscripten_glGetFloatv,
 "Qc": _emscripten_glGetFramebufferAttachmentParameteriv,
 "Pc": _emscripten_glGetIntegerv,
 "Nc": _emscripten_glGetProgramInfoLog,
 "Oc": _emscripten_glGetProgramiv,
 "he": _emscripten_glGetQueryObjecti64vEXT,
 "je": _emscripten_glGetQueryObjectivEXT,
 "ge": _emscripten_glGetQueryObjectui64vEXT,
 "ie": _emscripten_glGetQueryObjectuivEXT,
 "ke": _emscripten_glGetQueryivEXT,
 "Mc": _emscripten_glGetRenderbufferParameteriv,
 "Kc": _emscripten_glGetShaderInfoLog,
 "Jc": _emscripten_glGetShaderPrecisionFormat,
 "Ic": _emscripten_glGetShaderSource,
 "Lc": _emscripten_glGetShaderiv,
 "Hc": _emscripten_glGetString,
 "Gc": _emscripten_glGetTexParameterfv,
 "Fc": _emscripten_glGetTexParameteriv,
 "Cc": _emscripten_glGetUniformLocation,
 "Ec": _emscripten_glGetUniformfv,
 "Dc": _emscripten_glGetUniformiv,
 "zc": _emscripten_glGetVertexAttribPointerv,
 "Bc": _emscripten_glGetVertexAttribfv,
 "Ac": _emscripten_glGetVertexAttribiv,
 "xc": _emscripten_glHint,
 "wc": _emscripten_glIsBuffer,
 "vc": _emscripten_glIsEnabled,
 "uc": _emscripten_glIsFramebuffer,
 "tc": _emscripten_glIsProgram,
 "oe": _emscripten_glIsQueryEXT,
 "sc": _emscripten_glIsRenderbuffer,
 "rc": _emscripten_glIsShader,
 "qc": _emscripten_glIsTexture,
 "ce": _emscripten_glIsVertexArrayOES,
 "pc": _emscripten_glLineWidth,
 "oc": _emscripten_glLinkProgram,
 "mc": _emscripten_glPixelStorei,
 "lc": _emscripten_glPolygonOffset,
 "le": _emscripten_glQueryCounterEXT,
 "kc": _emscripten_glReadPixels,
 "jc": _emscripten_glReleaseShaderCompiler,
 "ic": _emscripten_glRenderbufferStorage,
 "hc": _emscripten_glSampleCoverage,
 "gc": _emscripten_glScissor,
 "fc": _emscripten_glShaderBinary,
 "ec": _emscripten_glShaderSource,
 "dc": _emscripten_glStencilFunc,
 "bc": _emscripten_glStencilFuncSeparate,
 "ac": _emscripten_glStencilMask,
 "$b": _emscripten_glStencilMaskSeparate,
 "_b": _emscripten_glStencilOp,
 "Zb": _emscripten_glStencilOpSeparate,
 "Yb": _emscripten_glTexImage2D,
 "Xb": _emscripten_glTexParameterf,
 "Wb": _emscripten_glTexParameterfv,
 "Vb": _emscripten_glTexParameteri,
 "Ub": _emscripten_glTexParameteriv,
 "Tb": _emscripten_glTexSubImage2D,
 "Sb": _emscripten_glUniform1f,
 "Rb": _emscripten_glUniform1fv,
 "Qb": _emscripten_glUniform1i,
 "Pb": _emscripten_glUniform1iv,
 "Ob": _emscripten_glUniform2f,
 "Nb": _emscripten_glUniform2fv,
 "Mb": _emscripten_glUniform2i,
 "Lb": _emscripten_glUniform2iv,
 "Kb": _emscripten_glUniform3f,
 "Jb": _emscripten_glUniform3fv,
 "Ib": _emscripten_glUniform3i,
 "Hb": _emscripten_glUniform3iv,
 "Gb": _emscripten_glUniform4f,
 "Fb": _emscripten_glUniform4fv,
 "Eb": _emscripten_glUniform4i,
 "Db": _emscripten_glUniform4iv,
 "Cb": _emscripten_glUniformMatrix2fv,
 "Bb": _emscripten_glUniformMatrix3fv,
 "Ab": _emscripten_glUniformMatrix4fv,
 "zb": _emscripten_glUseProgram,
 "yb": _emscripten_glValidateProgram,
 "xb": _emscripten_glVertexAttrib1f,
 "wb": _emscripten_glVertexAttrib1fv,
 "vb": _emscripten_glVertexAttrib2f,
 "ub": _emscripten_glVertexAttrib2fv,
 "tb": _emscripten_glVertexAttrib3f,
 "sb": _emscripten_glVertexAttrib3fv,
 "rb": _emscripten_glVertexAttrib4f,
 "qb": _emscripten_glVertexAttrib4fv,
 "_d": _emscripten_glVertexAttribDivisorANGLE,
 "pb": _emscripten_glVertexAttribPointer,
 "ob": _emscripten_glViewport,
 "f": _emscripten_longjmp,
 "re": _emscripten_memcpy_big,
 "se": _emscripten_resize_heap,
 "Df": _emscripten_webgl_get_current_context,
 "aa": _emscripten_webgl_make_context_current,
 "we": _environ_get,
 "xe": _environ_sizes_get,
 "Ie": _exit,
 "L": _fd_close,
 "ve": _fd_fdstat_get,
 "Ce": _fd_read,
 "nb": _fd_seek,
 "S": _fd_write,
 "a": _getTempRet0,
 "hb": _glActiveTexture,
 "gb": _glAttachShader,
 "fb": _glBindAttribLocation,
 "eb": _glBindBuffer,
 "$": _glBindFramebuffer,
 "db": _glBindRenderbuffer,
 "cb": _glBindTexture,
 "bb": _glBlendColor,
 "ab": _glBlendEquation,
 "$a": _glBlendFunc,
 "_a": _glBufferData,
 "Za": _glBufferSubData,
 "Ya": _glCheckFramebufferStatus,
 "N": _glClear,
 "Q": _glClearColor,
 "P": _glClearStencil,
 "Xa": _glColorMask,
 "Wa": _glCompileShader,
 "Va": _glCompressedTexImage2D,
 "Ua": _glCompressedTexSubImage2D,
 "Ta": _glCopyTexSubImage2D,
 "Sa": _glCreateProgram,
 "Ra": _glCreateShader,
 "Qa": _glCullFace,
 "Pa": _glDeleteBuffers,
 "Oa": _glDeleteFramebuffers,
 "Na": _glDeleteProgram,
 "Ma": _glDeleteRenderbuffers,
 "La": _glDeleteShader,
 "Ka": _glDeleteTextures,
 "Ja": _glDepthMask,
 "Ia": _glDisable,
 "Ga": _glDisableVertexAttribArray,
 "Fa": _glDrawArrays,
 "Ea": _glDrawElements,
 "Da": _glEnable,
 "Ca": _glEnableVertexAttribArray,
 "Ba": _glFinish,
 "Aa": _glFlush,
 "za": _glFramebufferRenderbuffer,
 "ya": _glFramebufferTexture2D,
 "xa": _glFrontFace,
 "va": _glGenBuffers,
 "ua": _glGenFramebuffers,
 "ta": _glGenRenderbuffers,
 "sa": _glGenTextures,
 "ra": _glGenerateMipmap,
 "qa": _glGetBufferParameteriv,
 "pa": _glGetError,
 "oa": _glGetFramebufferAttachmentParameteriv,
 "G": _glGetIntegerv,
 "na": _glGetProgramInfoLog,
 "ma": _glGetProgramiv,
 "ka": _glGetRenderbufferParameteriv,
 "ja": _glGetShaderInfoLog,
 "ia": _glGetShaderPrecisionFormat,
 "ha": _glGetShaderiv,
 "ga": _glGetString,
 "fa": _glGetUniformLocation,
 "ea": _glIsTexture,
 "da": _glLineWidth,
 "ca": _glLinkProgram,
 "ba": _glPixelStorei,
 "Cf": _glReadPixels,
 "Bf": _glRenderbufferStorage,
 "Af": _glScissor,
 "zf": _glShaderSource,
 "yf": _glStencilFunc,
 "xf": _glStencilFuncSeparate,
 "wf": _glStencilMask,
 "vf": _glStencilMaskSeparate,
 "uf": _glStencilOp,
 "tf": _glStencilOpSeparate,
 "sf": _glTexImage2D,
 "rf": _glTexParameterf,
 "qf": _glTexParameterfv,
 "pf": _glTexParameteri,
 "of": _glTexParameteriv,
 "nf": _glTexSubImage2D,
 "mf": _glUniform1f,
 "lf": _glUniform1fv,
 "kf": _glUniform1i,
 "jf": _glUniform1iv,
 "hf": _glUniform2f,
 "gf": _glUniform2fv,
 "ff": _glUniform2i,
 "ef": _glUniform2iv,
 "df": _glUniform3f,
 "cf": _glUniform3fv,
 "bf": _glUniform3i,
 "af": _glUniform3iv,
 "$e": _glUniform4f,
 "_e": _glUniform4fv,
 "Ze": _glUniform4i,
 "Ye": _glUniform4iv,
 "Xe": _glUniformMatrix2fv,
 "We": _glUniformMatrix3fv,
 "Ve": _glUniformMatrix4fv,
 "Ue": _glUseProgram,
 "Te": _glVertexAttrib1f,
 "Se": _glVertexAttrib2fv,
 "Re": _glVertexAttrib3fv,
 "Qe": _glVertexAttrib4fv,
 "Pe": _glVertexAttribPointer,
 "Oe": _glViewport,
 "k": invoke_ii,
 "v": invoke_iii,
 "g": invoke_iiii,
 "F": invoke_iiiii,
 "Me": invoke_iiiiii,
 "Z": invoke_iiiiiii,
 "Y": invoke_iiiiiiiiii,
 "X": invoke_v,
 "j": invoke_vi,
 "m": invoke_vii,
 "t": invoke_viii,
 "u": invoke_viiii,
 "Le": invoke_viiiii,
 "Je": invoke_viiiiii,
 "Ke": invoke_viiiiiiiii,
 "memory": wasmMemory,
 "q": _round,
 "E": _roundf,
 "s": _saveSetjmp,
 "mb": _sem_destroy,
 "O": _sem_init,
 "lb": _sem_post,
 "kb": _sem_wait,
 "b": _setTempRet0,
 "te": _strftime_l,
 "table": wasmTable,
 "c": _testSetjmp
};

var asm = createWasm();

Module["asm"] = asm;

var ___wasm_call_ctors = Module["___wasm_call_ctors"] = function() {
 return (___wasm_call_ctors = Module["___wasm_call_ctors"] = Module["asm"]["Ef"]).apply(null, arguments);
};

var _memset = Module["_memset"] = function() {
 return (_memset = Module["_memset"] = Module["asm"]["Ff"]).apply(null, arguments);
};

var _malloc = Module["_malloc"] = function() {
 return (_malloc = Module["_malloc"] = Module["asm"]["Gf"]).apply(null, arguments);
};

var _free = Module["_free"] = function() {
 return (_free = Module["_free"] = Module["asm"]["Hf"]).apply(null, arguments);
};

var _realloc = Module["_realloc"] = function() {
 return (_realloc = Module["_realloc"] = Module["asm"]["If"]).apply(null, arguments);
};

var ___errno_location = Module["___errno_location"] = function() {
 return (___errno_location = Module["___errno_location"] = Module["asm"]["Jf"]).apply(null, arguments);
};

var ___getTypeName = Module["___getTypeName"] = function() {
 return (___getTypeName = Module["___getTypeName"] = Module["asm"]["Kf"]).apply(null, arguments);
};

var ___embind_register_native_and_builtin_types = Module["___embind_register_native_and_builtin_types"] = function() {
 return (___embind_register_native_and_builtin_types = Module["___embind_register_native_and_builtin_types"] = Module["asm"]["Lf"]).apply(null, arguments);
};

var _emscripten_GetProcAddress = Module["_emscripten_GetProcAddress"] = function() {
 return (_emscripten_GetProcAddress = Module["_emscripten_GetProcAddress"] = Module["asm"]["Mf"]).apply(null, arguments);
};

var _setThrew = Module["_setThrew"] = function() {
 return (_setThrew = Module["_setThrew"] = Module["asm"]["Nf"]).apply(null, arguments);
};

var _memalign = Module["_memalign"] = function() {
 return (_memalign = Module["_memalign"] = Module["asm"]["Of"]).apply(null, arguments);
};

var dynCall_v = Module["dynCall_v"] = function() {
 return (dynCall_v = Module["dynCall_v"] = Module["asm"]["Pf"]).apply(null, arguments);
};

var dynCall_vi = Module["dynCall_vi"] = function() {
 return (dynCall_vi = Module["dynCall_vi"] = Module["asm"]["Qf"]).apply(null, arguments);
};

var dynCall_vii = Module["dynCall_vii"] = function() {
 return (dynCall_vii = Module["dynCall_vii"] = Module["asm"]["Rf"]).apply(null, arguments);
};

var dynCall_viii = Module["dynCall_viii"] = function() {
 return (dynCall_viii = Module["dynCall_viii"] = Module["asm"]["Sf"]).apply(null, arguments);
};

var dynCall_viiii = Module["dynCall_viiii"] = function() {
 return (dynCall_viiii = Module["dynCall_viiii"] = Module["asm"]["Tf"]).apply(null, arguments);
};

var dynCall_viiiii = Module["dynCall_viiiii"] = function() {
 return (dynCall_viiiii = Module["dynCall_viiiii"] = Module["asm"]["Uf"]).apply(null, arguments);
};

var dynCall_viiiiii = Module["dynCall_viiiiii"] = function() {
 return (dynCall_viiiiii = Module["dynCall_viiiiii"] = Module["asm"]["Vf"]).apply(null, arguments);
};

var dynCall_viiiiiiiii = Module["dynCall_viiiiiiiii"] = function() {
 return (dynCall_viiiiiiiii = Module["dynCall_viiiiiiiii"] = Module["asm"]["Wf"]).apply(null, arguments);
};

var dynCall_ii = Module["dynCall_ii"] = function() {
 return (dynCall_ii = Module["dynCall_ii"] = Module["asm"]["Xf"]).apply(null, arguments);
};

var dynCall_iii = Module["dynCall_iii"] = function() {
 return (dynCall_iii = Module["dynCall_iii"] = Module["asm"]["Yf"]).apply(null, arguments);
};

var dynCall_iiii = Module["dynCall_iiii"] = function() {
 return (dynCall_iiii = Module["dynCall_iiii"] = Module["asm"]["Zf"]).apply(null, arguments);
};

var dynCall_iiiii = Module["dynCall_iiiii"] = function() {
 return (dynCall_iiiii = Module["dynCall_iiiii"] = Module["asm"]["_f"]).apply(null, arguments);
};

var dynCall_iiiiii = Module["dynCall_iiiiii"] = function() {
 return (dynCall_iiiiii = Module["dynCall_iiiiii"] = Module["asm"]["$f"]).apply(null, arguments);
};

var dynCall_iiiiiii = Module["dynCall_iiiiiii"] = function() {
 return (dynCall_iiiiiii = Module["dynCall_iiiiiii"] = Module["asm"]["ag"]).apply(null, arguments);
};

var dynCall_iiiiiiiiii = Module["dynCall_iiiiiiiiii"] = function() {
 return (dynCall_iiiiiiiiii = Module["dynCall_iiiiiiiiii"] = Module["asm"]["bg"]).apply(null, arguments);
};

var stackSave = Module["stackSave"] = function() {
 return (stackSave = Module["stackSave"] = Module["asm"]["cg"]).apply(null, arguments);
};

var stackRestore = Module["stackRestore"] = function() {
 return (stackRestore = Module["stackRestore"] = Module["asm"]["dg"]).apply(null, arguments);
};

var dynCall_i = Module["dynCall_i"] = function() {
 return (dynCall_i = Module["dynCall_i"] = Module["asm"]["eg"]).apply(null, arguments);
};

var dynCall_vif = Module["dynCall_vif"] = function() {
 return (dynCall_vif = Module["dynCall_vif"] = Module["asm"]["fg"]).apply(null, arguments);
};

var dynCall_viffi = Module["dynCall_viffi"] = function() {
 return (dynCall_viffi = Module["dynCall_viffi"] = Module["asm"]["gg"]).apply(null, arguments);
};

var dynCall_viifi = Module["dynCall_viifi"] = function() {
 return (dynCall_viifi = Module["dynCall_viifi"] = Module["asm"]["hg"]).apply(null, arguments);
};

var dynCall_viiiiiiiiiii = Module["dynCall_viiiiiiiiiii"] = function() {
 return (dynCall_viiiiiiiiiii = Module["dynCall_viiiiiiiiiii"] = Module["asm"]["ig"]).apply(null, arguments);
};

var dynCall_viifiiiiiiii = Module["dynCall_viifiiiiiiii"] = function() {
 return (dynCall_viifiiiiiiii = Module["dynCall_viifiiiiiiii"] = Module["asm"]["jg"]).apply(null, arguments);
};

var dynCall_viffiiiiiffiii = Module["dynCall_viffiiiiiffiii"] = function() {
 return (dynCall_viffiiiiiffiii = Module["dynCall_viffiiiiiffiii"] = Module["asm"]["kg"]).apply(null, arguments);
};

var dynCall_viififiiiiiiii = Module["dynCall_viififiiiiiiii"] = function() {
 return (dynCall_viififiiiiiiii = Module["dynCall_viififiiiiiiii"] = Module["asm"]["lg"]).apply(null, arguments);
};

var dynCall_viiffii = Module["dynCall_viiffii"] = function() {
 return (dynCall_viiffii = Module["dynCall_viiffii"] = Module["asm"]["mg"]).apply(null, arguments);
};

var dynCall_viiiiiiii = Module["dynCall_viiiiiiii"] = function() {
 return (dynCall_viiiiiiii = Module["dynCall_viiiiiiii"] = Module["asm"]["ng"]).apply(null, arguments);
};

var dynCall_vifffi = Module["dynCall_vifffi"] = function() {
 return (dynCall_vifffi = Module["dynCall_vifffi"] = Module["asm"]["og"]).apply(null, arguments);
};

var dynCall_viiff = Module["dynCall_viiff"] = function() {
 return (dynCall_viiff = Module["dynCall_viiff"] = Module["asm"]["pg"]).apply(null, arguments);
};

var dynCall_viiffi = Module["dynCall_viiffi"] = function() {
 return (dynCall_viiffi = Module["dynCall_viiffi"] = Module["asm"]["qg"]).apply(null, arguments);
};

var dynCall_viffffi = Module["dynCall_viffffi"] = function() {
 return (dynCall_viffffi = Module["dynCall_viffffi"] = Module["asm"]["rg"]).apply(null, arguments);
};

var dynCall_viiiifiii = Module["dynCall_viiiifiii"] = function() {
 return (dynCall_viiiifiii = Module["dynCall_viiiifiii"] = Module["asm"]["sg"]).apply(null, arguments);
};

var dynCall_viiiffii = Module["dynCall_viiiffii"] = function() {
 return (dynCall_viiiffii = Module["dynCall_viiiffii"] = Module["asm"]["tg"]).apply(null, arguments);
};

var dynCall_vifff = Module["dynCall_vifff"] = function() {
 return (dynCall_vifff = Module["dynCall_vifff"] = Module["asm"]["ug"]).apply(null, arguments);
};

var dynCall_viff = Module["dynCall_viff"] = function() {
 return (dynCall_viff = Module["dynCall_viff"] = Module["asm"]["vg"]).apply(null, arguments);
};

var dynCall_iifii = Module["dynCall_iifii"] = function() {
 return (dynCall_iifii = Module["dynCall_iifii"] = Module["asm"]["wg"]).apply(null, arguments);
};

var dynCall_vifii = Module["dynCall_vifii"] = function() {
 return (dynCall_vifii = Module["dynCall_vifii"] = Module["asm"]["xg"]).apply(null, arguments);
};

var dynCall_viif = Module["dynCall_viif"] = function() {
 return (dynCall_viif = Module["dynCall_viif"] = Module["asm"]["yg"]).apply(null, arguments);
};

var dynCall_fi = Module["dynCall_fi"] = function() {
 return (dynCall_fi = Module["dynCall_fi"] = Module["asm"]["zg"]).apply(null, arguments);
};

var dynCall_fii = Module["dynCall_fii"] = function() {
 return (dynCall_fii = Module["dynCall_fii"] = Module["asm"]["Ag"]).apply(null, arguments);
};

var dynCall_iiffii = Module["dynCall_iiffii"] = function() {
 return (dynCall_iiffii = Module["dynCall_iiffii"] = Module["asm"]["Bg"]).apply(null, arguments);
};

var dynCall_viffii = Module["dynCall_viffii"] = function() {
 return (dynCall_viffii = Module["dynCall_viffii"] = Module["asm"]["Cg"]).apply(null, arguments);
};

var dynCall_iiifi = Module["dynCall_iiifi"] = function() {
 return (dynCall_iiifi = Module["dynCall_iiifi"] = Module["asm"]["Dg"]).apply(null, arguments);
};

var dynCall_iif = Module["dynCall_iif"] = function() {
 return (dynCall_iif = Module["dynCall_iif"] = Module["asm"]["Eg"]).apply(null, arguments);
};

var dynCall_iiiif = Module["dynCall_iiiif"] = function() {
 return (dynCall_iiiif = Module["dynCall_iiiif"] = Module["asm"]["Fg"]).apply(null, arguments);
};

var dynCall_viiif = Module["dynCall_viiif"] = function() {
 return (dynCall_viiif = Module["dynCall_viiif"] = Module["asm"]["Gg"]).apply(null, arguments);
};

var dynCall_iiffi = Module["dynCall_iiffi"] = function() {
 return (dynCall_iiffi = Module["dynCall_iiffi"] = Module["asm"]["Hg"]).apply(null, arguments);
};

var dynCall_iiiiiiii = Module["dynCall_iiiiiiii"] = function() {
 return (dynCall_iiiiiiii = Module["dynCall_iiiiiiii"] = Module["asm"]["Ig"]).apply(null, arguments);
};

var dynCall_viiiiiii = Module["dynCall_viiiiiii"] = function() {
 return (dynCall_viiiiiii = Module["dynCall_viiiiiii"] = Module["asm"]["Jg"]).apply(null, arguments);
};

var dynCall_viifffffffffi = Module["dynCall_viifffffffffi"] = function() {
 return (dynCall_viifffffffffi = Module["dynCall_viifffffffffi"] = Module["asm"]["Kg"]).apply(null, arguments);
};

var dynCall_viffffii = Module["dynCall_viffffii"] = function() {
 return (dynCall_viffffii = Module["dynCall_viffffii"] = Module["asm"]["Lg"]).apply(null, arguments);
};

var dynCall_vifffiiff = Module["dynCall_vifffiiff"] = function() {
 return (dynCall_vifffiiff = Module["dynCall_vifffiiff"] = Module["asm"]["Mg"]).apply(null, arguments);
};

var dynCall_vifffff = Module["dynCall_vifffff"] = function() {
 return (dynCall_vifffff = Module["dynCall_vifffff"] = Module["asm"]["Ng"]).apply(null, arguments);
};

var dynCall_iiff = Module["dynCall_iiff"] = function() {
 return (dynCall_iiff = Module["dynCall_iiff"] = Module["asm"]["Og"]).apply(null, arguments);
};

var dynCall_viffffff = Module["dynCall_viffffff"] = function() {
 return (dynCall_viffffff = Module["dynCall_viffffff"] = Module["asm"]["Pg"]).apply(null, arguments);
};

var dynCall_viffff = Module["dynCall_viffff"] = function() {
 return (dynCall_viffff = Module["dynCall_viffff"] = Module["asm"]["Qg"]).apply(null, arguments);
};

var dynCall_vifffffffff = Module["dynCall_vifffffffff"] = function() {
 return (dynCall_vifffffffff = Module["dynCall_vifffffffff"] = Module["asm"]["Rg"]).apply(null, arguments);
};

var dynCall_iifff = Module["dynCall_iifff"] = function() {
 return (dynCall_iifff = Module["dynCall_iifff"] = Module["asm"]["Sg"]).apply(null, arguments);
};

var dynCall_iiiiiiiiiiii = Module["dynCall_iiiiiiiiiiii"] = function() {
 return (dynCall_iiiiiiiiiiii = Module["dynCall_iiiiiiiiiiii"] = Module["asm"]["Tg"]).apply(null, arguments);
};

var dynCall_iiifiiiiiiii = Module["dynCall_iiifiiiiiiii"] = function() {
 return (dynCall_iiifiiiiiiii = Module["dynCall_iiifiiiiiiii"] = Module["asm"]["Ug"]).apply(null, arguments);
};

var dynCall_iiffiiiiiffiii = Module["dynCall_iiffiiiiiffiii"] = function() {
 return (dynCall_iiffiiiiiffiii = Module["dynCall_iiffiiiiiffiii"] = Module["asm"]["Vg"]).apply(null, arguments);
};

var dynCall_iiififiiiiiiii = Module["dynCall_iiififiiiiiiii"] = function() {
 return (dynCall_iiififiiiiiiii = Module["dynCall_iiififiiiiiiii"] = Module["asm"]["Wg"]).apply(null, arguments);
};

var dynCall_viifffi = Module["dynCall_viifffi"] = function() {
 return (dynCall_viifffi = Module["dynCall_viifffi"] = Module["asm"]["Xg"]).apply(null, arguments);
};

var dynCall_viiiff = Module["dynCall_viiiff"] = function() {
 return (dynCall_viiiff = Module["dynCall_viiiff"] = Module["asm"]["Yg"]).apply(null, arguments);
};

var dynCall_viiiffi = Module["dynCall_viiiffi"] = function() {
 return (dynCall_viiiffi = Module["dynCall_viiiffi"] = Module["asm"]["Zg"]).apply(null, arguments);
};

var dynCall_viiffffi = Module["dynCall_viiffffi"] = function() {
 return (dynCall_viiffffi = Module["dynCall_viiffffi"] = Module["asm"]["_g"]).apply(null, arguments);
};

var dynCall_viiiiifiii = Module["dynCall_viiiiifiii"] = function() {
 return (dynCall_viiiiifiii = Module["dynCall_viiiiifiii"] = Module["asm"]["$g"]).apply(null, arguments);
};

var dynCall_viiiiffii = Module["dynCall_viiiiffii"] = function() {
 return (dynCall_viiiiffii = Module["dynCall_viiiiffii"] = Module["asm"]["ah"]).apply(null, arguments);
};

var dynCall_viifff = Module["dynCall_viifff"] = function() {
 return (dynCall_viifff = Module["dynCall_viifff"] = Module["asm"]["bh"]).apply(null, arguments);
};

var dynCall_iiif = Module["dynCall_iiif"] = function() {
 return (dynCall_iiif = Module["dynCall_iiif"] = Module["asm"]["ch"]).apply(null, arguments);
};

var dynCall_iiiffi = Module["dynCall_iiiffi"] = function() {
 return (dynCall_iiiffi = Module["dynCall_iiiffi"] = Module["asm"]["dh"]).apply(null, arguments);
};

var dynCall_iiifff = Module["dynCall_iiifff"] = function() {
 return (dynCall_iiifff = Module["dynCall_iiifff"] = Module["asm"]["eh"]).apply(null, arguments);
};

var dynCall_fiii = Module["dynCall_fiii"] = function() {
 return (dynCall_fiii = Module["dynCall_fiii"] = Module["asm"]["fh"]).apply(null, arguments);
};

var dynCall_viiifffffffffi = Module["dynCall_viiifffffffffi"] = function() {
 return (dynCall_viiifffffffffi = Module["dynCall_viiifffffffffi"] = Module["asm"]["gh"]).apply(null, arguments);
};

var dynCall_viiffffii = Module["dynCall_viiffffii"] = function() {
 return (dynCall_viiffffii = Module["dynCall_viiffffii"] = Module["asm"]["hh"]).apply(null, arguments);
};

var dynCall_viifffiiff = Module["dynCall_viifffiiff"] = function() {
 return (dynCall_viifffiiff = Module["dynCall_viifffiiff"] = Module["asm"]["ih"]).apply(null, arguments);
};

var dynCall_viifffff = Module["dynCall_viifffff"] = function() {
 return (dynCall_viifffff = Module["dynCall_viifffff"] = Module["asm"]["jh"]).apply(null, arguments);
};

var dynCall_iiiff = Module["dynCall_iiiff"] = function() {
 return (dynCall_iiiff = Module["dynCall_iiiff"] = Module["asm"]["kh"]).apply(null, arguments);
};

var dynCall_viiffffff = Module["dynCall_viiffffff"] = function() {
 return (dynCall_viiffffff = Module["dynCall_viiffffff"] = Module["asm"]["lh"]).apply(null, arguments);
};

var dynCall_viiffff = Module["dynCall_viiffff"] = function() {
 return (dynCall_viiffff = Module["dynCall_viiffff"] = Module["asm"]["mh"]).apply(null, arguments);
};

var dynCall_viifffffffff = Module["dynCall_viifffffffff"] = function() {
 return (dynCall_viifffffffff = Module["dynCall_viifffffffff"] = Module["asm"]["nh"]).apply(null, arguments);
};

var dynCall_iiiiiiiii = Module["dynCall_iiiiiiiii"] = function() {
 return (dynCall_iiiiiiiii = Module["dynCall_iiiiiiiii"] = Module["asm"]["oh"]).apply(null, arguments);
};

var dynCall_vidi = Module["dynCall_vidi"] = function() {
 return (dynCall_vidi = Module["dynCall_vidi"] = Module["asm"]["ph"]).apply(null, arguments);
};

var dynCall_vid = Module["dynCall_vid"] = function() {
 return (dynCall_vid = Module["dynCall_vid"] = Module["asm"]["qh"]).apply(null, arguments);
};

var dynCall_viidi = Module["dynCall_viidi"] = function() {
 return (dynCall_viidi = Module["dynCall_viidi"] = Module["asm"]["rh"]).apply(null, arguments);
};

var dynCall_viid = Module["dynCall_viid"] = function() {
 return (dynCall_viid = Module["dynCall_viid"] = Module["asm"]["sh"]).apply(null, arguments);
};

var dynCall_di = Module["dynCall_di"] = function() {
 return (dynCall_di = Module["dynCall_di"] = Module["asm"]["th"]).apply(null, arguments);
};

var dynCall_dii = Module["dynCall_dii"] = function() {
 return (dynCall_dii = Module["dynCall_dii"] = Module["asm"]["uh"]).apply(null, arguments);
};

var dynCall_iiid = Module["dynCall_iiid"] = function() {
 return (dynCall_iiid = Module["dynCall_iiid"] = Module["asm"]["vh"]).apply(null, arguments);
};

var dynCall_fiiiiii = Module["dynCall_fiiiiii"] = function() {
 return (dynCall_fiiiiii = Module["dynCall_fiiiiii"] = Module["asm"]["wh"]).apply(null, arguments);
};

var dynCall_viiiiiff = Module["dynCall_viiiiiff"] = function() {
 return (dynCall_viiiiiff = Module["dynCall_viiiiiff"] = Module["asm"]["xh"]).apply(null, arguments);
};

var dynCall_viiiiifiiiiii = Module["dynCall_viiiiifiiiiii"] = function() {
 return (dynCall_viiiiifiiiiii = Module["dynCall_viiiiifiiiiii"] = Module["asm"]["yh"]).apply(null, arguments);
};

var dynCall_iiifii = Module["dynCall_iiifii"] = function() {
 return (dynCall_iiifii = Module["dynCall_iiifii"] = Module["asm"]["zh"]).apply(null, arguments);
};

var dynCall_viiiiifi = Module["dynCall_viiiiifi"] = function() {
 return (dynCall_viiiiifi = Module["dynCall_viiiiifi"] = Module["asm"]["Ah"]).apply(null, arguments);
};

var dynCall_viiiiiiifi = Module["dynCall_viiiiiiifi"] = function() {
 return (dynCall_viiiiiiifi = Module["dynCall_viiiiiiifi"] = Module["asm"]["Bh"]).apply(null, arguments);
};

var dynCall_viiiiiiiiifi = Module["dynCall_viiiiiiiiifi"] = function() {
 return (dynCall_viiiiiiiiifi = Module["dynCall_viiiiiiiiifi"] = Module["asm"]["Ch"]).apply(null, arguments);
};

var dynCall_ji = Module["dynCall_ji"] = function() {
 return (dynCall_ji = Module["dynCall_ji"] = Module["asm"]["Dh"]).apply(null, arguments);
};

var dynCall_iiji = Module["dynCall_iiji"] = function() {
 return (dynCall_iiji = Module["dynCall_iiji"] = Module["asm"]["Eh"]).apply(null, arguments);
};

var dynCall_iijjiii = Module["dynCall_iijjiii"] = function() {
 return (dynCall_iijjiii = Module["dynCall_iijjiii"] = Module["asm"]["Fh"]).apply(null, arguments);
};

var dynCall_iij = Module["dynCall_iij"] = function() {
 return (dynCall_iij = Module["dynCall_iij"] = Module["asm"]["Gh"]).apply(null, arguments);
};

var dynCall_vijjjii = Module["dynCall_vijjjii"] = function() {
 return (dynCall_vijjjii = Module["dynCall_vijjjii"] = Module["asm"]["Hh"]).apply(null, arguments);
};

var dynCall_viiiiiiiiiifi = Module["dynCall_viiiiiiiiiifi"] = function() {
 return (dynCall_viiiiiiiiiifi = Module["dynCall_viiiiiiiiiifi"] = Module["asm"]["Ih"]).apply(null, arguments);
};

var dynCall_viifii = Module["dynCall_viifii"] = function() {
 return (dynCall_viifii = Module["dynCall_viifii"] = Module["asm"]["Jh"]).apply(null, arguments);
};

var dynCall_viiiiiiiiiiii = Module["dynCall_viiiiiiiiiiii"] = function() {
 return (dynCall_viiiiiiiiiiii = Module["dynCall_viiiiiiiiiiii"] = Module["asm"]["Kh"]).apply(null, arguments);
};

var dynCall_iidi = Module["dynCall_iidi"] = function() {
 return (dynCall_iidi = Module["dynCall_iidi"] = Module["asm"]["Lh"]).apply(null, arguments);
};

var dynCall_viiiiiiiiiiiiiii = Module["dynCall_viiiiiiiiiiiiiii"] = function() {
 return (dynCall_viiiiiiiiiiiiiii = Module["dynCall_viiiiiiiiiiiiiii"] = Module["asm"]["Mh"]).apply(null, arguments);
};

var dynCall_viji = Module["dynCall_viji"] = function() {
 return (dynCall_viji = Module["dynCall_viji"] = Module["asm"]["Nh"]).apply(null, arguments);
};

var dynCall_vijiii = Module["dynCall_vijiii"] = function() {
 return (dynCall_vijiii = Module["dynCall_vijiii"] = Module["asm"]["Oh"]).apply(null, arguments);
};

var dynCall_fffff = Module["dynCall_fffff"] = function() {
 return (dynCall_fffff = Module["dynCall_fffff"] = Module["asm"]["Ph"]).apply(null, arguments);
};

var dynCall_viiiiij = Module["dynCall_viiiiij"] = function() {
 return (dynCall_viiiiij = Module["dynCall_viiiiij"] = Module["asm"]["Qh"]).apply(null, arguments);
};

var dynCall_fiff = Module["dynCall_fiff"] = function() {
 return (dynCall_fiff = Module["dynCall_fiff"] = Module["asm"]["Rh"]).apply(null, arguments);
};

var dynCall_viiiiiffii = Module["dynCall_viiiiiffii"] = function() {
 return (dynCall_viiiiiffii = Module["dynCall_viiiiiffii"] = Module["asm"]["Sh"]).apply(null, arguments);
};

var dynCall_viifd = Module["dynCall_viifd"] = function() {
 return (dynCall_viifd = Module["dynCall_viifd"] = Module["asm"]["Th"]).apply(null, arguments);
};

var dynCall_viddi = Module["dynCall_viddi"] = function() {
 return (dynCall_viddi = Module["dynCall_viddi"] = Module["asm"]["Uh"]).apply(null, arguments);
};

var dynCall_viiiiffi = Module["dynCall_viiiiffi"] = function() {
 return (dynCall_viiiiffi = Module["dynCall_viiiiffi"] = Module["asm"]["Vh"]).apply(null, arguments);
};

var dynCall_viiiiif = Module["dynCall_viiiiif"] = function() {
 return (dynCall_viiiiif = Module["dynCall_viiiiif"] = Module["asm"]["Wh"]).apply(null, arguments);
};

var dynCall_viijii = Module["dynCall_viijii"] = function() {
 return (dynCall_viijii = Module["dynCall_viijii"] = Module["asm"]["Xh"]).apply(null, arguments);
};

var dynCall_fif = Module["dynCall_fif"] = function() {
 return (dynCall_fif = Module["dynCall_fif"] = Module["asm"]["Yh"]).apply(null, arguments);
};

var dynCall_fiifi = Module["dynCall_fiifi"] = function() {
 return (dynCall_fiifi = Module["dynCall_fiifi"] = Module["asm"]["Zh"]).apply(null, arguments);
};

var dynCall_jii = Module["dynCall_jii"] = function() {
 return (dynCall_jii = Module["dynCall_jii"] = Module["asm"]["_h"]).apply(null, arguments);
};

var dynCall_vijii = Module["dynCall_vijii"] = function() {
 return (dynCall_vijii = Module["dynCall_vijii"] = Module["asm"]["$h"]).apply(null, arguments);
};

var dynCall_viiiiff = Module["dynCall_viiiiff"] = function() {
 return (dynCall_viiiiff = Module["dynCall_viiiiff"] = Module["asm"]["ai"]).apply(null, arguments);
};

var dynCall_vffff = Module["dynCall_vffff"] = function() {
 return (dynCall_vffff = Module["dynCall_vffff"] = Module["asm"]["bi"]).apply(null, arguments);
};

var dynCall_vf = Module["dynCall_vf"] = function() {
 return (dynCall_vf = Module["dynCall_vf"] = Module["asm"]["ci"]).apply(null, arguments);
};

var dynCall_viiiiiiiiii = Module["dynCall_viiiiiiiiii"] = function() {
 return (dynCall_viiiiiiiiii = Module["dynCall_viiiiiiiiii"] = Module["asm"]["di"]).apply(null, arguments);
};

var dynCall_iiiij = Module["dynCall_iiiij"] = function() {
 return (dynCall_iiiij = Module["dynCall_iiiij"] = Module["asm"]["ei"]).apply(null, arguments);
};

var dynCall_viiij = Module["dynCall_viiij"] = function() {
 return (dynCall_viiij = Module["dynCall_viiij"] = Module["asm"]["fi"]).apply(null, arguments);
};

var dynCall_vij = Module["dynCall_vij"] = function() {
 return (dynCall_vij = Module["dynCall_vij"] = Module["asm"]["gi"]).apply(null, arguments);
};

var dynCall_iiiiiiiiiii = Module["dynCall_iiiiiiiiiii"] = function() {
 return (dynCall_iiiiiiiiiii = Module["dynCall_iiiiiiiiiii"] = Module["asm"]["hi"]).apply(null, arguments);
};

var dynCall_jiiii = Module["dynCall_jiiii"] = function() {
 return (dynCall_jiiii = Module["dynCall_jiiii"] = Module["asm"]["ii"]).apply(null, arguments);
};

var dynCall_jiiiiii = Module["dynCall_jiiiiii"] = function() {
 return (dynCall_jiiiiii = Module["dynCall_jiiiiii"] = Module["asm"]["ji"]).apply(null, arguments);
};

var dynCall_iijj = Module["dynCall_iijj"] = function() {
 return (dynCall_iijj = Module["dynCall_iijj"] = Module["asm"]["ki"]).apply(null, arguments);
};

var dynCall_iidiiii = Module["dynCall_iidiiii"] = function() {
 return (dynCall_iidiiii = Module["dynCall_iidiiii"] = Module["asm"]["li"]).apply(null, arguments);
};

var dynCall_jiji = Module["dynCall_jiji"] = function() {
 return (dynCall_jiji = Module["dynCall_jiji"] = Module["asm"]["mi"]).apply(null, arguments);
};

var dynCall_iiiiij = Module["dynCall_iiiiij"] = function() {
 return (dynCall_iiiiij = Module["dynCall_iiiiij"] = Module["asm"]["ni"]).apply(null, arguments);
};

var dynCall_iiiiid = Module["dynCall_iiiiid"] = function() {
 return (dynCall_iiiiid = Module["dynCall_iiiiid"] = Module["asm"]["oi"]).apply(null, arguments);
};

var dynCall_iiiiijj = Module["dynCall_iiiiijj"] = function() {
 return (dynCall_iiiiijj = Module["dynCall_iiiiijj"] = Module["asm"]["pi"]).apply(null, arguments);
};

var dynCall_iiiiiijj = Module["dynCall_iiiiiijj"] = function() {
 return (dynCall_iiiiiijj = Module["dynCall_iiiiiijj"] = Module["asm"]["qi"]).apply(null, arguments);
};

var dynCall_vff = Module["dynCall_vff"] = function() {
 return (dynCall_vff = Module["dynCall_vff"] = Module["asm"]["ri"]).apply(null, arguments);
};

var dynCall_vfi = Module["dynCall_vfi"] = function() {
 return (dynCall_vfi = Module["dynCall_vfi"] = Module["asm"]["si"]).apply(null, arguments);
};

function invoke_ii(index, a1) {
 var sp = stackSave();
 try {
  return dynCall_ii(index, a1);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0 && e !== "longjmp") throw e;
  _setThrew(1, 0);
 }
}

function invoke_iii(index, a1, a2) {
 var sp = stackSave();
 try {
  return dynCall_iii(index, a1, a2);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0 && e !== "longjmp") throw e;
  _setThrew(1, 0);
 }
}

function invoke_vii(index, a1, a2) {
 var sp = stackSave();
 try {
  dynCall_vii(index, a1, a2);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0 && e !== "longjmp") throw e;
  _setThrew(1, 0);
 }
}

function invoke_iiii(index, a1, a2, a3) {
 var sp = stackSave();
 try {
  return dynCall_iiii(index, a1, a2, a3);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0 && e !== "longjmp") throw e;
  _setThrew(1, 0);
 }
}

function invoke_vi(index, a1) {
 var sp = stackSave();
 try {
  dynCall_vi(index, a1);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0 && e !== "longjmp") throw e;
  _setThrew(1, 0);
 }
}

function invoke_viii(index, a1, a2, a3) {
 var sp = stackSave();
 try {
  dynCall_viii(index, a1, a2, a3);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0 && e !== "longjmp") throw e;
  _setThrew(1, 0);
 }
}

function invoke_iiiiii(index, a1, a2, a3, a4, a5) {
 var sp = stackSave();
 try {
  return dynCall_iiiiii(index, a1, a2, a3, a4, a5);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0 && e !== "longjmp") throw e;
  _setThrew(1, 0);
 }
}

function invoke_viiii(index, a1, a2, a3, a4) {
 var sp = stackSave();
 try {
  dynCall_viiii(index, a1, a2, a3, a4);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0 && e !== "longjmp") throw e;
  _setThrew(1, 0);
 }
}

function invoke_iiiiiii(index, a1, a2, a3, a4, a5, a6) {
 var sp = stackSave();
 try {
  return dynCall_iiiiiii(index, a1, a2, a3, a4, a5, a6);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0 && e !== "longjmp") throw e;
  _setThrew(1, 0);
 }
}

function invoke_viiiii(index, a1, a2, a3, a4, a5) {
 var sp = stackSave();
 try {
  dynCall_viiiii(index, a1, a2, a3, a4, a5);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0 && e !== "longjmp") throw e;
  _setThrew(1, 0);
 }
}

function invoke_iiiii(index, a1, a2, a3, a4) {
 var sp = stackSave();
 try {
  return dynCall_iiiii(index, a1, a2, a3, a4);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0 && e !== "longjmp") throw e;
  _setThrew(1, 0);
 }
}

function invoke_viiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
 var sp = stackSave();
 try {
  dynCall_viiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0 && e !== "longjmp") throw e;
  _setThrew(1, 0);
 }
}

function invoke_viiiiii(index, a1, a2, a3, a4, a5, a6) {
 var sp = stackSave();
 try {
  dynCall_viiiiii(index, a1, a2, a3, a4, a5, a6);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0 && e !== "longjmp") throw e;
  _setThrew(1, 0);
 }
}

function invoke_iiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
 var sp = stackSave();
 try {
  return dynCall_iiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0 && e !== "longjmp") throw e;
  _setThrew(1, 0);
 }
}

function invoke_v(index) {
 var sp = stackSave();
 try {
  dynCall_v(index);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0 && e !== "longjmp") throw e;
  _setThrew(1, 0);
 }
}

Module["asm"] = asm;

var calledRun;

function ExitStatus(status) {
 this.name = "ExitStatus";
 this.message = "Program terminated with exit(" + status + ")";
 this.status = status;
}

dependenciesFulfilled = function runCaller() {
 if (!calledRun) run();
 if (!calledRun) dependenciesFulfilled = runCaller;
};

function run(args) {
 args = args || arguments_;
 if (runDependencies > 0) {
  return;
 }
 preRun();
 if (runDependencies > 0) return;
 function doRun() {
  if (calledRun) return;
  calledRun = true;
  Module["calledRun"] = true;
  if (ABORT) return;
  initRuntime();
  preMain();
  readyPromiseResolve(Module);
  if (Module["onRuntimeInitialized"]) Module["onRuntimeInitialized"]();
  postRun();
 }
 if (Module["setStatus"]) {
  Module["setStatus"]("Running...");
  setTimeout(function() {
   setTimeout(function() {
    Module["setStatus"]("");
   }, 1);
   doRun();
  }, 1);
 } else {
  doRun();
 }
}

Module["run"] = run;

function exit(status, implicit) {
 if (implicit && noExitRuntime && status === 0) {
  return;
 }
 if (noExitRuntime) {} else {
  ABORT = true;
  EXITSTATUS = status;
  exitRuntime();
  if (Module["onExit"]) Module["onExit"](status);
 }
 quit_(status, new ExitStatus(status));
}

if (Module["preInit"]) {
 if (typeof Module["preInit"] == "function") Module["preInit"] = [ Module["preInit"] ];
 while (Module["preInit"].length > 0) {
  Module["preInit"].pop()();
 }
}

noExitRuntime = true;

run();


  return CanvasKitInit.ready
}
);
})();
if (typeof exports === 'object' && typeof module === 'object')
      module.exports = CanvasKitInit;
    else if (typeof define === 'function' && define['amd'])
      define([], function() { return CanvasKitInit; });
    else if (typeof exports === 'object')
      exports["CanvasKitInit"] = CanvasKitInit;
