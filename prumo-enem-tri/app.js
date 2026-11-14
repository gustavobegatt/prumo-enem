/* Inicialização, rotas e eventos globais. */
(function () {
  const { $, $$, Store, Router, Sheet, I, renderNav, toast } = UI; const V1 = VIEWS1, V2 = VIEWS2, ACT = window.ACT;

  Store.load(); renderNav();
  Router.add('/inicio', V1.home);
  Router.add('/simulados', V1.simList);
  Router.add('/simulados/novo', V1.simNew);
  Router.add('/simulados/:id', V1.simDetail);
  Router.add('/simulados/:id/resolver', V1.resolver);
  Router.add('/gabarito', V1.gabPage);
  Router.add('/calendario', V2.calendario);
  Router.add('/desempenho', V2.desempenho);
  Router.add('/tri', V2.triHome);
  Router.add('/tri/:id', V2.triSim);
  Router.add('/universidades', V2.uni);
  Router.add('/biblioteca', V2.bib);
  Router.add('/biblioteca/:ano', V2.bib);
  Router.add('/perfil', V2.perfil);

  ACT['sheet-close'] = () => Sheet.close();
  ACT['sheet-ok'] = () => { const cb = UI.confirmSheet.cb; Sheet.close(); if (cb) cb(); };
  ACT.more = () => {
    Sheet.open(`<h3 class="h-lg">Mais</h3><div class="menu" style="margin-top:8px">
      <a href="#/tri"><span class="ic area-mt">${I('tri')}</span>Simulador TRI</a>
      <a href="#/universidades"><span class="ic area-cn">${I('uni')}</span>Universidades</a>
      <a href="#/perfil"><span class="ic area-ch">${I('user')}</span>Meu perfil e backup</a></div>`);
  };

  document.addEventListener('click', e => {
    const el = e.target.closest('[data-act]'); if (!el) return;
    const fn = ACT[el.dataset.act]; if (fn) { e.preventDefault(); fn(el, e); }
  });
  $('#scrim').addEventListener('click', () => Sheet.close());
  document.addEventListener('keydown', e => { if (e.key === 'Escape') Sheet.close(); });

  document.addEventListener('change', e => {
    const el = e.target, k = el.dataset && el.dataset.change; if (!k) return;
    if (k === 'draft') return ACT.draft(el);
    if (k === 'profile') Store.mutate(s => s.profile[el.dataset.k] = el.value);
    else if (k === 'profile-bool') Store.mutate(s => s.profile[el.dataset.k] = el.checked);
    else if (k === 'set-bool') Store.mutate(s => s.settings[el.dataset.k] = el.checked);
    else if (k === 'gab-conf') {
      const q = Router.cur.query, key = el.dataset.key, g = Store.state.gabs[key];
      if (!g) { el.checked = false; return toast('Preencha o gabarito antes de marcar como conferido.'); }
      Store.mutate(() => { g.source = g.source || {}; g.source.status = el.checked ? 'conferido' : 'informado'; g.source.date = el.checked ? CORE.todayKey() : ''; });
      Store.flush(); Router.render();
    } else if (k === 'import') { const f = el.files[0]; if (f) ACT.importFile(f); el.value = ''; }
  });
  document.addEventListener('input', e => {
    const el = e.target, k = el.dataset && el.dataset.input; if (!k) return;
    if (k === 'profile') Store.mutate(s => s.profile[el.dataset.k] = el.value);
    else if (k === 'gab-src') { const g = Store.state.gabs[el.dataset.key]; if (g) Store.mutate(() => { g.source = g.source || {}; g.source[el.dataset.f] = el.value; }); }
  });

  /* Gesto: deslizar o calendário troca de mês */
  let tx = null, ty = null;
  document.addEventListener('touchstart', e => { const s = e.target.closest('[data-swipe]'); if (s) { tx = e.touches[0].clientX; ty = e.touches[0].clientY; } else tx = null; }, { passive: true });
  document.addEventListener('touchend', e => {
    if (tx == null) return; const dx = e.changedTouches[0].clientX - tx, dy = e.changedTouches[0].clientY - ty; tx = null;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.6) ACT['cal-nav']({ dataset: { d: dx < 0 ? 1 : -1 } });
  }, { passive: true });

  addEventListener('hashchange', () => Router.render());
  Router.render();
  setTimeout(() => { const sp = $('#splash'); if (sp) { sp.classList.add('hide'); setTimeout(() => sp.remove(), 600); } }, 350);

  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => { });
})();
