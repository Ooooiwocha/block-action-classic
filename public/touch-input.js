// Ruffle reads offsetX/Y in canvas CSS pixels, then applies devicePixelRatio.
// Derive these from the canvas itself: synthetic events and shadow-DOM
// retargeting must not choose a different coordinate origin.
window.installGameTouchInput = function (player) {
  function prepare(event) {
    if (!event.isPrimary || !['touch', 'pen'].includes(event.pointerType)) return;
    const canvas = event.composedPath().find(node => node instanceof HTMLCanvasElement);
    if (!canvas || !player.shadowRoot?.contains(canvas)) return;
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    Object.defineProperties(event, {
      offsetX: {configurable: true, value: (event.clientX - rect.left) * canvas.clientWidth / rect.width},
      offsetY: {configurable: true, value: (event.clientY - rect.top) * canvas.clientHeight / rect.height},
    });
    return canvas;
  }

  // Normalize movement and release in the same coordinate system as the press.
  player.addEventListener('pointermove', prepare, {capture: true});
  player.addEventListener('pointerup', prepare, {capture: true});
  player.addEventListener('pointerdown', function (event) {
    const canvas = prepare(event);
    if (!canvas) return;
    // Flash buttons install press handlers after rollOver. Prime that state
    // without replacing the trusted press or losing browser user activation.
    const hover = new PointerEvent('pointermove', {
      bubbles: true,
      composed: true,
      pointerId: event.pointerId,
      pointerType: event.pointerType,
      isPrimary: true,
      clientX: event.clientX,
      clientY: event.clientY,
      screenX: event.screenX,
      screenY: event.screenY,
      button: -1,
      buttons: 0,
      width: event.width,
      height: event.height,
      pressure: 0,
    });
    Object.defineProperties(hover, {
      offsetX: {configurable: true, value: event.offsetX},
      offsetY: {configurable: true, value: event.offsetY},
    });
    canvas.dispatchEvent(hover);
  }, {capture: true});
};
