/* Infra de interface: ícones, armazenamento, rotas, sheet, toast, gráficos, animações. */
(function (root) {
  const C = root.CORE, E = root.ENEM;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ---------- Ícones ---------- */
  const P = {
    home: '<path d="M3 11l9-7 9 7v9a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1z"/>',
    sim: '<rect x="4" y="3" width="16" height="18" rx="3"/><path d="M8 8h8M8 12h8M8 16h4"/>',
    cal: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M8 3v4M16 3v4M3 10h18"/>',
    chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    folder: '<path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>',
    more: '<circle cx="5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="19" cy="12" r="1.4"/>',
    tri: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3"/>',
    uni: '<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11v5c0 1.5 3 3 6 3s6-1.5 6-3v-5"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>', left: '<path d="M15 5l-7 7 7 7"/>', right: '<path d="M9 5l7 7-7 7"/>',
    down: '<path d="M5 9l7 7 7-7"/>', up: '<path d="M5 15l7-7 7 7"/>',
    dl: '<path d="M12 4v11M7 11l5 5 5-5M5 20h14"/>', ext: '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1h5"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/>', check: '<path d="M5 12l5 5 9-10"/>',
    play: '<path d="M7 4l13 8-13 8z"/>', pause: '<path d="M8 4v16M16 4v16"/>', trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/>', pdf: '<path d="M6 3h8l5 5v13H6z"/><path d="M14 3v5h5M9 14h6M9 17h4"/>',
    grid: '<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>', clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8v.5"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01"/>', filter: '<path d="M4 6h16M7 12h10M10 18h4"/>', x: '<path d="M6 6l12 12M18 6L6 18"/>',
    up2: '<path d="M7 17l10-10M9 7h8v8"/>', down2: '<path d="M7 7l10 10M17 9v8H9"/>'
  };
  const I = (n, c) => `<svg class="ico ${c || ''}" viewBox="0 0 24 24" aria-hidden="true">${P[n] || ''}</svg>`;

  /* ---------- Armazenamento ---------- */
  const Store = {
    state: null, t: null, listeners: [],
    load() {
      let raw = null; try { raw = JSON.parse(localStorage.getItem(C.LS_KEY)); } catch (e) { raw = null; }
      this.state = C.normalize(raw); this.applyTheme();
      if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => { });
    },
    save() { clearTimeout(this.t); this.t = setTimeout(() => this.flush(), 150); },
    flush() {
      clearTimeout(this.t);
      try { localStorage.setItem(C.LS_KEY, JSON.stringify(this.state)); this.fail = false; }
      catch (e) { if (!this.fail) { this.fail = true; toast('Não foi possível salvar: armazenamento cheio ou bloqueado. Exporte um backup.'); } }
    },
    mutate(fn) { fn(this.state); this.save(); },
    applyTheme() {
      const t = this.state.settings.tema; document.documentElement.setAttribute('data-theme', t);
      const meta = $('meta[name="theme-color"]'); if (meta) meta.content = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim() || '#F3EEE2';
    }
  };
  addEventListener('pagehide', () => Store.flush());
  document.addEventListener('visibilitychange', () => { if (document.hidden) Store.flush(); });

  /* ---------- Arquivos (PDFs adicionados pelo usuário) em IndexedDB ---------- */
  const Files = {
    db() { return this._db || (this._db = new Promise((res, rej) => { const r = indexedDB.open('enemapp-files', 1); r.onupgradeneeded = () => r.result.createObjectStore('f'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); })); },
    async put(id, blob) { const db = await this.db(); return new Promise((res, rej) => { const tx = db.transaction('f', 'readwrite'); tx.objectStore('f').put(blob, id); tx.oncomplete = res; tx.onerror = () => rej(tx.error); }); },
    async get(id) { const db = await this.db(); return new Promise((res, rej) => { const r = db.transaction('f').objectStore('f').get(id); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }); },
    async del(id) { const db = await this.db(); return new Promise(res => { const tx = db.transaction('f', 'readwrite'); tx.objectStore('f').delete(id); tx.oncomplete = res; tx.onerror = res; }); }
  };

  /* ---------- Toast e sheet ---------- */
  let tt;
  function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(tt); tt = setTimeout(() => t.classList.remove('show'), 2600); }
  const Sheet = {
    open(html, onOpen) { $('#sheet').innerHTML = '<div class="grab"></div>' + html; $('#sheet').classList.add('show'); $('#scrim').classList.add('show'); $('#sheet').scrollTop = 0; if (onOpen) onOpen($('#sheet')); },
    close() { $('#sheet').classList.remove('show'); $('#scrim').classList.remove('show'); }
  };
  function confirmSheet(title, text, okLabel, onOk, danger) {
    Sheet.open(`<h3 class="h-lg">${esc(title)}</h3><p class="muted" style="line-height:1.5">${text}</p>
      <div style="display:grid;gap:10px;margin-top:18px"><button class="btn ${danger ? 'danger' : ''}" data-act="sheet-ok">${esc(okLabel)}</button><button class="btn ghost" data-act="sheet-close">Cancelar</button></div>`);
    confirmSheet.cb = onOk;
  }

  /* ---------- Rotas ---------- */
  const Router = {
    routes: [],
    add(pattern, fn) { const keys = []; const re = new RegExp('^' + pattern.replace(/:(\w+)/g, (_, k) => { keys.push(k); return '([^/?]+)'; }) + '$'); this.routes.push({ re, keys, fn }); },
    parse() { const h = location.hash.replace(/^#/, '') || '/inicio'; const [path, q] = h.split('?'); const query = {}; (q || '').split('&').forEach(p => { if (!p) return; const [k, v] = p.split('='); query[decodeURIComponent(k)] = decodeURIComponent(v || ''); }); return { path, query }; },
    go(h) { if (location.hash === '#' + h) this.render(); else location.hash = h; },
    render() {
      const { path, query } = this.parse();
      for (const r of this.routes) { const m = path.match(r.re); if (m) { const params = {}; r.keys.forEach((k, i) => params[k] = decodeURIComponent(m[i + 1])); this.cur = { path, query, params }; Sheet.close(); const v = $('#view'); v.style.animation = 'none'; void v.offsetWidth; v.style.animation = ''; v.innerHTML = r.fn(params, query) || ''; setNav(path); afterRender(); window.scrollTo(0, 0); return; } }
      this.go('/inicio');
    }
  };
  const NAV = [['/inicio', 'Início', 'home'], ['/simulados', 'Simulados', 'sim'], ['/calendario', 'Calendário', 'cal'], ['/desempenho', 'Desempenho', 'chart'], ['/tri', 'TRI', 'tri'], ['/universidades', 'Universidades', 'uni'], ['/biblioteca', 'Biblioteca', 'folder'], ['/perfil', 'Meu perfil', 'user']];
  const DOCK = ['/inicio', '/simulados', '/calendario', '/biblioteca'];
  function renderNav() {
    $('#side').innerHTML = `<div class="brand">Enem<span style="color:var(--ch)">.</span></div><nav>${NAV.map(n => `<a href="#${n[0]}" data-nav="${n[0]}">${I(n[2])}${n[1]}</a>`).join('')}</nav><div class="foot">Seus dados ficam salvos neste aparelho. Faça backup em Meu perfil.</div>`;
    $('#dock').innerHTML = DOCK.map(p => { const n = NAV.find(x => x[0] === p); return `<a href="#${p}" data-nav="${p}" aria-label="${n[1]}">${I(n[2])}</a>`; }).join('') +
      `<a href="#/desempenho" data-nav="/desempenho" aria-label="Desempenho">${I('chart')}</a><button data-act="more" data-nav="more" aria-label="Mais">${I('more')}</button>`;
  }
  function setNav(path) {
    const base = '/' + path.split('/')[1];
    $$('[data-nav]').forEach(a => { const p = a.getAttribute('data-nav'); const on = p === base || (p === 'more' && ['/tri', '/universidades', '/perfil'].includes(base)); a.classList.toggle('on', on); });
  }

  /* ---------- Animações pós-render ---------- */
  function afterRender() {
    $$('[data-count]').forEach(el => {
      const to = parseFloat(el.dataset.count), dec = +(el.dataset.dec || 0), suf = el.dataset.suf || ''; const t0 = performance.now(), dur = 800;
      const fmt = v => v.toFixed(dec).replace('.', ',') + suf;
      if (isNaN(to)) return; el.textContent = fmt(0);
      (function f(t) { const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3); el.textContent = fmt(to * e); if (p < 1) requestAnimationFrame(f); })(t0);
    });
    requestAnimationFrame(() => requestAnimationFrame(() => {
      $$('[data-w]').forEach(el => el.style.width = el.dataset.w + '%');
      $$('[data-h]').forEach(el => el.style.height = el.dataset.h + '%');
    }));
    $$('.stagger > *').forEach((el, i) => el.style.animationDelay = (i * 45) + 'ms');
  }

  /* ---------- Gráficos SVG ---------- */
  function lineChart(pts, opt) { // pts: [{x:label, y:number, tip}]
    opt = opt || {}; const W = 340, H = opt.h || 150, pl = 26, pr = 10, pt = 12, pb = 22;
    if (!pts.length) return '';
    const max = opt.max != null ? opt.max : 100, min = opt.min != null ? opt.min : 0;
    const X = i => pl + (pts.length === 1 ? (W - pl - pr) / 2 : i * (W - pl - pr) / (pts.length - 1));
    const Y = v => pt + (1 - (v - min) / (max - min)) * (H - pt - pb);
    const grid = [0, .5, 1].map(f => { const v = min + (max - min) * f, y = Y(v); return `<line class="grid" x1="${pl}" x2="${W - pr}" y1="${y}" y2="${y}"/><text x="0" y="${y + 3}">${Math.round(v)}</text>`; }).join('');
    const path = pts.map((p, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)} ${Y(p.y).toFixed(1)}`).join(' ');
    const area = pts.length > 1 ? `<path d="${path} L${X(pts.length - 1)} ${H - pb} L${X(0)} ${H - pb}Z" fill="${opt.color || 'var(--ink)'}" opacity=".07"/>` : '';
    const step = Math.ceil(pts.length / 6);
    const labels = pts.map((p, i) => i % step === 0 ? `<text x="${X(i)}" y="${H - 4}" text-anchor="middle">${esc(p.x)}</text>` : '').join('');
    const dots = pts.map((p, i) => `<circle cx="${X(i).toFixed(1)}" cy="${Y(p.y).toFixed(1)}" r="${i === pts.length - 1 ? 5 : 3.5}" fill="${i === pts.length - 1 ? 'var(--ch)' : 'var(--bg)'}" stroke="${opt.color || 'var(--ink)'}" stroke-width="2" data-tip="${esc(p.tip || p.y)}" style="cursor:pointer"/>`).join('');
    return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img">${grid}${area}<path d="${path}" fill="none" stroke="${opt.color || 'var(--ink)'}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" pathLength="1" style="stroke-dasharray:1;stroke-dashoffset:1;animation:draw 1.1s .1s forwards"/>${labels}${dots}</svg>`;
  }
  const tipEl = () => $('#tip');
  document.addEventListener('click', e => {
    const c = e.target.closest('[data-tip]'); const t = tipEl();
    if (c) { const r = c.getBoundingClientRect(); t.textContent = c.getAttribute('data-tip'); t.style.left = (r.left + r.width / 2) + 'px'; t.style.top = (r.top + r.height / 2) + 'px'; t.classList.add('show'); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('show'), 2400); }
    else t.classList.remove('show');
  });
  function barChart(items, hi) { // items: [{label, v(0-100), tip}]
    return `<div class="bars">${items.map((it, i) => `<div class="b ${i === hi ? 'hi' : ''}" data-tip="${esc(it.tip || '')}"><span>${it.v == null ? '—' : Math.round(it.v)}</span><i data-h="${it.v == null ? 2 : Math.max(2, it.v)}"></i><span>${esc(it.label)}</span></div>`).join('')}</div>`;
  }
  const style = document.createElement('style'); style.textContent = '@keyframes draw{to{stroke-dashoffset:0}}'; document.head.appendChild(style);

  /* ---------- Utilidades de domínio para telas ---------- */
  const simTitle = s => `ENEM ${s.year}${s.dia && E.structure(s.year).dias.length > 1 ? ' — ' + s.dia + 'º dia' : ''}`;
  const simSub = s => [s.app && s.app !== 'Regular' ? s.app : '', s.cor && s.cor !== 'Sem cor / única' ? 'Caderno ' + s.cor : ''].filter(Boolean).join(' · ');
  const areaCss = a => (E.AREAS[a] || {}).css || 'ge';
  const areaName = a => (E.AREAS[a] || {}).curto || a;
  const simAreas = s => E.structure(s.year).dias.find(d => d.dia === s.dia).areas.map(a => a.area);
  const docName = d => {
    const cor = d.cor ? C.norm(d.cor).replace(/[^a-z0-9]+/g, '_').toUpperCase().replace(/^_|_$/g, '') : '';
    const app = d.app && d.app !== 'Regular' ? C.norm(d.app).split(' ')[0].toUpperCase() : '';
    const dia = d.dia ? d.dia + '_DIA' : '';
    const parts = d.tipo === 'gabarito' ? ['ENEM', d.year, app, 'GABARITO', dia, cor] : d.tipo === 'prova' ? ['ENEM', d.year, app, dia, cor ? 'CADERNO_' + cor : ''] : ['ENEM', d.year, app, 'DOCUMENTO', dia, cor];
    return parts.filter(Boolean).join('_') + '.pdf';
  };

  root.UI = { $, $$, esc, I, Store, Files, toast, Sheet, confirmSheet, Router, renderNav, setNav, afterRender, lineChart, barChart, simTitle, simSub, areaCss, areaName, simAreas, docName, NAV };
})(window);
