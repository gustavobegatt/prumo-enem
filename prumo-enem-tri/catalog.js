/* Catálogo de edições do ENEM: estrutura de dias, áreas e numeração das questões.
   IMPORTANTE: este arquivo descreve a ESTRUTURA geral de cada período. Ele não contém gabaritos,
   links ou PDFs. Gabaritos e documentos entram pelo cadastro/importação (com fonte registrada). */
(function (root) {
  const AREAS = {
    LC: { id: 'LC', nome: 'Linguagens, Códigos e suas Tecnologias', curto: 'Linguagens', css: 'lc' },
    CH: { id: 'CH', nome: 'Ciências Humanas e suas Tecnologias', curto: 'Humanas', css: 'ch' },
    CN: { id: 'CN', nome: 'Ciências da Natureza e suas Tecnologias', curto: 'Natureza', css: 'cn' },
    MT: { id: 'MT', nome: 'Matemática e suas Tecnologias', curto: 'Matemática', css: 'mt' },
    GE: { id: 'GE', nome: 'Prova única (áreas integradas)', curto: 'Prova única', css: 'ge' }
  };

  const FIRST_YEAR = 1998;
  const LAST_CATALOG_YEAR = 2025; // última edição com acervo histórico consultado
  const INEP_URL = 'https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/enem/provas-e-gabaritos';

  /* Períodos (conforme estrutura divulgada pelo MEC/INEP):
     1998–2008: prova única, 63 questões, um dia.
     2009: 2 dias, 90 questões/dia; sem língua estrangeira. Dia 1 = Humanas+Natureza; Dia 2 = Linguagens+Matemática.
     2010–2016: igual a 2009, com 5 questões de língua estrangeira (91–95) em Linguagens.
     2017 em diante: Dia 1 = Linguagens+Humanas; Dia 2 = Natureza+Matemática. */
  function structure(year) {
    if (year <= 2008) {
      return {
        periodo: '1998–2008',
        dias: [{ dia: 1, nome: 'Prova única', areas: [{ area: 'GE', from: 1, to: 63 }] }],
        nota: 'Até 2008 a prova tinha 63 questões interdisciplinares em um único dia.'
      };
    }
    if (year <= 2016) {
      const lem = year >= 2010 ? [91, 95] : null;
      return {
        periodo: year === 2009 ? '2009' : '2010–2016',
        dias: [
          { dia: 1, nome: '1º dia', areas: [{ area: 'CH', from: 1, to: 45 }, { area: 'CN', from: 46, to: 90 }] },
          { dia: 2, nome: '2º dia', areas: [{ area: 'LC', from: 91, to: 135, lem }, { area: 'MT', from: 136, to: 180 }] }
        ],
        nota: year === 2009
          ? 'Em 2009 o 1º dia reuniu Humanas e Natureza e o 2º dia, Linguagens e Matemática. Não havia língua estrangeira.'
          : 'De 2010 a 2016 o 1º dia reuniu Humanas e Natureza; o 2º, Linguagens (com 5 questões de língua estrangeira) e Matemática.'
      };
    }
    return {
      periodo: '2017 em diante',
      dias: [
        { dia: 1, nome: '1º dia', areas: [{ area: 'LC', from: 1, to: 45, lem: [1, 5] }, { area: 'CH', from: 46, to: 90 }] },
        { dia: 2, nome: '2º dia', areas: [{ area: 'CN', from: 91, to: 135 }, { area: 'MT', from: 136, to: 180 }] }
      ],
      nota: 'A partir de 2017 o 1º dia reúne Linguagens e Humanas; o 2º, Natureza e Matemática.'
    };
  }

  const APLICACOES = ['Regular', 'PPL (pessoas privadas de liberdade)', 'Reaplicação', 'Digital', 'Outra'];
  const CORES = ['Azul', 'Amarelo', 'Branco', 'Rosa', 'Verde', 'Cinza', 'Laranja', 'Sem cor / única', 'Outra'];

  function questionList(year, dia) {
    const st = structure(year);
    const d = st.dias.find(x => x.dia === dia);
    if (!d) return [];
    const out = [];
    d.areas.forEach(a => {
      for (let n = a.from; n <= a.to; n++) {
        const isLem = !!(a.lem && n >= a.lem[0] && n <= a.lem[1]);
        out.push({ n, area: a.area, lem: isLem });
      }
    });
    return out;
  }

  function years() {
    const a = [];
    for (let y = LAST_CATALOG_YEAR; y >= FIRST_YEAR; y--) a.push(y);
    return a;
  }

  root.ENEM = { AREAS, FIRST_YEAR, LAST_CATALOG_YEAR, INEP_URL, structure, questionList, years, APLICACOES, CORES };
  if (typeof module !== 'undefined') module.exports = root.ENEM;
})(typeof window !== 'undefined' ? window : globalThis);
