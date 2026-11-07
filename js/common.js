/* ==========================================================================
   Shared behaviour for every page: header/nav, clouds, Options panel
   (accessibility), age gate, image spoilers, external-link handling.
   ========================================================================== */
(function () {
  'use strict';
  const C = window.SITE_CONFIG, U = window.SiteUtil;
  const root = document.documentElement;

  /* ---------- safe storage ---------- */
  const store = {
    get(k, area = 'local') { try { return window[area + 'Storage'].getItem(k); } catch (e) { return null; } },
    set(k, v, area = 'local') { try { window[area + 'Storage'].setItem(k, v); } catch (e) { /* private mode */ } }
  };

  /* ---------- preferences (Options panel) ---------- */
  const PREF_KEY = 'abPrefs';
  const DEFAULTS = { font: 'default', zoom: 100, reduceMotion: false, highContrast: false, blurImages: true };
  let prefs = Object.assign({}, DEFAULTS);
  try { Object.assign(prefs, JSON.parse(store.get(PREF_KEY) || '{}')); } catch (e) { /* ignore */ }
  if (store.get(PREF_KEY) === null && window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) prefs.reduceMotion = true;

  function applyPrefs() {
    root.classList.remove('font-atkinson', 'font-dyslexic');
    if (prefs.font === 'atkinson') root.classList.add('font-atkinson');
    if (prefs.font === 'dyslexic') root.classList.add('font-dyslexic');
    root.style.fontSize = prefs.zoom + '%';
    root.classList.toggle('reduce-motion', !!prefs.reduceMotion);
    root.classList.toggle('hc', !!prefs.highContrast);
    root.classList.toggle('no-spoiler', !prefs.blurImages);
  }
  function savePrefs() { store.set(PREF_KEY, JSON.stringify(prefs)); applyPrefs(); }
  applyPrefs();

  /* ---------- header + nav ---------- */
  function buildHeader() {
    const page = document.body.dataset.page || '';
    const links = C.nav.map(n => {
      const ext = /^https?:/i.test(n.href);
      const cur = !ext && n.page === page ? ' aria-current="page"' : '';
      return `<li><a href="${U.esc(n.href)}"${cur}${ext ? ' data-ext rel="noopener noreferrer"' : ''}>${U.esc(n.label)}${ext ? ' <span class="ext" aria-hidden="true">↗</span><span class="sr-only">(opens in new tab)</span>' : ''}</a></li>`;
    }).join('');
    const hdr = document.getElementById('siteHeader');
    if (!hdr) return;
    hdr.innerHTML = `
      <div class="header-inner">
        <a class="brand" href="index.html">${U.esc(C.siteName)}</a>
        <div class="opt-wrap">
          <button class="btn ghost small" id="optBtn" type="button" aria-expanded="false" aria-controls="optPanel">⚙ Options</button>
          <div class="options-panel" id="optPanel" role="group" aria-label="Accessibility and display options" hidden>
            <h2>Options</h2>
            <fieldset>
              <legend>Font</legend>
              <div class="seg" id="optFont">
                <button type="button" data-font="default">Default</button>
                <button type="button" data-font="atkinson">Atkinson</button>
                <button type="button" data-font="dyslexic">OpenDyslexic</button>
              </div>
            </fieldset>
            <div class="lbl" id="zoomLbl">Text size: <span id="zoomVal"></span></div>
            <div class="opt-row"><input type="range" id="optZoom" min="85" max="160" step="5" aria-labelledby="zoomLbl"></div>
            <div class="opt-row"><label for="optMotion">Reduce motion (stop drifting clouds)</label><input type="checkbox" id="optMotion"></div>
            <div class="opt-row"><label for="optHC">High contrast</label><input type="checkbox" id="optHC"></div>
            <div class="opt-row"><label for="optBlur">Blur images until clicked</label><input type="checkbox" id="optBlur"></div>
            <button type="button" class="btn small" id="optReset" style="margin-top:8px">Reset to defaults</button>
          </div>
        </div>
        <nav class="main-nav" aria-label="Main"><ul>${links}</ul></nav>
      </div>`;

    const btn = document.getElementById('optBtn'), panel = document.getElementById('optPanel');
    const sync = () => {
      document.querySelectorAll('#optFont button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.font === prefs.font)));
      document.getElementById('optZoom').value = prefs.zoom;
      document.getElementById('zoomVal').textContent = prefs.zoom + '%';
      document.getElementById('optMotion').checked = prefs.reduceMotion;
      document.getElementById('optHC').checked = prefs.highContrast;
      document.getElementById('optBlur').checked = prefs.blurImages;
    };
    const setOpen = open => { panel.hidden = !open; btn.setAttribute('aria-expanded', String(open)); };
    btn.addEventListener('click', () => setOpen(panel.hidden));
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && !panel.hidden) { setOpen(false); btn.focus(); } });
    document.addEventListener('click', e => { if (!panel.hidden && !e.target.closest('.opt-wrap')) setOpen(false); });
    document.getElementById('optFont').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; prefs.font = b.dataset.font; savePrefs(); sync(); });
    document.getElementById('optZoom').addEventListener('input', e => { prefs.zoom = +e.target.value; savePrefs(); sync(); });
    document.getElementById('optMotion').addEventListener('change', e => { prefs.reduceMotion = e.target.checked; savePrefs(); });
    document.getElementById('optHC').addEventListener('change', e => { prefs.highContrast = e.target.checked; savePrefs(); });
    document.getElementById('optBlur').addEventListener('change', e => { prefs.blurImages = e.target.checked; savePrefs(); });
    document.getElementById('optReset').addEventListener('click', () => { prefs = Object.assign({}, DEFAULTS); savePrefs(); sync(); });
    sync();
  }

  function buildFooter() {
    const f = document.getElementById('siteFooter');
    if (!f) return;
    f.innerHTML = `<p>© ${new Date().getFullYear()} ${U.esc(C.siteName)} · 18+ only` +
      (C.credit ? ` · <a href="${U.esc(C.credit.url)}" data-ext rel="noopener noreferrer">${U.esc(C.credit.text)}</a>` : '') + `</p>`;
  }

  /* ---------- clouds ---------- */
  function buildSky() {
    const sky = document.getElementById('sky');
    if (!sky) return;
    // [top %, font-size px, opacity, duration s, delay s, static x offset vw]
    const defs = [[6, 18, .8, 150, -20, 10], [18, 26, .6, 190, -110, 55], [34, 14, .7, 130, -60, 78], [48, 30, .5, 220, -150, 25],
                  [62, 20, .75, 160, -90, 62], [76, 24, .6, 200, -30, 8], [88, 16, .7, 140, -120, 40], [26, 12, .55, 110, -70, 92]];
    sky.innerHTML = defs.map(d => `<div class="cloud" style="top:${d[0]}%;font-size:${d[1]}px;--op:${d[2]};--dur:${d[3]}s;--delay:${d[4]}s;--xs:${d[5]}vw"></div>`).join('');
  }

  /* ---------- image spoilers ---------- */
  const REV_KEY = 'revealedImages';
  let revealed = new Set();
  try { revealed = new Set(JSON.parse(store.get(REV_KEY, 'session') || '[]')); } catch (e) { /* ignore */ }
  const saveRevealed = () => store.set(REV_KEY, JSON.stringify([...revealed]), 'session');

  window.SiteUI = {
    isRevealed: key => revealed.has(key),
    reveal(key) { revealed.add(key); saveRevealed(); document.querySelectorAll('.imgbox').forEach(b => { if (b.dataset.key === key) b.classList.add('revealed'); }); },
    /* Returns markup for an image that is blurred until clicked. `inner` is extra markup placed inside (e.g. an open button). */
    imageBox({ src, alt, key, credit, creditUrl, inner = '' }) {
      const on = revealed.has(key) ? ' revealed' : '';
      const url = U.safeUrl(src) || (src && !/^\s*(javascript|data):/i.test(src) ? src : '');
      const fb = U.placeholder(key);
      const cr = credit ? (creditUrl ? `<a class="credit" href="${U.esc(creditUrl)}" data-ext rel="noopener noreferrer">Art: ${U.esc(credit)}</a>` : `<span class="credit">Art: ${U.esc(credit)}</span>`) : '';
      return `<div class="imgbox${on}" data-key="${U.esc(key)}">
        <img src="${U.esc(url || fb)}" data-fallback="${U.esc(fb)}" alt="${U.esc(alt || '')}" loading="lazy" decoding="async">
        ${inner}${cr}
        <button type="button" class="veil" aria-label="Spoilered image. Click to reveal"><span>Spoilered</span><small>Click to reveal</small></button>
        <button type="button" class="rehide" aria-label="Hide image again">Hide</button>
      </div>`;
    }
  };

  document.addEventListener('click', e => {
    const v = e.target.closest('.veil');
    if (v) { const b = v.closest('.imgbox'); window.SiteUI.reveal(b.dataset.key); const open = b.querySelector('.art-open,.rehide'); if (open) open.focus({ preventScroll: true }); return; }
    const r = e.target.closest('.rehide');
    if (r) { const b = r.closest('.imgbox'); revealed.delete(b.dataset.key); saveRevealed(); document.querySelectorAll('.imgbox').forEach(x => { if (x.dataset.key === b.dataset.key) x.classList.remove('revealed'); }); return; }
    // external links: window.open is more reliable than bare anchors on iOS inside card grids
    const a = e.target.closest('a[data-ext]');
    if (a && !(e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1)) {
      e.preventDefault();
      const w = window.open(a.href, '_blank', 'noopener,noreferrer');
      if (!w) location.href = a.href;
    }
  });
  document.addEventListener('error', e => {
    const t = e.target;
    if (t && t.tagName === 'IMG' && t.dataset.fallback && t.src !== t.dataset.fallback) t.src = t.dataset.fallback;
  }, true);

  /* ---------- age gate ---------- */
  function buildAgeGate() {
    if (!root.classList.contains('age-locked')) return;
    const gate = document.createElement('div');
    gate.className = 'age-gate';
    gate.innerHTML = `<div class="age-box" role="dialog" aria-modal="true" aria-labelledby="ageTitle" aria-describedby="ageText">
      <span class="halo" aria-hidden="true"></span>
      <h2 id="ageTitle">Adults only</h2>
      <p id="ageText">${U.esc(C.siteName)} contains adult audio content. You must be 18 or older to enter.</p>
      <div class="age-actions">
        <button type="button" class="btn" id="ageYes">I am 18 or older</button>
        <button type="button" class="btn ghost" id="ageNo">Take me back</button>
      </div></div>`;
    document.body.appendChild(gate);
    const yes = gate.querySelector('#ageYes'), no = gate.querySelector('#ageNo');
    yes.focus();
    gate.addEventListener('keydown', e => { // focus trap
      if (e.key !== 'Tab') return;
      const first = yes, last = no;
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
    yes.addEventListener('click', () => { store.set('ageVerified', 'true'); root.classList.remove('age-locked'); gate.remove(); });
    no.addEventListener('click', () => { location.href = C.exitUrl; });
  }

  /* ---------- go ---------- */
  document.title = document.title || C.siteName;
  buildSky();
  buildHeader();
  buildFooter();
  buildAgeGate();
})();
