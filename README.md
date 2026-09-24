# Calculadora Aluguel x Financiamento MCMV

Ferramenta de diagnóstico que entra logo depois da Landing Page. A pessoa informa quanto paga de aluguel e há quanto tempo, vê quanto isso já representou, quanto pode representar no futuro e recebe uma estimativa do cenário de financiamento pelo Minha Casa, Minha Vida. No fim, o lead chega ao CRM com tudo organizado para o corretor.

Feita em HTML, CSS e JavaScript puros. Não precisa de instalação nem de build. Basta subir a pasta em qualquer hospedagem.

## Arquivos

| Arquivo | O que tem |
|---|---|
| `index.html` | As telas da calculadora |
| `css/style.css` | Visual (cores no topo do arquivo, em `:root`) |
| `js/config.js` | **Todas as regras e configurações.** É o único arquivo que você precisa mexer no dia a dia |
| `js/calculos.js` | As contas (aluguel, projeção, financiamento, mensagem final) |
| `js/crm.js` | Monta o JSON do lead, o resumo do corretor e faz o envio |
| `js/app.js` | Navegação entre telas e montagem do resultado |

## Jornada

1. Intro com o nome da pessoa ("Olá, Ana! Vamos entender o seu cenário.")
2. Renda familiar (só aparece se a LP não mandou)
3. Etapa 1: valor do aluguel
4. Etapa 2: tempo pagando aluguel (opções rápidas + campo de anos e meses exatos)
5. Revelação: quanto já foi para o aluguel
6. Projeção: 5, 10 e 20 anos + "Agora imagine se parte desse dinheiro..."
7. Etapas 3 a 7: entrada, FGTS, família, imóvel no nome, objetivo
8. Tela de cálculo
9. Resultado: até hoje x próximo passo, os dois cenários, mensagem personalizada, projeção de longo prazo, fatores que influenciam e CTA

## 1. Como a LP passa os dados

A calculadora lê nome, WhatsApp e renda de duas formas. Use a que for mais fácil.

**Pela URL** (mais simples). Ao enviar o formulário da LP, redirecione para:

```
https://seusite.com/calculadora/?nome=Ana%20Souza&whatsapp=11999998888&renda=4500&utm_source=meta
```

**Pelo navegador**. Antes de redirecionar, a LP salva:

```js
sessionStorage.setItem('lp_lead', JSON.stringify({ nome: 'Ana Souza', whatsapp: '11999998888', renda: 4500 }));
```

Os nomes aceitos para cada campo ficam em `config.js`, em `landingPage.parametrosUrl`. Os UTMs e `gclid`/`fbclid` também são repassados ao CRM.

Se a renda não chegar, a calculadora pergunta. Se o nome não chegar, a saudação fica genérica.

## 2. Como ligar ao CRM

Em `js/config.js`:

```js
crm: {
  webhookUrl: 'https://seu-crm.com/webhook',  // CRM, Zapier, Make, n8n...
  headers: { 'Authorization': 'Bearer SEU_TOKEN' },
  enviarAoVerResultado: true,
  usarDataLayer: true
}
```

São enviados dois eventos:

- `simulacao_concluida`: quando o resultado aparece (garante o lead mesmo que a pessoa não clique no botão)
- `cta_especialista`: quando a pessoa clica em "Quero falar com um especialista"

Enquanto `webhookUrl` estiver vazio, o JSON aparece no console do navegador para teste.

### Estrutura enviada

```json
{
  "evento": "simulacao_concluida",
  "dadosPessoais":   { "nome", "whatsapp", "rendaFamiliar" },
  "dadosFinanceiros": { "aluguelMensal", "tempoAluguelTotalMeses", "valorEstimadoPagoAluguel",
                        "possuiEntrada", "valorEntrada", "possuiFgts", "valorFgtsAproximado", ... },
  "perfil":          { "pessoasNaFamilia", "possuiImovel", "objetivo", ... },
  "dadosCalculados": { "projecaoAluguel5Anos", "projecaoAluguel10Anos", "projecaoAluguel20Anos",
                       "estimativaFinanciamentoMin", "estimativaFinanciamentoMax",
                       "estimativaImovelMin", "estimativaImovelMax", "parcelaEstimada",
                       "subsidioEstimado", "fatorLimitante", "indicadorInterno", "pendencias" },
  "parametrosUtilizados": { "taxaJurosAnual", "prazoMeses", "sistemaAmortizacao", ... },
  "resumoCorretor": "Lead simulou possibilidade de sair do aluguel.\nRenda familiar: R$ 4.500\n..."
}
```

