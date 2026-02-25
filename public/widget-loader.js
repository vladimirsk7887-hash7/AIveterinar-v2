/**
 * AI-Ветеринар — Widget Embed Loader
 * Usage: <script src="https://vetai24.ru/widget-loader.js" data-slug="your-slug"></script>
 */
(function () {
  'use strict';

  var script = document.currentScript;
  if (!script) return;

  var slug = script.getAttribute('data-slug');
  if (!slug) {
    console.warn('[AI-Vet Widget] Missing data-slug attribute');
    return;
  }

  var host = script.src.replace(/\/widget-loader\.js.*$/, '');
  var isOpen = false;
  var isMobile = window.innerWidth <= 520;

  // ── Floating button ──
  var btn = document.createElement('div');
  btn.id = 'aivet-btn';
  btn.setAttribute('aria-label', 'Открыть AI-ветеринар');
  btn.style.cssText =
    'position:fixed;bottom:20px;right:20px;width:60px;height:60px;border-radius:50%;' +
    'background:linear-gradient(135deg,#7C4DFF,#448AFF);display:flex;align-items:center;' +
    'justify-content:center;cursor:pointer;font-size:28px;z-index:2147483646;' +
    'box-shadow:0 4px 24px rgba(124,77,255,0.45);transition:transform .25s,box-shadow .25s;' +
    'user-select:none;-webkit-tap-highlight-color:transparent;';

  var btnIcon = document.createElement('span');
  btnIcon.style.pointerEvents = 'none';
  btnIcon.textContent = '\uD83D\uDC3E'; // 🐾
  btn.appendChild(btnIcon);

  btn.onmouseenter = function () { if (!isOpen) btn.style.transform = 'scale(1.1)'; };
  btn.onmouseleave = function () { btn.style.transform = ''; };

  // ── Iframe container ──
  var wrap = document.createElement('div');
  wrap.id = 'aivet-wrap';
  if (isMobile) {
    wrap.style.cssText =
      'position:fixed;top:0;left:0;width:100%;height:100%;z-index:2147483647;display:none;';
  } else {
    wrap.style.cssText =
      'position:fixed;bottom:92px;right:20px;width:400px;height:620px;max-height:calc(100vh - 110px);' +
      'border-radius:16px;overflow:hidden;z-index:2147483647;display:none;' +
      'box-shadow:0 12px 48px rgba(0,0,0,0.35);';
  }

  var iframe = document.createElement('iframe');
  iframe.src = host + '/widget/' + encodeURIComponent(slug);
  iframe.style.cssText = 'width:100%;height:100%;border:none;background:#0B0E18;';
  iframe.setAttribute('allow', 'clipboard-write');
  iframe.setAttribute('loading', 'lazy');
  wrap.appendChild(iframe);

  // ── Toggle ──
  function toggle() {
    isOpen = !isOpen;
    wrap.style.display = isOpen ? 'block' : 'none';
    btnIcon.textContent = isOpen ? '\u2715' : '\uD83D\uDC3E'; // ✕ or 🐾
    btnIcon.style.fontSize = isOpen ? '22px' : '';
    btnIcon.style.color = isOpen ? '#fff' : '';
    btn.style.transform = '';
  }

  btn.onclick = toggle;

  // Close on Escape
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && isOpen) toggle();
  });

  // Listen for close message from widget iframe
  window.addEventListener('message', function (e) {
    if (e.data === 'aivet:close' && isOpen) toggle();
  });

  // ── Mount ──
  document.body.appendChild(wrap);
  document.body.appendChild(btn);
})();
