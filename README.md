# Projeto Investimentos

Aplicacao web simples para apresentar e acompanhar uma carteira conservadora
simulada de R$ 500.000,00 entre 23/05/2026 e 26/06/2026.

O projeto foi montado para uma atividade pratica da materia de praticas
bancarias e cooperativistas. Ele nao deve ser usado como recomendacao real de
investimentos.

## Como abrir

Basta abrir o arquivo `index.html` no navegador.

Para apresentar ou enviar para alguem sem depender de outros arquivos, use o
arquivo `apresentacao.html`. Ele contem HTML, CSS e JavaScript no mesmo arquivo.

Se quiser rodar com um servidor local:

```bash
python3 -m http.server 8000
```

Depois acesse:

```text
http://localhost:8000
```

## Carteira sugerida

| Investimento | Percentual | Valor inicial | Justificativa |
| --- | ---: | ---: | --- |
| CDB liquidez diaria 105% CDI | 35% | R$ 175.000,00 | Melhor rentabilidade mantendo perfil conservador e FGC |
| CDB liquidez diaria 110% CDI | 25% | R$ 125.000,00 | Busca retorno maior com emissor diferente e valor abaixo do limite do FGC |
| Tesouro Selic | 30% | R$ 150.000,00 | Baixo risco de credito e oscilacao reduzida |
| Fundo DI conservador | 10% | R$ 50.000,00 | Liquidez e diversificacao operacional |

## Premissas iniciais

- Valor inicial: R$ 500.000,00
- Perfil: conservador
- CDI: 14,40% ao ano
- Selic: 14,50% ao ano
- Imposto de Renda: 22,5% sobre o rendimento
- IOF: zero, pois o periodo de avaliacao passa de 30 dias corridos
- Aplicacao efetiva: 25/05/2026, porque 23/05/2026 cai em um sabado
- Feriado desconsiderado: 04/06/2026, Corpus Christi

## Resultado esperado com as premissas padrao

Com 24 dias uteis considerados, a simulacao estima:

- Valor final liquido: aproximadamente R$ 505.177,14
- Lucro liquido: aproximadamente R$ 5.177,14
- Rentabilidade liquida no periodo: aproximadamente 1,04%

## O que a aplicacao permite acompanhar

- Valor final liquido estimado
- Lucro liquido estimado
- Rentabilidade liquida no periodo
- Dias uteis considerados
- Resultado por ativo
- Composicao percentual da carteira
- Evolucao diaria estimada ate a data de avaliacao

## Justificativa da estrategia

Como o prazo da atividade e curto, a carteira evita ativos sujeitos a maior
oscilacao, como acoes, fundos imobiliarios, dolar, criptoativos e titulos
prefixados ou indexados ao IPCA com vencimentos longos.

A carteira prioriza ativos pos-fixados atrelados ao CDI ou a Selic, que tendem
a preservar melhor o capital em uma janela curta. Os CDBs foram divididos entre
emissores diferentes para manter a protecao do FGC por instituicao financeira.
