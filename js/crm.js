/* ==========================================================================
   CRM
   Monta o JSON do lead, o resumo para o corretor e faz o envio.
   ========================================================================== */

window.CRM = (function () {

  const ROTULOS = {
    tempoFaixa: {
      'menos-1': 'Menos de 1 ano', '1-2': '1 a 2 anos', '3-5': '3 a 5 anos',
      '6-10': '6 a 10 anos', 'mais-10': 'Mais de 10 anos'
    },
    simNao: { sim: 'Sim', nao: 'Não', 'nao-sei': 'Não sabe' },
    objetivo: {
      'sair-aluguel': 'Sair do aluguel',
      'primeiro-imovel': 'Comprar primeiro imóvel',
      'entender-financiamento': 'Entender se consegue financiar',
      'pesquisando': 'Ainda pesquisando'
    },
    jaFinanciou: {
      'nunca': 'Nunca tentou',
      'nao-consegui': 'Tentou, mas não conseguiu',
      'tem-simulacao': 'Já tem simulação no banco'
    },
    momento: {
      'comecando': 'Começou a pesquisar agora',
      'viu-internet': 'Já viu imóveis na internet',
      'visitou': 'Já visitou imóveis',
      'imovel-em-vista': 'Já tem um imóvel em vista'
    },
    prazo: {
      'ate-3-meses': 'Nos próximos 3 meses',
      '3-6-meses': 'De 3 a 6 meses',
      '6-12-meses': 'De 6 meses a 1 ano',
      'mais-1-ano': 'Mais de 1 ano',
      'nao-sei': 'Ainda não sabe'
    },
    pronto: {
      'quer-avancar': 'Sim, quer avançar',
      'conversar-familia': 'Precisa conversar com a família',
      'so-entender': 'Por enquanto só quer entender'
    },
    temperatura: { quente: 'QUENTE', morno: 'MORNO', frio: 'FRIO' }
  };

  function brl(v) {
    if (v == null || isNaN(v)) return null;
    return 'R$ ' + Math.round(v).toLocaleString('pt-BR');
  }

  function textoTempo(meses) {
    if (!meses) return 'Não informado';
    const a = Math.floor(meses / 12);
    const m = meses % 12;
    const partes = [];
    if (a) partes.push(a + (a === 1 ? ' ano' : ' anos'));
    if (m) partes.push(m + (m === 1 ? ' mês' : ' meses'));
    return partes.join(' e ');
  }

  function textoFaixa(f) {
    if (!f) return null;
    return brl(f.min) + ' a ' + brl(f.max);
  }

  /* ---------- Payload estruturado ---------- */

  function montarPayload(estado, evento) {
    const r = estado.respostas;
    const est = estado.estimativa || {};
    const tempo = estado.tempoCalculado || {};
    const proj = estado.projecao || [];
    const porAnos = {};
    proj.forEach(function (p) { porAnos[p.anos] = Math.round(p.valor); });

    return {
      evento: evento,
      dataHora: new Date().toISOString(),
      origem: {
        ferramenta: 'calculadora-aluguel-x-financiamento-mcmv',
        pagina: location.href,
        rastreio: estado.rastreio || {}
      },

      dadosPessoais: {
        nome: estado.lead.nome || null,
        whatsapp: estado.lead.whatsapp || null,
        rendaFamiliar: estado.lead.renda || null,
        rendaInformadaNaCalculadora: !!estado.lead.rendaPerguntadaAqui
      },

      dadosFinanceiros: {
        aluguelMensal: r.aluguel || null,
        tempoAluguelFaixa: r.tempoFaixa || null,
        tempoAluguelAnosInformados: r.anos || null,
        tempoAluguelMesesInformados: r.meses || null,
        tempoAluguelTotalMeses: tempo.meses || null,
        tempoAluguelOrigem: tempo.origem || null, // 'informado' ou 'faixa'
        valorEstimadoPagoAluguel: estado.totalPago != null ? Math.round(estado.totalPago) : null,
        possuiEntrada: r.entradaResposta || null,
        valorEntrada: r.entradaResposta === 'sim' ? (r.entradaValor || null) : null,
        possuiFgts: r.fgtsResposta || null,
        valorFgtsAproximado: r.fgtsResposta === 'sim' ? (r.fgtsValor || null) : null
      },

      perfil: {
        pessoasNaFamilia: r.pessoas || null,
        pessoasNaFamiliaTexto: r.pessoas === 5 ? '5 ou mais' : (r.pessoas ? String(r.pessoas) : null),
        possuiImovel: r.possuiImovel == null ? null : (r.possuiImovel ? 'sim' : 'nao'),
        objetivo: r.objetivo || null,
        objetivoTexto: ROTULOS.objetivo[r.objetivo] || null
      },

      qualificacao: {
        jaTentouFinanciar: r.jaFinanciou || null,
        jaTentouFinanciarTexto: ROTULOS.jaFinanciou[r.jaFinanciou] || null,
        momentoDeCompra: r.momento || null,
        momentoDeCompraTexto: ROTULOS.momento[r.momento] || null,
        prazoDecisao: r.prazo || null,
        prazoDecisaoTexto: ROTULOS.prazo[r.prazo] || null,
        prontoParaSeguir: r.pronto || null,
        prontoParaSeguirTexto: ROTULOS.pronto[r.pronto] || null,
        temperatura: estado.temperatura ? estado.temperatura.nivel : null,
        pontuacao: estado.temperatura ? estado.temperatura.pontos : null
      },

      dadosCalculados: {
        projecaoAluguel5Anos: porAnos[5] != null ? porAnos[5] : null,
        projecaoAluguel10Anos: porAnos[10] != null ? porAnos[10] : null,
        projecaoAluguel20Anos: porAnos[20] != null ? porAnos[20] : null,
        statusEstimativa: est.status || null,
        faixaPrograma: est.faixaPrograma || null,
        estimativaFinanciamento: est.financiamento ? Math.round(est.financiamento) : null,
        estimativaFinanciamentoMin: est.faixaFinanciamento ? est.faixaFinanciamento.min : null,
        estimativaFinanciamentoMax: est.faixaFinanciamento ? est.faixaFinanciamento.max : null,
        estimativaImovel: est.valorImovel ? Math.round(est.valorImovel) : null,
        valorMinimoImovel: est.valorMinimoImovel || null,
        imovelReferenciaDaConta: est.imovelReferencia ? Math.round(est.imovelReferencia) : null,
        entradaNecessaria: est.entradaNecessaria != null ? Math.round(est.entradaNecessaria) : null,
        complementoEntrada: est.complementoEntrada != null ? Math.round(est.complementoEntrada) : null,
        estimativaImovelMin: est.faixaImovel ? est.faixaImovel.min : null,
        estimativaImovelMax: est.faixaImovel ? est.faixaImovel.max : null,
        parcelaEstimada: est.parcelaEstimada ? Math.round(est.parcelaEstimada) : null,
        subsidioEstimado: est.subsidioEstimado != null ? Math.round(est.subsidioEstimado) : null,
        capacidadePelaRenda: est.capacidadePelaRenda ? Math.round(est.capacidadePelaRenda) : null,
        fatorLimitante: est.fatorLimitante || null,
        indicadorInterno: estado.diagnostico ? estado.diagnostico.indicadorInterno : null,
        pendencias: estado.diagnostico ? estado.diagnostico.pendencias : []
      },

      parametrosUtilizados: {
        taxaJurosAnual: est.taxaJurosAnual != null ? est.taxaJurosAnual : null,
        prazoMeses: est.prazoMeses || null,
        sistemaAmortizacao: est.sistemaAmortizacao || null,
        comprometimentoRenda: est.comprometimentoRenda || null,
        percentualFinanciavel: est.percentualFinanciavel || null,
        parcelaMaximaConsiderada: est.parcelaMaxima ? Math.round(est.parcelaMaxima) : null
      },

      resumoCorretor: resumoCorretor(estado)
    };
  }

  /* ---------- Resumo em texto para o corretor ---------- */

  // interno = true inclui temperatura e notas que o cliente não deve ver
  function resumoCorretor(estado, interno) {
    if (interno === undefined) interno = true;
    const r = estado.respostas;
    const est = estado.estimativa || {};
    const tempo = estado.tempoCalculado || {};
    const linhas = [];

    linhas.push('Lead simulou possibilidade de sair do aluguel.');
    if (interno && estado.temperatura) {
      linhas.push('Temperatura: ' + ROTULOS.temperatura[estado.temperatura.nivel] + ' (' + estado.temperatura.pontos + ' pontos)');
    }
    if (estado.lead.nome) linhas.push('Nome: ' + estado.lead.nome);
    linhas.push('Renda familiar: ' + (brl(estado.lead.renda) || 'Não informada'));
    linhas.push('Aluguel atual: ' + (brl(r.aluguel) || 'Não informado'));
    linhas.push('Tempo pagando aluguel: ' + textoTempo(tempo.meses) + (tempo.origem === 'faixa' ? ' (aprox.)' : ''));
    if (estado.totalPago) linhas.push('Estimativa já paga em aluguel: ' + brl(estado.totalPago));

    if (r.entradaResposta === 'sim') linhas.push('Entrada: ' + (brl(r.entradaValor) || 'Sim, valor não informado'));
    else linhas.push('Entrada: ' + (ROTULOS.simNao[r.entradaResposta] || 'Não informado'));

    let fgts = ROTULOS.simNao[r.fgtsResposta] || 'Não informado';
    if (r.fgtsResposta === 'sim' && r.fgtsValor) fgts += ' (aprox. ' + brl(r.fgtsValor) + ')';
    linhas.push('FGTS: ' + fgts);

    linhas.push('Pessoas na família: ' + (r.pessoas === 5 ? '5 ou mais' : (r.pessoas || 'Não informado')));
    linhas.push('Possui imóvel: ' + (r.possuiImovel == null ? 'Não informado' : (r.possuiImovel ? 'Sim' : 'Não')));
    linhas.push('Objetivo: ' + (ROTULOS.objetivo[r.objetivo] || 'Não informado'));
    linhas.push('Prazo para decidir: ' + (ROTULOS.prazo[r.prazo] || 'Não informado'));
    linhas.push('Pronto para seguir: ' + (ROTULOS.pronto[r.pronto] || 'Não informado'));
    linhas.push('Momento: ' + (ROTULOS.momento[r.momento] || 'Não informado'));
    linhas.push('Já tentou financiar: ' + (ROTULOS.jaFinanciou[r.jaFinanciou] || 'Não informado') +
      (interno && r.jaFinanciou === 'nao-consegui' ? ' (vale perguntar o motivo)' : ''));

    if (est.status === 'estimado') {
      linhas.push('Estimativa de financiamento: ' + textoFaixa(est.faixaFinanciamento));
      linhas.push('Estimativa de imóvel: ' + textoFaixa(est.faixaImovel));
    } else if (est.status === 'fora-das-faixas') {
      linhas.push('Renda acima das faixas configuradas. Avaliar outras linhas.');
    } else if (est.status === 'abaixo-do-minimo') {
      linhas.push('Estimativa abaixo do imóvel mínimo (' + brl(est.valorMinimoImovel) + '). Financiamento pela renda: ' + textoFaixa(est.faixaFinanciamento));
    }
    if (est.imovelReferencia) {
      linhas.push('Entrada estimada: ' + brl(est.entradaNecessaria) +
        (est.complementoEntrada > 0 ? ' (faltam cerca de ' + brl(est.complementoEntrada) + ')' : ' (coberta)'));
    }

    return linhas.join('\n');
  }

  /* ---------- Envio ---------- */

  function enviar(estado, evento, cfg) {
    const payload = montarPayload(estado, evento);

    if (cfg.crm.usarDataLayer) {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ event: 'calculadora_' + evento, lead: payload });
    }

    if (!cfg.crm.webhookUrl) {
      // Sem webhook configurado: deixa o JSON visível no console para teste
      console.info('[Calculadora] webhook não configurado. Payload:', payload);
      return Promise.resolve({ ok: true, simulado: true, payload: payload });
    }

    const corpo = JSON.stringify(payload);
    return fetch(cfg.crm.webhookUrl, {
      method: 'POST',
      headers: Object.assign({ 'Content-Type': 'application/json' }, cfg.crm.headers || {}),
      body: corpo,
      keepalive: true
    }).then(function (res) {
      return { ok: res.ok, status: res.status, payload: payload };
    }).catch(function (erro) {
      console.warn('[Calculadora] falha ao enviar ao CRM', erro);
      return { ok: false, erro: erro, payload: payload };
    });
  }

  function linkWhatsapp(estado, cfg) {
    const nome = estado.lead.nome ? estado.lead.nome.split(' ')[0] : '';
    const texto = 'Olá! ' + (nome ? 'Sou ' + nome + '. ' : '') +
      'Fiz a simulação de aluguel x financiamento e quero entender quais imóveis fazem sentido para mim.\n\n' +
      resumoCorretor(estado, false);
    return 'https://wa.me/' + String(cfg.ctaFinal.whatsappNumero).replace(/\D/g, '') +
      '?text=' + encodeURIComponent(texto);
  }

  return {
    montarPayload: montarPayload,
    resumoCorretor: resumoCorretor,
    enviar: enviar,
    linkWhatsapp: linkWhatsapp,
    brl: brl,
    textoTempo: textoTempo,
    textoFaixa: textoFaixa,
    ROTULOS: ROTULOS
  };
})();
