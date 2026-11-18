/* =========================================================
   Plume — interaction layer (no dependencies)
   1. Dynamic light source  (cursor / device tilt → shadows + parallax)
   2. Day / night theme     (time of day + circular view transition)
   3. Products              (data → cards, colour swatches, 3D tilt)
   4. Filter + search       (FLIP re-layout)
   5. Cart                  (fly-to-cart, springy badge, drawer)
   ========================================================= */
(() => {
  const root = document.documentElement;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const calm = () => reduceMotion.matches;
  const money = (n) => '$' + n.toLocaleString('en-US');
  const SPRING = 'cubic-bezier(.34,1.56,.64,1)';

  /* ---------------------------------------------------------
     1. Dynamic light source
     --------------------------------------------------------- */
  const DEFAULT = { sx: 0.6, sy: 0.6 };
  const light = { sx: DEFAULT.sx, sy: DEFAULT.sy, tx: DEFAULT.sx, ty: DEFAULT.sy, px: 0, py: 0, tpx: 0, tpy: 0 };
  const layers = $$('[data-depth]');
  let raf = 0;
  const clamp = (v, a = -1, b = 1) => Math.min(b, Math.max(a, v));

  function aim(nx, ny) {
    // nx, ny: light position relative to viewport centre, -1..1.
    // Shadows fall away from the light, so they point the opposite way.
    light.tx = clamp(-nx * 0.95);
    light.ty = clamp(-ny * 0.95);
    light.tpx = nx;
    light.tpy = ny;
    if (!raf) raf = requestAnimationFrame(tick);
  }

  function tick() {
    const k = calm() ? 1 : 0.12;
    light.sx += (light.tx - light.sx) * k;
    light.sy += (light.ty - light.sy) * k;
    light.px += (light.tpx - light.px) * k;
    light.py += (light.tpy - light.py) * k;
    root.style.setProperty('--sx', light.sx.toFixed(3));
    root.style.setProperty('--sy', light.sy.toFixed(3));
    if (!calm()) {
      for (const el of layers) {
        const d = +el.dataset.depth;
        el.style.translate = `${(light.px * d).toFixed(1)}px ${(light.py * d).toFixed(1)}px`;
      }
    }
    const done = Math.abs(light.tx - light.sx) < 0.002 && Math.abs(light.ty - light.sy) < 0.002 &&
      Math.abs(light.tpx - light.px) < 0.002 && Math.abs(light.tpy - light.py) < 0.002;
    raf = done ? 0 : requestAnimationFrame(tick);
  }

  addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch') return;
    root.style.setProperty('--mx', e.clientX + 'px');
    root.style.setProperty('--my', e.clientY + 'px');
    aim((e.clientX / innerWidth) * 2 - 1, (e.clientY / innerHeight) * 2 - 1);
  }, { passive: true });

  document.addEventListener('pointerleave', () => aim(-DEFAULT.sx / 0.95, -DEFAULT.sy / 0.95));

  // Phones: tilt the device and the light moves with it.
  addEventListener('deviceorientation', (e) => {
    if (e.gamma == null || e.beta == null) return;
    aim(clamp(e.gamma / 35), clamp((e.beta - 40) / 35));
  }, { passive: true });

  /* ---------------------------------------------------------
     2. Day / night theme
     --------------------------------------------------------- */
  const toggle = $('#themeToggle');
  function setTheme(t) {
    root.dataset.theme = t;
    try { localStorage.setItem('plume-theme', t); } catch (e) {}
  }
  toggle.addEventListener('click', (e) => {
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    if (!document.startViewTransition || calm()) return setTheme(next);
    const r = toggle.getBoundingClientRect();
    const x = r.left + r.width / 2, y = r.top + r.height / 2;
    const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    document.startViewTransition(() => setTheme(next)).ready.then(() => {
      root.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
        { duration: 750, easing: 'cubic-bezier(.7,0,.3,1)', pseudoElement: '::view-transition-new(root)' }
      );
    });
  });

  /* ---------------------------------------------------------
     3. Products — every illustration is an SVG coloured by
        CSS variables, so swatches recolour them live.
     --------------------------------------------------------- */
  const HI = 'fill="#fff" opacity=".4"';
  const ART = {
    headphones: `
      <path d="M48 112V96a52 52 0 0 1 104 0v16" fill="none" stroke="var(--c2)" stroke-width="12" stroke-linecap="round"/>
      <rect x="30" y="96" width="40" height="64" rx="20" fill="var(--c1)"/>
      <rect x="130" y="96" width="40" height="64" rx="20" fill="var(--c1)"/>
      <rect x="40" y="106" width="9" height="38" rx="4.5" ${HI}/>
      <rect x="140" y="106" width="9" height="38" rx="4.5" ${HI}/>
      <circle cx="150" cy="148" r="4" fill="var(--c3)"/>`,
    watch: `
      <rect x="76" y="22" width="48" height="156" rx="18" fill="var(--c2)"/>
      <circle cx="100" cy="100" r="50" fill="var(--c1)"/>
      <circle cx="100" cy="100" r="38" fill="#fff" opacity=".92"/>
      <path d="M100 100V74M100 100l16 10" stroke="var(--c3)" stroke-width="6" stroke-linecap="round"/>
      <circle cx="100" cy="100" r="5" fill="var(--c3)"/>
      <rect x="148" y="90" width="10" height="20" rx="4" fill="var(--c2)"/>
      <path d="M68 76a40 40 0 0 1 22-16" stroke="#fff" stroke-width="6" stroke-linecap="round" opacity=".5" fill="none"/>`,
    speaker: `
      <rect x="48" y="30" width="104" height="146" rx="38" fill="var(--c1)"/>
      <circle cx="100" cy="126" r="32" fill="var(--c2)"/>
      <circle cx="100" cy="126" r="13" fill="var(--c3)"/>
      <circle cx="100" cy="70" r="12" fill="var(--c2)"/>
      <rect x="60" y="44" width="10" height="60" rx="5" ${HI}/>`,
    lamp: `
      <ellipse cx="100" cy="170" rx="46" ry="11" fill="var(--c2)"/>
      <rect x="95" y="112" width="10" height="58" rx="5" fill="var(--c2)"/>
      <circle cx="100" cy="82" r="52" fill="var(--c1)"/>
      <path d="M118 36a52 52 0 0 1 0 92a46 46 0 0 0 0-92z" fill="var(--c3)" opacity=".55"/>
      <ellipse cx="80" cy="62" rx="18" ry="12" ${HI} opacity=".55"/>`,
    mug: `
      <path d="M140 86h8a20 20 0 0 1 0 40h-8" fill="none" stroke="var(--c1)" stroke-width="13"/>
      <rect x="50" y="62" width="92" height="104" rx="24" fill="var(--c1)"/>
      <rect x="50" y="98" width="92" height="16" fill="var(--c2)"/>
      <rect x="62" y="74" width="9" height="70" rx="4.5" ${HI}/>
      <path d="M80 50q-8-10 0-20t0-20M104 50q-8-10 0-20t0-20" fill="none" stroke="var(--c3)" stroke-width="5" stroke-linecap="round"/>`,
    keyboard: `
      <rect x="18" y="62" width="164" height="86" rx="22" fill="var(--c1)"/>
      ${[0, 1, 2].map((r) => [0, 1, 2, 3, 4, 5].map((c) =>
        `<rect x="${32 + c * 23}" y="${74 + r * 20}" width="17" height="14" rx="5" fill="${r === 0 && c === 5 ? 'var(--c3)' : 'var(--c2)'}"/>`).join('')).join('')}
      <rect x="28" y="68" width="60" height="3" rx="1.5" ${HI}/>`,
    camera: `
      <rect x="58" y="44" width="44" height="24" rx="9" fill="var(--c2)"/>
      <rect x="30" y="60" width="140" height="100" rx="30" fill="var(--c1)"/>
      <circle cx="100" cy="110" r="36" fill="var(--c2)"/>
      <circle cx="100" cy="110" r="22" fill="var(--c3)"/>
      <circle cx="92" cy="102" r="7" fill="#fff" opacity=".7"/>
      <circle cx="148" cy="80" r="7" fill="var(--c3)"/>
      <rect x="40" y="72" width="8" height="44" rx="4" ${HI}/>`,
    planter: `
      <ellipse cx="78" cy="62" rx="16" ry="40" fill="var(--c2)" transform="rotate(-26 78 62)"/>
      <ellipse cx="122" cy="62" rx="16" ry="40" fill="var(--c2)" transform="rotate(26 122 62)"/>
      <ellipse cx="100" cy="50" rx="14" ry="42" fill="var(--c3)"/>
      <path d="M46 100h108l-14 70a12 12 0 0 1-12 10H72a12 12 0 0 1-12-10z" fill="var(--c1)"/>
      <rect x="44" y="94" width="112" height="18" rx="9" fill="var(--c1)"/>
      <rect x="62" y="118" width="8" height="44" rx="4" ${HI}/>`,
  };
  const art = (kind, p) =>
    `<svg viewBox="0 0 200 200" style="--c1:${p[0]};--c2:${p[1]};--c3:${p[2]}" aria-hidden="true">${ART[kind]}</svg>`;

  const PRODUCTS = [
    { id: 'halo', name: 'Halo Pods', kind: 'headphones', cat: 'audio', price: 189, note: 'Wireless · 40h battery', tag: 'New',
      colors: [['#3550f0', '#1d2a8a', '#f5bf14'], ['#e6337a', '#8f1449', '#8db0ff'], ['#f5bf14', '#b98a00', '#3550f0']] },
    { id: 'orbit', name: 'Orbit Watch', kind: 'watch', cat: 'wear', price: 249, note: 'Ceramic · 7-day charge',
      colors: [['#e6337a', '#f7a8c8', '#23283d'], ['#22b58a', '#9de3cd', '#23283d'], ['#3550f0', '#8db0ff', '#e6337a']] },
    { id: 'pebble', name: 'Pebble Speaker', kind: 'speaker', cat: 'audio', price: 129, note: '360° sound · waterproof', tag: 'Hot', hot: true,
      colors: [['#f5bf14', '#ffe48a', '#e6337a'], ['#8db0ff', '#3550f0', '#f5bf14'], ['#23283d', '#4a5275', '#22b58a']] },
    { id: 'luna', name: 'Luna Lamp', kind: 'lamp', cat: 'home', price: 98, note: 'Dimmable · tracks sunset',
      colors: [['#f4f1ea', '#3550f0', '#f5bf14'], ['#ffd6e6', '#e6337a', '#e6337a'], ['#cfe0ff', '#23283d', '#3550f0']] },
    { id: 'clay', name: 'Clay Mug', kind: 'mug', cat: 'home', price: 34, note: 'Hand-thrown stoneware',
      colors: [['#22b58a', '#f4f1ea', '#8db0ff'], ['#e6337a', '#f5bf14', '#8db0ff'], ['#3550f0', '#f4f1ea', '#e6337a']] },
    { id: 'tactile', name: 'Tactile 60', kind: 'keyboard', cat: 'tech', price: 159, note: 'Silent linear switches', tag: 'New',
      colors: [['#f4f1ea', '#cfd5e6', '#e6337a'], ['#3550f0', '#8db0ff', '#f5bf14'], ['#23283d', '#4a5275', '#22b58a']] },
    { id: 'snap', name: 'Snap Cam', kind: 'camera', cat: 'tech', price: 219, note: 'Instant print · 24 MP',
      colors: [['#8db0ff', '#23283d', '#e6337a'], ['#f5bf14', '#23283d', '#3550f0'], ['#e6337a', '#23283d', '#f5bf14']] },
    { id: 'pod', name: 'Pod Planter', kind: 'planter', cat: 'home', price: 46, note: 'Self-watering · recycled',
      colors: [['#e6337a', '#22b58a', '#8fdfb8'], ['#f5bf14', '#22b58a', '#8fdfb8'], ['#3550f0', '#22b58a', '#8fdfb8']] },
  ];

  const grid = $('#grid');
  const heart = '<svg viewBox="0 0 24 24"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg>';
  const plus = '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>';
  const check = '<svg viewBox="0 0 24 24"><path d="m5 12 5 5 9-10"/></svg>';

  grid.innerHTML = PRODUCTS.map((p) => `
    <article class="card neu" data-id="${p.id}" data-cat="${p.cat}" data-name="${p.name.toLowerCase()} ${p.cat} ${p.note.toLowerCase()}">
      <div class="well neu-in">
        <span class="well__blob" style="--c1:${p.colors[0][0]}"></span>
        <div class="well__product">${art(p.kind, p.colors[0])}</div>
        ${p.tag ? `<span class="tag ${p.hot ? 'tag--pink' : ''}">${p.tag}</span>` : ''}
        <button class="fav neu" aria-pressed="false" aria-label="Save ${p.name}">${heart}</button>
      </div>
      <div class="info">
        <div class="info__top"><h3>${p.name}</h3><span class="price">${money(p.price)}</span></div>
        <p class="muted">${p.note}</p>
        <div class="info__row">
          <div class="swatches" role="group" aria-label="Colour">
            ${p.colors.map((c, i) => `<button class="swatch neu" style="--sw:${c[0]}" data-i="${i}" aria-pressed="${i === 0}" aria-label="Colour ${i + 1}"></button>`).join('')}
          </div>
          <button class="add" aria-label="Add ${p.name} to cart">${plus}<span>Add</span></button>
        </div>
      </div>
    </article>`).join('');

  const byId = Object.fromEntries(PRODUCTS.map((p) => [p.id, p]));
  const chosen = Object.fromEntries(PRODUCTS.map((p) => [p.id, 0]));

  // hero product
  const hero = $('#heroProduct');
  hero.innerHTML = art('headphones', PRODUCTS[0].colors[0]);
  let heroIdx = 0;
  $('#spinBtn').addEventListener('click', () => {
    heroIdx = (heroIdx + 1) % PRODUCTS[0].colors.length;
    const svg = hero.querySelector('svg');
    const c = PRODUCTS[0].colors[heroIdx];
    hero.classList.remove('spin');
    void hero.offsetWidth;
    hero.classList.add('spin');
    setTimeout(() => svg.setAttribute('style', `--c1:${c[0]};--c2:${c[1]};--c3:${c[2]}`), calm() ? 0 : 280);
  });

  // card interactions (delegated)
  grid.addEventListener('click', (e) => {
    const card = e.target.closest('.card');
    if (!card) return;
    const p = byId[card.dataset.id];

    const sw = e.target.closest('.swatch');
    if (sw) {
      const i = +sw.dataset.i;
      chosen[p.id] = i;
      $$('.swatch', card).forEach((b) => b.setAttribute('aria-pressed', b === sw));
      const c = p.colors[i];
      $('.well__product svg', card).setAttribute('style', `--c1:${c[0]};--c2:${c[1]};--c3:${c[2]}`);
      $('.well__blob', card).style.setProperty('--c1', c[0]);
      if (!calm()) $('.well__product', card).animate(
        [{ scale: 1 }, { scale: 0.86 }, { scale: 1.08 }, { scale: 1 }], { duration: 550, easing: 'ease-out' });
      return;
    }

    const fav = e.target.closest('.fav');
    if (fav) {
      const on = fav.getAttribute('aria-pressed') !== 'true';
      fav.setAttribute('aria-pressed', on);
      if (on && !calm()) fav.animate([{ scale: 1 }, { scale: 1.45 }, { scale: 0.9 }, { scale: 1 }], { duration: 500 });
      toast(on ? `Saved ${p.name} to favourites` : `Removed ${p.name}`);
      return;
    }

    const add = e.target.closest('.add');
    if (add) {
      addToCart(p.id, chosen[p.id], add);
    }
  });

  // 3D tilt following the cursor (mouse/pen only)
  grid.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch' || calm()) return;
    const card = e.target.closest('.card');
    if (!card) return;
    const r = card.getBoundingClientRect();
    const nx = (e.clientX - r.left) / r.width - 0.5;
    const ny = (e.clientY - r.top) / r.height - 0.5;
    card.classList.add('tilting');
    card.style.setProperty('--ry', (nx * 10).toFixed(2) + 'deg');
    card.style.setProperty('--rx', (-ny * 10).toFixed(2) + 'deg');
    card.style.setProperty('--px', (nx * 14).toFixed(1) + 'px');
    card.style.setProperty('--py', (ny * 14).toFixed(1) + 'px');
  });
  grid.addEventListener('pointerout', (e) => {
    const card = e.target.closest('.card');
    if (!card || card.contains(e.relatedTarget)) return;
    card.classList.remove('tilting');
    ['--rx', '--ry', '--px', '--py'].forEach((v) => card.style.removeProperty(v));
  });

  /* ---------------------------------------------------------
     4. Filter tabs + search, with FLIP re-layout
     --------------------------------------------------------- */
  const tabs = $('#tabs');
  const indicator = $('.tabs__indicator', tabs);
  let cat = 'all';
  let query = '';

  function moveIndicator() {
    const active = $('[aria-selected="true"]', tabs);
    indicator.style.width = active.offsetWidth + 'px';
    indicator.style.transform = `translateX(${active.offsetLeft}px)`;
  }

  function applyFilter() {
    const cards = $$('.card', grid);
    const before = new Map(cards.map((c) => [c, c.getBoundingClientRect()]));
    let shown = 0;
    cards.forEach((c) => {
      const ok = (cat === 'all' || c.dataset.cat === cat) && c.dataset.name.includes(query);
      c.hidden = !ok;
      if (ok) shown++;
    });
    $('#empty').hidden = shown > 0;
    if (calm()) return;
    cards.forEach((c, i) => {
      if (c.hidden) return;
      const a = before.get(c), b = c.getBoundingClientRect();
      if (!a.width) {
        c.animate([{ opacity: 0, transform: 'scale(.85) translateY(20px)' }, { opacity: 1, transform: 'none' }],
          { duration: 600, delay: i * 40, easing: SPRING, fill: 'backwards' });
      } else if (a.left !== b.left || a.top !== b.top) {
        c.animate([{ transform: `translate(${a.left - b.left}px, ${a.top - b.top}px)` }, { transform: 'none' }],
          { duration: 650, easing: SPRING });
      }
    });
  }

  tabs.addEventListener('click', (e) => {
    const btn = e.target.closest('button[role="tab"]');
    if (!btn) return;
    $$('button[role="tab"]', tabs).forEach((b) => b.setAttribute('aria-selected', b === btn));
    cat = btn.dataset.cat;
    moveIndicator();
    applyFilter();
  });
  $('#search').addEventListener('input', (e) => {
    query = e.target.value.trim().toLowerCase();
    applyFilter();
  });
  addEventListener('resize', moveIndicator);
  document.fonts?.ready.then(moveIndicator);
  moveIndicator();

  /* ---------------------------------------------------------
     5. Cart
     --------------------------------------------------------- */
  const FREE_SHIP = 250;
  const cart = new Map(); // key "id:colour" -> { id, ci, qty }
  const cartBtn = $('#cartBtn');
  const drawer = $('#drawer');
  const scrim = $('#scrim');

  function addToCart(id, ci, btn) {
    const key = `${id}:${ci}`;
    const line = cart.get(key) || { id, ci, qty: 0 };
    line.qty++;
    cart.set(key, line);

    // button feedback
    btn.classList.add('done');
    btn.innerHTML = `${check}<span>Added</span>`;
    if (!calm()) btn.animate([{ scale: 1 }, { scale: 0.85 }, { scale: 1.1 }, { scale: 1 }], { duration: 500 });
    clearTimeout(btn._t);
    btn._t = setTimeout(() => { btn.classList.remove('done'); btn.innerHTML = `${plus}<span>Add</span>`; }, 1400);

    const after = () => { renderCart(); bump(); };
    if (calm()) return after();
    flyToCart(btn, byId[id].colors[ci][0]).then(after);
    toast(`${byId[id].name} added to your bag`);
  }

  function flyToCart(from, color) {
    const a = from.getBoundingClientRect();
    const b = cartBtn.getBoundingClientRect();
    const x0 = a.left + a.width / 2, y0 = a.top + a.height / 2;
    const x1 = b.left + b.width / 2, y1 = b.top + b.height / 2;
    const dot = document.createElement('div');
    dot.className = 'fly';
    dot.style.background = color;
    document.body.appendChild(dot);
    const peak = Math.min(y0, y1) - 140;
    const anim = dot.animate([
      { transform: `translate(${x0}px, ${y0}px) scale(.6)` },
      { transform: `translate(${(x0 + x1) / 2}px, ${peak}px) scale(1.25)`, offset: 0.45 },
      { transform: `translate(${x1}px, ${y1}px) scale(.35)`, opacity: 0.9 },
    ], { duration: 800, easing: 'cubic-bezier(.45,0,.25,1)' });
    return anim.finished.then(() => dot.remove());
  }

  function bump() {
    cartBtn.animate([{ scale: 1 }, { scale: 1.25, rotate: '-8deg' }, { scale: 0.92, rotate: '6deg' }, { scale: 1 }],
      { duration: 600, easing: 'ease-out' });
  }

  function renderCart() {
    const lines = [...cart.entries()];
    const count = lines.reduce((s, [, l]) => s + l.qty, 0);
    const total = lines.reduce((s, [, l]) => s + l.qty * byId[l.id].price, 0);

    const badge = $('#cartCount');
    badge.textContent = count;
    badge.classList.toggle('has', count > 0);

    $('#cartList').innerHTML = lines.map(([key, l]) => {
      const p = byId[l.id];
      return `<li class="line neu" data-key="${key}">
        <span class="line__thumb neu-in">${art(p.kind, p.colors[l.ci])}</span>
        <div class="line__body"><b>${p.name}</b><small>${money(p.price)} · colour ${l.ci + 1}</small></div>
        <div class="qty neu-in">
          <button data-d="-1" aria-label="Decrease quantity">−</button>
          <span>${l.qty}</span>
          <button data-d="1" aria-label="Increase quantity">+</button>
        </div>
      </li>`;
    }).join('');
    $('#cartEmpty').hidden = count > 0;
    $('#subtotal').textContent = money(total);
    $('#shipBar').style.width = Math.min(100, (total / FREE_SHIP) * 100) + '%';
    $('#shipText').textContent = total >= FREE_SHIP
      ? 'You unlocked free shipping 🎉'
      : `Add ${money(FREE_SHIP - total)} more for free shipping`;
  }

  $('#cartList').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-d]');
    if (!b) return;
    const key = b.closest('.line').dataset.key;
    const l = cart.get(key);
    l.qty += +b.dataset.d;
    if (l.qty <= 0) cart.delete(key);
    renderCart();
  });

  let lastFocus = null;
  function openCart() {
    lastFocus = document.activeElement;
    scrim.hidden = false;
    requestAnimationFrame(() => scrim.classList.add('open'));
    drawer.classList.add('open');
    drawer.setAttribute('aria-hidden', 'false');
    drawer.focus();
  }
  function closeCart() {
    scrim.classList.remove('open');
    drawer.classList.remove('open');
    drawer.setAttribute('aria-hidden', 'true');
    setTimeout(() => { scrim.hidden = true; }, 350);
    lastFocus?.focus();
  }
  cartBtn.addEventListener('click', openCart);
  $('#closeCart').addEventListener('click', closeCart);
  scrim.addEventListener('click', closeCart);
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && drawer.classList.contains('open')) closeCart(); });
  $('#checkout').addEventListener('click', () => toast(cart.size ? 'Demo checkout — no card needed ✨' : 'Your bag is empty'));
  renderCart();

  /* ---------------------------------------------------------
     Extras: countdown ring, toast, newsletter, scroll reveal
     --------------------------------------------------------- */
  const cd = $('#countdown');
  const ring = $('#ringBar');
  function countdown() {
    const now = new Date();
    const end = new Date(now); end.setHours(24, 0, 0, 0);
    const left = end - now;
    const h = Math.floor(left / 36e5), m = Math.floor(left / 6e4) % 60, s = Math.floor(left / 1e3) % 60;
    cd.textContent = [h, m, s].map((n) => String(n).padStart(2, '0')).join(':');
    ring.style.strokeDashoffset = (100 - (left / 864e5) * 100).toFixed(2);
  }
  countdown();
  setInterval(countdown, 1000);

  const toastEl = $('#toast');
  let toastT;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastT);
    toastT = setTimeout(() => toastEl.classList.remove('show'), 2200);
  }

  $('#newsForm').addEventListener('submit', (e) => {
    e.preventDefault();
    e.target.reset();
    toast("You're on the list — see you at the next drop 💌");
  });

  const io = new IntersectionObserver((entries) => {
    for (const en of entries) {
      if (!en.isIntersecting) continue;
      const el = en.target;
      io.unobserve(el);
      if (el.classList.contains('card')) {
        if (!calm()) el.animate([{ opacity: 0, transform: 'translateY(40px) scale(.94)' }, { opacity: 1, transform: 'none' }],
          { duration: 800, delay: (+el.dataset.order % 4) * 90, easing: SPRING, fill: 'backwards' });
      } else {
        el.classList.add('in');
      }
    }
  }, { threshold: 0.12 });
  $$('.reveal').forEach((el) => io.observe(el));
  $$('.card').forEach((el, i) => { el.dataset.order = i; io.observe(el); });
})();
