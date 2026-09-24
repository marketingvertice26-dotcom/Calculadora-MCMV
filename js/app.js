/* ==========================================================================
   APP
   Controla as telas, as respostas e a exibição do resultado.
   ========================================================================== */

(function () {
  const cfg = window.CALC_CONFIG;
  const C = window.Calculos;
  const brl = window.CRM.brl;
  const reduzirMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const $ = function (sel, raiz) { return (raiz || document).querySelector(sel); };
  const $$ = function (sel, raiz) { return Array.prototype.slice.call((raiz || document).querySelectorAll(sel)); };

  /* ---------- Estado ---------- */

  const estado = {
    lead: { nome: '', whatsapp: '', renda: 0, rendaPerguntadaAqui: false, contatoPerguntadoAqui: false },
    rastreio: {},
    respostas: {
      aluguel: 0, tempoFaixa: null, anos: 0, meses: 0,
      entradaResposta: null, entradaValor: 0,
      fgtsResposta: null, fgtsValor: 0,
      pessoas: null, possuiImovel: null, objetivo: null,
      jaFinanciou: null, momento: null, prazo: null, pronto: null
    },
    tempoCalculado: null,
    totalPago: 0,
    projecao: [],
    estimativa: null,
    diagnostico: null,
    fluxo: [],
    historico: [],
    telaAtual: 'intro',
    enviado: false,
    horizonteAtivo: 10
  };

  /* ---------- Utilidades ---------- */

  // Aceita "4500", "4.500", "4.500,00", "R$ 4.500", "4500.50"
  function lerMoeda(texto) {
    if (texto == null) return 0;
    let s = String(texto).trim().replace(/[^\d.,]/g, '');
    if (!s) return 0;
    if (s.indexOf(',') >= 0) s = s.split(',')[0].replace(/\./g, '');
    else if (/^\d+\.\d{1,2}$/.test(s)) s = s.split('.')[0];
    else s = s.replace(/\./g, '');
    return parseInt(s, 10) || 0;
  }

  function formatarMilhar(n) {
    return n ? n.toLocaleString('pt-BR') : '';
  }

  function animarNumero(el, valor, duracao) {
    if (reduzirMovimento || !valor) { el.textContent = brl(valor || 0); return; }
    const inicio = performance.now();
    const d = duracao || 1400;
    function passo(agora) {
      const t = Math.min(1, (agora - inicio) / d);
      const suave = 1 - Math.pow(1 - t, 3);
      el.textContent = brl(valor * suave);
      if (t < 1) requestAnimationFrame(passo);
    }
    requestAnimationFrame(passo);
  }

  function primeiroNome(nome) {
    return (nome || '').trim().split(/\s+/)[0] || '';
  }

  function capitalizar(nome) {
    return nome ? nome.charAt(0).toUpperCase() + nome.slice(1).toLowerCase() : '';
  }

  /* ---------- Dados da Landing Page ---------- */

  function carregarDadosLP() {
    const params = new URLSearchParams(location.search);
    const mapa = cfg.landingPage.parametrosUrl;
    let salvo = {};

    try {
      const bruto = sessionStorage.getItem(cfg.landingPage.chaveStorage) ||
        localStorage.getItem(cfg.landingPage.chaveStorage);
      if (bruto) salvo = JSON.parse(bruto) || {};
    } catch (e) { salvo = {}; }

    function pegar(campo) {
      const nomes = mapa[campo] || [campo];
      for (let k = 0; k < nomes.length; k++) {
        if (params.get(nomes[k])) return params.get(nomes[k]);
      }
      for (let k = 0; k < nomes.length; k++) {
        if (salvo[nomes[k]]) return salvo[nomes[k]];
      }
      return '';
    }

    estado.lead.nome = String(pegar('nome')).trim().split(/\s+/).map(capitalizar).join(' ');
    estado.lead.whatsapp = String(pegar('whatsapp')).replace(/\D/g, '');
    estado.lead.renda = lerMoeda(pegar('renda'));

    cfg.landingPage.parametrosRastreio.forEach(function (p) {
      const v = params.get(p) || salvo[p];
      if (v) estado.rastreio[p] = v;
    });
  }

  /* ---------- Fluxo de telas ---------- */

  function montarFluxo() {
    const fluxo = ['intro'];
    if (!estado.lead.renda) fluxo.push('renda');
    fluxo.push('aluguel', 'tempo', 'passado', 'futuro', 'entrada', 'fgts', 'familia', 'imovel', 'jaFinanciou',
      'objetivo', 'momento', 'prazo', 'pronto');
    // Rede de segurança: se a LP não mandou o WhatsApp, pergunta antes do resultado
    if (!estado.lead.whatsapp || estado.lead.contatoPerguntadoAqui) fluxo.push('contato');
    fluxo.push('calculando', 'resultado');
    estado.fluxo = fluxo;
  }

  function etapasDoFluxo() {
    return estado.fluxo.filter(function (t) {
      const el = $('[data-tela="' + t + '"]');
      return el && el.hasAttribute('data-etapa');
    });
  }

  function proximaTela(atual) {
    const i = estado.fluxo.indexOf(atual);
    return estado.fluxo[i + 1];
  }

  function irPara(destino, voltando) {
    const atual = $('[data-tela="' + estado.telaAtual + '"]');
    const nova = $('[data-tela="' + destino + '"]');
    if (!nova || atual === nova) return;

    if (!voltando) estado.historico.push(estado.telaAtual);

    atual.classList.remove('ativa', 'volta');
    nova.classList.toggle('volta', !!voltando);
    nova.classList.add('ativa');
    estado.telaAtual = destino;

    // Sobe até o início da calculadora (que pode estar no meio de uma página, como no GoHighLevel)
    const inicio = $('#app').getBoundingClientRect().top + window.pageYOffset;
    window.scrollTo({ top: Math.max(0, inicio), behavior: reduzirMovimento ? 'auto' : 'smooth' });
    atualizarTopo();
    aoEntrar(destino);

    const campo = $('input', nova);
    if (campo && window.innerWidth > 720) setTimeout(function () { campo.focus(); }, 350);
  }

  function voltar() {
    const anterior = estado.historico.pop();
    if (anterior) irPara(anterior, true);
  }

  function atualizarTopo() {
    const t = estado.telaAtual;
    const etapas = etapasDoFluxo();
    const pos = etapas.indexOf(t);
    const progresso = $('#progresso');

    const semVoltar = ['intro', 'calculando', 'resultado'];
    $('#btnVoltar').hidden = semVoltar.indexOf(t) >= 0;
    $('#app').classList.toggle('modo-escuro', t === 'passado');

    if (pos >= 0) {
      progresso.hidden = false;
      $('#progressoTexto').textContent = 'Etapa ' + (pos + 1) + ' de ' + etapas.length;
      $('#progressoBarra').style.width = ((pos + 1) / etapas.length * 100) + '%';
    } else if (t === 'passado' || t === 'futuro') {
      progresso.hidden = false;
      $('#progressoTexto').textContent = 'Seu histórico';
      const feitas = etapas.indexOf('tempo') + 1;
      $('#progressoBarra').style.width = (feitas / etapas.length * 100) + '%';
    } else {
      progresso.hidden = true;
    }
  }

  /* ---------- Ao entrar em cada tela ---------- */

  function aoEntrar(tela) {
    if (tela === 'passado') mostrarPassado();
    if (tela === 'futuro') mostrarFuturo();
    if (tela === 'calculando') calcular();
  }

  /* ---------- Validação ---------- */

  function erro(tela, msg) {
    const el = $('[data-tela="' + tela + '"]');
    let aviso = $('.erro', el);
    if (!aviso) {
      aviso = document.createElement('p');
      aviso.className = 'erro';
      aviso.setAttribute('role', 'alert');
      const btn = $('.btn-principal', el);
      el.insertBefore(aviso, btn);
    }
    aviso.textContent = msg;
    el.classList.remove('tremer');
    void el.offsetWidth;
    el.classList.add('tremer');
    return false;
  }

  function limparErro(tela) {
    const aviso = $('[data-tela="' + tela + '"] .erro');
    if (aviso) aviso.remove();
  }

  const validar = {
    renda: function () {
      const v = lerMoeda($('#inRenda').value);
      if (v <= 0) return erro('renda', 'Informe a renda mensal da família para continuar.');
      estado.lead.renda = v;
      estado.lead.rendaPerguntadaAqui = true;
      return true;
    },
    contato: function () {
      const nome = $('#inNome').value.trim();
      const whats = $('#inWhatsapp').value.replace(/\D/g, '');
      if (nome.length < 2) return erro('contato', 'Informe seu nome para continuar.');
      if (whats.length < 10 || whats.length > 13) return erro('contato', 'Confira o número de WhatsApp com DDD.');
      estado.lead.nome = nome.split(/\s+/).map(capitalizar).join(' ');
      estado.lead.whatsapp = whats;
      estado.lead.contatoPerguntadoAqui = true;
      return true;
    },
    aluguel: function () {
      const v = lerMoeda($('#inAluguel').value);
      if (v <= 0) return erro('aluguel', 'Informe o valor do aluguel para continuar.');
      estado.respostas.aluguel = v;
      return true;
    },
    tempo: function () {
      lerTempo();
      if (!estado.tempoCalculado.meses) return erro('tempo', 'Escolha uma opção ou informe os anos e meses.');
      return true;
    },
    entrada: function () {
      const r = estado.respostas;
      if (!r.entradaResposta) return erro('entrada', 'Escolha uma das opções.');
      if (r.entradaResposta === 'sim') {
        r.entradaValor = lerMoeda($('#inEntrada').value);
        if (r.entradaValor <= 0) return erro('entrada', 'Informe o valor ou escolha "Ainda não sei".');
      } else {
        r.entradaValor = 0;
      }
      return true;
    },
    fgts: function () {
      const r = estado.respostas;
      if (!r.fgtsResposta) return erro('fgts', 'Escolha uma das opções.');
      r.fgtsValor = r.fgtsResposta === 'sim' ? lerMoeda($('#inFgts').value) : 0;
      return true;
    }
  };

  function lerTempo() {
    estado.respostas.anos = parseInt($('#inAnos').value, 10) || 0;
    estado.respostas.meses = Math.min(11, parseInt($('#inMeses').value, 10) || 0);
    estado.tempoCalculado = C.mesesDeAluguel({
      anos: estado.respostas.anos,
      meses: estado.respostas.meses,
      faixa: estado.respostas.tempoFaixa
    }, cfg);
  }

  /* ---------- Dicas ao vivo ---------- */

  function atualizarDicaAluguel() {
    const v = lerMoeda($('#inAluguel').value);
    $('#dicaAluguel').innerHTML = v > 0
      ? 'Isso dá <strong>' + brl(v * 12) + '</strong> por ano.'
      : '';
  }

  function atualizarDicaTempo() {
    lerTempo();
    const t = estado.tempoCalculado;
    const el = $('#dicaTempo');
    if (!t.meses) { el.textContent = ''; return; }
    el.innerHTML = t.origem === 'faixa'
      ? 'Vamos considerar cerca de <strong>' + window.CRM.textoTempo(t.meses) + '</strong>.'
      : 'Vamos considerar <strong>' + window.CRM.textoTempo(t.meses) + '</strong> (' + t.meses + ' meses).';
  }

  /* ---------- Tela: passado ---------- */

  function mostrarPassado() {
    const r = estado.respostas;
    const t = estado.tempoCalculado;
    estado.totalPago = C.totalAluguel(r.aluguel, t.meses);
    estado.projecao = C.projecaoAluguel(r.aluguel, cfg);

    animarNumero($('#numPassado'), estado.totalPago, 1600);
    $('#detalhePassado').innerHTML =
      brl(r.aluguel) + ' por mês durante ' + (t.origem === 'faixa' ? 'cerca de ' : '') +
      '<strong>' + window.CRM.textoTempo(t.meses) + '</strong>.';

    // Um quadradinho por mês (agrupa quando passa de 120)
    const grafico = $('#graficoMeses');
    const porBloco = t.meses > 120 ? Math.ceil(t.meses / 120) : 1;
    const blocos = Math.ceil(t.meses / porBloco);
    grafico.innerHTML = '';
    for (let k = 0; k < blocos; k++) {
      const b = document.createElement('span');
      b.style.animationDelay = reduzirMovimento ? '0s' : (k * Math.min(18, 1200 / blocos)) + 'ms';
      grafico.appendChild(b);
    }
    const legenda = document.createElement('small');
    legenda.textContent = porBloco === 1
      ? 'Cada quadrado é um mês de aluguel.'
      : 'Cada quadrado representa ' + porBloco + ' meses de aluguel.';
    grafico.appendChild(legenda);
  }

  /* ---------- Tela: futuro ---------- */

  function mostrarFuturo() {
    const abas = $('#abasHorizonte');
    abas.innerHTML = '';
    estado.projecao.forEach(function (p) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'aba' + (p.anos === estado.horizonteAtivo ? ' ativa' : '');
      b.setAttribute('role', 'tab');
      b.textContent = p.anos + ' anos';
      b.addEventListener('click', function () {
        estado.horizonteAtivo = p.anos;
        mostrarFuturo();
      });
      abas.appendChild(b);
    });

    const ativo = estado.projecao.find(function (p) { return p.anos === estado.horizonteAtivo; }) || estado.projecao[0];
    $('#futuroRotulo').textContent = 'Em ' + ativo.anos + ' anos';
    animarNumero($('#numFuturo'), ativo.valor, 900);

    desenharBarras($('#barrasFuturo'), 'vertical', ativo.anos);
  }

  function desenharBarras(alvo, tipo, destaque) {
    const itens = [{ rotulo: 'Até hoje', valor: estado.totalPago, passado: true }]
      .concat(estado.projecao.map(function (p) {
        return { rotulo: tipo === 'vertical' ? p.anos + ' anos' : 'Em ' + p.anos + ' anos', valor: p.valor, anos: p.anos };
      }));
    const max = Math.max.apply(null, itens.map(function (i) { return i.valor; })) || 1;

    alvo.innerHTML = '';
    alvo.className = (tipo === 'vertical' ? 'barras-futuro' : 'barras-longo');
    itens.forEach(function (item, k) {
      const linha = document.createElement('div');
      linha.className = 'barra' + (item.passado ? ' barra-passado' : '') + (item.anos === destaque ? ' barra-destaque' : '');
      const pct = Math.max(4, item.valor / max * 100);
      linha.innerHTML =
        '<span class="barra-rotulo">' + item.rotulo + '</span>' +
        '<span class="barra-trilho"><span class="barra-fill" style="--tam:' + pct + '%;--atraso:' + (k * 120) + 'ms"></span></span>' +
        '<span class="barra-valor">' + brl(item.valor) + '</span>';
      alvo.appendChild(linha);
    });
  }

  /* ---------- Calcular ---------- */

  function calcular() {
    const r = estado.respostas;
    estado.estimativa = C.estimarFinanciamento({
      renda: estado.lead.renda,
      entrada: r.entradaResposta === 'sim' ? r.entradaValor : 0,
      fgts: r.fgtsResposta === 'sim' ? r.fgtsValor : 0,
      pessoas: r.pessoas,
      possuiImovel: r.possuiImovel
    }, cfg);
    estado.diagnostico = C.diagnostico(estado.estimativa, r, cfg);
    estado.temperatura = C.temperaturaLead(r, estado.estimativa, cfg);

    const itens = $$('#checklist li');
    itens.forEach(function (li) { li.classList.remove('feito'); });
    const passo = reduzirMovimento ? 60 : 550;
    itens.forEach(function (li, k) {
      setTimeout(function () { li.classList.add('feito'); }, passo * (k + 1));
    });
    setTimeout(function () {
      montarResultado();
      estado.historico = [];
      irPara('resultado');
      if (cfg.crm.enviarAoVerResultado && !estado.enviado) {
        estado.enviado = true;
        window.CRM.enviar(estado, 'simulacao_concluida', cfg);
      }
    }, passo * (itens.length + 1));
  }

  /* ---------- Resultado ---------- */

  function linhaDado(rotulo, valor, opcoes) {
    const o = opcoes || {};
    return '<div class="dado' + (o.destaque ? ' dado-destaque' : '') + (o.vazio ? ' dado-vazio' : '') + '">' +
      '<dt>' + rotulo + '</dt><dd>' + valor + (o.nota ? '<small>' + o.nota + '</small>' : '') + '</dd></div>';
  }

  function montarResultado() {
    const r = estado.respostas;
    const est = estado.estimativa;
    const t = estado.tempoCalculado;
    const nome = capitalizar(primeiroNome(estado.lead.nome));

    $('#resTitulo').textContent = nome ? nome + ', este é o seu diagnóstico' : 'Este é o seu diagnóstico';
    animarNumero($('#resPassado'), estado.totalPago, 1400);

    // Cenário atual
    $('#dadosAtual').innerHTML =
      linhaDado('Aluguel mensal', brl(r.aluguel)) +
      linhaDado('Tempo pagando aluguel', (t.origem === 'faixa' ? 'Cerca de ' : '') + window.CRM.textoTempo(t.meses)) +
      linhaDado('Estimativa já destinada ao aluguel', brl(estado.totalPago), { destaque: true, nota: 'Sem considerar reajustes' });

    // Financiamento
    let entradaTxt, entradaVazio = false;
    if (r.entradaResposta === 'sim') entradaTxt = brl(r.entradaValor);
    else if (r.entradaResposta === 'nao') { entradaTxt = 'Sem entrada no momento'; entradaVazio = true; }
    else { entradaTxt = 'Ainda não sabe'; entradaVazio = true; }

    let fgtsTxt, fgtsVazio = false;
    if (r.fgtsResposta === 'sim') {
      if (r.fgtsValor) fgtsTxt = brl(r.fgtsValor);
      else { fgtsTxt = 'Possui, valor não informado'; fgtsVazio = true; }
    } else if (r.fgtsResposta === 'nao') { fgtsTxt = 'Não possui'; fgtsVazio = true; }
    else { fgtsTxt = 'Não sabe'; fgtsVazio = true; }

    let html =
      linhaDado('Renda familiar', brl(estado.lead.renda)) +
      linhaDado('Entrada informada', entradaTxt, { vazio: entradaVazio }) +
      linhaDado('FGTS informado', fgtsTxt, { vazio: fgtsVazio });

    if (est.subsidioEstimado > 0) {
      html += linhaDado('Subsídio considerado', 'até ' + brl(est.subsidioEstimado), { nota: 'Depende das regras do programa' });
    }

    const notaParcela = { nota: 'Prazo de ' + Math.round(est.prazoMeses / 12) + ' anos. Valor aproximado' };

    if (est.status === 'estimado') {
      html +=
        linhaDado('Estimativa de faixa de imóvel', window.CRM.textoFaixa(est.faixaImovel), { destaque: true }) +
        linhaDado('Estimativa de faixa de financiamento', window.CRM.textoFaixa(est.faixaFinanciamento), { destaque: true }) +
        linhaDado('Parcela de referência', 'em torno de ' + brl(est.parcelaEstimada) + '/mês', notaParcela) +
        linhaEntrada(est);
    } else if (est.status === 'abaixo-do-minimo') {
      html +=
        linhaDado('Imóveis disponíveis', 'a partir de ' + brl(est.valorMinimoImovel), { destaque: true }) +
        linhaDado('Financiamento estimado pela sua renda', window.CRM.textoFaixa(est.faixaFinanciamento), { destaque: true }) +
        linhaDado('Parcela de referência', 'em torno de ' + brl(est.parcelaEstimada) + '/mês', notaParcela) +
        linhaEntrada(est);
    } else {
      html += linhaDado('Estimativa de faixa de financiamento', 'Precisa de análise personalizada', { vazio: true });
    }
    $('#dadosFinanciamento').innerHTML = html;

    montarComposicao(est, r);

    // Próximo passo
    let proximo = 'Descubra quais possibilidades de financiamento podem fazer sentido para o seu perfil.';
    if (est.status === 'estimado') {
      proximo = 'Sua estimativa aponta para imóveis entre ' + window.CRM.textoFaixa(est.faixaImovel) + '. Descubra quais possibilidades podem fazer sentido para o seu perfil.';
    } else if (est.status === 'abaixo-do-minimo') {
      proximo = 'Os imóveis começam em ' + brl(est.valorMinimoImovel) + '. Descubra com um especialista quais caminhos podem aproximar você desse valor.';
    }
    $('#resProximoTexto').textContent = proximo;

    // Mensagem
    const d = estado.diagnostico;
    const msg = $('#mensagem');
    msg.className = 'card mensagem mensagem-' + d.tom;
    $('#mensagemTitulo').textContent = d.titulo;
    $('#mensagemTexto').textContent = d.texto;

    desenharBarras($('#barrasLongo'), 'horizontal');
    montarFatores(est, r);
  }

  // Entrada estimada para o imóvel e quanto falta além do que a pessoa informou
  function linhaEntrada(est) {
    if (est.complementoEntrada > 0) {
      return linhaDado('Entrada estimada para esse imóvel', brl(est.entradaNecessaria),
          { nota: 'Parte que o financiamento não cobre' }) +
        linhaDado('Diferença a complementar', 'cerca de ' + brl(est.complementoEntrada),
          { vazio: true, nota: 'Em muitos empreendimentos dá para parcelar. O especialista confirma' });
    }
    return linhaDado('Entrada estimada para esse imóvel', brl(est.entradaNecessaria),
      { nota: 'Coberta pelo que você informou' });
  }

  function montarComposicao(est, r) {
    const alvo = $('#composicao');
    if ((est.status !== 'estimado' && est.status !== 'abaixo-do-minimo') || !est.imovelReferencia) { alvo.innerHTML = ''; return; }

    const partes = [
      { nome: 'Financiamento', valor: est.financiamento, cls: 'c-fin' },
      { nome: 'Entrada', valor: r.entradaResposta === 'sim' ? r.entradaValor : 0, cls: 'c-ent' },
      { nome: 'FGTS', valor: r.fgtsResposta === 'sim' ? r.fgtsValor : 0, cls: 'c-fgts' },
      { nome: 'Subsídio', valor: est.subsidioEstimado, cls: 'c-sub' },
      { nome: 'A complementar', valor: est.complementoEntrada, cls: 'c-falta' }
    ].filter(function (p) { return p.valor > 0; });

    const total = partes.reduce(function (s, p) { return s + p.valor; }, 0) || 1;
    alvo.innerHTML =
      '<p class="composicao-titulo">Como fecha um imóvel de ' + brl(est.imovelReferencia) + '</p>' +
      '<div class="composicao-barra">' + partes.map(function (p) {
        return '<span class="' + p.cls + '" style="width:' + (p.valor / total * 100) + '%"></span>';
      }).join('') + '</div>' +
      '<ul class="composicao-legenda">' + partes.map(function (p) {
        return '<li><i class="' + p.cls + '"></i>' + p.nome + '<b>' + brl(p.valor) + '</b></li>';
      }).join('') + '</ul>';
  }

  function montarFatores(est, r) {
    const fin = cfg.financiamento;
    const itens = [];
    const pct = Math.round(fin.comprometimentoRenda * 100);

    itens.push({
      estado: 'ok', titulo: 'Renda familiar',
      texto: brl(estado.lead.renda) + '. Nesta simulação a parcela fica em até ' + pct + '% da renda, cerca de ' + brl(estado.lead.renda * fin.comprometimentoRenda) + ' por mês.'
    });

    if (r.entradaResposta === 'sim') {
      itens.push({ estado: 'ok', titulo: 'Entrada', texto: brl(r.entradaValor) + ' disponíveis. Quanto maior a entrada, menor o valor financiado.' });
    } else {
      itens.push({ estado: 'pendente', titulo: 'Entrada', texto: r.entradaResposta === 'nao-sei'
        ? 'Você ainda não sabe o valor. Vale confirmar, porque a entrada muda bastante a conta.'
        : 'Sem entrada no momento. FGTS e subsídio podem ajudar nessa parte.' });
    }

    if (r.fgtsResposta === 'sim') {
      itens.push({ estado: r.fgtsValor ? 'ok' : 'pendente', titulo: 'FGTS', texto: r.fgtsValor
        ? brl(r.fgtsValor) + ' informados. O FGTS pode ser usado na entrada, conforme as regras.'
        : 'Você tem FGTS, mas não sabe o saldo. Dá para consultar no app do FGTS.' });
    } else {
      itens.push({ estado: r.fgtsResposta === 'nao-sei' ? 'pendente' : 'neutro', titulo: 'FGTS', texto: r.fgtsResposta === 'nao-sei'
        ? 'Se você já trabalhou com carteira assinada, pode ter saldo. Vale consultar.'
        : 'Não considerado na estimativa.' });
    }

    itens.push({
      estado: 'neutro', titulo: 'Composição familiar',
      texto: (r.pessoas === 5 ? '5 ou mais pessoas' : r.pessoas + (r.pessoas === 1 ? ' pessoa' : ' pessoas')) + '. Pode influenciar regras e benefícios do programa.'
    });

    itens.push(r.possuiImovel
      ? { estado: 'atencao', titulo: 'Imóvel no seu nome', texto: 'Você informou que já tem imóvel. Isso precisa ser analisado, porque muda as regras que podem valer para você.' }
      : { estado: 'ok', titulo: 'Imóvel no seu nome', texto: 'Você informou que não tem imóvel. Esse costuma ser um requisito do programa.' });

    if (est.taxaJurosAnual != null) {
      itens.push({
        estado: 'neutro', titulo: 'Prazo e juros',
        texto: 'Simulação com prazo de ' + Math.round(fin.prazoMeses / 12) + ' anos e juros de referência de ' +
          (est.taxaJurosAnual * 100).toLocaleString('pt-BR', { maximumFractionDigits: 2 }) + '% ao ano.'
      });
    }

    $('#fatores').innerHTML = itens.map(function (i) {
      return '<li class="fator fator-' + i.estado + '"><span class="fator-icone" aria-hidden="true"></span>' +
        '<div><strong>' + i.titulo + '</strong><p>' + i.texto + '</p></div></li>';
    }).join('');
  }

  /* ---------- CTA ---------- */

  function clicarCta() {
    const cta = cfg.ctaFinal;
    let destino = '';
    if (cta.tipo === 'whatsapp') destino = window.CRM.linkWhatsapp(estado, cfg);
    else if (cta.tipo === 'url' && cta.url) {
      const u = new URL(cta.url, location.href);
      if (estado.lead.nome) u.searchParams.set('nome', estado.lead.nome);
      if (estado.lead.whatsapp) u.searchParams.set('whatsapp', estado.lead.whatsapp);
      destino = u.toString();
    }

    // Abre antes do envio para o navegador não bloquear a nova aba
    let janela = null;
    if (destino && cta.abrirEmNovaAba) janela = window.open(destino, '_blank', 'noopener');

    $('#ctaFeedback').textContent = 'Pronto! Suas informações foram encaminhadas para um especialista.';
    window.CRM.enviar(estado, 'cta_especialista', cfg).then(function () {
      if (destino && (!cta.abrirEmNovaAba || !janela)) location.href = destino;
    });
  }

  /* ---------- Refazer ---------- */

  function refazer() {
    Object.assign(estado.respostas, {
      aluguel: 0, tempoFaixa: null, anos: 0, meses: 0, entradaResposta: null, entradaValor: 0,
      fgtsResposta: null, fgtsValor: 0, pessoas: null, possuiImovel: null, objetivo: null,
      jaFinanciou: null, momento: null, prazo: null, pronto: null
    });
    // Se a renda foi perguntada aqui, pergunta de novo
    if (estado.lead.rendaPerguntadaAqui) { estado.lead.renda = 0; estado.lead.rendaPerguntadaAqui = false; }
    if (estado.lead.contatoPerguntadoAqui) { estado.lead.nome = ''; estado.lead.whatsapp = ''; estado.lead.contatoPerguntadoAqui = false; }
    estado.enviado = false;
    $$('#app input').forEach(function (i) { i.value = ''; });
    $$('.opcao.selecionada').forEach(function (o) { o.classList.remove('selecionada'); o.setAttribute('aria-pressed', 'false'); });
    $$('.revela').forEach(function (r) { r.hidden = true; });
    $$('.dica-viva').forEach(function (d) { d.textContent = ''; });
    montarFluxo();
    estado.historico = [];
    irPara('intro', true);
  }

  /* ---------- Eventos ---------- */

  function ligarEventos() {
    $('#btnVoltar').addEventListener('click', voltar);

    document.addEventListener('click', function (ev) {
      const alvo = ev.target.closest('[data-acao]');
      if (!alvo) return;
      const acao = alvo.getAttribute('data-acao');
      const tela = estado.telaAtual;

      if (acao === 'comecar') irPara(proximaTela('intro'));
      if (acao === 'continuar') {
        const regra = alvo.getAttribute('data-valida');
        if (regra && validar[regra] && !validar[regra]()) return;
        limparErro(tela);
        irPara(proximaTela(tela));
      }
      if (acao === 'ir') irPara(alvo.getAttribute('data-destino'));
      if (acao === 'cta') clicarCta();
      if (acao === 'refazer') refazer();
    });

    // Opções (botões de escolha)
    $$('[data-grupo]').forEach(function (grupo) {
      const chave = grupo.getAttribute('data-grupo');
      const avanca = grupo.hasAttribute('data-avanca');
      $$('.opcao', grupo).forEach(function (op) {
        op.setAttribute('aria-pressed', 'false');
        op.addEventListener('click', function () {
          $$('.opcao', grupo).forEach(function (o) { o.classList.remove('selecionada'); o.setAttribute('aria-pressed', 'false'); });
          op.classList.add('selecionada');
          op.setAttribute('aria-pressed', 'true');
          escolher(chave, op.getAttribute('data-valor'));
          limparErro(estado.telaAtual);
          if (avanca) {
            const telaDaOpcao = estado.telaAtual;
            setTimeout(function () {
              if (estado.telaAtual === telaDaOpcao) irPara(proximaTela(telaDaOpcao));
            }, reduzirMovimento ? 50 : 320);
          }
        });
      });
    });

    // Campos em R$ com máscara de milhar
    $$('[data-moeda]').forEach(function (inp) {
      inp.addEventListener('input', function () {
        const n = lerMoeda(inp.value.replace(/[^\d]/g, ''));
        inp.value = formatarMilhar(n);
        if (inp.id === 'inAluguel') atualizarDicaAluguel();
      });
    });

    // Máscara de telefone: (11) 99999-9999
    $('#inWhatsapp').addEventListener('input', function () {
      const d = this.value.replace(/\D/g, '').slice(0, 11);
      let v = d;
      if (d.length > 2) v = '(' + d.slice(0, 2) + ') ' + d.slice(2);
      if (d.length > 7) v = '(' + d.slice(0, 2) + ') ' + d.slice(2, d.length - 4) + '-' + d.slice(-4);
      this.value = v;
    });

    ['#inAnos', '#inMeses'].forEach(function (sel) {
      $(sel).addEventListener('input', atualizarDicaTempo);
    });

    // Enter avança
    document.addEventListener('keydown', function (ev) {
      if (ev.key !== 'Enter' || ev.target.tagName !== 'INPUT') return;
      const btn = $('[data-tela="' + estado.telaAtual + '"] .btn-principal');
      if (btn) { ev.preventDefault(); btn.click(); }
    });
  }

  function escolher(chave, valor) {
    const r = estado.respostas;
    if (chave === 'tempoFaixa') { r.tempoFaixa = valor; atualizarDicaTempo(); }
    if (chave === 'entradaResposta') {
      r.entradaResposta = valor;
      const box = $('#revelaEntrada');
      box.hidden = valor !== 'sim';
      if (valor === 'sim') setTimeout(function () { $('#inEntrada').focus(); }, 60);
    }
    if (chave === 'fgtsResposta') {
      r.fgtsResposta = valor;
      $('#revelaFgts').hidden = valor !== 'sim';
    }
    if (chave === 'pessoas') r.pessoas = parseInt(valor, 10);
    if (chave === 'possuiImovel') r.possuiImovel = valor === 'sim';
    if (['objetivo', 'jaFinanciou', 'momento', 'prazo', 'pronto'].indexOf(chave) >= 0) r[chave] = valor;
  }

  /* ---------- Início ---------- */

  function iniciar() {
    carregarDadosLP();
    montarFluxo();

    const nome = capitalizar(primeiroNome(estado.lead.nome));
    $('#saudacao').textContent = nome ? 'Olá, ' + nome + '! Vamos entender o seu cenário.' : 'Olá! Vamos entender o seu cenário.';

    const marca = $('#marca');
    if (cfg.marca.logoUrl) {
      const img = document.createElement('img');
      img.src = cfg.marca.logoUrl;
      img.alt = cfg.marca.nome;
      marca.appendChild(img);
    } else {
      marca.textContent = cfg.marca.nome;
    }

    ligarEventos();
    atualizarTopo();
  }

  // Exposto para testes e integrações
  window.Calculadora = { estado: estado };

  iniciar();
})();
