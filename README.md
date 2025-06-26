# ME EMPREENDIMENTOS - Simulador de Empréstimos

Aplicação web completa para simulação de empréstimos com funcionalidades avançadas de cálculo, gerenciamento de configurações e área administrativa.

## Funcionalidades

### Simulação de Empréstimos
- **Valor do empréstimo**: Campo monetário com formatação R$
- **Número de parcelas**: 1 a 15 parcelas
- **Taxa de juros**: Percentual com 2 casas decimais
- **Cálculo**: Fórmula `Prestação = Valor × (1 + Juros)ᴺ ÷ N`
- **Scroll automático**: Tela rola até o resultado após calcular
- **Campo somente-leitura**: Prestação calculada automaticamente

### Validações Dinâmicas
- **Nova tabela de limites**: Parcelas 1-2 (15-100%), 3 (15-30%), 4-15 (limites específicos)
- **Mensagens contextuais**: Singular "1 PARCELA" vs plural "N PARCELAS"
- **Validação em tempo real**: Limpeza automática se campos ficarem vazios

### Exportação PDF
- **Relatório completo**: Cabeçalho ME EMPREENDIMENTOS + nome do usuário
- **Tabela de parcelas**: Nº, data vencimento (dia 5), valor
- **Download automático**: Arquivo salvo diretamente

### Configurações Avançadas
- **Nome do usuário**: Personalização dos relatórios
- **Tema**: Alternância entre modo claro e escuro
- **IGPM Anual**: Índice para cálculos de correção
- **Área Admin**: Acesso para configuração de limites (credenciais: Migueis/Laila@10042009)

## Tecnologias

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Design**: Material Design 3 com tema claro/escuro
- **PDF**: jsPDF para geração de relatórios
- **Persistência**: LocalStorage para configurações

## Como Usar

1. Acesse `index.html` no navegador
2. Preencha os campos de valor, parcelas e juros
3. Opcionalmente defina uma data inicial de vencimento
4. Clique em "CALCULAR" para obter o resultado
5. Use "EXPORTAR PDF" para gerar relatório completo

## Estrutura do Projeto

```
SimuladorEmprestimos/
├── index.html          # Página principal da aplicação
├── style.css           # Estilos Material Design 3
├── script.js           # Lógica de negócio e interface
├── test.html           # Suíte de testes automatizados
└── README.md           # Documentação do projeto
```

## Principais Funcionalidades

### 1. Cálculo de Empréstimos
```javascript
calcularParcela(valor, juros, nParcelas, diasExtra = 0, igpmMensal = 0) {
    const jurosDecimal = juros / 100;
    let valorCorrigido = valor;
    
    // Aplicar pró-rata se houver dias extras
    if (diasExtra > 0) {
        const jurosProRata = (jurosDecimal / 30) * diasExtra;
        valorCorrigido *= (1 + jurosProRata);
    }
    
    // Aplicar IGPM se configurado
    if (igpmMensal > 0) {
        const fatorIGPM = Math.pow(1 + (igpmMensal / 100), nParcelas);
        valorCorrigido *= fatorIGPM;
    }
    
    return (valorCorrigido * Math.pow(1 + jurosDecimal, nParcelas)) / nParcelas;
}
```

### 2. Tabela de Limites Dinâmicos
```javascript
const limitesJuros = {
    1: { min: 15.00, max: 100.00 },
    2: { min: 15.00, max: 100.00 },
    3: { min: 15.00, max: 30.00 },
    4: { min: 15.00, max: 24.00 },
    5: { min: 15.00, max: 22.00 },
    6: { min: 15.00, max: 20.00 },
    7: { min: 14.75, max: 18.00 },
    8: { min: 14.36, max: 17.00 },
    9: { min: 13.92, max: 16.00 },
    10: { min: 13.47, max: 15.00 },
    11: { min: 13.03, max: 14.00 },
    12: { min: 12.60, max: 13.00 },
    13: { min: 12.19, max: 12.60 },
    14: { min: 11.80, max: 12.19 },
    15: { min: 11.43, max: 11.80 }
};
```

### 3. Geração de PDF Completa
```javascript
gerarPdfSimples(valor, nParcelas, juros, prestacao) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Cabeçalho da empresa
    doc.setFontSize(20);
    doc.setFont(undefined, 'bold');
    doc.text('ME EMPREENDIMENTOS', 105, 30, { align: 'center' });
    
    // Dados da simulação
    doc.setFontSize(12);
    doc.text(`Valor do Empréstimo: ${this.formatarValorMonetario(valor)}`, 20, 60);
    doc.text(`Número de Parcelas: ${nParcelas}`, 20, 70);
    doc.text(`Taxa de Juros: ${juros.toFixed(2).replace('.', ',')}%`, 20, 80);
    
    // Tabela de vencimentos
    const dataInicial = this.obterDataInicialVencimento();
    for (let i = 1; i <= nParcelas; i++) {
        const dataVencimento = new Date(dataInicial);
        dataVencimento.setMonth(dataVencimento.getMonth() + i - 1);
        const dataFormatada = dataVencimento.toLocaleDateString('pt-BR');
        
        doc.text(`${i}ª Parcela - ${dataFormatada} - ${this.formatarValorMonetario(prestacao)}`, 20, 110 + (i * 10));
    }
    
    doc.save('simulacao-emprestimo.pdf');
}
```

## Testes

Execute `test.html` para validar as funcionalidades principais:

- **Cálculo básico**: R$ 1000, 15%, 1 parcela → R$ 1.150,00
- **Juros compostos**: R$ 5000, 20%, 5 parcelas → R$ 2.985,98
- **Validações de limite**: Testa todos os cenários de erro
- **Formatação de moeda**: Validação de entrada e saída
- **Pró-rata e IGPM**: Cálculos avançados

## Área Administrativa

Acesse através do botão de configurações com credenciais:
- **Usuário**: Migueis
- **Senha**: Laila@1004

Funcionalidades administrativas:
- Edição dos limites de juros para cada faixa de parcelas
- Alteração das credenciais de acesso
- Configuração de parâmetros globais do sistema

## Instalação

1. Faça download dos arquivos do projeto
2. Abra `index.html` em qualquer navegador moderno
3. Para testes, abra `test.html` em uma nova aba

## Especificações Técnicas

- **Compatibilidade**: Chrome, Firefox, Safari, Edge (versões recentes)
- **Responsividade**: Funciona em dispositivos móveis e desktop
- **Persistência**: Configurações salvas no LocalStorage do navegador
- **Segurança**: Validação client-side com sanitização de entrada
- **Performance**: Cálculos instantâneos sem dependências externas

---

**Desenvolvido para ME EMPREENDIMENTOS**  
Versão Web - Dezembro 2024