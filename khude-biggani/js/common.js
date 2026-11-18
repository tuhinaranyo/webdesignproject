/* খুদে বিজ্ঞানী — shared helpers: mascot "তুহিন", Bangla voice, Bangla digits, progress */
const KB = (() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const calm = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Bangla digits ---------- */
  const BN = '০১২৩৪৫৬৭৮৯';
  const bn = (n) => String(n).replace(/\d/g, (d) => BN[d]);

  /* ---------- Progress (stored only on this device) ---------- */
  const KEY = 'kb-badges';
  const badges = () => { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return []; } };
  const addBadge = (id) => {
    const b = badges();
    if (!b.includes(id)) b.push(id);
    try { localStorage.setItem(KEY, JSON.stringify(b)); } catch (e) {}
  };

  /* ---------- তুহিন, the robot ---------- */
  const TUHIN_SVG = `
  <svg viewBox="0 0 200 230" class="tuhin__svg" aria-hidden="true">
    <ellipse cx="100" cy="222" rx="54" ry="7" class="t-shadow"/>
    <g class="t-bob">
      <line x1="100" y1="30" x2="100" y2="12" class="t-stroke"/>
      <circle cx="100" cy="10" r="8" class="t-bulb"/>
      <rect x="22" y="70" width="18" height="34" rx="9" class="t-ear"/>
      <rect x="160" y="70" width="18" height="34" rx="9" class="t-ear"/>
      <rect x="34" y="28" width="132" height="112" rx="44" class="t-head"/>
      <rect x="50" y="46" width="100" height="74" rx="30" class="t-screen"/>
      <g class="t-eyes">
        <g class="t-blink">
          <ellipse cx="80" cy="80" rx="10" ry="12" class="t-eye"/>
          <ellipse cx="120" cy="80" rx="10" ry="12" class="t-eye"/>
          <circle cx="83" cy="76" r="3.5" fill="#fff"/>
          <circle cx="123" cy="76" r="3.5" fill="#fff"/>
        </g>
        <path d="M86 102q14 12 28 0" class="t-mouth"/>
        <ellipse cx="66" cy="100" rx="7" ry="4" class="t-cheek"/>
        <ellipse cx="134" cy="100" rx="7" ry="4" class="t-cheek"/>
      </g>
      <g class="t-arm t-arm--l"><rect x="30" y="150" width="20" height="46" rx="10" class="t-limb"/></g>
      <g class="t-arm t-arm--r"><rect x="150" y="150" width="20" height="46" rx="10" class="t-limb"/></g>
      <rect x="52" y="142" width="96" height="74" rx="30" class="t-body"/>
      <circle cx="100" cy="178" r="20" class="t-chest"/>
      <text x="100" y="186" text-anchor="middle" class="t-letter">ত</text>
    </g>
  </svg>`;

  function mountTuhin(el) {
    el.innerHTML = TUHIN_SVG;
    const eyes = $('.t-eyes', el);
    // eyes follow the cursor / finger
    const look = (x, y) => {
      if (calm()) return;
      const r = el.getBoundingClientRect();
      const dx = Math.max(-1, Math.min(1, (x - (r.left + r.width / 2)) / 300));
      const dy = Math.max(-1, Math.min(1, (y - (r.top + r.height * 0.35)) / 300));
      eyes.style.transform = `translate(${dx * 9}px, ${dy * 6}px)`;
    };
    addEventListener('pointermove', (e) => look(e.clientX, e.clientY), { passive: true });
    addEventListener('pointerdown', (e) => look(e.clientX, e.clientY), { passive: true });
    return el;
  }

  /* make তুহিন "say" something in a bubble (+ talking mouth) */
  function say(bubble, text, mood) {
    if (!bubble) return;
    bubble.textContent = text;
    bubble.classList.remove('pop');
    void bubble.offsetWidth;
    bubble.classList.add('pop');
    const t = bubble.closest('.buddy')?.querySelector('.tuhin');
    if (t) {
      t.dataset.mood = mood || '';
      t.classList.add('talking');
      clearTimeout(t._t);
      t._t = setTimeout(() => t.classList.remove('talking'), Math.min(4000, 600 + text.length * 35));
    }
  }

  /* ---------- Bangla voice (Web Speech API) ---------- */
  let bnVoice = null;
  const synth = window.speechSynthesis;
  function pickVoice() {
    if (!synth) return;
    bnVoice = synth.getVoices().find((v) => /^bn/i.test(v.lang)) || null;
    document.documentElement.classList.toggle('has-voice', !!bnVoice);
  }
  if (synth) { pickVoice(); synth.addEventListener?.('voiceschanged', pickVoice); }

  function speak(text) {
    if (!synth || !bnVoice) return false;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text.replace(/[\u{1F300}-\u{1FAFF}☀-➿]/gu, ''));
    u.voice = bnVoice;
    u.lang = bnVoice.lang;
    u.rate = 0.92;
    u.pitch = 1.25;
    synth.speak(u);
    return true;
  }

  /* ---------- toast ---------- */
  let toastT;
  function toast(msg) {
    let el = $('.toast');
    if (!el) { el = document.createElement('div'); el.className = 'toast'; el.setAttribute('role', 'status'); document.body.appendChild(el); }
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastT);
    toastT = setTimeout(() => el.classList.remove('show'), 2600);
  }

  /* ---------- confetti (CSS only, tiny) ---------- */
  function confetti(n = 60) {
    if (calm()) return;
    const colors = ['#ff7a1a', '#ff4f8b', '#ffc93c', '#18c29c', '#2f6bff', '#7b5cff'];
    for (let i = 0; i < n; i++) {
      const c = document.createElement('i');
      c.className = 'confetti';
      c.style.left = Math.random() * 100 + 'vw';
      c.style.background = colors[i % colors.length];
      c.style.animationDuration = 1.8 + Math.random() * 1.6 + 's';
      c.style.animationDelay = Math.random() * 0.4 + 's';
      c.style.setProperty('--drift', (Math.random() * 160 - 80) + 'px');
      c.style.setProperty('--spin', (Math.random() * 720 - 360) + 'deg');
      document.body.appendChild(c);
      setTimeout(() => c.remove(), 4000);
    }
  }

  /* ---------- offline support ---------- */
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }

  return { $, $$, bn, calm, badges, addBadge, mountTuhin, say, speak, toast, confetti };
})();
