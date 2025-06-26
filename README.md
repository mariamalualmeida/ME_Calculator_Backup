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

### 1. Sistema de Cálculo Avançado
**4 Métodos de Juros Configuráveis:**
- **Juros Simples**: Cálculo linear tradicional
- **Juros Compostos Diários**: Taxa calculada dia a dia
- **Juros Compostos Mensais**: Método padrão com capitalização mensal
- **Juros Compostos + Pro-rata Real**: Cálculo exponencial para múltiplas parcelas

**Cálculo Preciso de Dias:**
- Algoritmo baseado em componentes de data (ano/mês/dia)
- Eliminação de problemas de timezone e horários
- Separação automática: dias extras da data, compensação, meses 31 dias

### 2. Formulário Completo de Dados Cadastrais
**Seção Expansível com:**
- Dados pessoais completos (nome, CPF, nascimento, estado civil)
- Endereço completo (rua, número, complemento, bairro, cidade, estado, CEP)
- Dados profissionais (local trabalho, profissão, renda, tempo emprego)
- 2 referências pessoais com telefones e endereços
- Expansão automática ao preencher nome/CPF na tela principal

### 3. Área Administrativa Avançada
**Configurações Financeiras:**
- Seleção do sistema de juros (4 opções)
- Tabela de limites personalizada (1-15 parcelas)
- Modo livre (desabilitar todas as regras)
- Configurações avançadas (ajuste mês 31, dias extras fixos)
- Índice IGPM anual configurável

**Configurações de Interface:**
- 6 paletas de cores (Padrão, Azul, Verde, Roxo, Verde-água, Rosa)
- Controle de exibição de informações no PDF
- Credenciais administrativas editáveis

### 4. Exportação PDF Avançada
**Relatórios Completos com:**
- Dados da simulação (valor, parcelas, sistema de juros, taxa)
- Informações do cliente (dados cadastrais completos quando preenchidos)
- Tabela de parcelas detalhada
- Análise financeira (lucro e margem no modo livre)
- Informações de dias extras separadas (apenas dias reais da data)
- Nomenclatura inteligente: "Nome_CPF_Simulacao_emprestimo_timestamp.pdf"

### 5. Validação e UX Avançados
**Sistema de Validação Visual:**
- Bordas vermelhas para campos inválidos (respeitando modo livre)
- Placeholder dinâmico no campo parcelas baseado nas regras ativas
- Mensagens de erro padronizadas iniciando com "SIMULAÇÃO NEGADA"
- Formatação em tempo real (moeda, percentual, CPF, telefone, CEP)

### 6. Tabela de Limites Dinâmicos
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
- **Sistema de Juros Configurável**: 4 métodos (Simples, Compostos Diários, Compostos Mensais, Pro-rata Real)
- **Edição dos limites de juros**: Tabela personalizada para cada faixa de parcelas (1-15)
- **Modo Livre**: Desabilitar todas as regras de validação para simulações ilimitadas
- **Configurações Avançadas**: Ajuste automático meses 31 dias, dias extras fixos
- **Análise Financeira**: Cálculo de lucro e margem no modo livre
- **Alteração das credenciais**: Modificar usuário e senha administrativos
- **Controle de Relatórios**: Configurar exibição de informações no PDF
- **Dados do Credor**: Configurações para contratos e promissórias
- **Paletas de Cores**: 6 temas visuais (Padrão, Azul, Verde, Roxo, Verde-água, Rosa)

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