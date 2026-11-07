/* Art gallery: masonry of art pieces, artist filter, lightbox with prev/next. */
(function () {
  'use strict';
  const U = window.SiteUtil, UI = window.SiteUI;
  const $ = id => document.getElementById(id);
  const gal = $('gallery'), pills = $('pills'), count = $('count'), dlg = $('lightbox');
  let items = [], artist = '', shown = [], cur = -1, lastFocus = null;

  const normalise = (r, i) => ({
    id: r.id != null ? r.id : i + 1, title: r.title || 'Untitled', artist: r.artist || '',
    artistLink: U.safeUrl(r.artistLink), image: r.image || '', date: r.date || '',
    audio: r.audio || '' /* optional: title of the audio this art belongs to */, note: r.note || ''
  });

  function render() {
    const artists = [...new Set(items.map(i => i.artist).filter(Boolean))].sort((a, b) => a.localeCompare(b));
    const mk = (val, label, n) => `<li><button type="button" class="pill" data-artist="${U.esc(val)}" aria-pressed="${artist === val}">${U.esc(label)} <span class="n">${n}</span></button></li>`;
    pills.innerHTML = mk('', 'All', items.length) + artists.map(a => mk(a, a, items.filter(i => i.artist === a).length)).join('');

    shown = items.filter(i => !artist || i.artist === artist);
    gal.innerHTML = shown.length ? shown.map((it, idx) => {
      const open = `<button type="button" class="art-open" data-idx="${idx}" aria-label="View ${U.esc(it.title)} larger"></button>`;
      return `<figure class="art"><div class="art-inner"><i class="p p1"></i><i class="p p2"></i><i class="p p3"></i><i class="p p4"></i><i class="p p5"></i>
        ${UI.imageBox({ src: it.image, alt: it.title, key: 'art' + it.id, inner: open })}
        <figcaption class="art-cap"><b>${U.esc(it.title)}</b>
          ${it.artist ? (it.artistLink ? `by <a href="${U.esc(it.artistLink)}" data-ext rel="noopener noreferrer">${U.esc(it.artist)}</a>` : `by ${U.esc(it.artist)}`) : ''}
          ${it.audio ? `<br><a href="index.html?q=${encodeURIComponent(it.audio)}">Listen: ${U.esc(it.audio)}</a>` : ''}
        </figcaption></div></figure>`;
    }).join('') : '<p class="empty">No art here yet.</p>';
    count.textContent = `${shown.length} piece${shown.length === 1 ? '' : 's'}${artist ? ' by ' + artist : ''}`;
  }

  function show(i) {
    if (!shown.length) return;
    cur = (i + shown.length) % shown.length;
    const it = shown[cur];
    const img = $('lbImg');
    img.dataset.fallback = U.placeholder('art' + it.id, 900, 700);
    img.src = U.safeUrl(it.image) || (it.image && !/^\s*(javascript|data):/i.test(it.image) ? it.image : img.dataset.fallback);
    img.alt = it.title + (it.artist ? ' by ' + it.artist : '');
    $('lbCap').innerHTML = `<b>${U.esc(it.title)}</b>${it.artist ? ' · ' + U.esc(it.artist) : ''}${it.note ? `<br><small>${U.esc(it.note)}</small>` : ''}`;
  }

  document.addEventListener('click', e => {
    const p = e.target.closest('[data-artist]');
    if (p) { artist = p.dataset.artist; render(); return; }
    const o = e.target.closest('.art-open');
    if (o) { lastFocus = o; show(+o.dataset.idx); UI.reveal('art' + shown[cur].id); dlg.showModal(); return; }
    if (e.target === dlg) dlg.close(); // click on backdrop
  });
  $('lbPrev').addEventListener('click', () => show(cur - 1));
  $('lbNext').addEventListener('click', () => show(cur + 1));
  $('lbClose').addEventListener('click', () => dlg.close());
  dlg.addEventListener('close', () => { if (lastFocus) lastFocus.focus({ preventScroll: true }); });
  dlg.addEventListener('keydown', e => { if (e.key === 'ArrowLeft') show(cur - 1); if (e.key === 'ArrowRight') show(cur + 1); });

  U.loadData('art')
    .then(list => { items = list.map(normalise); render(); })
    .catch(() => { gal.innerHTML = '<p class="empty">Couldn’t load the gallery right now. Please try again in a moment.</p>'; });
})();
