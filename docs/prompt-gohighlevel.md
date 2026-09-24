# Prompt para a IA do GoHighLevel

Copie tudo o que está dentro do bloco abaixo e cole na IA do GoHighLevel (construtor de funil/site com IA ou elemento de código com IA).

```
Crie uma página de funil com uma CALCULADORA INTERATIVA chamada "Aluguel x Financiamento MCMV".
Ela fica logo depois da minha Landing Page, que já existe e já captura nome, WhatsApp e renda familiar.
Público: pessoas que pagam aluguel e querem financiar um imóvel pelo Minha Casa, Minha Vida. A maioria chega pelo celular, vinda de anúncios.

OBJETIVO
Fazer a pessoa perceber quanto já gastou com aluguel, quanto ainda pode gastar e ver uma estimativa do cenário de financiamento dela. No final, levar para um especialista no WhatsApp e salvar tudo no CRM do GoHighLevel, com as informações organizadas para o corretor.

REGRAS DE EXPERIÊNCIA
1. Mobile first. Uma pergunta por tela, botões grandes, pouco texto, teclado numérico nos campos de valor.
2. Barra de progresso no topo com "Etapa X de Y" e botão de voltar.
3. Nas perguntas de múltipla escolha, ao tocar numa opção, avança sozinho para a próxima tela.
4. Transições suaves entre telas. Números grandes com animação de contagem.
5. Visual de ferramenta financeira moderna: fundo claro (#F4F7F5), cards brancos com cantos arredondados, verde escuro (#0B3B2E) como cor principal, verde (#16A34A) nos destaques positivos e laranja (#F59E0B) para os valores de aluguel. Fonte Inter.
6. Não pode parecer formulário burocrático nem planilha.

DADOS QUE VÊM DA LANDING PAGE
Ler da URL os parâmetros nome, whatsapp e renda (exemplo: ?nome=Ana&whatsapp=11999998888&renda=4500) e também utm_source, utm_medium, utm_campaign, utm_content, utm_term, gclid e fbclid.
Se já existir contato identificado no GoHighLevel, usar os dados dele.
Não perguntar de novo o que já veio.
Se a renda não vier, perguntar antes da etapa 1: "Qual é a renda mensal da sua família?"
Se o WhatsApp não vier, perguntar antes do resultado: "Para onde enviamos o seu resultado?", com campos Nome e WhatsApp (máscara (11) 99999-9999).

SEQUÊNCIA DE TELAS

Tela inicial
Título: "Olá, [NOME]! Vamos entender o seu cenário." (sem nome: "Olá! Vamos entender o seu cenário.")
Texto: "Em menos de 2 minutos você vai ver quanto o aluguel já representou na sua vida e uma estimativa do seu cenário de financiamento."
Botão: "Começar meu diagnóstico"

Etapa 1: "Quanto você paga de aluguel hoje?" Campo em R$ com separador de milhar. Embaixo, ao digitar: "Isso dá R$ X por ano."

Etapa 2: "Há quanto tempo você paga aluguel?"
Opções: Menos de 1 ano (6 meses) / 1 a 2 anos (18 meses) / 3 a 5 anos (48 meses) / 6 a 10 anos (96 meses) / Mais de 10 anos (144 meses).
Campo opcional "Sabe o tempo certinho?" com anos e meses. Se preenchido, vale ele.
Botão: "Ver quanto isso representa"

Tela de impacto (fundo verde escuro)
"Até hoje você já destinou aproximadamente R$ [aluguel x meses]"
Mostrar um quadradinho laranja para cada mês pago.
Nota: "Estimativa. A conta usa o valor de aluguel informado hoje e não considera reajustes."
Botão: "E se eu continuar no aluguel?"

Tela de projeção
"E se você continuar pagando aluguel?"
Abas 5 anos / 10 anos / 20 anos com o valor grande (aluguel x 60, x 120, x 240).
Gráfico de barras: Até hoje, 5, 10 e 20 anos.
Nota: "Projeção simples com o aluguel de hoje. Não considera reajustes futuros."
Card: "Agora imagine se parte desse dinheiro fosse direcionada para um imóvel próprio."
Botão: "Ver meu cenário de financiamento"

Etapa 3: "Você já tem algum valor para dar de entrada?" Sim / Não / Ainda não sei. Se Sim, abrir campo "Quanto você tem disponível para entrada?" em R$.
Etapa 4: "Você tem FGTS?" Sim / Não / Não sei. Se Sim, campo opcional "Sabe mais ou menos quanto tem?" em R$.
Etapa 5: "Quantas pessoas fazem parte da sua família?" 1 / 2 / 3 / 4 / 5+
Etapa 6: "Você já tem algum imóvel no seu nome?" Não / Sim
Etapa 7: "Você já tentou financiar um imóvel antes?" Nunca tentei / Tentei, mas não consegui / Já tenho uma simulação no banco
Etapa 8: "O que você busca hoje?" Quero sair do aluguel / Quero comprar meu primeiro imóvel / Quero entender se consigo financiar / Ainda estou pesquisando
Etapa 9: "Em que momento você está?" Só comecei a pesquisar / Já vi imóveis na internet / Já visitei imóveis / Já tenho um imóvel em vista
Etapa 10: "Em quanto tempo você quer tomar essa decisão?" Nos próximos 3 meses / De 3 a 6 meses / De 6 meses a 1 ano / Mais de 1 ano / Ainda não sei
Etapa 11: "Se encontrarmos um imóvel que caiba no seu bolso, você está pronto para seguir?" Sim, quero avançar / Preciso conversar com a família / Por enquanto só quero entender

Tela de carregamento com checklist animado: "Somando o histórico de aluguel", "Projetando os próximos anos", "Considerando renda, entrada e FGTS", "Estimando sua faixa de financiamento".

CÁLCULO DO FINANCIAMENTO (deixe todos esses parâmetros num bloco de configuração fácil de editar)
Parâmetros:
- Comprometimento da renda: 30%
- Prazo: 420 meses (35 anos), tabela PRICE
- Percentual financiável: 80% do imóvel
- Valor mínimo do imóvel: R$ 240.000
- Margem para mostrar faixa: 10% para cima e para baixo, arredondando para o milhar
- Faixas de renda (VALORES DE EXEMPLO, serão ajustados depois):
  Faixa 1: renda até 2.850, juros 4,5% ao ano, subsídio até 55.000, teto do imóvel 264.000
  Faixa 2: renda até 4.700, juros 6% ao ano, subsídio até 30.000, teto 264.000
  Faixa 3: renda até 8.600, juros 7,66% ao ano, sem subsídio, teto 350.000
  Faixa 4: renda até 12.000, juros 10% ao ano, sem subsídio, teto 500.000

Passo a passo:
1. Achar a faixa pela renda. Se a renda passar de 12.000, não calcular: mostrar que o caso pede análise personalizada.
2. Juros mensal = (1 + juros anual) elevado a 1/12, menos 1.
3. Parcela máxima = renda x 30%.
4. Capacidade de financiamento = parcela máxima x (1 - (1 + juros mensal) elevado a -420) / juros mensal.
5. Subsídio estimado = subsídio máximo da faixa x (renda máxima da faixa - renda) / (renda máxima da faixa - renda máxima da faixa anterior). Se a pessoa tem imóvel no nome, subsídio = 0.
6. Recursos = entrada + FGTS + subsídio.
7. Valor do imóvel = menor valor entre (capacidade + recursos) e o teto da faixa.
8. Se o valor do imóvel ficar abaixo de R$ 240.000, usar R$ 240.000 como imóvel de referência e marcar como "abaixo do mínimo".
9. Financiamento = menor valor entre: capacidade, 80% do imóvel de referência, imóvel de referência menos recursos.
10. Entrada estimada = imóvel de referência menos financiamento.
11. Diferença a complementar = entrada estimada menos recursos (se der negativo, é zero).
12. Parcela de referência = financiamento x juros mensal / (1 - (1 + juros mensal) elevado a -420).
13. Nunca mostrar imóvel abaixo de R$ 240.000.

Exemplo para conferir: renda 4.500, entrada 10.000, sem FGTS dá imóvel entre R$ 240.000 e R$ 264.000, financiamento em torno de R$ 204.000, parcela perto de R$ 1.139, entrada estimada R$ 50.901 e diferença de R$ 37.658.

TELA DE RESULTADO
Selo "ESTIMATIVA" e título "[Nome], este é o seu diagnóstico". Subtítulo: "Estimativa baseada nas informações fornecidas."

Bloco "Até hoje": "Você já destinou aproximadamente R$ X ao aluguel." Uma seta leva para o bloco "Próximo passo": "Sua estimativa aponta para imóveis entre R$ X e R$ Y. Descubra quais possibilidades podem fazer sentido para o seu perfil."

Dois cards lado a lado (um embaixo do outro no celular):
Card "Seu cenário atual": aluguel mensal, tempo pagando aluguel e estimativa já destinada ao aluguel.
Card "Possibilidade de financiamento" (com selo Estimativa): renda familiar, entrada informada, FGTS informado, subsídio considerado, estimativa de faixa de imóvel, estimativa de faixa de financiamento, parcela de referência ("em torno de R$ X/mês"), entrada estimada para esse imóvel e diferença a complementar ("Em muitos empreendimentos dá para parcelar. O especialista confirma").
Barra empilhada "Como fecha um imóvel de R$ X": financiamento (verde), entrada (azul), FGTS (roxo), subsídio (laranja), a complementar (cinza listrado).
Se abaixo do mínimo: mostrar "Imóveis disponíveis a partir de R$ 240.000", o financiamento pela renda e quanto falta.
Se algum dado não foi informado, escrever "Não informado" ou "Ainda não sabe". Nunca inventar valor.

Mensagem personalizada:
Com estimativa: "Seu cenário indica que vale a pena analisar suas possibilidades de financiamento."
Abaixo do mínimo, com imóvel no nome ou renda acima das faixas: "Seu cenário ainda precisa de uma análise mais detalhada", explicando o motivo em uma frase simples.

Card "Quanto o aluguel pode representar ao longo do tempo?" com barras horizontais: Até hoje, Em 5 anos, Em 10 anos, Em 20 anos. Nota: "Esses valores são uma projeção simples baseada no aluguel informado hoje e não consideram reajustes."

Card "O que influencia o seu financiamento" com ícones: renda familiar, entrada, FGTS, composição familiar, imóvel no nome, prazo e juros.

CTA final (bloco verde escuro)
Título: "Quer entender quais imóveis podem fazer sentido para o seu cenário?"
Texto: "Agora que você já conhece uma estimativa do seu cenário, um especialista pode analisar suas informações e apresentar opções compatíveis com o seu perfil."
Botão verde grande: "QUERO FALAR COM UM ESPECIALISTA". Abre o WhatsApp do especialista [COLOQUE O NÚMERO] com uma mensagem pronta contendo o resumo da simulação.

Aviso no rodapé: "Esta ferramenta mostra uma estimativa baseada nas informações fornecidas e em parâmetros de referência. Ela não representa proposta, pré-aprovação ou garantia de crédito. A aprovação e as condições finais dependem da análise de crédito e das regras aplicáveis ao financiamento."

LINGUAGEM PROIBIDA
Nunca escrever "você está aprovado", "reprovado", "você pode financiar exatamente R$ X" ou "sua parcela será exatamente R$ X". Todo valor de financiamento aparece como faixa e marcado como estimativa.

TEMPERATURA DO LEAD (só para o CRM, o cliente nunca vê)
Pontos:
- Prazo: 3 meses = 3, 3 a 6 meses = 2, 6 a 12 meses = 1, mais de 1 ano ou não sabe = 0
- Pronto para seguir: quer avançar = 3, conversar com a família = 1, só entender = 0
- Momento: imóvel em vista = 3, já visitou = 2, viu na internet = 1, começando = 0
- Já tentou financiar: tem simulação = 2, nunca = 1, não conseguiu = 1
- Simulação encontrou faixa de imóvel = +1
9 pontos ou mais = QUENTE. De 5 a 8 = MORNO. Abaixo de 5 = FRIO.

ENVIO PARA O CRM DO GOHIGHLEVEL
Quando o resultado aparecer, criar ou atualizar o contato (pelo telefone) e salvar nestes campos personalizados:
renda_familiar, aluguel_mensal, tempo_aluguel, total_pago_aluguel, tem_entrada, valor_entrada, tem_fgts, valor_fgts, pessoas_familia, possui_imovel, objetivo, ja_tentou_financiar, momento_compra, prazo_decisao, pronto_para_seguir, temperatura, pontuacao, projecao_5_anos, projecao_10_anos, projecao_20_anos, faixa_imovel, faixa_financiamento, parcela_estimada, entrada_estimada, complemento_entrada.
Adicionar as tags "calculadora-mcmv" e "lead-quente", "lead-morno" ou "lead-frio", conforme a temperatura.
Criar uma nota no contato com este resumo:

Lead simulou possibilidade de sair do aluguel.
Temperatura: QUENTE (10 pontos)
Renda familiar: R$ 4.500
Aluguel atual: R$ 1.200
Tempo pagando aluguel: 5 anos
Estimativa já paga em aluguel: R$ 72.000
Entrada: R$ 10.000
FGTS: Não
Pessoas na família: 3
Possui imóvel: Não
Objetivo: Sair do aluguel
Prazo para decidir: Nos próximos 3 meses
Pronto para seguir: Sim, quer avançar
Momento: Já visitou imóveis
Já tentou financiar: Nunca tentou
Estimativa de imóvel: R$ 240.000 a R$ 264.000
Entrada estimada: R$ 50.901 (faltam cerca de R$ 37.658)

Quando a pessoa clicar em "Quero falar com um especialista", adicionar a tag "clicou-especialista" e avisar o corretor responsável.
```
