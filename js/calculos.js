/* ==========================================================================
   CÁLCULOS
   Funções puras: recebem dados + configuração e devolvem números.
   Nenhuma regra fixa mora aqui. Tudo vem de CALC_CONFIG (js/config.js).
   ========================================================================== */

window.Calculos = (function () {

  /* ---------- Aluguel ---------- */

  // Meses totais pagando aluguel.
  // Se a pessoa informou anos/meses exatos, usa isso. Senão usa a faixa escolhida.
  function mesesDeAluguel(tempo, cfg) {
    const anos = Number(tempo.anos) || 0;
    const meses = Number(tempo.meses) || 0;
    const exato = anos * 12 + meses;
    if (exato > 0) return { meses: exato, origem: 'informado' };
    if (tempo.faixa && cfg.aluguel.mesesPorFaixaTempo[tempo.faixa]) {
      return { meses: cfg.aluguel.mesesPorFaixaTempo[tempo.faixa], origem: 'faixa' };
    }
    return { meses: 0, origem: 'nao-informado' };
  }

  // Aluguel mensal × meses (sem reajustes)
  function totalAluguel(aluguelMensal, meses) {
    return (Number(aluguelMensal) || 0) * (Number(meses) || 0);
  }

  function projecaoAluguel(aluguelMensal, cfg) {
    return cfg.aluguel.horizontesAnos.map(function (anos) {
      return { anos: anos, valor: totalAluguel(aluguelMensal, anos * 12) };
    });
  }

  /* ---------- Matemática financeira ---------- */

  function taxaMensal(taxaAnual) {
    return Math.pow(1 + taxaAnual, 1 / 12) - 1;
  }

  // Quanto dá para financiar com uma parcela máxima
  function valorFinanciavelPelaParcela(parcela, i, n, sistema) {
    if (parcela <= 0 || n <= 0) return 0;
    if (i === 0) return parcela * n;
    if (sistema === 'SAC') {
      // 1ª parcela SAC = F/n + F*i  →  F = P / (1/n + i)
      return parcela / (1 / n + i);
    }
    // PRICE: valor presente de uma série de parcelas iguais
    return parcela * (1 - Math.pow(1 + i, -n)) / i;
  }

  // Parcela (a primeira, no caso SAC) para um valor financiado
  function parcelaDoFinanciamento(valor, i, n, sistema) {
    if (valor <= 0 || n <= 0) return 0;
    if (i === 0) return valor / n;
    if (sistema === 'SAC') return valor / n + valor * i;
    return valor * i / (1 - Math.pow(1 + i, -n));
  }

  /* ---------- Faixa de renda e subsídio ---------- */

  function encontrarFaixa(renda, faixas) {
    for (let k = 0; k < faixas.length; k++) {
      if (renda <= faixas[k].rendaMax) {
        return { faixa: faixas[k], rendaMin: k === 0 ? 0 : faixas[k - 1].rendaMax, indice: k };
      }
    }
    return null;
  }

  function estimarSubsidio(renda, achado, pessoas, possuiImovel, fin) {
    if (!achado || fin.modoSubsidio === 'nenhum') return 0;
    if (possuiImovel && fin.exigeNaoPossuirImovel) return 0;
    const max = achado.faixa.subsidioMax || 0;
    if (max <= 0) return 0;

    let valor = max;
    if (fin.modoSubsidio === 'proporcional') {
      const largura = achado.faixa.rendaMax - achado.rendaMin;
      const posicao = largura > 0 ? (achado.faixa.rendaMax - renda) / largura : 1;
      valor = max * Math.min(1, Math.max(0, posicao));
    }
    const ajuste = fin.ajusteSubsidioPorPessoas[Math.min(5, pessoas || 1)];
    return valor * (ajuste == null ? 1 : ajuste);
  }

  /* ---------- Faixa de exibição ---------- */

  function faixaDeValor(valor, fin, teto, piso) {
    if (!valor || valor <= 0) return null;
    const r = fin.arredondarPara || 1;
    let min = Math.floor((valor * (1 - fin.margemFaixa)) / r) * r;
    let max = Math.ceil((valor * (1 + fin.margemFaixa)) / r) * r;
    if (teto) max = Math.min(max, teto);
    if (piso) min = Math.max(min, piso);
    if (min > max) min = max;
    return { min: min, max: max, central: valor };
  }

  /* ---------- Estimativa principal ---------- */

  /*
    dados = {
      renda, entrada, fgts, pessoas, possuiImovel
    }
    Retorna todos os números usados, para exibir e para mandar ao CRM.
  */
  function estimarFinanciamento(dados, cfg) {
    const fin = cfg.financiamento;
    const renda = Number(dados.renda) || 0;
    const entrada = Number(dados.entrada) || 0;
    const fgts = Number(dados.fgts) || 0;

    const base = {
      renda: renda,
      entrada: entrada,
      fgts: fgts,
      prazoMeses: fin.prazoMeses,
      sistemaAmortizacao: fin.sistemaAmortizacao,
      comprometimentoRenda: fin.comprometimentoRenda,
      percentualFinanciavel: fin.percentualFinanciavel
    };

    if (renda <= 0) {
      return Object.assign(base, { status: 'sem-renda' });
    }

    const achado = encontrarFaixa(renda, fin.faixas);
    if (!achado) {
      return Object.assign(base, { status: 'fora-das-faixas' });
    }

    const faixa = achado.faixa;
    const i = taxaMensal(faixa.taxaJurosAnual);
    const n = fin.prazoMeses;
    const parcelaMax = Math.max(0, renda * fin.comprometimentoRenda - (fin.custosMensaisExtras || 0));
    const capacidadePelaRenda = valorFinanciavelPelaParcela(parcelaMax, i, n, fin.sistemaAmortizacao);

    const subsidio = estimarSubsidio(renda, achado, dados.pessoas, dados.possuiImovel, fin);
    const recursos = entrada + fgts + subsidio;

    // Quanto a renda + recursos permitem comprar, respeitando o teto da faixa
    const podeComprar = capacidadePelaRenda + recursos;
    const teto = faixa.valorMaxImovel || Infinity;
    const valorImovel = Math.min(podeComprar, teto);
    const fatorLimitante = podeComprar > teto ? 'teto' : 'renda';

    // Imóveis abaixo do valor mínimo não existem no mercado atendido.
    // Se a estimativa ficar abaixo, a conta é feita para o imóvel mínimo.
    const minimo = fin.valorMinimoImovel || 0;
    const status = valorImovel >= minimo ? 'estimado' : 'abaixo-do-minimo';
    const imovelReferencia = Math.max(valorImovel, minimo);

    // O financiamento não passa da capacidade da renda nem do percentual financiável
    const limitePercentual = fin.aplicarLimitePercentualFinanciavel
      ? imovelReferencia * fin.percentualFinanciavel
      : imovelReferencia;
    const financiamento = Math.max(0, Math.min(capacidadePelaRenda, limitePercentual, imovelReferencia - recursos));

    // O que o financiamento não cobre precisa vir de entrada, FGTS ou subsídio
    const entradaNecessaria = imovelReferencia - financiamento;
    const complementoEntrada = Math.max(0, entradaNecessaria - recursos);

    const parcelaEstimada = parcelaDoFinanciamento(financiamento, i, n, fin.sistemaAmortizacao)
      + (financiamento > 0 ? (fin.custosMensaisExtras || 0) : 0);

    return Object.assign(base, {
      status: status,
      faixaPrograma: faixa.nome,
      taxaJurosAnual: faixa.taxaJurosAnual,
      taxaJurosMensal: i,
      parcelaMaxima: parcelaMax,
      capacidadePelaRenda: capacidadePelaRenda,
      subsidioEstimado: subsidio,
      recursosProprios: entrada + fgts,
      recursosTotais: recursos,
      valorMinimoImovel: minimo,
      imovelReferencia: imovelReferencia,
      financiamento: financiamento,
      valorImovel: status === 'estimado' ? valorImovel : 0,
      entradaNecessaria: entradaNecessaria,
      complementoEntrada: complementoEntrada,
      parcelaEstimada: parcelaEstimada,
      fatorLimitante: fatorLimitante,
      faixaFinanciamento: faixaDeValor(financiamento, fin),
      faixaImovel: status === 'estimado' ? faixaDeValor(valorImovel, fin, teto, minimo) : null
    });
  }

  function reais(v) {
    return 'R$ ' + Math.round(v || 0).toLocaleString('pt-BR');
  }

  /* ---------- Mensagem personalizada ---------- */

  /*
    Mensagem orientativa. Nunca diz "aprovado" ou "reprovado".
    Também devolve um indicador interno (só para o CRM) que ajuda o corretor
    a priorizar o contato.
  */
  function diagnostico(estimativa, respostas, cfg) {
    const fin = cfg.financiamento;
    const pendencias = [];
    if (respostas.entradaResposta === 'nao-sei') pendencias.push('valor de entrada');
    if (respostas.fgtsResposta === 'nao-sei' || (respostas.fgtsResposta === 'sim' && !respostas.fgtsValor)) pendencias.push('saldo de FGTS');

    let titulo, texto, tom, indicadorInterno;

    if (respostas.possuiImovel && fin.exigeNaoPossuirImovel) {
      tom = 'atencao';
      titulo = 'Seu cenário precisa de uma análise mais detalhada';
      texto = 'Você informou que já tem um imóvel no seu nome. Isso muda as regras que podem valer para você. Um especialista pode verificar quais caminhos fazem sentido no seu caso.';
      indicadorInterno = 'analisar-imovel-existente';
    } else if (estimativa.status === 'fora-das-faixas') {
      tom = 'atencao';
      titulo = 'Seu cenário pede uma análise personalizada';
      texto = 'A renda informada ficou acima dos limites considerados nesta simulação. Existem outras linhas de financiamento, e um especialista pode mostrar quais combinam com o seu perfil.';
      indicadorInterno = 'renda-acima-faixas';
    } else if (estimativa.status === 'abaixo-do-minimo') {
      tom = 'atencao';
      titulo = 'Seu cenário ainda precisa de uma análise mais detalhada';
      texto = 'Com a renda informada, a estimativa ficou abaixo do valor dos imóveis disponíveis, que começam em ' +
        reais(estimativa.valorMinimoImovel) + '. Juntar a renda com outra pessoa, usar o FGTS ou contar com subsídio pode mudar esse cenário. Um especialista pode mostrar os caminhos possíveis.';
      indicadorInterno = 'abaixo-do-minimo';
    } else if (estimativa.status === 'estimado') {
      tom = 'positivo';
      titulo = 'Seu cenário indica que vale a pena analisar suas possibilidades de financiamento';
      texto = 'Com base nas informações que você passou, existe uma estimativa de faixa de financiamento para o seu perfil. O próximo passo é conferir isso com uma análise de verdade.';
      indicadorInterno = estimativa.complementoEntrada > 0 ? 'estimado-com-entrada-a-complementar' : 'estimado';
    } else {
      tom = 'atencao';
      titulo = 'Vamos completar o seu diagnóstico';
      texto = 'Faltaram algumas informações para montar a estimativa. Um especialista pode completar essa análise com você.';
      indicadorInterno = 'dados-insuficientes';
    }

    if (indicadorInterno === 'estimado-com-entrada-a-complementar') {
      texto += ' Para esse valor de imóvel, a entrada estimada fica em torno de ' + reais(estimativa.entradaNecessaria) +
        '. Em muitos empreendimentos essa diferença pode ser parcelada, e o especialista confirma as condições.';
    }

    if (pendencias.length && estimativa.status === 'estimado') {
      texto += ' Como você ainda não sabe o ' + pendencias.join(' e o ') + ', esse número pode mudar depois de conferido.';
    }

    return { titulo: titulo, texto: texto, tom: tom, indicadorInterno: indicadorInterno, pendencias: pendencias };
  }

  /* ---------- Temperatura do lead (só para o CRM) ---------- */

  function temperaturaLead(respostas, estimativa, cfg) {
    const q = cfg.qualificacao;
    let pontos = 0;
    ['prazo', 'pronto', 'momento', 'jaFinanciou'].forEach(function (campo) {
      const tabela = q.pontos[campo] || {};
      pontos += tabela[respostas[campo]] || 0;
    });
    if (estimativa && estimativa.status === 'estimado') pontos += q.pontos.estimativaEncontrada || 0;

    const nivel = pontos >= q.quente ? 'quente' : (pontos >= q.morno ? 'morno' : 'frio');
    return { nivel: nivel, pontos: pontos };
  }

  return {
    temperaturaLead: temperaturaLead,
    mesesDeAluguel: mesesDeAluguel,
    totalAluguel: totalAluguel,
    projecaoAluguel: projecaoAluguel,
    taxaMensal: taxaMensal,
    valorFinanciavelPelaParcela: valorFinanciavelPelaParcela,
    parcelaDoFinanciamento: parcelaDoFinanciamento,
    encontrarFaixa: encontrarFaixa,
    estimarFinanciamento: estimarFinanciamento,
    diagnostico: diagnostico
  };
})();
