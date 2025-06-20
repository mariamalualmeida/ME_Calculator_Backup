/**
 * Simulador de Empréstimos
 * Implementa a lógica de cálculo de empréstimos com validação de limites
 */

class SimuladorEmprestimos {
    constructor() {
        // Nova tabela de limites de juros conforme prompt
        this.limitesJuros = {
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

        // Configurações padrão (localStorage)
        this.configuracoes = this.carregarConfiguracoes();
        
        this.initializeElements();
        this.setupEventListeners();
        this.focusInitialField();
    }

    carregarConfiguracoes() {
        const config = localStorage.getItem('simulador_config');
        return config ? JSON.parse(config) : {
            nomeUsuario: '',
            diaFixoVencimento: null,
            igpmAnual: 0.0,
            isAdmin: false
        };
    }

    salvarConfiguracoes() {
        localStorage.setItem('simulador_config', JSON.stringify(this.configuracoes));
    }

    initializeElements() {
        this.valorEmprestimoField = document.getElementById('valorEmprestimo');
        this.numeroParcelasField = document.getElementById('numeroParcelas');
        this.taxaJurosField = document.getElementById('taxaJuros');
        this.dataInicialField = document.getElementById('dataInicial');
        this.calcularBtn = document.getElementById('calcularBtn');
        this.resultCard = document.getElementById('resultCard');
        this.resultValue = document.getElementById('resultValue');
        this.errorSection = document.getElementById('errorSection');
        this.errorMessage = document.getElementById('errorMessage');
        this.exportPdfBtn = document.getElementById('exportPdfBtn');
        this.configBtn = document.getElementById('configBtn');
    }

    setupEventListeners() {
        // Formatação de moeda para valor do empréstimo
        this.valorEmprestimoField.addEventListener('input', (e) => {
            this.formatarMoeda(e.target);
            this.limparResultado();
        });

        // Formatação de percentual para taxa de juros
        this.taxaJurosField.addEventListener('input', (e) => {
            this.formatarPercentual(e.target);
            this.limparResultado();
        });

        // Limpeza quando número de parcelas muda
        this.numeroParcelasField.addEventListener('input', () => {
            this.limparResultado();
        });

        // Botão calcular
        this.calcularBtn.addEventListener('click', () => {
            this.calcular();
        });

        // Enter para calcular
        [this.valorEmprestimoField, this.numeroParcelasField, this.taxaJurosField].forEach(field => {
            field.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.calcular();
                }
            });
        });
    }

    focusInitialField() {
        // Foco automático no campo valor do empréstimo ao abrir
        setTimeout(() => {
            this.valorEmprestimoField.focus();
        }, 100);
    }

    formatarMoeda(input) {
        let valor = input.value.replace(/\D/g, '');
        if (valor.length === 0) {
            input.value = '';
            return;
        }
        
        valor = parseInt(valor).toString();
        
        if (valor.length === 1) {
            valor = '0,0' + valor;
        } else if (valor.length === 2) {
            valor = '0,' + valor;
        } else {
            valor = valor.slice(0, -2) + ',' + valor.slice(-2);
        }
        
        // Adicionar pontos para milhares
        let partes = valor.split(',');
        partes[0] = partes[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
        
        input.value = partes.join(',');
    }

    formatarPercentual(input) {
        let valor = input.value.replace(/[^\d,]/g, '');
        
        // Permitir apenas uma vírgula
        let virgulas = valor.split(',').length - 1;
        if (virgulas > 1) {
            valor = valor.substring(0, valor.lastIndexOf(','));
        }
        
        // Limitar casas decimais
        if (valor.includes(',')) {
            let partes = valor.split(',');
            if (partes[1].length > 2) {
                partes[1] = partes[1].substring(0, 2);
            }
            valor = partes.join(',');
        }
        
        input.value = valor;
    }

    limparResultado() {
        this.resultValue.textContent = 'R$ 0,00';
        this.esconderErro();
    }

    mostrarErro(mensagem) {
        this.errorMessage.textContent = mensagem;
        this.errorSection.style.display = 'flex';
        this.resultValue.textContent = 'R$ 0,00';
    }

    esconderErro() {
        this.errorSection.style.display = 'none';
    }

    obterValorNumerico(valorFormatado) {
        if (!valorFormatado) return 0;
        return parseFloat(valorFormatado.replace(/\./g, '').replace(',', '.'));
    }

    obterPercentualNumerico(percentualFormatado) {
        if (!percentualFormatado) return 0;
        return parseFloat(percentualFormatado.replace(',', '.'));
    }

    /**
     * Calcula o valor da parcela usando a fórmula: parcela = Valor × (1 + Juros)^N / N
     * @param {number} valor - Valor do empréstimo
     * @param {number} juros - Taxa de juros (em percentual)
     * @param {number} nParcelas - Número de parcelas
     * @returns {number} - Valor da parcela
     */
    calcularParcela(valor, juros, nParcelas) {
        const jurosDecimal = juros / 100;
        const parcela = (valor * Math.pow(1 + jurosDecimal, nParcelas)) / nParcelas;
        return parcela;
    }

    validarCampos() {
        const valor = this.obterValorNumerico(this.valorEmprestimoField.value);
        const nParcelas = parseInt(this.numeroParcelasField.value);
        const juros = this.obterPercentualNumerico(this.taxaJurosField.value);

        // Verificar se todos os campos estão preenchidos
        if (!this.valorEmprestimoField.value.trim() || 
            !this.numeroParcelasField.value.trim() || 
            !this.taxaJurosField.value.trim()) {
            return { valido: false, mensagem: null }; // Limpar resultado silenciosamente
        }

        // Validar número de parcelas
        if (nParcelas < 1) {
            return { 
                valido: false, 
                mensagem: "NÚMERO DE PARCELAS INFERIOR AO MÍNIMO PERMITIDO." 
            };
        }

        if (nParcelas > 15) {
            return { 
                valido: false, 
                mensagem: "VOCÊ NÃO TEM PERMISSÃO PARA SIMULAÇÕES ACIMA DE 15 PARCELAS. PARA SIMULAÇÕES SUPERIORES A 15 PARCELAS, CONSULTE MIGUEIS." 
            };
        }

        // Validar limites de juros
        const limites = this.limitesJuros[nParcelas];
        if (juros < limites.min) {
            return { 
                valido: false, 
                mensagem: `[${nParcelas}] PARCELA(S), A PORCENTAGEM MÍNIMA PERMITIDA É DE ${limites.min.toFixed(2).replace('.', ',')} %. PARA EMPRÉSTIMOS COM JUROS FORA DOS LIMITES ESPECIFICADOS, CONSULTE MIGUEIS.` 
            };
        }

        if (juros > limites.max) {
            return { 
                valido: false, 
                mensagem: `[${nParcelas}] PARCELA(S), A PORCENTAGEM MÁXIMA PERMITIDA É DE ${limites.max.toFixed(2).replace('.', ',')} %. PARA EMPRÉSTIMOS COM JUROS FORA DOS LIMITES ESPECIFICADOS, CONSULTE MIGUEIS.` 
            };
        }

        return { valido: true, valor, nParcelas, juros };
    }

    formatarValorMonetario(valor) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(valor);
    }

    calcular() {
        const validacao = this.validarCampos();

        if (!validacao.valido) {
            if (validacao.mensagem) {
                this.mostrarErro(validacao.mensagem);
            } else {
                this.limparResultado();
            }
            return;
        }

        const { valor, nParcelas, juros } = validacao;

        try {
            const valorParcela = this.calcularParcela(valor, juros, nParcelas);
            this.resultValue.textContent = this.formatarValorMonetario(valorParcela);
            this.esconderErro();
        } catch (error) {
            this.mostrarErro('ERRO NO CÁLCULO. VERIFIQUE OS VALORES INFORMADOS.');
            console.error('Erro no cálculo:', error);
        }
    }
}

// Inicializar aplicação quando DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    new SimuladorEmprestimos();
});

// Exportar para testes (se necessário)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SimuladorEmprestimos };
}
