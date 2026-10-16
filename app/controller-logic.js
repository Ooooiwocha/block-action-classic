export function installController(root,send){
 root.innerHTML=`<button class="pad-toggle" aria-expanded="false">スマホ用コントローラを開く</button><section class="mobile-pad" hidden aria-label="ゲームコントローラ"><div class="pad-settings"><label>サイズ <output>100％</output><input class="pad-size" type="range" min="80" max="140" step="5" value="100" aria-label="コントローラのサイズ"></label><button class="pad-reset" type="button">標準に戻す</button><small>画面幅に収まる範囲で拡大します</small></div><div class="pad-grid"><button data-key="17" class="pad-ctrl" aria-pressed="false">Ctrl<br><small>OFF</small></button><button data-key="38" class="pad-up" aria-label="上">↑</button><button data-key="37" class="pad-left" aria-label="左">←</button><button data-key="32" class="pad-space">Space</button><button data-key="39" class="pad-right" aria-label="右">→</button><button data-key="40" class="pad-down" aria-label="下">↓</button></div><div class="pad-footer"><span>CtrlはタップでON／OFF<br>方向とSpaceは同時押し可能</span><button data-key="9" class="pad-tab">Tab<br><small>自爆</small></button></div></section>`;
 const panel=root.querySelector('section'),toggle=root.querySelector('.pad-toggle'),ctrl=root.querySelector('.pad-ctrl'),pointers=new Map(),held=new Set();let latched=false;
 const buttons=new Map([...root.querySelectorAll('[data-key]')].map(b=>[Number(b.dataset.key),b]));
 const suppressNative=e=>{if(e.target.closest?.('[data-key]')&&e.cancelable)e.preventDefault();};
 // Cancel native long-press selection/callouts without blocking the size slider.
 for(const type of ['touchstart','touchmove','touchend'])root.addEventListener(type,suppressNative,{passive:false});
 root.addEventListener('selectstart',suppressNative);
 const emit=(code,down)=>{if(down===held.has(code))return;down?held.add(code):held.delete(code);send(code,down);buttons.get(code).classList.toggle('pressed',down);};
 const latch=()=>{latched=!latched;emit(17,latched);ctrl.setAttribute('aria-pressed',String(latched));ctrl.querySelector('small').textContent=latched?'ON':'OFF';};
 const release=()=>{for(const code of [...held])emit(code,false);pointers.clear();latched=false;ctrl.setAttribute('aria-pressed','false');ctrl.querySelector('small').textContent='OFF';};
 const slider=root.querySelector('.pad-size'),output=root.querySelector('output'),reset=root.querySelector('.pad-reset');
 const storageKey='block-action-controller-size';
 const applySize=(value,save=false)=>{
  const n=Number(value),size=Number.isFinite(n)?Math.min(140,Math.max(80,n)):100;
  slider.value=String(size);output.textContent=size+'％';panel.style.setProperty('--requested-scale',String(size/100));
  if(save){release();try{localStorage.setItem(storageKey,String(size));}catch{}}
 };
 let stored=100;try{const value=localStorage.getItem(storageKey);if(value!==null)stored=Number(value);}catch{}
 applySize(stored);
 slider.oninput=()=>applySize(slider.value,true);reset.onclick=()=>applySize(100,true);
 const observer=new ResizeObserver(entries=>{const width=entries[0].borderBoxSize?.[0]?.inlineSize||panel.getBoundingClientRect().width;if(width>0)panel.style.setProperty('--pad-scale',String(width/350));});observer.observe(panel);
 toggle.onclick=()=>{panel.hidden=!panel.hidden;toggle.setAttribute('aria-expanded',String(!panel.hidden));toggle.textContent=panel.hidden?'スマホ用コントローラを開く':'コントローラを閉じる';if(panel.hidden)release();};
 for(const button of root.querySelectorAll('[data-key]')){
  const code=Number(button.dataset.key);
  button.onpointerdown=e=>{e.preventDefault();if(code===17)latch();else{pointers.set(e.pointerId,code);emit(code,true);}try{button.setPointerCapture(e.pointerId);}catch{}};
  const up=e=>{const key=pointers.get(e.pointerId);pointers.delete(e.pointerId);if(key&&!Array.from(pointers.values()).includes(key))emit(key,false);};
  button.onpointerup=up;button.onpointercancel=up;button.onlostpointercapture=up;
  button.onclick=e=>{if(e.detail===0){if(code===17)latch();else{emit(code,true);setTimeout(()=>emit(code,false),100);}}};
  button.oncontextmenu=e=>e.preventDefault();
 }
 // Focusing the game iframe also blurs the outer window; that is not leaving the page.
 const onBlur=()=>setTimeout(()=>{if(!document.hasFocus())release();},0),onVisibility=()=>{if(document.hidden)release();};window.addEventListener('blur',onBlur);document.addEventListener('visibilitychange',onVisibility);
 return {release,dispose(){release();observer.disconnect();for(const type of ['touchstart','touchmove','touchend','selectstart'])root.removeEventListener(type,suppressNative);window.removeEventListener('blur',onBlur);document.removeEventListener('visibilitychange',onVisibility);}};
}
