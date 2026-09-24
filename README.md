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
7. Perguntas de financiamento: entrada, FGTS, família, imóvel no nome
8. Perguntas de qualificação: já tentou financiar, objetivo, momento de compra, prazo para decidir e se está pronto para seguir
9. Tela de cálculo
10. Resultado: até hoje x próximo passo, os dois cenários, mensagem personalizada, projeção de longo prazo, fatores que influenciam e CTA

## Usar no GoHighLevel

Existem dois caminhos.

**Caminho A: colar o código pronto (recomendado, fica idêntico à prévia)**
1. No funil da LP, crie um novo passo (página) só para a calculadora
2. Adicione uma seção de largura total e, dentro dela, o elemento **Código personalizado** (Custom JS/HTML)
3. Abra o arquivo `dist/calculadora-ghl.html`, copie tudo e cole no elemento
4. Antes de colar, procure por `webhookUrl` e `whatsappNumero` e preencha
5. No formulário da LP, configure o envio para abrir a página da calculadora, de preferência com `?nome=...&whatsapp=...&renda=...` na URL. Se a renda não chegar, a calculadora pergunta. Nome e WhatsApp precisam vir da LP para o lead chegar completo ao CRM

Para o lead cair no CRM: crie um Workflow com o gatilho **Inbound Webhook**, copie a URL gerada para `webhookUrl` e use a ação **Create/Update Contact** para mapear os campos (`telefone`, `primeiro_nome`, `temperatura`, `faixa_imovel`, `resumo_corretor` etc). Os campos chegam numa lista simples, sem nada aninhado.

Sempre que mudar algo em `index.html`, `css/` ou `js/`, gere de novo o arquivo com `python3 tools/gerar-ghl.py`.

**Caminho B: pedir para a IA do GoHighLevel montar**
O prompt completo está em `docs/prompt-gohighlevel.md`. A IA do GHL costuma entregar uma versão mais simples, por isso o caminho A é o mais fiel.

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
Temperatura: QUENTE (10 pontos)
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
Prazo para decidir: Nos próximos 3 meses
Pronto para seguir: Sim, quer avançar
Momento: Já visitou imóveis
Já tentou financiar: Nunca tentou
Estimativa de financiamento: R$ 76.000 a R$ 94.000
Estimativa de imóvel: R$ 95.000 a R$ 117.000
```

O `indicadorInterno` ajuda o corretor a priorizar (ex.: `estimado`, `precisa-entrada`, `renda-acima-faixas`, `analisar-imovel-existente`). Ele **não aparece** para o usuário.

## Temperatura do lead

Com as respostas de qualificação, a calculadora dá uma nota ao lead: **quente**, **morno** ou **frio**. Ela vai só para o CRM e para o resumo do corretor. O cliente nunca vê, e o texto que ele manda no WhatsApp também não mostra essa nota.

| Resposta | Pontos |
|---|---|
| Prazo: 3 meses / 3 a 6 / 6 a 12 / mais de 1 ano ou não sabe | 3 / 2 / 1 / 0 |
| Pronto para seguir: quer avançar / conversar com a família / só entender | 3 / 1 / 0 |
| Momento: imóvel em vista / já visitou / viu na internet / começando | 3 / 2 / 1 / 0 |
| Já tentou financiar: tem simulação / nunca / não conseguiu | 2 / 1 / 1 |
| A simulação encontrou uma faixa de financiamento | +1 |

Com 9 pontos ou mais o lead é quente. De 5 a 8 é morno. Abaixo de 5 é frio. Os pesos e os limites ficam em `config.js`, em `qualificacao`.

No JSON, esses dados chegam no bloco `qualificacao` (`prazoDecisao`, `prontoParaSeguir`, `momentoDeCompra`, `jaTentouFinanciar`, `temperatura`, `pontuacao`).

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
| `valorMinimoImovel` | Preço do imóvel mais barato que vocês vendem. A estimativa nunca mostra menos que isso |
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
5. Valor do imóvel = o que a renda financia + esses recursos, limitado ao teto da faixa
6. O imóvel nunca fica abaixo de `valorMinimoImovel` (hoje R$ 240.000). Se a renda não chegar lá, a conta é feita para o imóvel mínimo e o resultado mostra quanto falta
7. O financiamento cobre no máximo o percentual financiável (80%). O resto é a **entrada estimada**. Se o que a pessoa informou não cobre essa entrada, aparece a **diferença a complementar**
8. O resultado aparece como faixa (mínimo e máximo), sempre marcado como estimativa

Exemplos com os valores atuais:

| Cenário | Imóvel | Financiamento | Parcela | Entrada estimada | Falta |
|---|---|---|---|---|---|
| Renda R$ 4.500, entrada R$ 10 mil | R$ 240 mil a R$ 264 mil | cerca de R$ 204 mil | cerca de R$ 1.139 | R$ 50.901 | R$ 37.658 |
| Renda R$ 8.000, entrada R$ 60 mil | R$ 315 mil a R$ 350 mil | R$ 280 mil | cerca de R$ 1.869 | R$ 70.000 | R$ 10.000 |
| Renda R$ 3.000, sem entrada | abaixo do mínimo, conta feita para R$ 240 mil | cerca de R$ 161 mil | R$ 900 | R$ 79.158 | R$ 51.591 |

No último caso a mensagem explica que a estimativa ficou abaixo dos imóveis disponíveis e sugere caminhos, como juntar a renda com outra pessoa.

## 5. Linguagem

A ferramenta nunca diz "aprovado", "reprovado" ou "você pode financiar exatamente". Todo número de financiamento aparece como faixa, com o selo "Estimativa" e o aviso de que a aprovação depende da análise de crédito.

## Testar localmente

Abra o `index.html` no navegador, ou rode `python3 -m http.server` na pasta e acesse:

```
http://localhost:8000/?nome=Ana&whatsapp=11999998888&renda=4500
```
