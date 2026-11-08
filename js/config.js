/* ==========================================================================
   ArchangelsBabe — site config
   Single source of truth for: site name, nav tabs, categories, Discord info.
   Edit ONLY here to add/remove/reorder tabs or categories.
   Wording on the Discord page is general; replace it with her exact process.
   ========================================================================== */

window.SITE_CONFIG = {
  siteName: 'ArchangelsBabe',
  tagline: 'Sinning was Never so Sweet...',
  exitUrl: 'https://www.google.com',
  useApi: false,         // false = never call /api (front-end-only demo, reads data/*.json)
  showCardArt: false,   // true = show cover art + artist credit on Masterlist cards (hidden for now)
  credit: { text: 'Site by Isapeth', url: 'https://www.reddit.com/user/Isapeth' },

  /* Nav tabs, in order. `href` starting with http = external link.
     Internal pages: index.html (Masterlist), art.html, discord.html */
  nav: [
    { label: 'Masterlist',  href: 'index.html',   page: 'masterlist' },
    { label: 'Art Gallery', href: 'art.html',     page: 'gallery' },
    { label: 'Discord',     href: 'discord.html', page: 'discord' },
    { label: 'Reddit',      href: 'https://www.reddit.com/user/ArchangelsBabe' },
    { label: 'HotAudio',    href: 'https://hotaudio.net/u/ArchangelsBabe' }
  ],


  /* Keep this list short. Order here = order of the pills. */
  categories: [
    { slug: 'gfe',       label: 'GFE' },
    { slug: 'bestie',    label: 'Bestie' },
    { slug: 'casualsex', label: 'Casual Sex' },
    { slug: 'fantasy',   label: 'Fantasy' },
    { slug: 'dark',      label: 'Dark' },
    { slug: 'collab',    label: 'Collab' },
    { slug: 'roommate',  label: 'Roommate' },
    { slug: 'scifi',     label: 'Sci-Fi' },
    { slug: 'narrative', label: 'Narrative' },
    { slug: 'mommydom',  label: 'MommyDom' }
  ],


  /* Discord info page. All wording is placeholder — replace with her real process. */
  discord: {
    inviteLabel: 'Get Your Invite',
    inviteUrl: '',   // add the signup link here; the button stays hidden until there is one
    intro: 'The Discord is where the community lives: early looks, polls, chatting, and a place to hang out with other listeners.',
    whyGated: 'Access is behind a small paywall on purpose. It keeps minors and bots out and keeps the space safe and friendly for everyone inside.',
    steps: [
      { title: 'Be 18 or older', body: 'This is an adults-only space. Everyone in the server is 18+.' },
      { title: 'Join on Patreon', body: 'Choose the paid tier that includes Discord access.' },
      { title: 'Link your Discord', body: 'In your Patreon settings, connect your Discord account.' },
      { title: 'Get your role', body: 'Your role is added automatically after linking, and the member channels unlock.' }
    ],
    faq: [
      { q: 'I linked my account but nothing unlocked.', a: 'Give it a few minutes, then disconnect and reconnect Discord in your Patreon settings.' },
      { q: 'Is there a free way in?', a: 'No. The paywall is the age and bot check.' },
      { q: 'Can I cancel any time?', a: 'Yes. Your access ends when your membership does.' }
    ]
  }
};

/* ---- helpers shared by pages ---- */
window.SiteUtil = {
  norm: s => String(s == null ? '' : s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ''),
  esc: s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])),
  safeUrl: u => /^https?:\/\//i.test(u || '') ? u : '',
  /* Loads a list from the API. Only a 404 (plain static server, no API) falls back to data/<name>.json; real API errors surface. */
  async loadData(name) {
    const useApi = !window.SITE_CONFIG || window.SITE_CONFIG.useApi !== false;
    const r = useApi ? await fetch('/api/' + name, { cache: 'no-store' }).catch(() => null) : null;
    if (r && r.ok) { const j = await r.json(); if (Array.isArray(j)) return j; }
    else if (r && r.status !== 404) throw new Error('API ' + r.status);
    const f = await fetch('data/' + name + '.json?v=' + Date.now());
    if (!f.ok) throw new Error(f.status);
    const j = await f.json();
    return Array.isArray(j) ? j : (j[name] || []);
  },
  /* Soft cloud-gradient placeholder so the site looks finished before real art exists */
  placeholder(seed, w = 640, h = 480) {
    let n = 0; for (const c of String(seed)) n = (n * 31 + c.charCodeAt(0)) >>> 0;
    const pal = [['#bfe0fb', '#fde0ec'], ['#fde0ec', '#fff1bd'], ['#fff1bd', '#bfe0fb'], ['#d8e6ff', '#ffe6f0']];
    const [a, b] = pal[n % pal.length];
    const x = 80 + (n % 400), y = 90 + ((n >> 3) % 200);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="${w}" height="${h}" fill="url(#g)"/><g fill="#fff" opacity=".85"><circle cx="${x}" cy="${y + 90}" r="60"/><circle cx="${x + 70}" cy="${y + 60}" r="80"/><circle cx="${x + 160}" cy="${y + 95}" r="55"/><rect x="${x - 40}" y="${y + 90}" width="260" height="60" rx="30"/></g><ellipse cx="${w - 120}" cy="70" rx="46" ry="12" fill="none" stroke="#e0b440" stroke-width="7" opacity=".9"/></svg>`;
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
  }
};
