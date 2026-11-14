/* Núcleo: dados, correção, estatísticas, calendário e TRI. Sem dependência de DOM (testável em Node). */
(function (root) {
  const ENEM = root.ENEM || (typeof require !== 'undefined' ? require('./catalog.js') : null);
  const LS_KEY = 'enemapp.v1';

  /* ---------- Datas (sempre strings YYYY-MM-DD locais; nunca new Date('YYYY-MM-DD')) ---------- */
  const pad = n => String(n).padStart(2, '0');
  const dateKey = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`; // m: 0-11
  function todayKey(now) { const d = now || new Date(); return dateKey(d.getFullYear(), d.getMonth(), d.getDate()); }
  function parseKey(k) { const [y, m, d] = String(k).split('-').map(Number); return { y, m: m - 1, d }; }
  function isValidKey(k) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(k || '')) return false;
    const { y, m, d } = parseKey(k); const t = new Date(y, m, d);
    return t.getFullYear() === y && t.getMonth() === m && t.getDate() === d;
  }
  function dayDiff(a, b) { // dias entre duas chaves, imune a horário de verão
    const A = parseKey(a), B = parseKey(b);
    return Math.round((Date.UTC(B.y, B.m, B.d) - Date.UTC(A.y, A.m, A.d)) / 86400000);
  }
  function addDays(k, n) { const { y, m, d } = parseKey(k); const t = new Date(Date.UTC(y, m, d + n)); return dateKey(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate()); }
  function daysInMonth(y, m) { return new Date(y, m + 1, 0).getDate(); }
  function monthMatrix(y, m) { // semanas começando no domingo; null fora do mês
    const first = new Date(y, m, 1).getDay(), n = daysInMonth(y, m), cells = [];
    for (let i = 0; i < first; i++) cells.push(null);
    for (let d = 1; d <= n; d++) cells.push(d);
    while (cells.length % 7) cells.push(null);
    const weeks = []; for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
    return weeks;
  }
  const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  const MESES_CURTO = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const DIAS_SEMANA = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  const fmtDateBR = k => { const { y, m, d } = parseKey(k); return `${pad(d)}/${pad(m + 1)}/${y}`; };

  /* ---------- Estado e persistência ---------- */
  function emptyState() {
    return {
      v: 1,
      profile: { nome: '', curso: '', universidade: '', estado: '', anoIngresso: '', modalidade: '', aceitaOutroEstado: true, tipoInst: 'ambas', cotas: '', bolsa: '' },
      settings: { tema: 'auto', cronometroPorQuestao: false },
      sims: [], gabs: {}, docs: [], params: {}, official: {}, goals: []
    };
  }
  let _id = 0;
  const uid = p => `${p}_${Date.now().toString(36)}${(++_id).toString(36)}${Math.random().toString(36).slice(2, 5)}`;
  function normalize(s) {
    const e = emptyState();
    const o = Object.assign(e, s || {});
    o.profile = Object.assign(e.profile, (s && s.profile) || {});
    o.settings = Object.assign(e.settings, (s && s.settings) || {});
    ['sims', 'docs', 'goals'].forEach(k => { if (!Array.isArray(o[k])) o[k] = []; });
    ['gabs', 'params', 'official'].forEach(k => { if (!o[k] || typeof o[k] !== 'object') o[k] = {}; });
    return o;
  }

  /* ---------- Chaves de prova ---------- */
  const norm = s => String(s == null ? '' : s).trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const gabKey = (year, app, dia, cor) => [year, norm(app), dia, norm(cor)].join('|');
  const simGabKey = s => gabKey(s.year, s.app, s.dia, s.cor);

  /* ---------- Gabarito: leitura de texto colado ---------- */
  function parseGabarito(text, expected) {
    // expected: lista de números de questão esperados. Aceita "1 A", "01-B", "1: C", "1) D", "1 anulada", ou string contínua.
    const answers = {}, notes = [];
    const t = String(text || '').replace(/\r/g, '\n');
    const re = /(\d{1,3})\s*[-–—:.)=]?\s*(anulad[ao]|[A-Ea-e]\b|[*Xx]\b)/g;
    let m, found = 0;
    const exp = new Set(expected);
    while ((m = re.exec(t))) {
      const n = +m[1]; if (!exp.has(n)) continue;
      let v = m[2].toUpperCase(); if (v.startsWith('ANULAD') || v === '*' || v === 'X') v = 'X';
      if (answers[n] && answers[n] !== v) notes.push(`Questão ${n} apareceu com respostas diferentes (${answers[n]} e ${v}). Mantida a última.`);
      answers[n] = v; found++;
    }
    if (found < expected.length * 0.5) { // tenta string contínua
      const letters = t.replace(/[^A-Ea-e*Xx]/g, '').toUpperCase().replace(/\*/g, 'X');
      if (letters.length === expected.length) {
        const a2 = {}; expected.forEach((n, i) => a2[n] = letters[i]);
        return { answers: a2, missing: [], notes: ['Lido como sequência contínua, na ordem das questões do dia.'], mode: 'sequence' };
      }
    }
    const missing = expected.filter(n => !answers[n]);
    return { answers, missing, notes, mode: 'numbered' };
  }

  /* ---------- Correção ---------- */
  function gradeSim(sim, gab) {
    const qs = ENEM.questionList(sim.year, sim.dia);
    const areas = {}; const items = [];
    qs.forEach(q => {
      const a = areas[q.area] || (areas[q.area] = { area: q.area, acertos: 0, erros: 0, brancos: 0, anuladas: 0, total: 0, validas: 0, aprov: null });
      let key = gab && gab.answers ? gab.answers[q.n] : undefined;
      if (q.lem && sim.lem === 'espanhol' && gab && gab.alt && gab.alt[q.n]) key = gab.alt[q.n];
      const mk = sim.answers ? sim.answers[q.n] : undefined;
      let status;
      if (key === 'X') status = 'anulada';
      else if (!mk) status = 'branco';
      else status = mk === key ? 'acerto' : 'erro';
      a.total++;
      if (status === 'acerto') a.acertos++; else if (status === 'erro') a.erros++; else if (status === 'branco') a.brancos++; else a.anuladas++;
      items.push({ n: q.n, area: q.area, marked: mk || null, key: key || null, status, lem: q.lem, secs: (sim.times && sim.times[q.n]) || 0 });
    });
    const total = { acertos: 0, erros: 0, brancos: 0, anuladas: 0, total: 0, validas: 0, aprov: null };
    Object.values(areas).forEach(a => {
      a.validas = a.total - a.anuladas;
      a.aprov = a.validas > 0 ? a.acertos / a.validas * 100 : null;
      ['acertos', 'erros', 'brancos', 'anuladas', 'total', 'validas'].forEach(k => total[k] += a[k]);
    });
    total.aprov = total.validas > 0 ? total.acertos / total.validas * 100 : null;
    return { areas, total, items };
  }
  function missingKeys(sim, gab) {
    if (!gab || !gab.answers) return ENEM.questionList(sim.year, sim.dia).map(q => q.n);
    return ENEM.questionList(sim.year, sim.dia).filter(q => !gab.answers[q.n]).map(q => q.n);
  }
  const gabComplete = (sim, gab) => missingKeys(sim, gab).length === 0;
  const answeredCount = sim => Object.keys(sim.answers || {}).filter(k => sim.answers[k]).length;

  /* ---------- Dificuldade (só com dados informados) ---------- */
  function difficultyOf(gab, n) { return gab && gab.diff && gab.diff[n] ? gab.diff[n] : null; } // 'F','M','D'

  /* ---------- Estatísticas ---------- */
  function fmtPct(v, d = 1) { return v == null ? '—' : v.toFixed(d).replace('.', ',') + '%'; }
  function fmtDur(sec) {
    sec = Math.round(sec || 0); if (!sec) return '—';
    const h = Math.floor(sec / 3600), m = Math.floor(sec % 3600 / 60), s = sec % 60;
    return h ? `${h}h${pad(m)}min` : m ? `${m}min${s ? pad(s) + 's' : ''}` : `${s}s`;
  }
  function gradedSims(state) {
    return state.sims.filter(s => s.status === 'finalizado').map(s => {
      const gab = state.gabs[simGabKey(s)];
      return { sim: s, gab, res: gradeSim(s, gab) };
    });
  }
  function overview(state) {
    const g = gradedSims(state);
    const o = { simulados: g.length, respondidas: 0, acertos: 0, erros: 0, brancos: 0, anuladas: 0, validas: 0, aprov: null, areas: {}, tempoTotal: 0, tempoProvas: 0, qComTempo: 0, melhor: {}, porMes: {}, tempoPorArea: {}, evolucao: [] };
    g.forEach(({ sim, res }) => {
      o.acertos += res.total.acertos; o.erros += res.total.erros; o.brancos += res.total.brancos; o.anuladas += res.total.anuladas; o.validas += res.total.validas;
      o.respondidas += res.total.acertos + res.total.erros;
      if (sim.totalSeconds) { o.tempoTotal += sim.totalSeconds; o.tempoProvas++; }
      Object.values(res.areas).forEach(a => {
        const x = o.areas[a.area] || (o.areas[a.area] = { area: a.area, acertos: 0, erros: 0, brancos: 0, anuladas: 0, total: 0, validas: 0, aprov: null, n: 0 });
        ['acertos', 'erros', 'brancos', 'anuladas', 'total', 'validas'].forEach(k => x[k] += a[k]); x.n++;
        if (a.aprov != null && (!o.melhor[a.area] || a.aprov > o.melhor[a.area].aprov)) o.melhor[a.area] = { aprov: a.aprov, acertos: a.acertos, validas: a.validas, sim };
      });
      res.items.forEach(it => { if (it.secs) { o.qComTempo++; const t = o.tempoPorArea[it.area] || (o.tempoPorArea[it.area] = { s: 0, n: 0 }); t.s += it.secs; t.n++; } });
      const mk = (sim.dateDone || '').slice(0, 7);
      if (mk) { const mm = o.porMes[mk] || (o.porMes[mk] = { acertos: 0, validas: 0 }); mm.acertos += res.total.acertos; mm.validas += res.total.validas; }
    });
    Object.values(o.areas).forEach(a => a.aprov = a.validas ? a.acertos / a.validas * 100 : null);
    o.aprov = o.validas ? o.acertos / o.validas * 100 : null;
    o.evolucao = g.slice().sort((a, b) => (a.sim.dateDone || '').localeCompare(b.sim.dateDone || '') || a.sim.createdAt - b.sim.createdAt)
      .map(({ sim, res }) => ({ sim, aprov: res.total.aprov, areas: res.areas }));
    const ordered = Object.values(o.areas).filter(a => a.aprov != null).sort((a, b) => b.aprov - a.aprov);
    o.forte = ordered[0] || null; o.fraca = ordered.length > 1 ? ordered[ordered.length - 1] : null;
    const vals = o.evolucao.map(e => e.aprov).filter(v => v != null);
    o.media = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
    o.desvio = vals.length > 1 ? Math.sqrt(vals.reduce((s, v) => s + (v - o.media) ** 2, 0) / vals.length) : null;
    o.tempoMedioProva = o.tempoProvas ? o.tempoTotal / o.tempoProvas : null;
    const qDone = g.filter(x => x.sim.totalSeconds).reduce((s, x) => s + x.res.total.total - x.res.total.anuladas, 0);
    o.tempoMedioQuestao = o.tempoTotal && qDone ? o.tempoTotal / qDone : null;
    // maior evolução por área: última vs primeira ocorrência
    const first = {}, last = {};
    o.evolucao.forEach(e => Object.values(e.areas).forEach(a => { if (a.aprov == null) return; if (!first[a.area]) first[a.area] = a.aprov; last[a.area] = a.aprov; }));
    let best = null; Object.keys(first).forEach(k => { if (o.evolucao.filter(e => e.areas[k]).length > 1) { const d = last[k] - first[k]; if (!best || d > best.delta) best = { area: k, delta: d }; } });
    o.maiorEvolucao = best;
    return o;
  }
  function difficultyStats(state) {
    const out = { F: { a: 0, e: 0 }, M: { a: 0, e: 0 }, D: { a: 0, e: 0 }, semDados: 0 };
    gradedSims(state).forEach(({ res, gab }) => res.items.forEach(it => {
      if (it.status !== 'acerto' && it.status !== 'erro') return;
      const d = difficultyOf(gab, it.n); if (!d) { out.semDados++; return; }
      out[d][it.status === 'acerto' ? 'a' : 'e']++;
    }));
    return out;
  }

  /* ---------- Calendário (derivado dos simulados; sem cópia de dados) ---------- */
  function activitiesByDate(state, filter) {
    const map = {};
    state.sims.forEach(s => {
      if (!s.dateDone || !isValidKey(s.dateDone)) return;
      if (filter) {
        if (filter.year && +filter.year !== s.year) return;
        if (filter.dia && +filter.dia !== s.dia) return;
        if (filter.app && filter.app !== s.app) return;
        if (filter.area) { const has = ENEM.structure(s.year).dias.find(d => d.dia === s.dia).areas.some(a => a.area === filter.area); if (!has) return; }
      }
      (map[s.dateDone] = map[s.dateDone] || []).push(s);
    });
    return map;
  }
  function monthStats(state, y, m, filter) {
    const map = activitiesByDate(state, filter), pre = `${y}-${pad(m + 1)}`;
    let dias = 0, sims = 0, secs = 0;
    Object.keys(map).forEach(k => { if (k.startsWith(pre)) { dias++; sims += map[k].length; map[k].forEach(s => secs += s.totalSeconds || 0); } });
    return { dias, sims, secs };
  }
  function streaks(state, today) {
    const keys = Object.keys(activitiesByDate(state)).sort();
    if (!keys.length) return { atual: 0, maior: 0 };
    let maior = 1, run = 1;
    for (let i = 1; i < keys.length; i++) { run = dayDiff(keys[i - 1], keys[i]) === 1 ? run + 1 : 1; if (run > maior) maior = run; }
    let atual = 0; const last = keys[keys.length - 1];
    if (dayDiff(last, today) <= 1) { atual = 1; for (let i = keys.length - 1; i > 0; i--) { if (dayDiff(keys[i - 1], keys[i]) === 1) atual++; else break; } }
    return { atual, maior };
  }

  /* ---------- TRI: apenas com parâmetros informados (modelo logístico de 3 parâmetros) ---------- */
  function irtEstimate(items) { // items: [{a,b,c,u}] u=1 acerto/0 erro; theta escala padrão. EAP com priori N(0,1).
    if (!items.length) return null;
    const D = 1.7; let num = 0, den = 0, varNum = 0; const pts = [];
    for (let t = -4; t <= 4.0001; t += 0.1) {
      let lp = -0.5 * t * t;
      items.forEach(it => { const p = it.c + (1 - it.c) / (1 + Math.exp(-D * it.a * (t - it.b))); lp += it.u ? Math.log(Math.max(p, 1e-9)) : Math.log(Math.max(1 - p, 1e-9)); });
      pts.push([t, lp]);
    }
    const mx = Math.max(...pts.map(p => p[1]));
    pts.forEach(([t, lp]) => { const w = Math.exp(lp - mx); num += t * w; den += w; });
    const theta = num / den; pts.forEach(([t, lp]) => { const w = Math.exp(lp - mx); varNum += (t - theta) ** 2 * w; });
    return { theta, sd: Math.sqrt(varNum / den) };
  }
  function irtPattern(items, theta) { // acertos improváveis e erros improváveis dado theta
    const D = 1.7; let hitsLow = 0, missesEasy = 0;
    items.forEach(it => { const p = it.c + (1 - it.c) / (1 + Math.exp(-D * it.a * (theta - it.b))); if (it.u && p < 0.3) hitsLow++; if (!it.u && p > 0.8) missesEasy++; });
    return { hitsLow, missesEasy };
  }
  function triItemsFor(sim, gab, params, areaId, bScale500) {
    const res = gradeSim(sim, gab), items = [];
    res.items.filter(i => i.area === areaId && (i.status === 'acerto' || i.status === 'erro' || i.status === 'branco')).forEach(i => {
      const p = params && params[i.n]; if (!p) return;
      items.push({ n: i.n, a: +p.a, b: bScale500 ? (+p.b - 500) / 100 : +p.b, c: +p.c, u: i.status === 'acerto' ? 1 : 0 });
    });
    return { items, totalValid: res.areas[areaId] ? res.areas[areaId].validas : 0 };
  }

  const api = {
    LS_KEY, pad, dateKey, todayKey, parseKey, isValidKey, dayDiff, addDays, daysInMonth, monthMatrix, MESES, MESES_CURTO, DIAS_SEMANA, fmtDateBR,
    emptyState, normalize, uid, norm, gabKey, simGabKey, parseGabarito, gradeSim, missingKeys, gabComplete, answeredCount, difficultyOf,
    fmtPct, fmtDur, gradedSims, overview, difficultyStats, activitiesByDate, monthStats, streaks, irtEstimate, irtPattern, triItemsFor
  };
  root.CORE = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
