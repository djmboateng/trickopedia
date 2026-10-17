/* =========================================================
   Trickopedia — site logic
   ========================================================= */

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* ============ SUBMIT FORM LINK ============
   Every "Submit a move" button opens this URL in a new tab.
   PLACEHOLDER: intentionally broken until the Google Form exists.
   Replace it with the form's share link (e.g. https://forms.gle/...). */
const SUBMIT_FORM_URL = 'https://forms.gle/REPLACE-WITH-GOOGLE-FORM';

/* ============ FILTER OPTIONS ============
   Edit these to change the filter chips and the form's dropdowns. */
const CATEGORIES = ['Flips', 'Twists', 'Kicks', 'Breaking', 'Parkour', 'Other'];
const LEVELS = ['Beginner', 'Intermediate', 'Advanced'];

/* ============ ENTRIES ============
   Approved moves go here, newest first. `link` can be any URL; YouTube
   links get a thumbnail and play in place. Example:
   { name: 'Backflip', category: 'Flips', level: 'Beginner', link: 'https://youtu.be/XXXXXXXXXXX', credit: '@someone' }, */
const ENTRIES = [];

/* ============ TICKER ============
   The scrolling strip above the nav on every page. */
const TICKER_MOVES = [
  ['540 Kick', 'jump off one leg, spin 540° and kick with the other, landing on the kicking leg'],
  ['Butterfly Kick', 'body goes flat in the air while the legs scissor overhead like wings'],
  ['Butterfly Twist', 'a butterfly kick with a full twist added in the air'],
  ['Tornado Kick', 'a 360° spinning crescent kick off a quick step'],
  ['Aerial', 'a cartwheel done without touching the ground with your hands'],
  ['Cork', 'an off-axis backflip with a full twist, set up from a swing'],
  ['Gainer', 'a backflip that travels forward instead of back'],
  ['Webster', 'a front flip taken off one leg'],
  ['Cheat 720 Kick', 'a 540 pushed to two full rotations before the kick'],
];

function initTicker() {
  const el = $('#ticker');
  if (!el) return;
  const items = TICKER_MOVES.map(([name, what]) => `<span class="ticker-item"><b>${esc(name)}</b> ${esc(what)}</span><i></i>`).join('');
  // Two copies so the loop is seamless; the second is hidden from screen readers
  el.innerHTML = `<div class="ticker-track"><div class="ticker-set">${items}</div><div class="ticker-set" aria-hidden="true">${items}</div></div>`;
  el.setAttribute('aria-label', 'Popular tricking moves');
}

function youtubeId(url) {
  const m = String(url).match(/(?:youtu\.be\/|v=|embed\/|shorts\/|live\/)([\w-]{11})/);
  return m ? m[1] : '';
}

function platform(url) {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '');
    const known = { 'instagram.com': 'Instagram', 'tiktok.com': 'TikTok', 'x.com': 'X', 'twitter.com': 'X', 'vimeo.com': 'Vimeo' };
    return known[host] || host;
  } catch {
    return 'Link';
  }
}

// Escape text and wrap any search terms in <mark>
function highlight(text, terms) {
  if (!terms.length) return esc(text);
  const re = new RegExp(`(${terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
  return text.split(re).map((part, i) => (i % 2 ? `<mark>${esc(part)}</mark>` : esc(part))).join('');
}

function card(e, terms) {
  const id = youtubeId(e.link);
  const media = id
    ? `<img src="https://i.ytimg.com/vi/${id}/hqdefault.jpg" alt="" loading="lazy">
       <button class="play" data-yt="${id}" aria-label="Play ${esc(e.name)}"></button>`
    : `<a class="media-link" href="${esc(e.link)}" target="_blank" rel="noopener">Watch on ${esc(platform(e.link))} ↗</a>`;
  return `<article class="card">
    <div class="media">${media}</div>
    <div class="card-body">
      <h3>${highlight(e.name, terms)}</h3>
      <div class="tags"><span class="tag tag-blue">${esc(e.category)}</span>${e.level ? `<span class="tag">${esc(e.level)}</span>` : ''}</div>
      ${e.credit ? `<p class="credit">${highlight(e.credit, terms)}</p>` : ''}
    </div>
  </article>`;
}

/* ============ DATABASE ============ */
function initDatabase() {
  const grid = $('#grid');
  const search = $('#search');
  const chips = $('#categoryChips');
  const level = $('#levelFilter');
  let category = 'All';

  chips.innerHTML = ['All', ...CATEGORIES]
    .map((c) => `<button type="button" class="chip" aria-pressed="${c === category}" data-cat="${esc(c)}">${esc(c)}</button>`)
    .join('');
  level.innerHTML = ['Any', ...LEVELS].map((l) => `<option>${esc(l)}</option>`).join('');

  const render = () => {
    const terms = search.value.toLowerCase().trim().split(/\s+/).filter(Boolean);
    const list = ENTRIES.filter((e) => {
      if (category !== 'All' && e.category !== category) return false;
      if (level.value !== 'Any' && e.level !== level.value) return false;
      const hay = `${e.name} ${e.category} ${e.level || ''} ${e.credit || ''} ${e.tags || ''}`.toLowerCase();
      return terms.every((t) => hay.includes(t));
    });

    $('#count').innerHTML = `<b>${list.length}</b> of ${ENTRIES.length} ${ENTRIES.length === 1 ? 'entry' : 'entries'}`;

    if (list.length) {
      grid.innerHTML = list.map((e) => card(e, terms)).join('');
    } else if (!ENTRIES.length) {
      grid.innerHTML = `<div class="empty">
        <img src="assets/trickopedia.png" alt="" class="empty-logo">
        <h2>No entries yet</h2>
        <p>The database is just getting started. Be the first to add a move.</p>
        <a href="${SUBMIT_FORM_URL}" class="btn btn-red" target="_blank" rel="noopener">+ Submit a move</a>
      </div>`;
    } else {
      grid.innerHTML = `<div class="empty empty-sm">
        <h2>No moves match</h2>
        <p>Try a different search or filter.</p>
      </div>`;
    }
  };

  chips.addEventListener('click', (ev) => {
    const b = ev.target.closest('.chip');
    if (!b) return;
    category = b.dataset.cat;
    $$('.chip', chips).forEach((c) => c.setAttribute('aria-pressed', String(c === b)));
    render();
  });
  search.addEventListener('input', render);
  level.addEventListener('change', render);

  // Load the YouTube player only when a thumbnail is clicked
  grid.addEventListener('click', (ev) => {
    const b = ev.target.closest('.play');
    if (!b) return;
    b.parentElement.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${b.dataset.yt}?autoplay=1&rel=0"
      title="YouTube video" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>`;
  });

  // Press "/" to jump to search
  document.addEventListener('keydown', (ev) => {
    if (ev.key !== '/' || /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) return;
    ev.preventDefault();
    search.focus();
  });

  render();
}

/* ============ SUBMIT LINKS ============ */
function initSubmitLinks() {
  $$('[data-submit-link]').forEach((a) => {
    a.href = SUBMIT_FORM_URL;
    a.target = '_blank';
    a.rel = 'noopener';
  });
}

/* ============ INIT ============ */
$('#year').textContent = new Date().getFullYear();
initTicker();
initSubmitLinks();
// The database only exists on the home page
if ($('#grid')) initDatabase();