O campo `resumoCorretor` é um texto pronto para colar na nota do lead:

```
Lead simulou possibilidade de sair do aluguel.
Nome: Ana Souza
Renda familiar: R$ 4.500
Aluguel atual: R$ 1.200
Tempo pagando aluguel: 5 anos
Estimativa já paga em aluguel: R$ 72.000
Entrada: R$ 10.000
FGTS: Sim (aprox. R$ 8.000)
Pessoas na família: 3
Possui imóvel: Não
Objetivo: Comprar primeiro imóvel
Estimativa de financiamento: R$ 76.000 a R$ 94.000
Estimativa de imóvel: R$ 95.000 a R$ 117.000
```

O `indicadorInterno` ajuda o corretor a priorizar (ex.: `estimado`, `precisa-entrada`, `renda-acima-faixas`, `analisar-imovel-existente`). Ele **não aparece** para o usuário.

## 3. Botão final

Em `ctaFinal`:

- `tipo: 'whatsapp'` abre conversa com o número em `whatsappNumero`, já com o resumo escrito
- `tipo: 'url'` leva para outra página (agenda, obrigado etc). Nome e WhatsApp vão na URL

## 4. Regras do financiamento

**Os números que estão no `config.js` são de exemplo.** Eles servem para a ferramenta funcionar e não são a regra oficial do programa. Confirme tudo com o correspondente bancário antes de publicar.

O que dá para ajustar em `financiamento`:

| Variável | Para que serve |
|---|---|
| `comprometimentoRenda` | Parte da renda que pode virar parcela (0.30 = 30%) |
| `prazoMeses` | Prazo do financiamento |
| `sistemaAmortizacao` | `'PRICE'` ou `'SAC'` |
| `percentualFinanciavel` | Quanto do imóvel pode ser financiado |
| `aplicarLimitePercentualFinanciavel` | Liga ou desliga a trava acima |
| `custosMensaisExtras` | Seguros e taxas somados à parcela |
| `margemFaixa` | Largura da faixa mostrada (0.10 = mais ou menos 10%) |
| `exigeNaoPossuirImovel` | Trata quem já tem imóvel como caso para análise |
| `faixas` | Renda máxima, juros, subsídio máximo e teto do imóvel de cada faixa |
| `modoSubsidio` | `'nenhum'`, `'maximo'` ou `'proporcional'` |
| `ajusteSubsidioPorPessoas` | Multiplicador do subsídio pelo tamanho da família |

### Como a conta funciona

1. A renda define a faixa e a taxa de juros
2. Parcela máxima = renda × comprometimento
3. Com a parcela máxima, taxa e prazo, calcula quanto dá para financiar (PRICE ou SAC)
4. Soma entrada + FGTS + subsídio estimado
5. O valor do imóvel é o menor entre: o que a renda permite + recursos, o que os recursos cobrem pelo percentual financiável e o teto da faixa
6. O resultado aparece como faixa (mínimo e máximo), sempre marcado como estimativa

Exemplo com os valores atuais: renda de R$ 4.500 cai na Faixa 2 (6% a.a.). A parcela máxima fica em R$ 1.350. Em 35 anos, isso comportaria cerca de R$ 241 mil. Com R$ 18 mil de entrada + FGTS e o limite de 80%, a estimativa de imóvel fica perto de R$ 106 mil. Nesse caso quem limita a conta é a entrada, e a mensagem final avisa isso.

## 5. Linguagem

A ferramenta nunca diz "aprovado", "reprovado" ou "você pode financiar exatamente". Todo número de financiamento aparece como faixa, com o selo "Estimativa" e o aviso de que a aprovação depende da análise de crédito.

## Testar localmente

Abra o `index.html` no navegador, ou rode `python3 -m http.server` na pasta e acesse:

```
http://localhost:8000/?nome=Ana&whatsapp=11999998888&renda=4500
```
