// Ruffle 0.6's canvas font renderer quotes each SWF font as a single family.
// Apply the device fallback inside its OffscreenCanvas font atlas, rather than
// page CSS (which cannot change SWF text). No font files are downloaded.
window.installGameFontFallback = function (platform) {
  if (!platform) {
    const apple = /iPhone|iPad|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    platform = apple ? 'ios' : /Android/.test(navigator.userAgent) ? 'android' : 'desktop';
  }
  if (platform !== 'ios' && platform !== 'android') return;
  const proto = window.OffscreenCanvasRenderingContext2D?.prototype;
  const font = proto && Object.getOwnPropertyDescriptor(proto, 'font');
  if (!font?.get || !font.set || !font.configurable || proto.__blockActionFonts) return;

  const japanese = platform === 'ios'
    ? '"Hiragino Sans", "Hiragino Kaku Gothic ProN", sans-serif' : 'sans-serif';
  const latin = platform === 'ios' ? '"Helvetica Neue", sans-serif' : 'sans-serif';
  // fontBoundingBox values measured in Windows Chrome at Ruffle's 64px atlas
  // size. Keep real glyph bounds and widths, adjusting only layout metrics.
  const profiles = {
    'ms ui gothic': [japanese, 55, 9],
    'ms pgothic': [japanese, 55, 9],
    'ms gothic': [japanese, 55, 9],
    'century gothic': [latin, 62, 14],
    'arial': [latin, 58, 14],
    'tahoma': [latin, 64, 13],
  };
  const contexts = new WeakMap();
  Object.defineProperty(proto, '__blockActionFonts', {value: true});
  Object.defineProperty(proto, 'font', {
    configurable: font.configurable,
    enumerable: font.enumerable,
    get: font.get,
    set(value) {
      const match = /^(.*?)([0-9.]+)px\s+["']?([^"']+?)["']?\s*$/.exec(String(value));
      const profile = match && profiles[match[3].toLowerCase()];
      if (!profile) {
        contexts.delete(this);
        font.set.call(this, value);
        return;
      }
      font.set.call(this, match[1] + match[2] + 'px ' + profile[0]);
      contexts.set(this, {css: font.get.call(this), size: Number(match[2]), profile});
    },
  });
  const measure = proto.measureText;
  proto.measureText = function (text) {
    const result = measure.call(this, text);
    const state = contexts.get(this);
    // Canvas resizing resets state; only apply while the matching font is active.
    if (state && font.get.call(this) === state.css) {
      Object.defineProperties(result, {
        fontBoundingBoxAscent: {value: state.profile[1] * state.size / 64},
        fontBoundingBoxDescent: {value: state.profile[2] * state.size / 64},
      });
    }
    return result;
  };
};
window.installGameFontFallback();
