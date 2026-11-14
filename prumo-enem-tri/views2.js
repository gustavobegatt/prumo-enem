/* Telas: Calendário, Desempenho, TRI, Universidades, Biblioteca (pastas) e Perfil. */
(function (root) {
  const { $, $$, esc, I, Store, Files, toast, Sheet, confirmSheet, Router, lineChart, barChart, simTitle, simSub, areaCss, areaName, simAreas, docName } = root.UI;
  const C = root.CORE, E = root.ENEM; const ACT = root.ACT = root.ACT || {};
  const S = () => Store.state, go = h => Router.go(h), fmtP = C.fmtPct;
  const AREA_ORDER = ['CH', 'LC', 'MT', 'CN', 'GE'];
  const pl = (n, a, b) => n + ' ' + (n === 1 ? a : b);
  const opt =(arr, v) => arr.map(x => `<option ${String(x) === String(v) ? 'selected' : ''}>${esc(x)}</option>`).join('');

  /* ================= CALENDÁRIO ================= */
  const Cal = { mode: 'mes', y: null, m: null, sel: null, dir: '', area: '' };
  function calendario(_, q) {
    const now = new Date(), today = C.todayKey();
    if (Cal.y == null) { Cal.y = now.getFullYear(); Cal.m = now.getMonth(); }
    if (q.d && C.isValidKey(q.d)) { const p = C.parseKey(q.d); Cal.y = p.y; Cal.m = p.m; Cal.sel = q.d; Cal.mode = 'mes'; }
    const f = Cal.area ? { area: Cal.area } : null, map = C.activitiesByDate(S(), f);
    const seg = `<div class="seg" style="margin-bottom:14px">${[['mes', 'Mês'], ['ano', 'Ano'], ['lista', 'Lista']].map(([k, l]) => `<button class="${Cal.mode === k ? 'on' : ''}" data-act="cal-mode" data-v="${k}">${l}</button>`).join('')}</div>`;
    const chips = `<div class="chips" style="margin-bottom:16px"><button class="chip soft ${!Cal.area ? 'on' : ''}" data-act="cal-area" data-v="">Todas as áreas</button>${['CH', 'LC', 'MT', 'CN'].map(a => `<button class="chip soft ${Cal.area === a ? 'on' : ''}" data-act="cal-area" data-v="${a}"><span class="dot area-${areaCss(a)}" style="background:var(--c)"></span>${areaName(a)}</button>`).join('')}</div>`;
    let head, body;
    if (Cal.mode === 'ano') {
      head = `<div class="cal-head"><div><div class="mo">${Cal.y}</div><div class="yr">Visão do ano</div></div><div class="cal-nav"><button class="iconbtn" data-act="cal-nav" data-d="-12" aria-label="Ano anterior">${I('left')}</button><button class="iconbtn" data-act="cal-nav" data-d="12" aria-label="Próximo ano">${I('right')}</button></div></div>`;
      body = `<div class="year-grid stagger">${Array.from({ length: 12 }, (_, m) => yearMini(Cal.y, m, map, today)).join('')}</div>`;
    } else {
      head = `<div class="cal-head"><div><div class="mo">${C.MESES[Cal.m]}</div><div class="yr">${Cal.y}</div></div><div class="cal-nav"><button class="iconbtn" data-act="cal-today" aria-label="Hoje">${I('cal')}</button><button class="iconbtn" data-act="cal-nav" data-d="-1" aria-label="Mês anterior">${I('left')}</button><button class="iconbtn" data-act="cal-nav" data-d="1" aria-label="Próximo mês">${I('right')}</button></div></div>`;
      const ms = C.monthStats(S(), Cal.y, Cal.m, f);
      if (Cal.mode === 'lista') {
        const prefix = `${Cal.y}-${C.pad(Cal.m + 1)}`, keys = Object.keys(map).filter(k => k.startsWith(prefix)).sort();
        body = keys.length ? `<div class="daystrip">${keys.map(k => map[k].map(s => dayItem(k, s)).join('')).join('')}</div>` : `<div class="empty"><b>Nada em ${C.MESES[Cal.m]}</b>Os simulados que você registrar aparecem aqui na data em que foram feitos.</div>`;
      } else {
        const wk = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map(w => `<div class="cal-w">${w}</div>`).join('');
        const cells = C.monthMatrix(Cal.y, Cal.m).flat().map(d => {
          if (!d) return '<div class="cal-d out"></div>'; const k = C.dateKey(Cal.y, Cal.m, d), items = map[k] || [];
          const dots = items.slice(0, 3).map(s => `<i style="--c:var(--${s.status === 'finalizado' ? 'ok' : 'ch'})"></i>`).join('');
          return `<button class="cal-d ${items.length ? 'has' : ''} ${k === today ? 'today' : ''} ${k === Cal.sel ? 'sel' : ''}" data-act="cal-sel" data-k="${k}">${d}<span class="dots">${dots}</span></button>`;
        }).join('');
        body = `<div data-swipe="cal"><div class="cal-grid ${Cal.dir}">${wk}${cells}</div></div>
          <div class="ms" style="margin-top:18px"><div><b>${ms.sims}</b><span>Simulados no mês</span></div><div><b>${ms.dias}</b><span>Dias com atividade</span></div><div><b>${ms.secs ? C.fmtDur(ms.secs) : '—'}</b><span>Tempo registrado</span></div></div>${selPanel(map)}`;
      }
    }
    Cal.dir = '';
    return `<div class="topbar"><h1>Calendário</h1><a class="iconbtn dark" href="#/simulados/novo${Cal.sel ? '?data=' + Cal.sel : ''}" aria-label="Novo simulado">${I('plus')}</a></div>${seg}${chips}${head}${body}`;
  }
  function yearMini(y, m, map, today) {
    const cells = C.monthMatrix(y, m).flat(), pre = `${y}-${C.pad(m + 1)}`;
    const n = Object.keys(map).filter(k => k.startsWith(pre)).length;
    return `<button class="mini m-${m}" data-act="cal-month" data-m="${m}"><h4>${C.MESES[m]}${n ? ` · ${n}` : ''}</h4><div class="mg">${cells.map(d => d ? `<span class="${map[C.dateKey(y, m, d)] ? 'h' : ''}">${d}</span>` : '<span></span>').join('')}</div></button>`;
  }
  function dayItem(k, s) {
    const p = C.parseKey(k), a = simAreas(s)[0];
    return `<button class="dayitem area-${areaCss(a)}" data-act="open-sim" data-id="${s.id}"><div class="dn"><span>${C.DIAS_SEMANA[new Date(p.y, p.m, p.d).getDay()].slice(0, 3)}</span><b>${p.d}</b><span>${C.MESES_CURTO[p.m]}</span></div><div class="dc"><b>${esc(simTitle(s))}</b><div>${esc(simSub(s) || 'Prova regular')} · ${s.status === 'finalizado' ? 'corrigido' : s.status === 'aguardando_gabarito' ? 'aguardando gabarito' : 'em andamento'}</div></div></button>`;
  }
  function selPanel(map) {
    if (!Cal.sel) return `<p class="small faint" style="margin-top:14px">Toque em um dia para ver os simulados dele. Deslize o calendário para trocar de mês.</p>`;
    const items = map[Cal.sel] || [], p = C.parseKey(Cal.sel);
    return `<div class="sec"><div class="sec-h"><h2 class="h-md">${C.DIAS_SEMANA[new Date(p.y, p.m, p.d).getDay()]}, ${C.fmtDateBR(Cal.sel)}</h2><a class="link" href="#/simulados/novo?data=${Cal.sel}">${I('plus', 'sm')} Simulado</a></div>
      ${items.length ? `<div class="daystrip">${items.map(s => dayItem(Cal.sel, s)).join('')}</div>` : '<div class="empty">Nenhum simulado neste dia.</div>'}</div>`;
  }
  ACT['cal-mode'] = el => { Cal.mode = el.dataset.v; Router.render(); };
  ACT['cal-area'] = el => { Cal.area = el.dataset.v; Router.render(); };
  ACT['cal-sel'] = el => { Cal.sel = Cal.sel === el.dataset.k ? null : el.dataset.k; Router.render(); };
  ACT['cal-today'] = () => { const n = new Date(); Cal.y = n.getFullYear(); Cal.m = n.getMonth(); Cal.sel = C.todayKey(); Router.render(); };
  ACT['cal-month'] = el => { Cal.m = +el.dataset.m; Cal.mode = 'mes'; Router.render(); };
  ACT['cal-nav'] = el => { const d = +el.dataset.d, t = Cal.y * 12 + Cal.m + d; Cal.dir = d > 0 ? 'l' : 'r'; Cal.y = Math.floor(t / 12); Cal.m = t % 12; Router.render(); };

  /* ================= DESEMPENHO ================= */
  function desempenho() {
    const s = S(), o = C.overview(s);
    if (!o.simulados) return `<div class="topbar"><h1>Desempenho</h1><span></span></div><h2 class="h-xl">Seus números<br>aparecem aqui</h2><div class="empty" style="margin-top:22px"><b>Nenhum simulado corrigido</b>O desempenho é calculado apenas com simulados finalizados e gabarito cadastrado. Nenhum número é estimado ou inventado.<div style="margin-top:14px"><a class="btn sm" href="#/simulados/novo">Novo simulado</a></div></div>`;
    const ev = o.evolucao.filter(e => e.aprov != null);
    const pts = ev.map(e => ({ x: C.fmtDateBR(e.sim.dateDone).slice(0, 5), y: e.aprov, tip: `${simTitle(e.sim)} · ${fmtP(e.aprov)}` }));
    const areas = AREA_ORDER.filter(a => o.areas[a]);
    const meses = Object.keys(o.porMes).sort().slice(-7).map(k => ({ label: C.MESES_CURTO[+k.slice(5) - 1], v: o.porMes[k].validas ? o.porMes[k].acertos / o.porMes[k].validas * 100 : null, tip: `${C.MESES[+k.slice(5) - 1]}: ${o.porMes[k].acertos}/${o.porMes[k].validas}` }));
    const bi = meses.length ? meses.reduce((bi, m, i) => (m.v || 0) > (meses[bi].v || 0) ? i : bi, 0) : -1;
    const ds = C.difficultyStats(s), dl = { F: 'Fáceis', M: 'Médias', D: 'Difíceis' }, hasD = ['F', 'M', 'D'].some(k => ds[k].a + ds[k].e);
    const fmtA = a => a ? `${areaName(a.area)} · ${fmtP(a.aprov)}` : '—';
    return `<div class="topbar"><h1>Desempenho</h1><span></span></div>
    <div class="tiny">Aproveitamento geral</div><div class="big-num" style="margin-top:6px"><span data-count="${o.aprov}" data-dec="1" data-suf="%">0%</span></div>
    <p class="small muted" style="margin:8px 0 0">${pl(o.acertos, 'acerto', 'acertos')} · ${pl(o.erros, 'erro', 'erros')} · ${o.brancos} em branco${o.anuladas ? ` · ${pl(o.anuladas, 'anulada', 'anuladas')} fora do cálculo` : ''} em ${o.simulados} simulado${o.simulados > 1 ? 's' : ''}.</p>
    <div class="d-grid"><div>
    <div class="sec"><div class="sec-h"><h2 class="h-md">Evolução</h2><span class="small faint">toque nos pontos</span></div>${pts.length ? lineChart(pts) : ''}
      ${o.media != null ? `<div class="ms" style="margin-top:14px"><div><b>${fmtP(o.media, 0)}</b><span>Média dos simulados</span></div><div><b>${o.desvio == null ? '—' : fmtP(o.desvio, 1)}</b><span>Variação (desvio)</span></div><div><b>${o.maiorEvolucao ? (o.maiorEvolucao.delta >= 0 ? '+' : '') + o.maiorEvolucao.delta.toFixed(0) : '—'}</b><span>${o.maiorEvolucao ? 'Evolução em ' + areaName(o.maiorEvolucao.area) : 'Evolução por área'}</span></div></div>` : ''}</div>
    <div class="sec"><h2 class="h-md">Por área</h2><div class="grid2 stagger" style="margin-top:6px">${areas.map(a => { const x = o.areas[a]; return `<div class="folder area-${areaCss(a)} stat"><div class="k">${areaName(a).toUpperCase()}</div><div class="v">${fmtP(x.aprov, 0)}</div><div class="s">${x.acertos}/${x.validas} válidas${o.melhor[a] ? `<br>Melhor: ${fmtP(o.melhor[a].aprov, 0)}` : ''}</div><div class="bar"><i data-w="${x.aprov || 0}"></i></div></div>`; }).join('')}</div>
      <div class="note"><b>Mais forte:</b> ${fmtA(o.forte)}<br><b>Mais fraca:</b> ${fmtA(o.fraca)}</div></div>
    </div><div>
    ${meses.length > 1 ? `<div class="sec"><h2 class="h-md">Por mês</h2>${barChart(meses, bi)}</div>` : ''}
    <div class="sec"><h2 class="h-md">Tempo</h2><div class="ms" style="margin-top:10px"><div><b>${o.tempoMedioProva ? C.fmtDur(o.tempoMedioProva) : '—'}</b><span>Tempo médio por prova</span></div><div><b>${o.tempoMedioQuestao ? C.fmtDur(o.tempoMedioQuestao) : '—'}</b><span>Média por questão</span></div><div><b>${o.tempoTotal ? C.fmtDur(o.tempoTotal) : '—'}</b><span>Total estudado</span></div></div>
      ${Object.keys(o.tempoPorArea).length ? `<div class="rows" style="margin-top:8px">${Object.keys(o.tempoPorArea).map(a => `<div class="row" style="grid-template-columns:1fr auto;padding:10px 0"><span><span class="dot area-${areaCss(a)}" style="background:var(--c);margin-right:8px"></span>${areaName(a)}</span><b>${C.fmtDur(o.tempoPorArea[a].s / o.tempoPorArea[a].n)}/questão</b></div>`).join('')}</div>` : '<p class="small faint">Para ver o tempo por área, ative “Cronometrar cada questão” em Meu perfil.</p>'}</div>
    <div class="sec"><h2 class="h-md">Por dificuldade</h2>${hasD ? `<table class="table" style="margin-top:8px"><tr><th></th><th>Acertos</th><th>Erros</th><th>Taxa</th></tr>${['F', 'M', 'D'].map(k => `<tr><td><b>${dl[k]}</b></td><td>${ds[k].a}</td><td>${ds[k].e}</td><td>${ds[k].a + ds[k].e ? fmtP(ds[k].a / (ds[k].a + ds[k].e) * 100, 0) : '—'}</td></tr>`).join('')}</table><p class="small faint">Considera só as questões com classificação informada por você${ds.semDados ? ` (${ds.semDados} sem classificação).` : '.'}</p>` : `<div class="note">Sem dados de dificuldade. O app não classifica questões pelo seu resultado. Informe uma classificação com fonte em Gabarito → Dificuldade.</div>`}</div>
    </div></div>`;
  }

  /* ================= TRI ================= */
  function triHome() {
    const g = C.gradedSims(S());
    return `<div class="topbar"><h1>Simulador TRI</h1><span></span></div><h2 class="h-xl">Nota estimada<br>pela TRI</h2>
    <div class="note warn" style="margin-top:18px"><b>Leia antes.</b> A nota oficial do ENEM usa parâmetros de cada item (discriminação a, dificuldade b, acerto casual c) calibrados pelo INEP. Esses parâmetros só valem se vierem de uma fonte que você confie. O app <b>não inventa</b> parâmetros: sem eles, não há nota TRI. Com eles, calcula uma <b>estimativa de estudo</b>, que não é a nota oficial.</div>
    ${g.length ? `<div class="rows" style="margin-top:14px">${g.map(({ sim, res }) => `<button class="row" data-act="tri-open" data-id="${sim.id}"><div class="dcol"><b>${sim.year % 100}</b><span>${sim.dia}º dia</span></div><div><div class="t">${esc(simTitle(sim))}</div><div class="st">${esc(simSub(sim) || 'Prova regular')} · ${fmtP(res.total.aprov, 0)} de acertos</div>${sim.tri ? `<div class="st"><b>${Object.keys(sim.tri).length}</b> área(s) estimada(s)</div>` : ''}</div>${I('right')}</button>`).join('')}</div>` : `<div class="empty" style="margin-top:20px"><b>Nenhum simulado corrigido</b>Corrija um simulado para poder usar a estimativa TRI.</div>`}`;
  }
  ACT['tri-open'] = el => go('/tri/' + el.dataset.id);
  function triSim(p) {
    const sim = S().sims.find(x => x.id === p.id); if (!sim || sim.status !== 'finalizado') return '<div class="empty"><b>Simulado não corrigido</b><a class="btn sm" href="#/tri">Voltar</a></div>';
    const key = C.simGabKey(sim), gab = S().gabs[key], pm = S().params[key] || { items: {}, scale: 'padrao' }, items = pm.items || {}, areas = simAreas(sim);
    const block = a => {
      const have = E.questionList(sim.year, sim.dia).filter(q => q.area === a && items[q.n]).length, total = E.questionList(sim.year, sim.dia).filter(q => q.area === a).length;
      const inp = C.triItemsFor(sim, gab, items, a, pm.scale === 'enem'); let res = '';
      if (have === 0) res = `<div class="note">Sem parâmetros para esta área.</div>`;
      else if (have < total * 0.8) res = `<div class="note warn">Parâmetros em apenas <b>${have} de ${total}</b> questões. Para uma estimativa confiável, preencha ao menos 80% das questões da área.</div>`;
      else {
        const est = C.irtEstimate(inp.items), pat = C.irtPattern(inp.items, est.theta), nota = 500 + 100 * est.theta;
        res = `<div class="block area-${areaCss(a)} stat" style="margin-top:10px"><div class="k">ESTIMATIVA NA ESCALA 500 ± 100 (aprox.)</div><div class="v">${nota.toFixed(0)}</div><div class="s">margem aproximada ±${(est.sd * 100 * 1.96).toFixed(0)} pontos · ${inp.items.filter(i => i.u).length} acertos em ${inp.items.length} itens usados</div></div>
          <div class="note"><b>Coerência:</b> ${pat.hitsLow} acerto${pat.hitsLow === 1 ? '' : 's'} em itens muito difíceis para o seu nível e ${pat.missesEasy} erro${pat.missesEasy === 1 ? '' : 's'} em itens muito fáceis. ${pat.hitsLow + pat.missesEasy > 4 ? 'Padrão irregular costuma indicar chutes ou desatenção.' : 'Padrão coerente com o nível estimado.'}<br>Esta é uma estimativa de estudo (modelo logístico de 3 parâmetros), não a nota oficial.</div>
          <button class="btn soft sm" style="margin-top:10px" data-act="tri-save" data-id="${sim.id}" data-a="${a}" data-n="${nota.toFixed(1)}">Guardar esta estimativa</button>${sim.tri && sim.tri[a] ? ` <span class="small muted">guardada: ${sim.tri[a].nota.toFixed(0)}</span>` : ''}`;
      }
      return `<div class="sec"><div class="sec-h"><h2 class="h-md"><span class="dot area-${areaCss(a)}" style="background:var(--c);margin-right:8px"></span>${areaName(a)}</h2><span class="small faint">${have}/${total} com parâmetros</span></div>${res}</div>`;
    };
    return `<div class="topbar"><a class="iconbtn" href="#/tri" aria-label="Voltar">${I('left')}</a><h1>TRI</h1><span style="width:42px"></span></div><div class="tiny">${esc(simSub(sim) || 'Prova regular')}</div><h2 class="h-xl" style="margin-top:6px">${esc(simTitle(sim))}</h2>
    <div class="card" style="margin-top:18px"><b>Parâmetros dos itens</b><p class="small muted" style="margin:6px 0 10px;line-height:1.45">Cole uma linha por questão: <code>número a b c</code> (aceita vírgula decimal). Informe de onde vieram. Os parâmetros são ligados a esta prova (ano, dia, cor).</p>
      <label class="field" style="margin-top:0"><span>Escala do parâmetro b</span><div class="seg"><button data-act="tri-scale" data-id="${sim.id}" data-v="padrao" class="${pm.scale !== 'enem' ? 'on' : ''}">Padrão (θ ~ 0)</button><button data-act="tri-scale" data-id="${sim.id}" data-v="enem" class="${pm.scale === 'enem' ? 'on' : ''}">Escala ENEM (500/100)</button></div></label>
      <textarea class="txt" id="tri-paste" placeholder="1 1,2 0,35 0,2&#10;2 0,9 -0,4 0,18"></textarea>
      <label class="field"><span>Fonte dos parâmetros</span><input class="inp" id="tri-src" value="${esc(pm.fonte || '')}" placeholder="Ex.: arquivo de itens do INEP, estudo de terceiros"></label>
      <button class="btn block" style="margin-top:10px" data-act="tri-parse" data-id="${sim.id}">Salvar parâmetros</button>
      ${Object.keys(items).length ? `<p class="small muted" style="margin:10px 0 0">${Object.keys(items).length} itens salvos${pm.fonte ? ' · fonte: ' + esc(pm.fonte) : ''}. <button class="link" data-act="tri-clear" data-id="${sim.id}">Limpar</button></p>` : ''}</div>
    ${areas.map(block).join('')}`;
  }
  ACT['tri-scale'] = el => { const sim = S().sims.find(x => x.id === el.dataset.id), k = C.simGabKey(sim); Store.mutate(st => { const p = st.params[k] || (st.params[k] = { items: {}, scale: 'padrao' }); p.scale = el.dataset.v; }); Router.render(); };
  ACT['tri-parse'] = el => {
    const sim = S().sims.find(x => x.id === el.dataset.id), k = C.simGabKey(sim), exp = new Set(E.questionList(sim.year, sim.dia).map(q => q.n)), items = {}; let bad = 0;
    $('#tri-paste').value.split(/\n+/).forEach(line => { if (!line.trim()) return; const v = line.replace(/,/g, '.').split(/[\s;\t]+/).map(Number); if (v.length < 4 || v.slice(0, 4).some(isNaN) || !exp.has(v[0]) || v[1] <= 0 || v[3] < 0 || v[3] >= 1) { bad++; return; } items[v[0]] = { a: v[1], b: v[2], c: v[3] }; });
    if (!Object.keys(items).length) return toast('Nenhuma linha válida. Formato: número a b c.');
    if (!$('#tri-src').value.trim()) return toast('Informe a fonte dos parâmetros.');
    Store.mutate(st => { const p = st.params[k] || (st.params[k] = { items: {}, scale: 'padrao' }); Object.assign(p.items, items); p.fonte = $('#tri-src').value.trim(); }); Store.flush();
    toast(`${Object.keys(items).length} itens salvos${bad ? `, ${bad} linha(s) ignorada(s)` : ''}.`); Router.render();
  };
  ACT['tri-clear'] = el => { const sim = S().sims.find(x => x.id === el.dataset.id), k = C.simGabKey(sim); Store.mutate(st => { delete st.params[k]; }); Router.render(); };
  ACT['tri-save'] = el => { Store.mutate(st => { const s = st.sims.find(x => x.id === el.dataset.id); s.tri = s.tri || {}; s.tri[el.dataset.a] = { nota: +el.dataset.n, date: C.todayKey() }; }); Store.flush(); toast('Estimativa guardada.'); Router.render(); };

  /* ================= UNIVERSIDADES ================= */
  function uni() {
    const s = S(), goals = s.goals, est = []; s.sims.forEach(x => x.tri && Object.values(x.tri).forEach(t => est.push(t.nota)));
    const media = est.length ? est.reduce((a, b) => a + b, 0) / est.length : null;
    return `<div class="topbar"><h1>Universidades</h1><button class="iconbtn dark" data-act="goal-form" aria-label="Adicionar curso">${I('plus')}</button></div><h2 class="h-xl">Seus cursos<br>e notas de corte</h2>
    <div class="note" style="margin-top:16px"><b>Sem lista pronta de propósito.</b> Notas de corte mudam a cada processo seletivo e por modalidade. Cadastre os cursos que interessam <b>com a nota e a fonte</b> que você conferiu (SiSU, edital da instituição). O app compara com a sua estimativa TRI guardada${media != null ? `: <b>média de ${media.toFixed(0)}</b> em ${est.length} estimativa(s) por área` : ' (ainda não há estimativas)'}.${s.profile.curso ? `<br>Curso no seu perfil: <b>${esc(s.profile.curso)}</b>${s.profile.universidade ? ' · ' + esc(s.profile.universidade) : ''}.` : ''}</div>
    ${goals.length ? `<div class="stagger">${goals.map((g, i) => { const gap = media != null && g.nota ? g.nota - media : null; return `<div class="folder area-${['ge', 'cn', 'ch', 'lc', 'mt'][i % 5]}"><div style="display:flex;justify-content:space-between;gap:10px"><div><div class="h-md">${esc(g.curso)}</div><div class="small" style="opacity:.8">${esc(g.uni)}${g.modalidade ? ' · ' + esc(g.modalidade) : ''}</div></div><button class="iconbtn" style="border-color:rgba(0,0,0,.3)" data-act="goal-form" data-id="${g.id}" aria-label="Editar">${I('edit')}</button></div>
      <div style="display:flex;gap:22px;margin-top:12px"><div><div class="tiny" style="color:inherit;opacity:.7">Nota de corte</div><b style="font-size:26px;letter-spacing:-.04em">${g.nota ? g.nota.toFixed(1).replace('.', ',') : '—'}</b></div>${gap != null ? `<div><div class="tiny" style="color:inherit;opacity:.7">Diferença p/ sua média</div><b style="font-size:26px;letter-spacing:-.04em">${gap > 0 ? '+' : ''}${gap.toFixed(0)}</b></div>` : ''}</div>
      <div class="small" style="opacity:.8;margin-top:8px">Fonte: ${esc(g.fonte || 'não informada')}${g.ano ? ' · ' + esc(g.ano) : ''}</div></div>`; }).join('')}</div>` : `<div class="empty" style="margin-top:20px"><b>Nenhum curso cadastrado</b>Adicione os cursos que você quer acompanhar.<div style="margin-top:14px"><button class="btn sm" data-act="goal-form">Adicionar curso</button></div></div>`}`;
  }
  ACT['goal-form'] = el => {
    const g = el && el.dataset.id ? S().goals.find(x => x.id === el.dataset.id) : null; const v = k => esc(g ? g[k] || '' : '');
    Sheet.open(`<h3 class="h-lg">${g ? 'Editar curso' : 'Novo curso'}</h3>
      <label class="field"><span>Instituição</span><input class="inp" id="g-uni" value="${v('uni') || esc(S().profile.universidade)}"></label><label class="field"><span>Curso</span><input class="inp" id="g-curso" value="${v('curso') || esc(S().profile.curso)}"></label>
      <div class="two"><label class="field"><span>Nota de corte</span><input class="inp" id="g-nota" inputmode="decimal" value="${g && g.nota ? String(g.nota).replace('.', ',') : ''}"></label><label class="field"><span>Ano / edição</span><input class="inp" id="g-ano" value="${v('ano')}" placeholder="2026"></label></div>
      <label class="field"><span>Modalidade (ampla, cota…)</span><input class="inp" id="g-mod" value="${v('modalidade')}"></label><label class="field"><span>Fonte da nota</span><input class="inp" id="g-fonte" value="${v('fonte')}" placeholder="Ex.: SiSU 2026, edital"></label>
      <div style="display:grid;gap:10px;margin-top:18px"><button class="btn block" data-act="goal-save" data-id="${g ? g.id : ''}">Salvar</button>${g ? `<button class="btn danger block" data-act="goal-del" data-id="${g.id}">Excluir</button>` : ''}</div>`);
  };
  ACT['goal-save'] = el => {
    const uniN = $('#g-uni').value.trim(), curso = $('#g-curso').value.trim(); if (!uniN || !curso) return toast('Informe instituição e curso.');
    const nota = parseFloat($('#g-nota').value.replace(',', '.')); const rec = { uni: uniN, curso, nota: isNaN(nota) ? null : nota, ano: $('#g-ano').value.trim(), modalidade: $('#g-mod').value.trim(), fonte: $('#g-fonte').value.trim() };
    Store.mutate(st => { if (el.dataset.id) Object.assign(st.goals.find(x => x.id === el.dataset.id), rec); else st.goals.push(Object.assign({ id: C.uid('g') }, rec)); }); Store.flush(); Sheet.close(); Router.render();
  };
  ACT['goal-del'] = el => { Store.mutate(st => st.goals = st.goals.filter(x => x.id !== el.dataset.id)); Store.flush(); Sheet.close(); Router.render(); };

  /* ================= BIBLIOTECA (pastas) ================= */
  const Lib = { open: null, all: false };
  function bib(p) {
    if (p && p.ano) Lib.open = +p.ano;
    const docs = S().docs, byYear = {}; docs.forEach(d => (byYear[d.year] = byYear[d.year] || []).push(d));
    const withDocs = Object.keys(byYear).map(Number).sort((a, b) => b - a), recentYears = E.years().slice(0, 6);
    let years = Lib.all ? E.years() : [...new Set([...withDocs, ...recentYears, ...(Lib.open ? [Lib.open] : [])])].sort((a, b) => b - a);
    return `<div class="topbar"><h1>Biblioteca</h1><button class="iconbtn dark" data-act="doc-form" aria-label="Adicionar documento">${I('plus')}</button></div><h2 class="h-xl">Provas e gabaritos<br>por ano</h2>
    <div class="note" style="margin-top:16px">Os PDFs oficiais ficam no site do INEP. Baixe lá e adicione aqui para guardar organizado por ano, dia e cor de caderno (o arquivo fica só neste aparelho). <a href="${E.INEP_URL}" target="_blank" rel="noopener" style="font-weight:650">Abrir página do INEP →</a></div>
    <div class="stack stagger">${years.map((y, i) => {
      const ds = (byYear[y] || []).slice().sort((a, b) => (a.dia || 0) - (b.dia || 0) || a.tipo.localeCompare(b.tipo)), op = Lib.open === y, st = E.structure(y);
      return `<button class="fold f${i % 5} ${op ? 'open' : ''}" data-act="fold" data-y="${y}" style="animation-delay:${i * 40}ms"><div class="fm"><div><div class="fy">${y}</div><div class="fs">${ds.length ? ds.length + ' documento' + (ds.length > 1 ? 's' : '') : 'Nenhum documento ainda'} · ${st.dias.length > 1 ? '2 dias' : 'dia único'}</div></div><span class="chev">${I('right')}</span></div></button>
      <div class="fbody f${i % 5} ${op ? 'show' : ''}" style="background:var(--c)"><div class="small" style="opacity:.85">${esc(st.nota)}</div>
        ${ds.map(d => `<div class="docrow"><div class="dt">${esc(d.nome || docName(d))}</div><div class="dm">${d.tipo === 'prova' ? 'Caderno de questões' : d.tipo === 'gabarito' ? 'Gabarito' : 'Documento'}${d.dia ? ' · ' + d.dia + 'º dia' : ''}${d.cor ? ' · ' + esc(d.cor) : ''}${d.app && d.app !== 'Regular' ? ' · ' + esc(d.app) : ''}${d.fileId ? ' · arquivo guardado' : d.url ? ' · link' : ''}</div>
          <div class="acts">${d.fileId ? `<button class="btn sm" data-act="doc-open" data-id="${d.id}">Abrir</button><button class="btn sm ghost" data-act="doc-dl" data-id="${d.id}">${I('dl', 'sm')} Baixar</button>` : d.url ? `<a class="btn sm" href="${esc(d.url)}" target="_blank" rel="noopener">Abrir link</a>` : ''}<button class="btn sm ghost" data-act="doc-del" data-id="${d.id}">${I('trash', 'sm')}</button></div></div>`).join('')}
        <div class="acts" style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px"><button class="btn sm" style="background:#111;color:#F6F2E8" data-act="doc-form" data-y="${y}">${I('plus', 'sm')} Adicionar</button><a class="btn sm ghost" style="color:#111;border-color:#111" href="#/simulados/novo?ano=${y}">Fazer simulado</a><a class="btn sm ghost" style="color:#111;border-color:#111" href="#/gabarito?ano=${y}&app=Regular&dia=1&cor=Azul">Gabarito</a></div></div>`;
    }).join('')}</div>
    <div style="margin-top:20px;text-align:center">${Lib.all ? '' : `<button class="btn soft sm" data-act="lib-all">Ver todos os anos (${E.FIRST_YEAR}–${E.LAST_CATALOG_YEAR})</button>`}</div>`;
  }
  ACT.fold = el => { const y = +el.dataset.y; Lib.open = Lib.open === y ? null : y; Router.render(); setTimeout(() => { const f = $('.fold.open'); if (f) f.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 50); };
  ACT['lib-all'] = () => { Lib.all = true; Router.render(); };
  ACT['doc-form'] = el => {
    const y0 = +(el && el.dataset.y) || E.LAST_CATALOG_YEAR, yrs = []; for (let y = new Date().getFullYear() + 1; y >= E.FIRST_YEAR; y--) yrs.push(y);
    Sheet.open(`<h3 class="h-lg">Adicionar documento</h3><p class="small muted">Use o PDF oficial baixado do INEP. O nome é gerado automaticamente.</p>
      <div class="two"><label class="field"><span>Ano</span><select class="sel" id="d-year">${opt(yrs, y0)}</select></label><label class="field"><span>Tipo</span><select class="sel" id="d-tipo"><option value="prova">Prova</option><option value="gabarito">Gabarito</option><option value="outro">Outro</option></select></label></div>
      <div class="two"><label class="field"><span>Dia</span><select class="sel" id="d-dia"><option value="1">1º dia</option><option value="2">2º dia</option><option value="0">Não se aplica</option></select></label><label class="field"><span>Cor do caderno</span><select class="sel" id="d-cor"><option value="">—</option>${opt(E.CORES, '')}</select></label></div>
      <label class="field"><span>Aplicação</span><select class="sel" id="d-app">${opt(E.APLICACOES.map(a => a.startsWith('Regular') ? 'Regular' : a), 'Regular')}</select></label>
      <label class="field"><span>Arquivo PDF</span><input class="inp" style="padding-top:12px" type="file" id="d-file" accept="application/pdf,.pdf"></label>
      <label class="field"><span>ou link (opcional)</span><input class="inp" id="d-url" inputmode="url" placeholder="https://..."></label>
      <button class="btn block" style="margin-top:18px" data-act="doc-save">Salvar documento</button>`);
  };
  ACT['doc-save'] = async () => {
    const file = $('#d-file').files[0], url = $('#d-url').value.trim(); if (!file && !url) return toast('Escolha um PDF ou informe um link.');
    if (file && !(file.type === 'application/pdf' || /\.pdf$/i.test(file.name))) return toast('Envie um arquivo PDF.'); if (file && file.size > 60 * 1024 * 1024) return toast('Arquivo acima de 60 MB.');
    if (url && !/^https?:\/\//i.test(url)) return toast('O link precisa começar com http:// ou https://');
    const d = { id: C.uid('doc'), year: +$('#d-year').value, tipo: $('#d-tipo').value, dia: +$('#d-dia').value, cor: $('#d-cor').value, app: $('#d-app').value, addedAt: Date.now() }; d.nome = docName(d);
    try { if (file) { await Files.put(d.id, file); d.fileId = d.id; } else d.url = url; } catch (e) { return toast('Não foi possível guardar o arquivo neste aparelho.'); }
    Store.mutate(st => st.docs.push(d)); Store.flush(); Lib.open = d.year; Sheet.close(); toast('Documento adicionado.'); Router.render();
  };
  async function blobOf(id) { const d = S().docs.find(x => x.id === id); const b = d && await Files.get(d.fileId); return { d, b }; }
  ACT['doc-open'] = async el => { const { b } = await blobOf(el.dataset.id); if (!b) return toast('Arquivo não encontrado neste aparelho.'); const u = URL.createObjectURL(b); window.open(u, '_blank'); setTimeout(() => URL.revokeObjectURL(u), 60000); };
  ACT['doc-dl'] = async el => { const { d, b } = await blobOf(el.dataset.id); if (!b) return toast('Arquivo não encontrado neste aparelho.'); const u = URL.createObjectURL(b), a = document.createElement('a'); a.href = u; a.download = d.nome || docName(d); document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 5000); };
  ACT['doc-del'] = el => confirmSheet('Remover documento?', 'O arquivo guardado neste aparelho será apagado. O PDF oficial continua no site do INEP.', 'Remover', async () => { const d = S().docs.find(x => x.id === el.dataset.id); if (d && d.fileId) await Files.del(d.fileId); Store.mutate(st => st.docs = st.docs.filter(x => x.id !== el.dataset.id)); Store.flush(); Sheet.close(); Router.render(); }, true);

  /* ================= PERFIL ================= */
  function perfil() {
    const p = S().profile, se = S().settings, ESTADOS = ['', 'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];
    const f = (k, l, ph, type) => `<label class="field"><span>${l}</span><input class="inp" ${type ? `type="${type}"` : ''} data-input="profile" data-k="${k}" value="${esc(p[k] || '')}" placeholder="${ph || ''}"></label>`;
    return `<div class="topbar"><h1>Meu perfil</h1><span></span></div><h2 class="h-xl">${p.nome ? esc(p.nome) : 'Seus dados'}</h2>
    ${f('nome', 'Nome', 'Como quer ser chamado')}${f('curso', 'Curso desejado')}${f('universidade', 'Instituição desejada')}
    <div class="two"><label class="field"><span>Estado</span><select class="sel" data-change="profile" data-k="estado">${ESTADOS.map(e => `<option ${p.estado === e ? 'selected' : ''}>${e}</option>`).join('')}</select></label>${f('anoIngresso', 'Ano de ingresso', '2027', 'number')}</div>
    <label class="check"><input type="checkbox" data-change="profile-bool" data-k="aceitaOutroEstado" ${p.aceitaOutroEstado ? 'checked' : ''}><span>Aceito estudar em outro estado</span></label>
    <div class="sec"><h2 class="h-md">Aparência e uso</h2>
      <label class="field"><span>Tema</span><div class="seg">${[['auto', 'Automático'], ['light', 'Claro'], ['dark', 'Escuro']].map(([k, l]) => `<button class="${se.tema === k || (k === 'light' && se.tema === 'light') ? 'on' : ''}" data-act="theme" data-v="${k}">${l}</button>`).join('')}</div></label>
      <label class="check"><input type="checkbox" data-change="set-bool" data-k="cronometroPorQuestao" ${se.cronometroPorQuestao ? 'checked' : ''}><span>Cronometrar cada questão (soma o tempo na última questão marcada, para o gráfico de tempo por área)</span></label></div>
    <div class="sec"><h2 class="h-md">Backup dos dados</h2><p class="small muted" style="line-height:1.45">Seus dados ficam só neste aparelho e navegador. Limpar dados do site ou trocar de endereço apaga tudo. Exporte um backup de vez em quando. PDFs guardados na biblioteca <b>não</b> entram no backup (apenas a lista deles).</p>
      <div style="display:grid;gap:10px;margin-top:12px"><button class="btn block" data-act="export">${I('dl')} Exportar backup</button><label class="btn soft block" style="cursor:pointer">${I('plus')} Importar backup<input type="file" accept="application/json,.json" id="imp" style="display:none" data-change="import"></label></div></div>
    <div class="sec"><button class="btn danger block" data-act="reset">Apagar todos os dados</button></div>
    <p class="small faint" style="margin-top:20px;text-align:center">Estrutura das provas conforme divulgado pelo MEC/INEP. Gabaritos e parâmetros TRI sempre vêm de você, com fonte registrada.</p>`;
  }
  ACT.theme = el => { Store.mutate(st => st.settings.tema = el.dataset.v); Store.applyTheme(); Router.render(); };
  ACT.export = () => {
    const blob = new Blob([JSON.stringify({ app: 'enem', exportedAt: new Date().toISOString(), data: S() }, null, 1)], { type: 'application/json' }), u = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = u; a.download = `backup-enem-${C.todayKey()}.json`; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 5000); toast('Backup exportado.');
  };
  ACT.reset = () => confirmSheet('Apagar tudo?', 'Simulados, gabaritos, documentos, perfil e configurações serão apagados deste aparelho. Isso não pode ser desfeito. Exporte um backup antes se quiser guardar.', 'Apagar tudo', async () => { for (const d of S().docs) if (d.fileId) await Files.del(d.fileId); Store.state = C.emptyState(); Store.flush(); Store.applyTheme(); Sheet.close(); toast('Dados apagados.'); go('/inicio'); }, true);
  ACT.importFile = file => {
    const r = new FileReader(); r.onload = () => {
      try {
        const j = JSON.parse(r.result), d = j && j.data; if (!d || typeof d !== 'object' || !Array.isArray(d.sims)) throw 0;
        const n = C.normalize(d); confirmSheet('Importar backup?', `O backup tem ${n.sims.length} simulado(s), ${Object.keys(n.gabs).length} gabarito(s) e ${n.docs.length} documento(s). Isso <b>substitui</b> os dados atuais deste aparelho.`, 'Substituir e importar', () => { Store.state = n; Store.flush(); Store.applyTheme(); Sheet.close(); toast('Backup importado.'); go('/inicio'); });
      } catch (e) { toast('Arquivo de backup inválido.'); }
    }; r.readAsText(file);
  };

  root.VIEWS2 = { calendario, desempenho, triHome, triSim, uni, bib, perfil };
})(window);
