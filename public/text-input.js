// Ruffle 0.6 clears its hidden input on every input event and forwards raw
// keydown/paste globally. Keep native IME composition intact until commit.
window.installGameTextInput = function (player) {
  const preview = document.createElement('div');
  preview.id = 'game-composition-preview';
  preview.hidden = true;
  preview.setAttribute('role', 'status');
  preview.style.cssText = 'position:fixed;z-index:10000;top:8px;right:8px;width:max-content;max-width:calc(50% - 16px);text-align:left;box-sizing:border-box;padding:10px 12px;border:1px solid #ffbd45;border-radius:6px;background:#20252bf5;color:#fff;font:16px/1.5 sans-serif;box-shadow:0 3px 12px #0005;pointer-events:none;overflow-wrap:anywhere;white-space:pre-wrap';
  const label = document.createElement('span');
  label.textContent = '変換中 ';
  label.style.cssText = 'color:#ffbd45;font-size:12px;margin-right:8px';
  const value = document.createElement('span');
  preview.append(label, value);
  document.body.appendChild(preview);
  function showPreview(text) {
    value.textContent = text;
    preview.hidden = !text;
  }
  let composing = false;
  let generation = 0;
  const keyboard = event => event.composedPath().find(node =>
    node instanceof HTMLInputElement && node.id === 'virtual-keyboard' &&
    player.shadowRoot?.contains(node));
  function key(value) {
    for (const type of ['keydown', 'keyup']) {
      player.dispatchEvent(new KeyboardEvent(type, {key: value, bubbles: true, composed: true}));
    }
  }
  function commit(input) {
    showPreview('');
    const text = input.value;
    input.value = '';
    for (const character of text) key(character);
  }
  player.addEventListener('compositionstart', event => {
    if (!keyboard(event)) return;
    composing = true;
    generation++;
    showPreview('');
  }, {capture: true});
  player.addEventListener('compositionupdate', event => {
    if (keyboard(event)) showPreview(event.data || '');
  }, {capture: true});
  player.addEventListener('compositionend', event => {
    const input = keyboard(event);
    if (!input) return;
    composing = false;
    showPreview('');
    const token = ++generation;
    // Browsers differ on whether the final input precedes or follows this event.
    queueMicrotask(() => {
      if (token === generation && !composing && player.shadowRoot.activeElement === input) commit(input);
    });
  }, {capture: true});
  player.addEventListener('input', event => {
    const input = keyboard(event);
    if (!input) return;
    event.stopImmediatePropagation();
    if (composing || event.isComposing) {
      showPreview(input.value);
      return;
    }
    commit(input);
  }, {capture: true});
  player.addEventListener('paste', event => {
    if (!keyboard(event)) return;
    // Let the browser insert clipboard text; the input handler commits it once.
    // Do not let Ruffle's window paste listener also consume the same text.
    event.stopPropagation();
  }, {capture: true});
  for (const type of ['keydown', 'keyup']) {
    player.addEventListener(type, event => {
      if (!keyboard(event)) return;
      const printable = Array.from(event.key).length === 1 && !event.ctrlKey && !event.metaKey;
      if (composing || event.isComposing || event.keyCode === 229 || printable) {
        // Keep browser default behavior, preventing Ruffle from cancelling IME
        // keystrokes or inserting the same character again via keydown.
        event.stopPropagation();
      }
    }, {capture: true});
  }
  player.addEventListener('beforeinput', event => {
    if (!keyboard(event) || composing || event.isComposing) return;
    if (event.inputType === 'deleteContentBackward' || event.inputType === 'deleteContentForward') {
      event.preventDefault();
      event.stopPropagation();
      key(event.inputType === 'deleteContentBackward' ? 'Backspace' : 'Delete');
    }
  }, {capture: true});
  player.addEventListener('focusout', event => {
    const input = keyboard(event);
    if (!input) return;
    generation++;
    composing = false;
    input.value = '';
    showPreview('');
  }, {capture: true});
};
