# Simulador de Empréstimos

## Visão Geral

Aplicativo web que simula cálculos de empréstimos com validação de limites de juros por número de parcelas. Implementa a fórmula `parcela = Valor × (1 + Juros)^N / N` com interface Material Design 3, validações específicas e mensagens de erro em português.

## Funcionalidades

- **Campos de entrada**: Valor do empréstimo (moeda), número de parcelas (1-15), taxa de juros (percentual com 2 casas)
- **Cálculo automático**: Botão CALCULAR que aplica a fórmula matemática
- **Validações**: Limites de juros por parcelas (15-30% para 1-3 parcelas, 15-24% para 4-15 parcelas)
- **Mensagens de erro**: Textos específicos em português e caixa alta
- **Interface responsiva**: Design Material 3 com foco automático no primeiro campo
- **Limpeza automática**: Resultado zerado quando campos ficam vazios

## Estrutura do Projeto

