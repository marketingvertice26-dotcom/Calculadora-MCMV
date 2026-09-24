/* ==========================================================================
   CONFIGURAÇÃO CENTRAL DA CALCULADORA
   --------------------------------------------------------------------------
   Todas as regras de cálculo ficam aqui. Para mudar taxa, prazo, faixas de
   renda, subsídio, teto do imóvel, integração com CRM ou textos do CTA,
   altere somente este arquivo.

   ATENÇÃO: os valores abaixo são REFERÊNCIAS DE EXEMPLO para a ferramenta
   funcionar. Eles NÃO são a regra oficial do Minha Casa, Minha Vida.
   Antes de publicar, confirme cada número com o correspondente bancário
   ou com as regras vigentes do programa.
   ========================================================================== */

window.CALC_CONFIG = {

  /* ------------------------------------------------------------------
     1. REGRAS DE FINANCIAMENTO
     ------------------------------------------------------------------ */
  financiamento: {
    // Parte da renda que pode ir para a parcela (0.30 = 30%)
    comprometimentoRenda: 0.30,

    // Prazo em meses (420 = 35 anos)
    prazoMeses: 420,

    // 'PRICE' (parcelas iguais) ou 'SAC' (primeira parcela maior, depois cai)
    sistemaAmortizacao: 'PRICE',

    // Percentual máximo do imóvel que pode ser financiado (0.80 = 80%)
    percentualFinanciavel: 0.80,

    // Se true, o financiamento nunca passa do percentual acima.
    // Nesse caso a entrada + FGTS + subsídio precisam cobrir o restante.
    aplicarLimitePercentualFinanciavel: true,

    // Custo mensal estimado de seguros e taxas somado à parcela (em R$).
    // Deixe 0 para ignorar.
    custosMensaisExtras: 0,

    // Margem usada para mostrar o resultado como faixa (0.10 = ±10%)
    margemFaixa: 0.10,

    // Arredondamento dos valores exibidos na faixa (1000 = milhar)
    arredondarPara: 1000,

    // O programa costuma exigir que a família não tenha imóvel próprio.
    // Se true, quem tem imóvel recebe o aviso e fica sem subsídio na conta.
    exigeNaoPossuirImovel: true,

    /* Faixas de renda. Cada faixa define:
       - nome: rótulo interno (vai para o CRM)
       - rendaMax: renda familiar bruta máxima da faixa
       - taxaJurosAnual: juros ao ano (0.05 = 5% a.a.)
       - subsidioMax: subsídio máximo considerado na conta (R$)
       - valorMaxImovel: teto do imóvel na faixa (R$)
       VALORES DE EXEMPLO. AJUSTE ANTES DE USAR. */
    faixas: [
      { nome: 'Faixa 1', rendaMax: 2850,  taxaJurosAnual: 0.0450, subsidioMax: 55000, valorMaxImovel: 264000 },
      { nome: 'Faixa 2', rendaMax: 4700,  taxaJurosAnual: 0.0600, subsidioMax: 30000, valorMaxImovel: 264000 },
      { nome: 'Faixa 3', rendaMax: 8600,  taxaJurosAnual: 0.0766, subsidioMax: 0,     valorMaxImovel: 350000 },
      { nome: 'Faixa 4', rendaMax: 12000, taxaJurosAnual: 0.1000, subsidioMax: 0,     valorMaxImovel: 500000 }
    ],

    /* Como o subsídio entra na conta.
       'nenhum'       → ignora subsídio
       'maximo'       → usa o subsidioMax da faixa
       'proporcional' → quanto menor a renda dentro da faixa, maior o subsídio
       Use 'nenhum' se preferir não sinalizar subsídio na estimativa. */
    modoSubsidio: 'proporcional',

    /* Ajuste opcional pela composição familiar.
       Multiplicador aplicado ao subsídio estimado conforme o número de
       pessoas. Deixe tudo 1 para não aplicar ajuste. */
    ajusteSubsidioPorPessoas: { 1: 1, 2: 1, 3: 1, 4: 1, 5: 1 }
  },

  /* ------------------------------------------------------------------
     2. PROJEÇÃO DO ALUGUEL
     ------------------------------------------------------------------ */
  aluguel: {
    // Horizontes da projeção futura (em anos)
    horizontesAnos: [5, 10, 20],

    // Meses usados quando a pessoa escolhe só a faixa de tempo
    mesesPorFaixaTempo: {
      'menos-1': 6,
      '1-2': 18,
      '3-5': 48,
      '6-10': 96,
      'mais-10': 144
    }
  },

  /* ------------------------------------------------------------------
     3. DADOS VINDOS DA LANDING PAGE
     A calculadora procura os dados nesta ordem:
       a) parâmetros da URL (ex.: ?nome=Ana&whatsapp=11999999999&renda=4500)
       b) sessionStorage / localStorage com a chave abaixo (JSON)
     ------------------------------------------------------------------ */
  landingPage: {
    parametrosUrl: {
      nome: ['nome', 'name', 'first_name'],
      whatsapp: ['whatsapp', 'telefone', 'phone', 'celular'],
      renda: ['renda', 'renda_familiar', 'income']
    },
    chaveStorage: 'lp_lead',
    // Parâmetros de campanha repassados ao CRM
    parametrosRastreio: ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'gclid', 'fbclid']
  },

  /* ------------------------------------------------------------------
     4. INTEGRAÇÃO COM O CRM
     ------------------------------------------------------------------ */
  crm: {
    // URL que recebe o POST com o JSON do lead (webhook do CRM, Zapier,
    // Make, n8n etc). Deixe '' para não enviar.
    webhookUrl: '',

    // Cabeçalhos extras (ex.: token do CRM)
    headers: {},

    // Envia os dados assim que o resultado aparece (garante o lead mesmo
    // que a pessoa não clique no CTA). O clique no CTA envia de novo com
    // o evento "cta_especialista".
    enviarAoVerResultado: true,

    // Também publica os eventos no dataLayer (Google Tag Manager)
    usarDataLayer: true
  },

  /* ------------------------------------------------------------------
     5. CTA FINAL
     ------------------------------------------------------------------ */
  ctaFinal: {
    // 'whatsapp' abre conversa com o especialista já com o resumo
    // 'url' redireciona para outra página (agenda, obrigado etc)
    tipo: 'whatsapp',
    whatsappNumero: '5500000000000', // DDI + DDD + número, só dígitos
    url: '',
    abrirEmNovaAba: true
  },

  /* ------------------------------------------------------------------
     6. MARCA
     ------------------------------------------------------------------ */
  marca: {
    nome: 'Sua Imobiliária',
    logoUrl: '' // opcional
  }
};
