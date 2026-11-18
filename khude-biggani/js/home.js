(() => {
  const { $, bn, badges, mountTuhin, say, speak } = KB;

  const WORLDS = [
    { id: 'rocket', icon: '🚀', name: 'রকেট ও মহাকাশ', short: 'রকেট', text: 'রকেট কীভাবে ওড়ে? নিজেই রকেট উড়িয়ে দেখো!', c: '#ff7a1a', open: true, href: 'rocket.html' },
    { id: 'robot', icon: '🤖', name: 'রোবট', short: 'রোবট', text: 'রোবটের চোখ, কান আর মগজ কীভাবে কাজ করে?', c: '#2f6bff' },
    { id: 'code', icon: '💻', name: 'কোডিং', short: 'কোডিং', text: 'ব্লক জুড়ে জুড়ে তুহিনকে পথ দেখাও।', c: '#7b5cff' },
    { id: 'sky', icon: '🔭', name: 'আকাশ দেখা', short: 'আকাশ', text: 'সপ্তর্ষি, কালপুরুষ আর ধ্রুবতারা খুঁজে বের করো।', c: '#1d2547' },
    { id: 'energy', icon: '⚡', name: 'বিদ্যুৎ ও শক্তি', short: 'বিদ্যুৎ', text: 'বাতি জ্বালাও, সৌরবিদ্যুৎ দিয়ে গ্রাম আলো করো।', c: '#ffc93c' },
    { id: 'nature', icon: '🌦️', name: 'প্রকৃতি ও আবহাওয়া', short: 'প্রকৃতি', text: 'বর্ষা, ঘূর্ণিঝড় আর সুন্দরবনের রহস্য।', c: '#12b28c' },
  ];
  const got = badges();

  // world cards
  $('#worlds').innerHTML = WORLDS.map((w) => {
    const tag = w.open ? '<span class="world__tag world__tag--open">খেলো এখনই</span>' : '<span class="world__tag soft-in">🔒 শীঘ্রই আসছে</span>';
    const inner = `
      ${got.includes(w.id) ? '<span class="done" title="শেষ করেছ">⭐</span>' : ''}
      <span class="world__icon" style="--c:${w.c}">${w.icon}</span>
      <h3>${w.name}</h3><p>${w.text}</p>${tag}`;
    return w.open
      ? `<a class="world soft" href="${w.href}">${inner}</a>`
      : `<button class="world soft world--locked" data-soon="${w.name}">${inner}</button>`;
  }).join('');

  $('#worlds').addEventListener('click', (e) => {
    const b = e.target.closest('[data-soon]');
    if (b) say($('#heroBubble'), `"${b.dataset.soon}" জগৎটা আমি এখনো বানাচ্ছি! ততক্ষণ চলো রকেট ওড়াই। 🚀`, 'happy');
  });

  // star count + star map
  $('#starCount').textContent = bn(got.length);
  const pts = [[55, 100], [150, 40], [250, 90], [350, 34], [450, 100], [545, 46]];
  const svg = $('#starSvg');
  const star = (x, y, r) => {
    const p = [];
    for (let i = 0; i < 10; i++) {
      const a = (Math.PI / 5) * i - Math.PI / 2;
      const rr = i % 2 ? r * 0.45 : r;
      p.push(`${(x + Math.cos(a) * rr).toFixed(1)},${(y + Math.sin(a) * rr).toFixed(1)}`);
    }
    return p.join(' ');
  };
  svg.innerHTML =
    `<polyline class="sm-line" fill="none" points="${pts.map((p) => p.join(',')).join(' ')}"/>` +
    WORLDS.map((w, i) => `
      <polygon class="sm-star ${got.includes(w.id) ? 'on' : ''}" points="${star(pts[i][0], pts[i][1], 24)}"/>
      <text class="sm-label" x="${pts[i][0]}" y="${pts[i][1] + 54}" text-anchor="middle">${w.short}</text>`).join('');

  // তুহিন
  const tuhin = mountTuhin($('#heroTuhin'));
  const bubble = $('#heroBubble');
  const LINES = [
    'আমাকে কাতুকুতু দিও না! 😆',
    'আমার নাম তুহিন। মজার ব্যাপার কী জানো? এই সাইটটা যিনি বানিয়েছেন, তাঁর নামও তুহিন! 😄',
    'জানো? চাঁদে কোনো বাতাস নেই, তাই সেখানে কোনো শব্দও শোনা যায় না!',
    'আজ রাতে আকাশে কালপুরুষ খুঁজে দেখবে? তিনটা তারা পাশাপাশি এক লাইনে থাকে।',
    'রোবটও ভুল করে। তারপর আবার চেষ্টা করে! তুমিও করবে, তাই না?',
    'আমার বুকে "ত" লেখা কেন বলো তো? তুহিনের "ত"!',
    'আকাশের তারাগুলো আসলে বিশাল বিশাল সূর্য। অনেক দূরে বলে ছোট্ট দেখায়!',
  ];
  let li = 0;
  const poke = () => {
    say(bubble, LINES[li++ % LINES.length], 'happy');
    tuhin.animate([{ transform: 'scale(1)' }, { transform: 'scale(.92,1.06)' }, { transform: 'scale(1.04,.96)' }, { transform: 'scale(1)' }], { duration: 500 });
  };
  tuhin.addEventListener('click', poke);
  tuhin.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); poke(); } });

  $('#hearBtn').addEventListener('click', () => speak(bubble.textContent));

  // welcome back message
  if (got.length) setTimeout(() => say(bubble, `আবার দেখা হলো! তুমি এর মধ্যে ${bn(got.length)}টা তারা জ্বালিয়েছ। দারুণ! ⭐`, 'happy'), 900);
})();
