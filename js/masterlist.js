/* Masterlist: loads data/audios.json, renders cloud cards, search, sort, category pills. */
(function () {
  'use strict';
  const C = window.SITE_CONFIG, U = window.SiteUtil, UI = window.SiteUI;
  const $ = id => document.getElementById(id);
  const grid = $('grid'), pills = $('pills'), count = $('count'), search = $('search'), sortSel = $('sort');
  $('tagline').textContent = C.tagline;

  const catLabel = Object.fromEntries(C.categories.map(c => [c.slug, c.label]));
  const slugOf = s => { const n = U.norm(s); const hit = C.categories.find(c => U.norm(c.slug) === n || U.norm(c.label) === n); return hit ? hit.slug : null; };

  let items = [];
  const params = new URLSearchParams(location.search);
  const state = { cat: slugOf(params.get('category')) || '', q: params.get('q') || '', sort: ['new', 'old', 'az'].includes(params.get('sort')) ? params.get('sort') : 'new' };
  search.value = state.q; sortSel.value = state.sort;

  function normalise(raw, i) {
    const cats = (Array.isArray(raw.categories) ? raw.categories : []).map(slugOf).filter(Boolean);
    return {
      id: raw.id != null ? raw.id : i + 1,
      title: raw.title || 'Untitled',
      tags: Array.isArray(raw.tags) ? raw.tags : [],
      contentTags: Array.isArray(raw.contentTags) ? raw.contentTags.filter(Boolean) : [],
      categories: [...new Set(cats)],
      synopsis: raw.synopsis || '',
      image: raw.image || '', artist: raw.artist || '', artistLink: U.safeUrl(raw.artistLink),
      date: raw.date || '', length: raw.length || '',
      writer: raw.writer || '', collabs: Array.isArray(raw.collabs) ? raw.collabs.filter(Boolean) : [],
      links: raw.links || {}
    };
  }
  const haystack = it => U.norm([it.title, it.tags.join(' '), it.contentTags.join(' '), it.synopsis, it.writer, it.collabs.join(' '), it.categories.map(c => catLabel[c]).join(' ')].join(' '));
  const matchesQ = it => !state.q || U.norm(state.q).split('').length === 0 || state.q.split(/\s+/).filter(Boolean).every(w => haystack(it).includes(U.norm(w)));
  const fmtDate = d => { if (!d) return ''; const x = new Date(d + 'T00:00:00'); return isNaN(x) ? d : x.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }); };

  function visible() {
    const list = items.filter(it => (!state.cat || it.categories.includes(state.cat)) && matchesQ(it));
    const by = { new: (a, b) => (b.date || '').localeCompare(a.date || ''), old: (a, b) => (a.date || '').localeCompare(b.date || ''), az: (a, b) => a.title.localeCompare(b.title) };
    return list.sort(by[state.sort]);
  }

  function renderPills() {
    const base = items.filter(matchesQ);
    const mk = (slug, label, n) => `<li><button type="button" class="pill" data-cat="${slug}" aria-pressed="${state.cat === slug}">${U.esc(label)} <span class="n">${n}</span></button></li>`;
    pills.innerHTML = mk('', 'All', base.length) + C.categories.map(c => mk(c.slug, c.label, base.filter(i => i.categories.includes(c.slug)).length)).join('');
  }

  function cardHTML(it) {
    const aud = it.tags.map(t => `<li><span class="chip aud">${U.esc(t)}</span></li>`).join('');
    const cats = it.categories.map(c => `<li><button type="button" class="chip" data-cat="${c}" aria-label="Filter by ${U.esc(catLabel[c])}">${U.esc(catLabel[c])}</button></li>`).join('');
    const L = it.links, btn = (u, label, primary) => U.safeUrl(u) ? `<a class="btn small${primary ? '' : ' ghost'}" href="${U.esc(u)}" data-ext rel="noopener noreferrer">${label}<span class="sr-only"> (opens in new tab)</span></a>` : '';
    const links = btn(L.audio, '▶ Listen', true) + btn(L.reddit, 'Reddit') + btn(L.script, 'Script') + btn(L.patreon, 'Patreon');
    const meta = [fmtDate(it.date), it.length].filter(Boolean).map(m => `<span>${U.esc(m)}</span>`).join('');
    const person = n => /^u\/[\w-]+$/.test(n) ? `<a href="https://www.reddit.com/user/${U.esc(n.slice(2))}" data-ext rel="noopener noreferrer">${U.esc(n)}</a>` : U.esc(n);
    const credits = [it.writer ? `Written by ${person(it.writer)}` : '', it.collabs.length ? `With ${it.collabs.map(person).join(', ')}` : ''].filter(Boolean).map(m => `<span>${m}</span>`).join('');
    const ctags = it.contentTags.length ? `<details class="tagbox"><summary>Tags <span class="n">${it.contentTags.length}</span></summary><ul class="chips">${it.contentTags.map(t => `<li><button type="button" class="chip tag" data-tag="${U.esc(t)}" aria-label="Search for ${U.esc(t)}">${U.esc(t)}</button></li>`).join('')}</ul></details>` : '';
    return `<div class="card-wrap"><article class="card" aria-labelledby="t-${it.id}">
      <i class="p p1"></i><i class="p p2"></i><i class="p p3"></i><i class="p p4"></i><i class="p p5"></i>
      ${C.showCardArt ? UI.imageBox({ src: it.image, alt: '', key: 'a' + it.id, credit: it.artist, creditUrl: it.artistLink }) : ''}
      <h2 id="t-${it.id}">${U.esc(it.title)}</h2>
      ${meta ? `<div class="meta">${meta}</div>` : ''}
      ${credits ? `<div class="meta">${credits}</div>` : ''}
      ${aud || cats ? `<ul class="chips">${aud}${cats}</ul>` : ''}
      ${it.synopsis ? `<p class="synopsis">${U.esc(it.synopsis)}</p><button type="button" class="more" aria-expanded="false" hidden>Read more</button>` : ''}
      ${ctags}
      ${links ? `<div class="links">${links}</div>` : ''}
    </article></div>`;
  }

  function render() {
    renderPills();
    const list = visible();
    grid.innerHTML = list.length ? list.map(cardHTML).join('') : items.length ? '<p class="empty">Nothing found up here. Try a different word or category.</p>' : '<p class="empty">No audios yet. Check back soon!</p>';
    const label = state.cat ? ` in ${catLabel[state.cat]}` : '';
    count.textContent = `Showing ${list.length} of ${items.length} audios${label}`;
    // only offer "Read more" where the summary is actually clamped
    requestAnimationFrame(() => grid.querySelectorAll('.synopsis').forEach(p => { const b = p.nextElementSibling; if (b && b.classList.contains('more') && p.scrollHeight > p.clientHeight + 2) b.hidden = false; }));
    const q = new URLSearchParams();
    if (state.cat) q.set('category', state.cat); if (state.q) q.set('q', state.q); if (state.sort !== 'new') q.set('sort', state.sort);
    history.replaceState(null, '', location.pathname + (q.toString() ? '?' + q : ''));
  }

  document.addEventListener('click', e => {
    const c = e.target.closest('[data-cat]');
    if (c) { state.cat = state.cat === c.dataset.cat ? '' : c.dataset.cat; render(); if (c.closest('.card')) window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    const tg = e.target.closest('[data-tag]');
    if (tg) { search.value = tg.dataset.tag; state.q = tg.dataset.tag; state.cat = ''; render(); window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    const m = e.target.closest('.more');
    if (m) { const p = m.previousElementSibling, open = p.classList.toggle('open'); m.textContent = open ? 'Show less' : 'Read more'; m.setAttribute('aria-expanded', String(open)); }
  });
  let t; search.addEventListener('input', () => { clearTimeout(t); t = setTimeout(() => { state.q = search.value.trim(); render(); }, 150); });
  sortSel.addEventListener('change', () => { state.sort = sortSel.value; render(); });

  U.loadData('audios')
    .then(list => { items = list.map(normalise); render(); })
    .catch(() => { grid.innerHTML = '<p class="empty">Couldn’t load the masterlist right now. Please try again in a moment.</p>'; });
})();
