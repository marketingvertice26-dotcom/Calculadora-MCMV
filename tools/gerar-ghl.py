#!/usr/bin/env python3
"""
Gera dist/calculadora-ghl.html: a calculadora inteira num arquivo só,
pronta para colar num elemento de código personalizado do GoHighLevel
(ou de qualquer construtor de páginas).

- Junta o HTML, o CSS e os 4 arquivos JS.
- Prefixa todo o CSS com #calc-mcmv para não mexer no resto da página
  e renomeia as animações para não colidir com as da página.

Uso (na raiz do projeto):  python3 tools/gerar-ghl.py
Rode de novo sempre que mudar algo em index.html, css/ ou js/.
"""
import re
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
ESCOPO = '#calc-mcmv'


def prefixar_seletor(sel):
    sel = sel.strip()
    if sel in (':root', 'html', 'body'):
        return ESCOPO
    return ESCOPO + ' ' + sel


def escopar(css):
    """Prefixa seletores. Entra em @media, mantém @keyframes como estão."""
    saida, i, n = [], 0, len(css)
    while i < n:
        abre = css.find('{', i)
        if abre == -1:
            saida.append(css[i:])
            break
        cabecalho = css[i:abre]
        # acha o fechamento correspondente
        prof, j = 1, abre + 1
        while prof and j < n:
            if css[j] == '{':
                prof += 1
            elif css[j] == '}':
                prof -= 1
            j += 1
        corpo = css[abre + 1:j - 1]
        cab = cabecalho.strip()
        # preserva comentários antes do seletor
        comentarios = ''.join(re.findall(r'/\*.*?\*/', cabecalho, re.S))
        cab_limpo = re.sub(r'/\*.*?\*/', '', cab, flags=re.S).strip()
        if cab_limpo.startswith('@media') or cab_limpo.startswith('@supports'):
            saida.append(comentarios + '\n' + cab_limpo + ' {' + escopar(corpo) + '}\n')
        elif cab_limpo.startswith('@'):
            saida.append(comentarios + '\n' + cab_limpo + ' {' + corpo + '}\n')
        else:
            novos = ', '.join(prefixar_seletor(s) for s in cab_limpo.split(','))
            saida.append(comentarios + '\n' + novos + ' {' + corpo + '}\n')
        i = j
    return ''.join(saida)


def renomear_animacoes(css):
    nomes = re.findall(r'@keyframes\s+([\w-]+)', css)
    for nome in nomes:
        css = re.sub(r'@keyframes\s+' + nome + r'\b', '@keyframes cm-' + nome, css)
        css = re.sub(r'(animation(?:-name)?\s*:[^;{}]*?)\b' + nome + r'\b', r'\1cm-' + nome, css)
    return css


def main():
    html = (RAIZ / 'index.html').read_text(encoding='utf-8')
    css = (RAIZ / 'css/style.css').read_text(encoding='utf-8')
    js = '\n'.join((RAIZ / 'js' / f).read_text(encoding='utf-8')
                   for f in ('config.js', 'calculos.js', 'crm.js', 'app.js'))

    corpo = re.search(r'<body>(.*?)<script', html, re.S).group(1).strip()
    fontes = re.findall(r'<link[^>]+fonts\.(?:googleapis|gstatic)[^>]*>', html)

    # Protege contra estilos globais da página (fonte, cor e espaçamento)
    reset = (ESCOPO + ' { font-family: var(--fonte); color: var(--texto); line-height: 1.5; '
             'background: var(--fundo); text-align: left; }\n' +
             ESCOPO + ' h1, ' + ESCOPO + ' h2, ' + ESCOPO + ' h3, ' + ESCOPO + ' p, ' +
             ESCOPO + ' ul, ' + ESCOPO + ' li, ' + ESCOPO + ' dl, ' + ESCOPO + ' dt, ' + ESCOPO + ' dd, ' +
             ESCOPO + ' button, ' + ESCOPO + ' input, ' + ESCOPO + ' label, ' + ESCOPO + ' small, ' +
             ESCOPO + ' strong, ' + ESCOPO + ' span, ' + ESCOPO + ' div, ' + ESCOPO + ' section, ' +
             ESCOPO + ' article, ' + ESCOPO + ' header, ' + ESCOPO + ' main, ' + ESCOPO + ' b '
             '{ font-family: inherit; font-size: inherit; line-height: inherit; color: inherit; '
             'text-transform: none; border: 0 none; padding: 0; margin: 0; background: none; '
             'box-shadow: none; text-shadow: none; float: none; width: auto; max-width: none; '
             'min-height: 0; height: auto; }\n')

    css_final = reset + renomear_animacoes(escopar(css))

    # Acentos viram códigos ASCII: funciona mesmo se a página não declarar UTF-8
    css_final = ''.join(c if ord(c) < 128 else '\\%x ' % ord(c) for c in css_final)
    corpo = ''.join(c if ord(c) < 128 else '&#x%x;' % ord(c) for c in corpo)
    js = ''.join(c if ord(c) < 128 else '\\u%04x' % ord(c) for c in js)

    arquivo = (
        '<!-- CALCULADORA ALUGUEL x FINANCIAMENTO MCMV (versao arquivo unico)\n'
        '     Gerado por tools/gerar-ghl.py. Para mudar as regras, edite js/config.js e gere de novo,\n'
        '     ou procure por "window.CALC_CONFIG" aqui dentro (webhookUrl, whatsappNumero, marca). -->\n'
        + '\n'.join(fontes) + '\n'
        '<style>\n' + css_final + '</style>\n'
        '<div id="calc-mcmv">\n' + corpo + '\n</div>\n'
        '<script>\n' + js + '\n</script>\n'
    )
    destino = RAIZ / 'dist' / 'calculadora-ghl.html'
    destino.parent.mkdir(exist_ok=True)
    destino.write_text(arquivo, encoding='utf-8')
    print('Gerado:', destino.relative_to(RAIZ), f'({len(arquivo) // 1024} KB)')


if __name__ == '__main__':
    main()
