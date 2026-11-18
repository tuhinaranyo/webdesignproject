(() => {
  const { $, $$, bn, calm, mountTuhin, say, speak, addBadge, confetti } = KB;

  mountTuhin($('#tuhin'));
  const bubble = $('#bubble');
  const steps = $$('.step');
  const dots = $$('#steps i');
  const next = $('#next');
  const prev = $('#prev');
  let cur = 0;
  const unlocked = [false, false, true, false, true]; // can the child move past this step yet?

  function go(i) {
    cur = i;
    steps.forEach((s, j) => s.classList.toggle('active', j === i));
    dots.forEach((d, j) => { d.classList.toggle('on', j === i); d.classList.toggle('done', j < i); });
    say(bubble, steps[i].dataset.say, i === 4 ? 'happy' : '');
    prev.style.visibility = i === 0 ? 'hidden' : 'visible';
    $('#nav').hidden = i === 4;
    next.disabled = !unlocked[i];
    if (i === 4) { addBadge('rocket'); confetti(80); }
    window.scrollTo({ top: 0, behavior: calm() ? 'auto' : 'smooth' });
  }
  const unlock = (i) => { unlocked[i] = true; if (cur === i) next.disabled = false; };
  next.addEventListener('click', () => cur < 4 && go(cur + 1));
  prev.addEventListener('click', () => cur > 0 && go(cur - 1));
  $('#again').addEventListener('click', () => { resetBalloon(); go(0); });
  $('#speakBtn').addEventListener('click', () => speak(bubble.textContent));

  /* ---------- ১. বেলুন ---------- */
  const stage = $('#balloonStage');
  const balloon = $('#balloon');
  function resetBalloon() { stage.classList.remove('fired'); balloon.classList.remove('go'); }
  $('#fireBalloon').addEventListener('click', () => {
    resetBalloon();
    void balloon.offsetWidth;
    stage.classList.add('fired');
    balloon.classList.add('go');
    setTimeout(() => {
      $('#fact1').hidden = false;
      say(bubble, 'দেখলে? বাতাস ছুটল পেছনে, আর বেলুন ছুটল সামনে! বিজ্ঞানী নিউটন একেই বলেছেন ক্রিয়া আর প্রতিক্রিয়া। রকেটও ঠিক এভাবেই ওড়ে! 🚀', 'happy');
      unlock(0);
      setTimeout(resetBalloon, 1800);
    }, calm() ? 0 : 1200);
  });

  /* ---------- ২. রকেট সিমুলেটর ---------- */
  // Simple physics: constant thrust, mass drops as fuel burns, gravity pulls down.
  const THRUST = 200, BURN = 1.6, DRY = 2, G = 9.8, KM = 0.0956;
  const fuelIn = $('#fuel'), loadIn = $('#load');
  const sky = $('#sky'), layer = $('#worldLayer'), rocket = $('#rocket');
  const altEl = $('#alt'), cdEl = $('#cd');
  const launchBtn = $('#launch');
  const done = new Set();
  let tries = 0, flying = false;

  const px = (km) => 260 * Math.log10(1 + km); // log scale so 0–150 km fits on a phone
  const place = (html, km, style = '') => `<div style="position:absolute;bottom:${px(km).toFixed(0)}px;${style}">${html}</div>`;
  layer.innerHTML = `
    <div class="ground"></div>
    <span class="tree" style="left:12%">🌴</span><span class="tree" style="left:24%">🌳</span>
    <span class="tree" style="right:14%">🏠</span><span class="tree" style="right:28%">🌴</span>
    ${place('🐦', 0.6, 'left:20%;font-size:1.4rem')}
    <span class="cloud" style="bottom:${px(6)}px;left:6%">☁️</span>
    <span class="cloud" style="bottom:${px(9)}px;right:4%">☁️</span>
    <span class="cloud" style="bottom:${px(13)}px;left:18%">☁️</span>
    ${place('✈️', 11, 'right:22%;font-size:1.8rem')}
    <div class="marker" style="bottom:${px(10)}px"><span>☁️ মেঘের রাজ্য · ১০ কিমি</span></div>
    <div class="marker" style="bottom:${px(100)}px"><span>🌌 মহাকাশ শুরু · ১০০ কিমি</span></div>
    ${place('🛰️', 140, 'left:14%;font-size:2rem')}
    ${place('🌙', 155, 'right:12%;font-size:2.4rem')}`;

  function mass() { return DRY + +loadIn.value + +fuelIn.value; }

  function updateForces() {
    $('#fuelOut').textContent = bn(fuelIn.value);
    $('#loadOut').textContent = bn(loadIn.value) + ' কেজি';
    const w = mass() * G;
    $('#thrustBar').style.width = (THRUST / 260) * 100 + '%';
    $('#weightBar').style.width = Math.min(100, (w / 260) * 100) + '%';
    const v = $('#verdict');
    const ok = THRUST > w;
    v.textContent = ok ? 'ঠেলা বল ওজনের চেয়ে বেশি, তাই রকেট উড়বে! ✅' : 'ওজন ঠেলা বলের চেয়ে বেশি, তাই রকেট উঠতে পারবে না! ❌';
    v.className = 'verdict ' + (ok ? 'ok' : 'no');
  }
  fuelIn.addEventListener('input', updateForces);
  loadIn.addEventListener('input', updateForces);
  updateForces();

  function simulate(load, fuel) {
    let m = DRY + load + fuel, f = fuel, v = 0, h = 0, t = 0;
    const dt = 0.02, path = [];
    if (THRUST / m <= G) return null;
    while (true) {
      const burning = f > 0;
      if (burning) { f -= BURN * dt; m -= BURN * dt; }
      v += ((burning ? THRUST : 0) / m - G) * dt;
      h += v * dt; t += dt;
      path.push({ t, km: Math.max(0, h * KM), burning });
      if (!burning && v <= 0) break;
    }
    return path;
  }

  function setView(km) {
    const p = px(km);
    const cam = Math.max(0, p - 190);
    layer.style.transform = `translateY(${cam}px)`;
    rocket.style.transform = `translateY(${-(p - cam)}px)`;
    $('#night').style.opacity = Math.min(1, Math.max(0, (km - 15) / 85));
    $('#starsBg').style.opacity = Math.min(1, Math.max(0, (km - 45) / 55));
    altEl.textContent = bn(km < 10 ? km.toFixed(1) : Math.round(km)) + ' কিমি';
  }

  function smoke() {
    const r = rocket.getBoundingClientRect(), s = sky.getBoundingClientRect();
    const el = document.createElement('i');
    el.className = 'smoke';
    el.style.left = r.left - s.left + r.width / 2 - 13 + 'px';
    el.style.top = r.bottom - s.top - 18 + 'px';
    el.style.setProperty('--sx', (Math.random() * 60 - 30) + 'px');
    sky.appendChild(el);
    setTimeout(() => el.remove(), 1400);
  }

  const wait = (ms) => new Promise((r) => setTimeout(r, calm() ? 0 : ms));

  async function countdown() {
    for (const n of ['৩', '২', '১']) {
      cdEl.textContent = n;
      cdEl.classList.remove('tick'); void cdEl.offsetWidth; cdEl.classList.add('tick');
      await wait(700);
    }
    cdEl.textContent = '';
  }

  function complete(m) {
    const li = $(`#missions [data-m="${m}"]`);
    if (!done.has(m)) { done.add(m); li.classList.add('done'); li.animate?.([{ transform: 'scale(1.06)' }, { transform: 'none' }], { duration: 400 }); }
  }

  launchBtn.addEventListener('click', async () => {
    if (flying) return;
    flying = true; tries++;
    launchBtn.disabled = true; fuelIn.disabled = true; loadIn.disabled = true;
    setView(0);
    say(bubble, 'সবাই তৈরি? গোনা শুরু...', '');
    // on phones the sky sits above the controls: bring it into view for the flight
    const head = $('.top').offsetHeight + 8;
    const skyTop = sky.getBoundingClientRect().top;
    if (skyTop < head || skyTop > innerHeight * 0.4) window.scrollTo({ top: scrollY + skyTop - head, behavior: calm() ? 'auto' : 'smooth' });
    await countdown();

    const path = simulate(+loadIn.value, +fuelIn.value);
    let smokeT = setInterval(smoke, 90);
    rocket.classList.add('burn');

    if (!path) {
      rocket.classList.add('shake');
      await wait(1600);
      rocket.classList.remove('burn', 'shake');
      clearInterval(smokeT);
      say(bubble, 'উফ! রকেট নড়লই না। 😟 ওজন ঠেলা বলের চেয়ে বেশি হয়ে গেছে। মালপত্র কমিয়ে দেখো। মজার কথা হলো, জ্বালানিরও কিন্তু ওজন আছে!', 'sad');
    } else {
      const top = path[path.length - 1].km;
      const D = calm() ? 1 : Math.min(7500, Math.max(3000, 2500 + top * 30));
      const t0 = performance.now();
      await new Promise((res) => {
        (function frame(now) {
          const k = Math.min(1, (now - t0) / D);
          const idx = Math.min(path.length - 1, Math.floor(k * (path.length - 1)));
          const s = path[idx];
          setView(s.km);
          if (!s.burning && rocket.classList.contains('burn')) { rocket.classList.remove('burn'); clearInterval(smokeT); }
          k < 1 ? requestAnimationFrame(frame) : res();
        })(t0);
      });
      rocket.classList.remove('burn');
      clearInterval(smokeT);
      setView(top);
      const h = bn(top < 10 ? top.toFixed(1) : Math.round(top));
      complete('lift');
      if (top >= 10) complete('cloud');
      if (top >= 100) complete('space');

      if (top >= 100) {
        say(bubble, `অসাধারণ! ${h} কিমি! তুমি মহাকাশে পৌঁছে গেছ! 🌌 মাটি থেকে ১০০ কিমি ওপরে যেখানে মহাকাশ শুরু, তার নাম কারমান রেখা।`, 'happy');
        confetti(40);
      } else if (top >= 10) {
        say(bubble, `দারুণ! ${h} কিমি উঠে তুমি মেঘের ওপরে চলে গেছ! ☁️ মহাকাশ শুরু হয় ১০০ কিমি ওপরে। মালপত্র আরও কমিয়ে দেখো তো!`, 'happy');
      } else {
        say(bubble, `রকেট উঠল ${h} কিমি! 👏 মেঘ পর্যন্ত যেতে চাইলে ওজন কমাও, বা জ্বালানি বাড়াও।`, 'happy');
      }
      unlock(1);
    }

    // show তুহিন's verdict together with the rocket
    const buddyTop = $('.buddy').getBoundingClientRect().top;
    window.scrollTo({ top: scrollY + buddyTop - ($('.top').offsetHeight + 8), behavior: calm() ? 'auto' : 'smooth' });

    if (tries >= 3 && !done.has('space')) {
      await wait(3500);
      say(bubble, 'একটা গোপন কথা বলি? 🤫 মালপত্র একদম শূন্য করে দাও, আর জ্বালানি দাও অনেক বেশি!', 'happy');
    }
    flying = false;
    launchBtn.disabled = false; fuelIn.disabled = false; loadIn.disabled = false;
    launchBtn.textContent = '🚀 আবার উৎক্ষেপণ!';
  });

  /* ---------- ৩. বাসায় করে দেখো ---------- */
  $('#tried').addEventListener('change', (e) => {
    if (e.target.checked) { say(bubble, 'বাহ! তুমি তো সত্যিকারের বিজ্ঞানী! 🎉 রকেট কত দূর গেল? পরের বার দুটো বেলুন লাগিয়ে দেখো!', 'happy'); confetti(30); }
  });

  /* ---------- ৪. কুইজ ---------- */
  const QUIZ = [
    { q: 'রকেট ওপরে ওঠে কারণ…', a: ['রকেট বাতাসের চেয়ে হালকা', 'ইঞ্জিন গরম গ্যাস নিচের দিকে ঠেলে দেয়', 'রকেট পাখির মতো ডানা ঝাপটায়'], c: 1,
      why: 'মনে আছে বেলুনটার কথা? গ্যাস যায় নিচে, তাই রকেট যায় ওপরে।' },
    { q: 'রকেট মাটি ছেড়ে উঠতে হলে ঠেলা বলকে হতে হবে…', a: ['ওজনের চেয়ে কম', 'ওজনের সমান', 'ওজনের চেয়ে বেশি'], c: 2,
      why: 'সিমুলেটরের লাল আর বেগুনি দাগ দুটো মনে করো!' },
    { q: 'মহাকাশ শুরু হয় মাটি থেকে প্রায় কত ওপরে?', a: ['১০০ কিমি', '১০ কিমি', '১০,০০০ কিমি'], c: 0,
      why: '১০ কিমিতে তো মেঘ আর বিমান থাকে। আরও ওপরে!' },
  ];
  const right = new Set();
  $('#quiz').innerHTML = QUIZ.map((x, i) => `
    <div class="q soft" data-q="${i}">
      <h3>${bn(i + 1)}. ${x.q}</h3>
      <div class="opts">${x.a.map((o, j) => `<button class="opt soft-sm" data-j="${j}">${o}</button>`).join('')}</div>
      <p class="q__fb" aria-live="polite"></p>
    </div>`).join('');
  $('#quiz').addEventListener('click', (e) => {
    const b = e.target.closest('.opt');
    if (!b) return;
    const box = b.closest('.q');
    const i = +box.dataset.q;
    if (right.has(i)) return;
    const fb = $('.q__fb', box);
    if (+b.dataset.j === QUIZ[i].c) {
      b.classList.add('right');
      right.add(i);
      fb.textContent = ['ঠিক! 🎉', 'একদম ঠিক! ⭐', 'সাবাশ! 🚀'][i];
      fb.style.color = 'var(--teal)';
      if (right.size === QUIZ.length) {
        unlock(3);
        say(bubble, 'তিনে তিন! তুমি তো দারুণ! এবার "পরের ধাপ" চাপো, তোমার জন্য একটা চমক আছে! 🎁', 'happy');
        confetti(30);
      }
    } else {
      b.classList.remove('wrong'); void b.offsetWidth; b.classList.add('wrong');
      fb.textContent = 'উঁহু, আবার ভাবো! ' + QUIZ[i].why;
      fb.style.color = 'var(--pink)';
    }
  });

  go(0);
})();
