/* =========================================================
   Trickopedia — site logic
   ========================================================= */

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

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
        <button type="button" class="btn btn-red" data-open-submit>+ Submit a move</button>
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
    if (ev.key !== '/' || /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName) || $('#submitDialog').open) return;
    ev.preventDefault();
    search.focus();
  });

  render();
}

/* ============ SUBMIT FORM ============
   Sends entries to /api/submit (server.js saves them to data/submissions.json). */
function initSubmit() {
  const dialog = $('#submitDialog');
  const form = $('#submitForm');
  const error = $('#formError');
  const send = $('#sendBtn');

  $('#formCategory').innerHTML = `<option value="">Choose…</option>` + CATEGORIES.map((c) => `<option>${esc(c)}</option>`).join('');
  $('#formLevel').innerHTML = `<option value="">Not sure</option>` + LEVELS.map((l) => `<option>${esc(l)}</option>`).join('');

  const showDone = (done) => {
    $('#formFields').hidden = done;
    $('#formDone').hidden = !done;
    send.hidden = done;
    $('#againBtn').hidden = !done;
    $('#cancelBtn').textContent = done ? 'Close' : 'Cancel';
  };

  const open = () => {
    if (dialog.open) return;
    showDone(false);
    error.textContent = '';
    dialog.showModal();
    form.link.focus();
  };

  // Buttons are added and replaced as the grid re-renders, so delegate
  document.addEventListener('click', (ev) => {
    if (ev.target.closest('[data-open-submit]')) open();
  });
  $$('[data-close]', dialog).forEach((b) => b.addEventListener('click', () => dialog.close()));
  // Click on the backdrop closes the dialog
  dialog.addEventListener('click', (ev) => { if (ev.target === dialog) dialog.close(); });
  $('#againBtn').addEventListener('click', () => { form.reset(); showDone(false); form.link.focus(); });

  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    error.textContent = '';
    const data = Object.fromEntries(new FormData(form));
    data.link = data.link.trim();
    if (data.link && !/^https?:\/\//i.test(data.link)) data.link = 'https://' + data.link;
    form.link.value = data.link;

    const invalid = [...form.elements].find((el) => el.willValidate && !el.checkValidity());
    if (invalid) {
      error.textContent = invalid.name === 'link' ? 'Please enter a valid link.' : 'Please fill in the required fields.';
      invalid.focus();
      return;
    }

    send.disabled = true;
    send.textContent = 'Sending…';
    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const out = await res.json().catch(() => ({}));
      if (!res.ok || !out.ok) throw new Error(out.error || 'Something went wrong.');
      form.reset();
      showDone(true);
    } catch (err) {
      error.textContent = err instanceof TypeError ? "Couldn't reach the server. Please try again." : err.message;
    } finally {
      send.disabled = false;
      send.textContent = 'Send for review';
    }
  });

  if (location.hash === '#submit') open();
}

/* ============ INIT ============ */
$('#year').textContent = new Date().getFullYear();
initTicker();
// The database and form only exist on the home page
if ($('#grid')) {
  initDatabase();
  initSubmit();
}
