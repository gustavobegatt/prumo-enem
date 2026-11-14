/* Telas: Início, Simulados (lista, novo, detalhe, cartão-resposta) e Gabarito. */
(function (root) {
  const { $, $$, esc, I, Store, toast, Sheet, confirmSheet, Router, simTitle, simSub, areaCss, areaName, simAreas } = root.UI;
  const C = root.CORE, E = root.ENEM; const ACT = root.ACT = root.ACT || {};
  const S = () => Store.state;
  const go = h => Router.go(h);
  const fmtP = C.fmtPct;
  const pl = (n, a, b) => n + ' ' + (n === 1 ? a : b);
  const AREA_ORDER = ['CH', 'LC', 'MT', 'CN', 'GE'];

  function statusBadge(s, gab) {
    if (s.status === 'finalizado') return '<span class="badge ok">Corrigido</span>';
    if (s.status === 'aguardando_gabarito') return '<span class="badge warn">Aguardando gabarito</span>';
    return `<span class="badge">${C.answeredCount(s)}/${E.questionList(s.year, s.dia).length} marcadas</span>`;
  }
  function areaStripes(s) { return `<div class="stripes">${simAreas(s).map(a => `<i class="area-${areaCss(a)}"></i>`).join('')}</div>`; }
  function simRow(s) {
    const d = C.parseKey(s.dateDone || C.todayKey()); const gab = S().gabs[C.simGabKey(s)];
    let right = statusBadge(s, gab);
    if (s.status === 'finalizado') { const r = C.gradeSim(s, gab); right = `<div class="ring" style="--p:${r.total.aprov || 0};--c:var(--ok)"><b>${r.total.aprov == null ? '—' : Math.round(r.total.aprov)}</b></div>`; }
    return `<button class="row" data-act="open-sim" data-id="${s.id}">
      <div class="dcol"><b>${C.pad(d.d)}</b><span>${C.MESES_CURTO[d.m]}</span></div>
      <div><div class="t">${esc(simTitle(s))}</div><div class="st">${esc(simSub(s) || 'Prova regular')}</div>${areaStripes(s)}</div>${right}</button>`;
  }

  /* ================= INÍCIO ================= */
  function home() {
    const s = S(), o = C.overview(s), today = C.todayKey(), t = C.parseKey(today), now = new Date();
    const h = now.getHours(), sal = h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
    const nome = s.profile.nome ? ', ' + esc(s.profile.nome) : '';
    const ev = o.evolucao.filter(e => e.aprov != null); let delta = '';
    if (ev.length > 1) { const d = ev[ev.length - 1].aprov - ev[ev.length - 2].aprov; delta = `<span class="delta ${d >= 0 ? 'up' : 'down'}">${I(d >= 0 ? 'up2' : 'down2', 'sm')}${d >= 0 ? '+' : ''}${d.toFixed(1).replace('.', ',')} pts vs. simulado anterior</span>`; }
    const areasPresent = AREA_ORDER.filter(a => o.areas[a]); const showAreas = areasPresent.length ? areasPresent : ['CH', 'LC', 'MT', 'CN'];
    const areaBlocks = showAreas.map(a => { const x = o.areas[a]; const ps = x ? x.aprov : null;
      return `<div class="folder area-${areaCss(a)} stat"><div class="k">${areaName(a).toUpperCase()}</div><div class="v">${x ? `<span data-count="${x.aprov == null ? 0 : x.aprov}" data-dec="1" data-suf="%">0%</span>` : '—'}</div>
      <div class="s">${x ? `${pl(x.acertos, 'acerto', 'acertos')} de ${x.validas}` : 'Nenhum simulado ainda'}</div><div class="bar"><i data-w="${ps || 0}"></i></div></div>`; }).join('');
    const recent = s.sims.slice().sort((a, b) => (b.dateDone || '').localeCompare(a.dateDone || '') || b.createdAt - a.createdAt).slice(0, 4);
    const spark = ev.length > 1 ? root.UI.lineChart(ev.map(e => ({ x: C.fmtDateBR(e.sim.dateDone).slice(0, 5), y: e.aprov, tip: `${simTitle(e.sim)}: ${fmtP(e.aprov)}` })), { h: 120 }) : '';
    const emptyAll = !s.sims.length;
    return `
    <div class="topbar"><h1>${sal}${nome}</h1><a class="iconbtn" href="#/perfil" aria-label="Meu perfil">${I('user')}</a></div>
    <div class="today-line"><div class="hero"><div class="bigdate">${t.d}</div><div><div class="m">${C.MESES[t.m]}</div><div class="w">${C.DIAS_SEMANA[now.getDay()]} · ${t.y}</div></div></div>
      ${C.streaks(s, today).atual ? `<div style="text-align:right"><div class="tiny">Sequência</div><b style="font-size:22px;letter-spacing:-.03em">${C.streaks(s, today).atual} dia${C.streaks(s, today).atual > 1 ? 's' : ''}</b></div>` : ''}</div>
    <div class="quick"><a class="btn" href="#/simulados/novo">Novo simulado ${I('plus')}</a><a class="btn soft" href="#/biblioteca">Provas ${I('folder')}</a></div>
    <div class="d-grid">
    <div>
      <div class="sec"><div class="tiny">Aproveitamento geral</div>
        <div style="display:flex;align-items:flex-end;justify-content:space-between;gap:12px;margin-top:8px"><div class="big-num">${o.aprov == null ? '—' : `<span data-count="${o.aprov}" data-dec="1" data-suf="%">0%</span>`}</div>
        <div style="text-align:right" class="small muted">${o.simulados} simulado${o.simulados === 1 ? '' : 's'} corrigido${o.simulados === 1 ? '' : 's'}<br>${pl(o.acertos, 'acerto', 'acertos')} · ${pl(o.erros, 'erro', 'erros')}</div></div>
        <div style="margin-top:6px">${delta}</div>${spark ? `<div style="margin-top:14px">${spark}</div>` : ''}
        ${emptyAll ? `<div class="empty" style="margin-top:14px"><b>Seu painel começa aqui</b>Crie o primeiro simulado para ver seus números. Nada é estimado antes disso.</div>` : ''}
      </div>
      <div class="sec"><div class="sec-h"><h2 class="h-md">Por área</h2><a class="link" href="#/desempenho">Detalhes ${I('right', 'sm')}</a></div><div class="grid2 d4 stagger">${areaBlocks}</div></div>
    </div>
    <div>
      <div class="sec"><div class="sec-h"><h2 class="h-md">${C.MESES[t.m]}</h2><a class="link" href="#/calendario">Calendário ${I('right', 'sm')}</a></div>${miniMonth(t.y, t.m)}${monthLine(s, t.y, t.m)}</div>
      <div class="sec"><div class="sec-h"><h2 class="h-md">Atividade recente</h2><a class="link" href="#/simulados">Todos ${I('right', 'sm')}</a></div>
      ${recent.length ? `<div class="rows">${recent.map(simRow).join('')}</div>` : '<div class="empty">Nenhum simulado registrado.</div>'}</div>
    </div></div>`;
  }
  function monthLine(s, y, m) { const ms = C.monthStats(s, y, m); return `<p class="small muted" style="margin:10px 0 0">${ms.sims ? `${ms.sims} simulado${ms.sims > 1 ? 's' : ''} em ${ms.dias} dia${ms.dias > 1 ? 's' : ''}${ms.secs ? ' · ' + C.fmtDur(ms.secs) : ''}` : 'Nenhum simulado neste mês.'}</p>`; }
  function miniMonth(y, m) {
    const map = C.activitiesByDate(S()), today = C.todayKey();
    const cells = C.monthMatrix(y, m).flat();
    return `<div class="cal-grid" style="gap:2px">${['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map(w => `<div class="cal-w">${w}</div>`).join('')}${cells.map(d => {
      if (!d) return '<div></div>'; const k = C.dateKey(y, m, d), has = map[k];
      return `<button class="cal-d ${has ? 'has' : ''} ${k === today ? 'today' : ''}" style="aspect-ratio:1/.8;font-size:14px" data-act="cal-day" data-k="${k}">${d}${has ? `<span class="dots"><i style="--c:var(--ink)"></i></span>` : ''}</button>`;
    }).join('')}</div>`;
  }
  ACT['cal-day'] = el => go('/calendario?d=' + el.dataset.k);

  /* ================= SIMULADOS: LISTA ================= */
  const listFilter = { st: 'todos' };
  function simList() {
    const s = S(); let arr = s.sims.slice().sort((a, b) => (b.dateDone || '').localeCompare(a.dateDone || '') || b.createdAt - a.createdAt);
    const f = listFilter.st; if (f !== 'todos') arr = arr.filter(x => x.status === f);
    const chip = (k, l) => `<button class="chip ${f === k ? 'on' : ''}" data-act="list-filter" data-v="${k}">${l}</button>`;
    return `<div class="topbar"><h1>Simulados</h1><a class="iconbtn dark" href="#/simulados/novo" aria-label="Novo simulado">${I('plus')}</a></div>
    <h2 class="h-xl">Suas provas<br>feitas e em curso</h2>
    <div class="chips" style="margin:18px 0 6px">${chip('todos', 'Todos')}${chip('em_andamento', 'Em andamento')}${chip('aguardando_gabarito', 'Aguardando gabarito')}${chip('finalizado', 'Corrigidos')}</div>
    ${arr.length ? `<div class="rows">${arr.map(simRow).join('')}</div>` : `<div class="empty" style="margin-top:20px"><b>Nenhum simulado${f !== 'todos' ? ' neste filtro' : ''}</b>Escolha o ano, o dia e a cor do caderno para começar.<div style="margin-top:14px"><a class="btn sm" href="#/simulados/novo">Novo simulado</a></div></div>`}`;
  }
  ACT['list-filter'] = el => { listFilter.st = el.dataset.v; Router.render(); };
  ACT['open-sim'] = el => go('/simulados/' + el.dataset.id);

  /* ================= SIMULADOS: NOVO ================= */
  let draft = null;
  function simNew(_, q) {
    if (!draft || q.fresh !== undefined || q.ano || q.data) {
      draft = { year: +(q.ano || E.LAST_CATALOG_YEAR), app: q.app || 'Regular', dia: +(q.dia || 1), cor: q.cor || 'Azul', lem: 'ingles', date: q.data && C.isValidKey(q.data) ? q.data : C.todayKey(), notes: '' };
      try { history.replaceState(null, '', '#/simulados/novo'); } catch (e) { }
    }
    const st = E.structure(draft.year); if (!st.dias.find(d => d.dia === draft.dia)) draft.dia = 1;
    const day = st.dias.find(d => d.dia === draft.dia), hasLem = day.areas.some(a => a.lem);
    const gab = S().gabs[C.gabKey(draft.year, draft.app, draft.dia, draft.cor)], sim = { year: draft.year, dia: draft.dia };
    const miss = C.missingKeys(sim, gab).length, tot = E.questionList(draft.year, draft.dia).length;
    const opt = (arr, v) => arr.map(x => `<option ${String(x) === String(v) ? 'selected' : ''}>${esc(x)}</option>`).join('');
    const yrs = []; for (let y = new Date().getFullYear() + 1; y >= E.FIRST_YEAR; y--) yrs.push(y);
    return `<div class="topbar"><a class="iconbtn" href="#/simulados" aria-label="Voltar">${I('left')}</a><h1>Novo simulado</h1><span style="width:42px"></span></div>
    <h2 class="h-xl">ENEM ${draft.year}${st.dias.length > 1 ? `<br>${draft.dia}º dia` : ''}</h2>
    <div class="note" style="margin-top:16px"><b>Estrutura ${esc(st.periodo)}:</b> ${esc(st.nota)}</div>
    <div class="two"><label class="field"><span>Ano da prova</span><select class="sel" data-change="draft" data-k="year">${opt(yrs, draft.year)}</select></label>
      <label class="field"><span>Dia</span><select class="sel" data-change="draft" data-k="dia">${st.dias.map(d => `<option value="${d.dia}" ${d.dia === draft.dia ? 'selected' : ''}>${esc(d.nome)}</option>`).join('')}</select></label></div>
    <div class="two"><label class="field"><span>Aplicação</span><select class="sel" data-change="draft" data-k="app">${opt(E.APLICACOES.map(a => a.startsWith('Regular') ? 'Regular' : a), draft.app)}</select></label>
      <label class="field"><span>Cor do caderno</span><select class="sel" data-change="draft" data-k="cor">${opt(E.CORES, draft.cor)}</select></label></div>
    ${hasLem ? `<label class="field"><span>Língua estrangeira (5 questões)</span><div class="seg"><button data-act="draft-lem" data-v="ingles" class="${draft.lem === 'ingles' ? 'on' : ''}">Inglês</button><button data-act="draft-lem" data-v="espanhol" class="${draft.lem === 'espanhol' ? 'on' : ''}">Espanhol</button></div></label>` : ''}
    <label class="field"><span>Data em que realizou</span><input class="inp" type="date" value="${draft.date}" data-change="draft" data-k="date"></label>
    <label class="field"><span>Observações (opcional)</span><textarea class="txt" style="min-height:70px" data-change="draft" data-k="notes">${esc(draft.notes)}</textarea></label>
    <div class="note ${miss ? 'warn' : ''}" style="margin-top:18px">${day.areas.map(a => `<span class="dot area-${areaCss(a.area)}" style="background:var(--c)"></span> ${areaName(a.area)} (${a.from}–${a.to})`).join(' &nbsp; ')}<br><br>
      ${!gab ? `<b>Gabarito desta prova ainda não cadastrado.</b> Você pode responder agora e corrigir depois.` : miss ? `<b>Gabarito incompleto:</b> ${tot - miss} de ${tot} questões.` : `<b>Gabarito completo</b> (${gab.source && gab.source.status === 'conferido' ? 'conferido por você com o PDF oficial' : 'informado por você'}).`}
      <br><a href="#/gabarito?${gq(draft.year, draft.app, draft.dia, draft.cor)}" style="font-weight:650">${gab ? 'Revisar gabarito' : 'Cadastrar gabarito'} →</a></div>
    <div style="display:grid;gap:10px;margin-top:22px"><button class="btn block" data-act="create-sim">Criar e responder ${I('arrow')}</button></div>`;
  }
  const gq = (y, a, d, c) => `ano=${y}&app=${encodeURIComponent(a)}&dia=${d}&cor=${encodeURIComponent(c)}`;
  ACT.draft = el => { draft[el.dataset.k] = ['year', 'dia'].includes(el.dataset.k) ? +el.value : el.value; if (el.dataset.k === 'notes') return; const y = window.scrollY; Router.render(); window.scrollTo(0, y); };
  ACT['draft-lem'] = el => { draft.lem = el.dataset.v; const y = window.scrollY; Router.render(); window.scrollTo(0, y); };
  ACT['create-sim'] = () => {
    if (!C.isValidKey(draft.date)) return toast('Informe uma data válida.');
    const s = { id: C.uid('sim'), createdAt: Date.now(), year: draft.year, app: draft.app, dia: draft.dia, cor: draft.cor, lem: draft.lem, dateDone: draft.date, notes: draft.notes.trim(), answers: {}, times: {}, totalSeconds: 0, status: 'em_andamento' };
    Store.mutate(st => st.sims.push(s)); Store.flush(); draft = null; toast('Simulado criado e registrado no calendário.'); go('/simulados/' + s.id + '/resolver');
  };

  /* ================= SIMULADOS: DETALHE ================= */
  function srcLine(gab) { if (!gab) return 'Sem gabarito cadastrado.'; const s = gab.source || {}; return `${esc(s.nome || 'Fonte não informada')}${s.date ? ' · conferido em ' + C.fmtDateBR(s.date) : ''}`; }
  function simDetail(p) {
    const sim = S().sims.find(x => x.id === p.id); if (!sim) return `<div class="empty"><b>Simulado não encontrado</b><a class="btn sm" href="#/simulados">Voltar</a></div>`;
    const gab = S().gabs[C.simGabKey(sim)], total = E.questionList(sim.year, sim.dia).length, miss = C.missingKeys(sim, gab).length;
    const d = C.parseKey(sim.dateDone);
    let body = '';
    if (sim.status === 'finalizado') body = resultBlock(sim, gab);
    else {
      body = `<div class="card" style="margin-top:22px"><div class="tiny">Progresso</div><div class="h-lg" style="margin-top:6px">${C.answeredCount(sim)} de ${total} marcadas</div><div class="prog"><i data-w="${C.answeredCount(sim) / total * 100}"></i></div>
        <div style="display:grid;gap:10px;margin-top:16px"><a class="btn block" href="#/simulados/${sim.id}/resolver">${C.answeredCount(sim) ? 'Continuar respondendo' : 'Abrir cartão-resposta'} ${I('arrow')}</a>
        ${sim.status === 'aguardando_gabarito' ? `<button class="btn soft block" data-act="finalize" data-id="${sim.id}" ${miss ? 'disabled' : ''}>${miss ? 'Cadastre o gabarito para corrigir' : 'Corrigir agora'}</button>` : ''}</div></div>`;
    }
    return `<div class="topbar"><a class="iconbtn" href="#/simulados" aria-label="Voltar">${I('left')}</a><h1>Simulado</h1><button class="iconbtn" data-act="sim-menu" data-id="${sim.id}" aria-label="Opções">${I('more')}</button></div>
    <div class="tiny">${C.DIAS_SEMANA[new Date(d.y, d.m, d.d).getDay()]}, ${C.fmtDateBR(sim.dateDone)}</div>
    <h2 class="h-xl" style="margin-top:6px">${esc(simTitle(sim))}</h2><div class="muted" style="margin-top:6px">${esc(simSub(sim) || 'Prova regular')}${sim.totalSeconds ? ' · ' + C.fmtDur(sim.totalSeconds) : ''}</div>
    ${body}
    <div class="outline" style="margin-top:22px"><div class="sec-h" style="margin-bottom:6px"><div class="tiny">Gabarito vinculado</div>${gab ? `<span class="badge ${gab.source && gab.source.status === 'conferido' ? 'ok' : 'warn'}">${gab.source && gab.source.status === 'conferido' ? 'Conferido' : 'Informado por você'}</span>` : '<span class="badge bad">Ausente</span>'}</div>
      <div class="small muted">${srcLine(gab)}<br>Chave: ENEM ${sim.year} · ${esc(sim.app)} · ${sim.dia}º dia · ${esc(sim.cor)}</div>
      <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap"><a class="btn sm ghost" href="#/gabarito?${gq(sim.year, sim.app, sim.dia, sim.cor)}">${gab ? 'Revisar gabarito' : 'Cadastrar gabarito'}</a><a class="btn sm ghost" href="#/biblioteca/${sim.year}">Prova na biblioteca</a></div></div>
    ${sim.notes ? `<div class="note"><b>Observações:</b> ${esc(sim.notes)}</div>` : ''}`;
  }
  function resultBlock(sim, gab) {
    const r = C.gradeSim(sim, gab), t = r.total, areas = Object.values(r.areas);
    const diff = areas.length ? diffTable(r, gab) : '';
    const timeInfo = timeBlock(sim, r);
    return `<div class="sec" style="margin-top:22px"><div class="tiny">Resultado do dia</div>
      <div style="display:flex;align-items:flex-end;justify-content:space-between;margin-top:6px"><div class="big-num"><span data-count="${t.aprov || 0}" data-dec="1" data-suf="%">0%</span></div>
      <div class="small muted" style="text-align:right">${pl(t.acertos, 'acerto', 'acertos')}<br>${pl(t.erros, 'erro', 'erros')} · ${t.brancos} em branco${t.anuladas ? `<br>${t.anuladas} anulada${t.anuladas > 1 ? 's' : ''}` : ''}</div></div></div>
      <div class="grid2 stagger" style="margin-top:6px">${areas.map(a => `<div class="folder area-${areaCss(a.area)} stat"><div class="k">${areaName(a.area).toUpperCase()}</div><div class="v">${fmtP(a.aprov)}</div>
        <div class="s">${pl(a.acertos, 'acerto', 'acertos')} · ${pl(a.erros, 'erro', 'erros')}<br>${a.brancos} em branco${a.anuladas ? ` · ${a.anuladas} anulada${a.anuladas > 1 ? 's' : ''}` : ''}</div><div class="bar"><i data-w="${a.aprov || 0}"></i></div></div>`).join('')}</div>
      ${t.anuladas ? `<div class="note"><b>Questões anuladas (${t.anuladas}):</b> não entram como erro nem como acerto e saem do cálculo do aproveitamento (acertos ÷ questões válidas). Você pode conferir quais foram no mapa abaixo (listradas).</div>` : ''}
      <div class="sec"><div class="sec-h"><h2 class="h-md">Mapa das questões</h2></div>${areas.map(a => `<div class="tiny" style="margin:14px 0 8px">${areaName(a.area)}</div><div class="map">${r.items.filter(i => i.area === a.area).map(i => `<div class="mchip ${i.status}" data-tip="Q${i.n} · você: ${i.marked || '—'} · gabarito: ${i.key === 'X' ? 'anulada' : i.key || '—'}${i.lem ? ' · língua estrangeira' : ''}">${i.n}</div>`).join('')}</div>`).join('')}
      <p class="small faint" style="margin-top:10px">Verde: acerto · Vermelho: erro · Contorno: em branco · Listrado: anulada. Toque em uma questão para ver sua marcação e o gabarito.</p></div>
      ${diff}${timeInfo}
      <div style="display:grid;gap:10px;margin-top:24px"><a class="btn ghost block" href="#/simulados/${sim.id}/resolver">Revisar marcações</a></div>`;
  }
  function diffTable(r, gab) {
    const o = { F: { a: 0, e: 0 }, M: { a: 0, e: 0 }, D: { a: 0, e: 0 } }; let n = 0;
    r.items.forEach(i => { if (i.status !== 'acerto' && i.status !== 'erro') return; const d = C.difficultyOf(gab, i.n); if (d) { n++; o[d][i.status === 'acerto' ? 'a' : 'e']++; } });
    if (!n) return `<div class="sec"><h2 class="h-md">Dificuldade das questões</h2><div class="note">Sem dados de dificuldade para esta prova. O app não classifica questões pelo seu acerto ou erro. Se você tiver uma fonte confiável, informe-a em <a href="#/gabarito?${gq(0, '', 0, '')}" style="display:none"></a>Gabarito → Dificuldade (opcional).</div></div>`;
    const lab = { F: 'Fáceis', M: 'Médias', D: 'Difíceis' }; const src = (gab.diffSource || 'fonte informada por você');
    return `<div class="sec"><h2 class="h-md">Dificuldade das questões</h2><table class="table" style="margin-top:8px"><tr><th></th><th>Acertos</th><th>Erros</th><th>Taxa</th></tr>${['F', 'M', 'D'].map(k => `<tr><td><b>${lab[k]}</b></td><td>${o[k].a}</td><td>${o[k].e}</td><td>${o[k].a + o[k].e ? fmtP(o[k].a / (o[k].a + o[k].e) * 100, 0) : '—'}</td></tr>`).join('')}</table><p class="small faint">Fonte da classificação: ${esc(src)}.</p></div>`;
  }
  function timeBlock(sim, r) {
    const valid = r.total.total - r.total.anuladas, withT = r.items.filter(i => i.secs).sort((a, b) => b.secs - a.secs);
    if (!sim.totalSeconds && !withT.length) return `<div class="sec"><h2 class="h-md">Tempo</h2><div class="note">Nenhum tempo registrado. Use o cronômetro no cartão-resposta ou edite o tempo total nas opções do simulado.</div></div>`;
    const perArea = {}; withT.forEach(i => { const x = perArea[i.area] || (perArea[i.area] = { s: 0, n: 0 }); x.s += i.secs; x.n++; });
    return `<div class="sec"><h2 class="h-md">Tempo</h2><div class="ms" style="margin-top:10px"><div><b>${C.fmtDur(sim.totalSeconds)}</b><span>Tempo total</span></div><div><b>${sim.totalSeconds && valid ? C.fmtDur(sim.totalSeconds / valid) : '—'}</b><span>Média por questão</span></div><div><b>${withT.length || '—'}</b><span>Questões cronometradas</span></div></div>
      ${Object.keys(perArea).length ? `<div class="rows" style="margin-top:12px">${Object.keys(perArea).map(a => `<div class="row" style="grid-template-columns:1fr auto;padding:10px 0"><div><span class="dot area-${areaCss(a)}" style="background:var(--c);margin-right:8px"></span>${areaName(a)}</div><b>${C.fmtDur(perArea[a].s / perArea[a].n)} /questão</b></div>`).join('')}</div>` : ''}
      ${withT.length ? `<div class="tiny" style="margin-top:16px">Questões que mais consumiram tempo</div><div class="rows">${withT.slice(0, 5).map(i => `<div class="row" style="grid-template-columns:44px 1fr auto;padding:10px 0"><b>Q${i.n}</b><span class="muted small">${areaName(i.area)} · ${i.status === 'acerto' ? 'acerto' : i.status === 'erro' ? 'erro' : i.status}</span><b>${C.fmtDur(i.secs)}</b></div>`).join('')}</div>` : ''}</div>`;
  }
  ACT['sim-menu'] = el => {
    const id = el.dataset.id, sim = S().sims.find(x => x.id === id);
    Sheet.open(`<h3 class="h-lg">${esc(simTitle(sim))}</h3><div style="display:grid;gap:10px;margin-top:18px">
      <button class="btn soft block" data-act="sim-edit" data-id="${id}">${I('edit')} Editar data, tempo e observações</button>
      ${sim.status === 'finalizado' ? `<button class="btn soft block" data-act="sim-reopen" data-id="${id}">Reabrir para alterar respostas</button><button class="btn soft block" data-act="finalize" data-id="${id}">Recorrigir com o gabarito atual</button>` : ''}
      <button class="btn danger block" data-act="sim-del" data-id="${id}">${I('trash')} Excluir simulado</button></div>`);
  };
  ACT['sim-edit'] = el => {
    const sim = S().sims.find(x => x.id === el.dataset.id);
    Sheet.open(`<h3 class="h-lg">Editar simulado</h3><div class="note">Ano e dia não podem mudar (definem a prova e o gabarito). Para isso, exclua e crie outro.</div>
      <label class="field"><span>Data em que realizou</span><input class="inp" type="date" id="e-date" value="${sim.dateDone}"></label>
      <div class="two"><label class="field"><span>Aplicação</span><select class="sel" id="e-app">${E.APLICACOES.map(a => a.startsWith('Regular') ? 'Regular' : a).map(a => `<option ${a === sim.app ? 'selected' : ''}>${esc(a)}</option>`).join('')}</select></label>
      <label class="field"><span>Cor do caderno</span><select class="sel" id="e-cor">${E.CORES.map(a => `<option ${a === sim.cor ? 'selected' : ''}>${esc(a)}</option>`).join('')}</select></label></div>
      <label class="field"><span>Tempo total (minutos)</span><input class="inp" type="number" min="0" id="e-min" value="${Math.round((sim.totalSeconds || 0) / 60)}"></label>
      <label class="field"><span>Observações</span><textarea class="txt" id="e-notes" style="min-height:80px">${esc(sim.notes || '')}</textarea></label>
      <button class="btn block" style="margin-top:18px" data-act="sim-edit-save" data-id="${sim.id}">Salvar</button>`);
  };
  ACT['sim-edit-save'] = el => {
    const date = $('#e-date').value; if (!C.isValidKey(date)) return toast('Data inválida.');
    Store.mutate(st => { const s = st.sims.find(x => x.id === el.dataset.id); s.dateDone = date; s.app = $('#e-app').value; s.cor = $('#e-cor').value; s.totalSeconds = Math.max(0, Math.round((+$('#e-min').value || 0) * 60)); s.notes = $('#e-notes').value.trim(); });
    Store.flush(); Sheet.close(); toast('Atualizado. O calendário acompanha a nova data.'); Router.render();
  };
  ACT['sim-del'] = el => confirmSheet('Excluir simulado?', 'As respostas e o resultado deste simulado serão apagados e ele sai do calendário. Os outros simulados não são afetados.', 'Excluir', () => { Store.mutate(st => st.sims = st.sims.filter(x => x.id !== el.dataset.id)); Store.flush(); toast('Simulado excluído.'); go('/simulados'); }, true);
  ACT['sim-reopen'] = el => { Store.mutate(st => st.sims.find(x => x.id === el.dataset.id).status = 'em_andamento'); Store.flush(); Sheet.close(); go('/simulados/' + el.dataset.id + '/resolver'); };

  /* ================= CARTÃO-RESPOSTA ================= */
  const Run = { id: null, running: false, last: 0, cur: null, area: null, iv: null, saved: 0 };
  function resolver(p) {
    const sim = S().sims.find(x => x.id === p.id); if (!sim) return `<div class="empty"><b>Simulado não encontrado</b></div>`;
    if (Run.id !== sim.id) { Run.id = sim.id; Run.running = false; Run.cur = null; Run.area = null; }
    const qs = E.questionList(sim.year, sim.dia), areas = simAreas(sim); if (!Run.area || !areas.includes(Run.area)) Run.area = areas[0];
    const total = qs.length, done = C.answeredCount(sim); clearInterval(Run.iv); Run.iv = setInterval(tick, 1000);
    return `<div class="sheetbar"><div style="display:flex;align-items:center;justify-content:space-between;gap:10px"><a class="iconbtn" href="#/simulados/${sim.id}" aria-label="Sair do cartão">${I('left')}</a>
      <div class="timer"><button class="iconbtn dark" id="tbtn" data-act="timer" aria-label="Cronômetro">${I(Run.running ? 'pause' : 'play')}</button><span class="tm" id="tm">${fmtClock(sim.totalSeconds)}</span></div>
      <button class="iconbtn" data-act="map" aria-label="Mapa de questões">${I('grid')}</button></div>
      <div style="display:flex;justify-content:space-between;margin-top:10px" class="small"><b>${esc(simTitle(sim))}</b><span class="muted" id="pc">${done}/${total} marcadas</span></div><div class="prog"><i id="pb" style="width:${done / total * 100}%"></i></div>
      <div class="atabs">${areas.map(a => { const n = qs.filter(q => q.area === a), d = n.filter(q => sim.answers[q.n]).length; return `<button class="atab area-${areaCss(a)} ${a === Run.area ? 'on' : ''}" data-act="area" data-a="${a}">${areaName(a)} <span style="opacity:.7">${d}/${n.length}</span></button>`; }).join('')}</div></div>
    <div id="rows">${rowsHtml(sim)}</div>
    <div style="display:grid;gap:10px;margin-top:22px"><button class="btn block" data-act="finalize" data-id="${sim.id}">FINALIZAR CORREÇÃO</button><p class="small faint" style="text-align:center;margin:0">Seu progresso é salvo automaticamente. Toque na mesma alternativa para deixar em branco.</p></div>`;
  }
  function rowsHtml(sim) {
    return E.questionList(sim.year, sim.dia).filter(q => q.area === Run.area).map(q => {
      const m = sim.answers[q.n];
      return `<div class="qrow area-${areaCss(q.area)} ${m ? 'done' : ''} ${Run.cur === q.n ? 'cur' : ''}" id="q${q.n}" data-n="${q.n}"><div class="qn">${q.n}</div><div class="opts">${'ABCDE'.split('').map(l => `<button class="opt ${m === l ? 'on' : ''}" data-act="pick" data-n="${q.n}" data-l="${l}" aria-label="Questão ${q.n} alternativa ${l}">${l}</button>`).join('')}</div>${q.lem ? `<div></div><div class="small faint" style="margin:-2px 0 0">Língua estrangeira (${sim.lem === 'espanhol' ? 'espanhol' : 'inglês'})</div>` : ''}</div>`;
    }).join('');
  }
  const fmtClock = s => { s = Math.round(s || 0); return `${C.pad(Math.floor(s / 3600))}:${C.pad(Math.floor(s % 3600 / 60))}:${C.pad(s % 60)}`; };
  function tick() {
    const cp = Router.cur && Router.cur.path; if (!cp || !/\/resolver$/.test(cp)) { clearInterval(Run.iv); Run.running = false; return; }
    if (!Run.running) return; const now = Date.now(), dt = Math.round((now - Run.last) / 1000); if (dt < 1) return; Run.last += dt * 1000;
    const sim = S().sims.find(x => x.id === Run.id); sim.totalSeconds = (sim.totalSeconds || 0) + dt;
    if (S().settings.cronometroPorQuestao && Run.cur) sim.times[Run.cur] = (sim.times[Run.cur] || 0) + dt;
    const tm = $('#tm'); if (tm) tm.textContent = fmtClock(sim.totalSeconds); Store.save();
  }
  ACT.timer = () => { Run.running = !Run.running; Run.last = Date.now(); const b = $('#tbtn'); if (b) b.innerHTML = I(Run.running ? 'pause' : 'play'); toast(Run.running ? 'Cronômetro rodando' : 'Cronômetro pausado'); };
  ACT.area = el => { Run.area = el.dataset.a; const y = window.scrollY; Router.render(); window.scrollTo(0, 0); };
  ACT.pick = el => {
    const n = +el.dataset.n, l = el.dataset.l; const sim = S().sims.find(x => x.id === Run.id);
    if (!Run.running && !sim.totalSeconds) { Run.running = true; Run.last = Date.now(); const b = $('#tbtn'); if (b) b.innerHTML = I('pause'); }
    Store.mutate(() => { if (sim.answers[n] === l) delete sim.answers[n]; else sim.answers[n] = l; });
    Run.cur = n; if (navigator.vibrate) navigator.vibrate(8);
    const row = $('#q' + n); $$('.opt', row).forEach(b => b.classList.toggle('on', b.dataset.l === sim.answers[n])); row.classList.toggle('done', !!sim.answers[n]);
    $$('.qrow.cur').forEach(r => r.classList.remove('cur')); row.classList.add('cur');
    const total = E.questionList(sim.year, sim.dia).length, d = C.answeredCount(sim); $('#pc').textContent = `${d}/${total} marcadas`; $('#pb').style.width = d / total * 100 + '%';
    const qs = E.questionList(sim.year, sim.dia).filter(q => q.area === Run.area); const tab = $(`.atab.on`); if (tab) tab.innerHTML = `${areaName(Run.area)} <span style="opacity:.7">${qs.filter(q => sim.answers[q.n]).length}/${qs.length}</span>`;
  };
  ACT.map = () => {
    const sim = S().sims.find(x => x.id === Run.id), qs = E.questionList(sim.year, sim.dia), areas = simAreas(sim);
    Sheet.open(`<h3 class="h-lg">Mapa de questões</h3><p class="small muted">Escuras: respondidas · Contorno: pendentes. Toque para ir até a questão.</p>${areas.map(a => `<div class="tiny" style="margin:16px 0 8px">${areaName(a)}</div><div class="map">${qs.filter(q => q.area === a).map(q => `<button class="mchip ${sim.answers[q.n] ? 'd' : 'branco'}" data-act="goq" data-n="${q.n}" data-a="${a}">${q.n}</button>`).join('')}</div>`).join('')}`);
  };
  ACT.goq = el => { Run.area = el.dataset.a; Run.cur = +el.dataset.n; Sheet.close(); Router.render(); setTimeout(() => { const r = $('#q' + el.dataset.n); if (r) { r.scrollIntoView({ behavior: 'smooth', block: 'center' }); } }, 60); };
  ACT.finalize = el => {
    const sim = S().sims.find(x => x.id === (el && el.dataset.id || Run.id)), gab = S().gabs[C.simGabKey(sim)], total = E.questionList(sim.year, sim.dia).length;
    const blanks = total - C.answeredCount(sim), miss = C.missingKeys(sim, gab).length;
    const doIt = () => { Store.mutate(() => { sim.status = 'finalizado'; sim.finalizedAt = Date.now(); if (!sim.dateDone) sim.dateDone = C.todayKey(); }); Store.flush(); Run.running = false; Sheet.close(); toast('Correção concluída.'); go('/simulados/' + sim.id); };
    if (miss) {
      Sheet.open(`<h3 class="h-lg">Gabarito ${gab ? 'incompleto' : 'não encontrado'}</h3><p class="muted" style="line-height:1.5">Não é possível corrigir sem o gabarito oficial desta prova (${sim.year}, ${sim.dia}º dia, caderno ${esc(sim.cor)}). O app nunca usa um gabarito de outra cor ou aplicação. ${gab ? `Faltam ${miss} questões.` : ''}</p>
        <div style="display:grid;gap:10px;margin-top:16px"><a class="btn block" href="#/gabarito?${gq(sim.year, sim.app, sim.dia, sim.cor)}">Cadastrar gabarito agora</a><button class="btn soft block" data-act="wait-gab" data-id="${sim.id}">Salvar e corrigir depois</button><button class="btn ghost block" data-act="sheet-close">Continuar respondendo</button></div>`); return;
    }
    if (blanks && Run.id === sim.id && /resolver$/.test(Router.cur.path)) { confirmSheet('Finalizar com questões em branco?', `Há ${blanks} questão${blanks > 1 ? 'ões' : ''} sem marcação. Elas contarão como em branco.`, 'Finalizar e corrigir', doIt); return; }
    doIt();
  };
  ACT['wait-gab'] = el => { Store.mutate(st => st.sims.find(x => x.id === el.dataset.id).status = 'aguardando_gabarito'); Store.flush(); Sheet.close(); toast('Salvo. Falta apenas o gabarito.'); go('/simulados/' + el.dataset.id); };

  /* ================= GABARITO ================= */
  function gabPage(_, q) {
    const year = +q.ano, app = q.app || 'Regular', dia = +q.dia || 1, cor = q.cor || 'Azul';
    if (!year) return '<div class="empty"><b>Prova não indicada</b><a class="btn sm" href="#/simulados/novo">Escolher prova</a></div>';
    const key = C.gabKey(year, app, dia, cor), gab = S().gabs[key], qs = E.questionList(year, dia), areas = [...new Set(qs.map(x => x.area))];
    const miss = C.missingKeys({ year, dia }, gab).length, src = (gab && gab.source) || {};
    const hasLem = qs.some(x => x.lem);
    return `<div class="topbar"><button class="iconbtn" onclick="history.back()" aria-label="Voltar">${I('left')}</button><h1>Gabarito</h1><span style="width:42px"></span></div>
    <div class="tiny">${esc(app)} · ${E.structure(year).dias.length > 1 ? dia + 'º dia · ' : ''}caderno ${esc(cor)}</div><h2 class="h-xl" style="margin-top:6px">ENEM ${year}</h2>
    <div class="card" style="margin-top:18px"><div class="sec-h" style="margin-bottom:8px"><b>${qs.length - miss} de ${qs.length} questões</b><span class="badge ${miss ? 'warn' : 'ok'}">${miss ? 'Incompleto' : 'Completo'}</span></div><div class="prog"><i data-w="${(qs.length - miss) / qs.length * 100}"></i></div>
    <p class="small muted" style="margin:12px 0 0;line-height:1.45">Este app não traz gabaritos prontos e nunca inventa respostas. Abra o gabarito oficial correspondente a <b>este ano, dia e cor de caderno</b>, e cole o texto abaixo ou marque manualmente.</p>
    <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap"><a class="btn sm" target="_blank" rel="noopener" href="${E.INEP_URL}">Abrir página oficial do INEP ${I('ext', 'sm')}</a><a class="btn sm ghost" href="#/biblioteca/${year}">Biblioteca ${year}</a></div></div>
    <div class="sec"><h2 class="h-md">Colar gabarito</h2><p class="small muted">Aceita linhas como <code>1 A</code>, <code>2-C</code>, <code>3: anulada</code> ou uma sequência contínua (ex.: ABCDE…) na ordem das questões do dia.</p>
      <textarea class="txt" id="gpaste" placeholder="Cole aqui o texto copiado do PDF oficial"></textarea><button class="btn block" style="margin-top:10px" data-act="gab-parse" data-key="${esc(q.ano)}|${esc(app)}|${dia}|${esc(cor)}">Ler texto e preencher</button><div id="gres"></div></div>
    <div class="sec"><div class="sec-h"><h2 class="h-md">Conferir e ajustar</h2></div><p class="small muted">Toque para marcar a resposta. “Anul.” indica questão anulada oficialmente.</p>
      ${areas.map(a => `<div class="tiny" style="margin:16px 0 4px">${areaName(a)}</div>${qs.filter(x => x.area === a).map(x => gabRow(x, gab, key, false)).join('')}`).join('')}
      ${hasLem ? `<div class="tiny" style="margin:22px 0 4px">Língua estrangeira — alternativa para espanhol</div><p class="small muted">As 5 questões de língua estrangeira têm gabarito de inglês (acima) e de espanhol (abaixo). Preencha só se for corrigir provas em espanhol.</p>${qs.filter(x => x.lem).map(x => gabRow(x, gab, key, true)).join('')}` : ''}</div>
    <div class="sec"><h2 class="h-md">Fonte e conferência</h2>
      <label class="field"><span>Fonte</span><input class="inp" data-input="gab-src" data-f="nome" data-key="${esc(key)}" value="${esc(src.nome || 'INEP — Provas e gabaritos')}"></label>
      <label class="field"><span>Endereço (opcional)</span><input class="inp" data-input="gab-src" data-f="url" data-key="${esc(key)}" value="${esc(src.url || E.INEP_URL)}"></label>
      <label class="check"><input type="checkbox" data-change="gab-conf" data-key="${esc(key)}" ${src.status === 'conferido' ? 'checked' : ''}><span>Conferi este gabarito com o PDF oficial do INEP (mesmo ano, dia, cor e aplicação).</span></label>
      <div class="note">Situação: <b>${src.status === 'conferido' ? 'conferido por você' + (src.date ? ' em ' + C.fmtDateBR(src.date) : '') : 'informado por você, ainda sem conferência'}</b>. O app não consegue verificar sozinho se o conteúdo bate com o oficial.</div></div>
    <div class="sec"><h2 class="h-md">Dificuldade das questões (opcional)</h2><p class="small muted">Só preencha com dados de fonte confiável. Formato: <code>número F</code>, <code>número M</code> ou <code>número D</code> (fácil, média, difícil).</p>
      <textarea class="txt" id="gdiff" style="min-height:80px" placeholder="1 F&#10;2 M&#10;3 D"></textarea><label class="field"><span>Fonte da classificação</span><input class="inp" id="gdiffsrc" value="${esc((gab && gab.diffSource) || '')}" placeholder="Ex.: estudo, relatório ou parâmetros do INEP"></label>
      <button class="btn soft block" style="margin-top:10px" data-act="gab-diff" data-key="${esc(q.ano)}|${esc(app)}|${dia}|${esc(cor)}">Salvar dificuldade${gab && gab.diff ? ' (já há ' + Object.keys(gab.diff).length + ')' : ''}</button></div>
    ${gab ? `<button class="btn danger block" style="margin-top:26px" data-act="gab-del" data-key="${esc(key)}">Apagar este gabarito</button>` : ''}`;
  }
  function gabRow(x, gab, key, alt) {
    const m = gab ? (alt ? (gab.alt || {})[x.n] : gab.answers[x.n]) : null;
    return `<div class="qrow area-${areaCss(x.area)} ${m ? 'done' : ''}" data-n="${x.n}" data-alt="${alt ? 1 : 0}"><div class="qn">${x.n}</div><div class="opts" style="grid-template-columns:repeat(6,1fr)">${'ABCDE'.split('').map(l => `<button class="opt ${m === l ? 'on' : ''}" data-act="gab-set" data-key="${esc(key)}" data-n="${x.n}" data-l="${l}" data-alt="${alt ? 1 : 0}">${l}</button>`).join('')}<button class="opt ${m === 'X' ? 'on' : ''}" style="font-size:10px" data-act="gab-set" data-key="${esc(key)}" data-n="${x.n}" data-l="X" data-alt="${alt ? 1 : 0}">Anul.</button></div></div>`;
  }
  function ensureGab(st, k) { // k = "ano|app|dia|cor" (rótulos originais)
    const [y, app, dia, cor] = k.split('|'); const key = C.gabKey(+y, app, +dia, cor);
    if (!st.gabs[key]) st.gabs[key] = { year: +y, app, dia: +dia, cor, answers: {}, alt: {}, source: { nome: 'INEP — Provas e gabaritos', url: E.INEP_URL, status: 'informado', date: '' }, createdAt: Date.now() };
    return st.gabs[key];
  }
  const keyOf = el => { const parts = el.split('|'); return C.gabKey(+parts[0], parts[1], +parts[2], parts[3]); };
  ACT['gab-set'] = el => {
    const full = el.dataset.key; // chave normalizada; recuperar rótulos a partir da rota atual
    const q = Router.cur.query, lab = `${q.ano}|${q.app || 'Regular'}|${q.dia || 1}|${q.cor || 'Azul'}`; const n = +el.dataset.n, l = el.dataset.l, alt = el.dataset.alt === '1';
    Store.mutate(st => { const g = ensureGab(st, lab); const tgt = alt ? (g.alt = g.alt || {}) : g.answers; if (tgt[n] === l) delete tgt[n]; else tgt[n] = l; });
    const row = el.closest('.qrow'), g = S().gabs[full], v = alt ? (g.alt || {})[n] : g.answers[n];
    $$('.opt', row).forEach(b => b.classList.toggle('on', b.dataset.l === v)); row.classList.toggle('done', !!v); if (navigator.vibrate) navigator.vibrate(6);
  };
  ACT['gab-parse'] = el => {
    const txt = $('#gpaste').value; if (!txt.trim()) return toast('Cole o texto do gabarito.');
    const q = Router.cur.query, dia = +q.dia || 1, exp = E.questionList(+q.ano, dia).map(x => x.n), r = C.parseGabarito(txt, exp); const lab = el.dataset.key;
    const found = Object.keys(r.answers).length; if (!found) return toast('Não encontrei respostas no texto. Confira o formato.');
    Store.mutate(st => { const g = ensureGab(st, lab); Object.assign(g.answers, r.answers); g.source.status = 'informado'; });
    Store.flush(); toast(`${found} respostas lidas.`); const keep = $('#gres'); Router.render();
    const box = $('#gres'); if (box) box.innerHTML = `<div class="note ${r.missing.length ? 'warn' : ''}">${found} lidas${r.missing.length ? `. <b>Faltam ${r.missing.length}:</b> ${r.missing.slice(0, 20).join(', ')}${r.missing.length > 20 ? '…' : ''}` : '. Todas as questões do dia foram preenchidas.'} ${r.notes.map(esc).join(' ')} Revise abaixo antes de usar.</div>`;
  };
  ACT['gab-diff'] = el => {
    const q = Router.cur.query, exp = new Set(E.questionList(+q.ano, +q.dia || 1).map(x => x.n)), diff = {}; let c = 0; const re = /(\d{1,3})\s*[-:.)]?\s*([FMDfmd])\b/g; let m;
    while ((m = re.exec($('#gdiff').value))) { if (exp.has(+m[1])) { diff[+m[1]] = m[2].toUpperCase(); c++; } }
    if (!c) return toast('Nenhuma linha válida (ex.: 12 F).'); if (!$('#gdiffsrc').value.trim()) return toast('Informe a fonte da classificação.');
    Store.mutate(st => { const g = ensureGab(st, el.dataset.key); g.diff = Object.assign(g.diff || {}, diff); g.diffSource = $('#gdiffsrc').value.trim(); }); Store.flush(); toast(`${c} classificações salvas.`); Router.render();
  };
  ACT['gab-del'] = el => confirmSheet('Apagar gabarito?', 'Os simulados já corrigidos com este gabarito perdem a correção até que um gabarito seja cadastrado de novo.', 'Apagar', () => { Store.mutate(st => delete st.gabs[el.dataset.key]); Store.flush(); toast('Gabarito apagado.'); Router.render(); }, true);

  root.VIEWS1 = { home, simList, simNew, simDetail, resolver, gabPage };
})(window);
