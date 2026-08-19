/* =========================================================
   Red Devils Uzbekistan — interaktiv qism
   ========================================================= */
(function () {
  'use strict';

  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
  const MU = 'Manchester United';

  /* ---------------- Header + mobil menyu ---------------- */
  const header = $('#header');
  const nav    = $('#nav');
  const burger = $('#burger');

  const onScroll = () => {
    header.classList.toggle('is-scrolled', window.scrollY > 30);
    $('#toTop').classList.toggle('is-visible', window.scrollY > 600);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  burger.addEventListener('click', () => {
    const open = nav.classList.toggle('is-open');
    burger.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('no-scroll', open);
  });

  $$('.nav__link').forEach(link => link.addEventListener('click', () => {
    nav.classList.remove('is-open');
    burger.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('no-scroll');
  }));

  $('#toTop').addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  /* ---------------- Scroll reveal ---------------- */
  const revealIO = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('is-visible'); revealIO.unobserve(e.target); }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
  $$('.reveal').forEach(el => revealIO.observe(el));

  /* ---------------- Raqamli hisoblagichlar ---------------- */
  const countIO = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target, target = +el.dataset.count, dur = 1400;
      let start = null;
      const step = (ts) => {
        if (!start) start = ts;
        const p = Math.min((ts - start) / dur, 1);
        el.textContent = Math.floor((1 - Math.pow(1 - p, 3)) * target);
        if (p < 1) requestAnimationFrame(step); else el.textContent = target;
      };
      requestAnimationFrame(step);
      countIO.unobserve(el);
    });
  }, { threshold: 0.5 });
  $$('[data-count]').forEach(el => countIO.observe(el));

  /* ---------------- Scrollspy ---------------- */
  const sections = $$('section[id]');
  const spyIO = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      $$('.nav__link').forEach(l => l.classList.toggle('is-active', l.getAttribute('href') === '#' + e.target.id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  sections.forEach(s => spyIO.observe(s));

  /* ---------------- Keyingi o'yin: sanoq ---------------- */
  // Eng yaqin shanba, soat 21:30 (foydalanuvchi vaqti bo'yicha)
  function nextMatchDate() {
    const d = new Date();
    d.setHours(21, 30, 0, 0);
    const diff = (6 - d.getDay() + 7) % 7;           // 6 = shanba
    if (diff === 0 && d <= new Date()) d.setDate(d.getDate() + 7);
    else d.setDate(d.getDate() + diff);
    return d;
  }

  const kickoff = nextMatchDate();
  const MONTHS = ['yanvar','fevral','mart','aprel','may','iyun','iyul','avgust','sentabr','oktabr','noyabr','dekabr'];
  $('#matchDate').textContent =
    `${kickoff.getDate()}-${MONTHS[kickoff.getMonth()]} · ${String(kickoff.getHours()).padStart(2,'0')}:${String(kickoff.getMinutes()).padStart(2,'0')}`;

  const cdCells = $$('#countdown b');
  function tick() {
    let ms = kickoff - new Date();
    if (ms < 0) ms = 0;
    const s = Math.floor(ms / 1000);
    const vals = [Math.floor(s / 86400), Math.floor(s / 3600) % 24, Math.floor(s / 60) % 60, s % 60];
    cdCells.forEach((c, i) => c.textContent = String(vals[i]).padStart(2, '0'));
  }
  tick();
  setInterval(tick, 1000);

  /* ---------------- O'yinlar ---------------- */
  const teamHTML = (name) => name === MU ? `<span class="mu">${name}</span>` : `<span>${name}</span>`;

  $('#fixturesList').innerHTML = FIXTURES.map(m => `
    <li class="match">
      <div class="match__date"><b>${m.date}</b>${m.time}</div>
      <div class="match__teams">
        ${teamHTML(m.home)} <span class="match__score">—</span> ${teamHTML(m.away)}
      </div>
      <div class="match__meta">
        <span class="match__comp">${m.comp}</span>
        <span class="pill pill--d">${m.venue}</span>
      </div>
    </li>`).join('');

  $('#resultsList').innerHTML = RESULTS.map(m => {
    const muHome = m.home === MU;
    const gf = muHome ? m.hs : m.as;
    const ga = muHome ? m.as : m.hs;
    const res = gf > ga ? ['w', "G'alaba"] : gf === ga ? ['d', 'Durang'] : ['l', "Mag'lubiyat"];
    return `
    <li class="match">
      <div class="match__date"><b>${m.date}</b>2025</div>
      <div class="match__teams">
        ${teamHTML(m.home)} <span class="match__score">${m.hs} : ${m.as}</span> ${teamHTML(m.away)}
      </div>
      <div class="match__meta">
        <span class="match__comp">${m.comp}</span>
        <span class="pill pill--${res[0]}">${res[1]}</span>
      </div>
    </li>`;
  }).join('');

  $$('.tabs__btn').forEach(btn => btn.addEventListener('click', () => {
    $$('.tabs__btn').forEach(b => b.classList.remove('is-active'));
    $$('.tab-panel').forEach(p => p.classList.remove('is-active'));
    btn.classList.add('is-active');
    $('#tab-' + btn.dataset.tab).classList.add('is-active');
  }));

  /* ---------------- Tarkib + filtr ---------------- */
  const squadGrid = $('#squadGrid');
  const renderSquad = (pos = 'all') => {
    const list = pos === 'all' ? SQUAD : SQUAD.filter(p => p.pos === pos);
    squadGrid.innerHTML = list.map((p, i) => `
      <article class="player" style="animation-delay:${i * 45}ms">
        <span class="player__num">${p.num}</span>
        <div class="player__shirt">${p.num}</div>
        <h3 class="player__name">${p.name}</h3>
        <p class="player__pos">${p.posName}</p>
        <p class="player__country">🌍 ${p.country}</p>
      </article>`).join('');
  };
  renderSquad();

  $$('#filters .chip').forEach(chip => chip.addEventListener('click', () => {
    $$('#filters .chip').forEach(c => c.classList.remove('is-active'));
    chip.classList.add('is-active');
    renderSquad(chip.dataset.pos);
  }));

  /* ---------------- Turnir jadvali ---------------- */
  $('#tableBody').innerHTML = TABLE.map(t => `
    <tr class="${t.mu ? 'is-mu' : ''}">
      <td class="rank">${t.pos}</td>
      <td><div class="team-cell"><i>${t.team.slice(0, 3).toUpperCase()}</i>${t.team}</div></td>
      <td>${t.p}</td><td>${t.w}</td><td>${t.d}</td><td>${t.l}</td><td>${t.gd}</td>
      <td class="pts">${t.pts}</td>
    </tr>`).join('');

  /* ---------------- Tarix ---------------- */
  $('#timeline').innerHTML = TIMELINE.map((t, i) => `
    <div class="tl-item reveal" style="animation-delay:${i * 60}ms">
      <b>${t.year}</b>
      <h4>${t.title}</h4>
      <p>${t.text}</p>
    </div>`).join('');

  /* ---------------- Afsonalar ---------------- */
  $('#legendsGrid').innerHTML = LEGENDS.map(l => `
    <article class="legend reveal">
      <div class="legend__init">${l.init}</div>
      <h3>${l.name}</h3>
      <p class="role">${l.role}</p>
      <p>${l.text}</p>
    </article>`).join('');

  // Dinamik qo'shilgan bloklarni ham kuzatamiz
  $$('.reveal:not(.is-visible)').forEach(el => revealIO.observe(el));

  /* ---------------- Fan-klub formasi ---------------- */
  const form = $('#joinForm');
  const msg  = $('#formMsg');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    let ok = true;

    ['name', 'city', 'contact'].forEach(n => {
      const input = form.elements[n];
      const field = input.closest('.field');
      const empty = !input.value.trim();
      field.classList.toggle('has-error', empty);
      if (empty) ok = false;
    });

    if (!ok) {
      msg.className = 'form__msg err';
      msg.textContent = 'Iltimos, majburiy maydonlarni to‘ldiring.';
      return;
    }

    msg.className = 'form__msg ok';
    msg.textContent = `Rahmat, ${form.elements.name.value.trim()}! Arizangiz qabul qilindi. Glory Glory Man United! 🔴`;
    form.reset();
  });

  form.addEventListener('input', (e) => e.target.closest('.field')?.classList.remove('has-error'));

  /* ---------------- Yil ---------------- */
  $('#year').textContent = new Date().getFullYear();
})();
