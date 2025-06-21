/**
 * ME EMPREENDIMENTOS - Simulador de Empréstimos
 * Implementa cálculo com pró-rata, IGPM e área administrativa
 * Updated: 2025-06-21 13:33 - Real-time percentage formatting
 */

class SimuladorEmprestimos {
    constructor() {
        // Nova tabela de limites conforme prompt
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

        this.configuracoes = this.carregarConfiguracoes();
        this.initializeElements();
        this.setupEventListeners();
        this.focusInitialField();
    }

    carregarConfiguracoes() {
        const config = localStorage.getItem('simulador_config');
        const defaultConfig = {
            nomeUsuario: '',
            igpmAnual: 0.0,
            isAdmin: false,
            limitesPersonalizados: null,
            themeMode: 'light',
            mostrarJurosRelatorio: false,
            desabilitarRegras: false,
            colorTheme: 'default',
            adminUser: 'Migueis',
            adminPassword: 'Laila@10042009'
        };
        const loadedConfig = config ? { ...defaultConfig, ...JSON.parse(config) } : defaultConfig;
        
        // Aplicar tema e paleta na inicialização
        this.aplicarTema(loadedConfig.themeMode);
        this.aplicarPaletaCores(loadedConfig.colorTheme);
        
        // Aplicar classes de modo livre após carregar configurações
        setTimeout(() => {
            if (this.atualizarClassesModoLivre) {
                this.atualizarClassesModoLivre();
            }
        }, 100);
        
        return loadedConfig;
    }

    salvarConfiguracoes() {
        localStorage.setItem('simulador_config', JSON.stringify(this.configuracoes));
    }

    initializeElements() {
        console.log('Inicializando elementos...');
        this.valorEmprestimoField = document.getElementById('valorEmprestimo');
        this.numeroParcelasField = document.getElementById('numeroParcelas');
        this.taxaJurosField = document.getElementById('taxaJuros');
        this.dataInicialField = document.getElementById('dataInicial');
        this.nomeClienteField = document.getElementById('nomeCliente');
        this.cpfClienteField = document.getElementById('cpfCliente');
        this.calcularBtn = document.getElementById('calcularBtn');
        this.resultCard = document.getElementById('resultCard');
        this.resultValue = document.getElementById('resultValue');
        this.errorSection = document.getElementById('errorSection');
        this.errorMessage = document.getElementById('errorMessage');
        this.exportPdfBtn = document.getElementById('exportPdfBtn');
        this.configBtn = document.getElementById('configBtn');
        
        console.log('Taxa de juros field encontrado:', !!this.taxaJurosField);
        console.log('ID do campo:', this.taxaJurosField?.id);
    }

    setupEventListeners() {
        // Formatação de campos
        this.valorEmprestimoField.addEventListener('input', (e) => {
            this.formatarMoeda(e.target);
            this.limparResultado();
        });
        
        this.valorEmprestimoField.addEventListener('focus', (e) => {
            // Limpar completamente o campo ao focar
            e.target.value = '';
            e.target.placeholder = '';
        });
        
        this.valorEmprestimoField.addEventListener('blur', (e) => {
            if (e.target.value === '') {
                e.target.placeholder = '0,00';
            }
        });

        // Anexar event listener com múltiplas tentativas
        if (this.taxaJurosField) {
            this.taxaJurosField.addEventListener('input', (e) => {
                // Formatação automática como centavos em tempo real
                this.formatarPercentualTempoReal(e.target);
                this.validarCampoJuros();
                this.limparResultado();
            });
            console.log('Event listener anexado ao campo taxaJuros');
        } else {
            console.error('Campo taxaJuros não encontrado!');
        }
        
        this.taxaJurosField.addEventListener('keydown', (e) => {
            // Permitir navegação, seleção e funcionalidades básicas
            if (['ArrowLeft', 'ArrowRight', 'Home', 'End', 'Tab', 'Shift', 'Ctrl', 'Alt'].includes(e.key)) {
                return;
            }
            
            // Permitir Backspace e Delete
            if (e.key === 'Backspace' || e.key === 'Delete') {
                return;
            }
            
            // Permitir números e vírgula
            if (/[\d,]/.test(e.key)) {
                return;
            }
            
            // Bloquear tudo o resto
            e.preventDefault();
        });

        this.dataInicialField.addEventListener('input', (e) => {
            this.formatarData(e.target);
            this.toggleMetodoDiasExtras();
            this.limparResultado();
        });
        
        this.dataInicialField.addEventListener('keydown', (e) => {
            // Permitir navegação e seleção
            if (['ArrowLeft', 'ArrowRight', 'Home', 'End', 'Tab'].includes(e.key)) {
                return;
            }
            
            // Permitir apagar
            if (e.key === 'Backspace' || e.key === 'Delete') {
                e.preventDefault();
                const valor = e.target.value.replace(/\D/g, '');
                
                if (e.key === 'Backspace') {
                    const novoValor = valor.slice(0, -1);
                    e.target.value = novoValor;
                    this.formatarData(e.target);
                } else if (e.key === 'Delete') {
                    e.target.value = '';
                }
                this.toggleMetodoDiasExtras();
                this.limparResultado();
                return;
            }
            
            // Apenas números
            if (!/^\d$/.test(e.key)) {
                e.preventDefault();
                return;
            }
        });

        this.numeroParcelasField.addEventListener('input', () => {
            this.limparResultado();
            this.toggleMetodoDiasExtras();
            this.atualizarInformacaoLimites(); // Atualizar limites de juros
            this.validarCampoJuros(); // Re-validar juros quando parcelas mudam
        });

        // Formatação de CPF
        this.cpfClienteField.addEventListener('input', (e) => {
            this.formatarCpf(e.target);
        });

        // Botões
        this.calcularBtn.addEventListener('click', () => {
            this.calcular();
        });

        this.exportPdfBtn.addEventListener('click', () => {
            this.exportarPdf();
        });

        this.configBtn.addEventListener('click', () => {
            this.abrirConfiguracoes();
        });

        // Modal de configurações
        document.getElementById('closeModal').addEventListener('click', () => {
            this.fecharModal();
        });

        document.getElementById('saveConfigBtn').addEventListener('click', () => {
            this.salvarConfiguracoesModal();
        });

        document.getElementById('adminLoginBtn').addEventListener('click', () => {
            this.fazerLoginAdmin();
        });

        document.getElementById('saveCredentialsBtn').addEventListener('click', () => {
            this.salvarCredenciaisAdmin();
        });

        // Listener para detectar mudanças no localStorage (sincronização entre abas)
        window.addEventListener('storage', (e) => {
            if (e.key === 'simulador-configuracoes') {
                this.carregarConfiguracoes();
                this.esconderErro();
            }
        });

        // Listener para eventos customizados (sincronização na mesma aba)
        window.addEventListener('configuracoesAtualizadas', (e) => {
            console.log('Evento configuracoesAtualizadas recebido');
            this.carregarConfiguracoes();
            this.esconderErro();
            this.atualizarClassesModoLivre();
            this.atualizarInformacaoLimites(); // Atualizar limites quando configurações mudam
        });

        // Método alternativo - polling para garantir sincronização
        this.setupConfigPolling();
        
        // Armazenar referência da instância para callbacks globais
        window.simuladorInstance = this;

        // Event listener para mudança de tema (evitar duplicação)
        const themeSelect = document.getElementById('themeMode');
        if (themeSelect && !themeSelect.hasAttribute('data-listener-added')) {
            themeSelect.addEventListener('change', (e) => {
                this.aplicarTema(e.target.value);
            });
            themeSelect.setAttribute('data-listener-added', 'true');
        }

        // Event listener para mudança de paleta de cores
        const colorSelect = document.getElementById('colorTheme');
        if (colorSelect && !colorSelect.hasAttribute('data-listener-added')) {
            colorSelect.addEventListener('change', (e) => {
                this.aplicarPaletaCores(e.target.value);
            });
            colorSelect.setAttribute('data-listener-added', 'true');
        }

        // Enter para calcular
        [this.valorEmprestimoField, this.numeroParcelasField, this.taxaJurosField, this.dataInicialField].forEach(field => {
            field.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.calcular();
                }
            });
        });

        // Fechar modal ao clicar fora
        document.getElementById('configModal').addEventListener('click', (e) => {
            if (e.target.id === 'configModal') {
                this.fecharModal();
            }
        });

        // Event listener para formulário completo
        const toggleFormBtn = document.getElementById('toggleFormCompleto');
        if (toggleFormBtn) {
            toggleFormBtn.addEventListener('click', () => this.toggleFormularioCompleto());
        }

        // Configurar formatação dos campos do formulário completo
        this.setupFormCompletoFormatting();
    }

    // Função para toggle do formulário completo
    toggleFormularioCompleto() {
        const container = document.getElementById('formCompletoContainer');
        const toggleBtn = document.getElementById('toggleFormCompleto');
        const icon = toggleBtn.querySelector('.toggle-icon');
        
        if (container.style.display === 'none') {
            container.style.display = 'block';
            toggleBtn.classList.add('expanded');
            icon.textContent = '▲';
        } else {
            container.style.display = 'none';
            toggleBtn.classList.remove('expanded');
            icon.textContent = '▼';
        }
    }

    // Configurar formatação dos campos do formulário completo
    setupFormCompletoFormatting() {
        // CPF completo (novo campo)
        const cpfCompletoField = document.getElementById('cpfCompleto');
        if (cpfCompletoField) {
            cpfCompletoField.addEventListener('input', (e) => this.formatarCpf(e.target));
        }

        // CEP
        const cepField = document.getElementById('cep');
        if (cepField) {
            cepField.addEventListener('input', (e) => this.formatarCep(e.target));
        }

        // Telefones (incluindo o novo telefone completo)
        const telefoneFields = ['telefoneCompleto', 'ref1Telefone', 'ref2Telefone'];
        telefoneFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.addEventListener('input', (e) => this.formatarTelefone(e.target));
            }
        });

        // Renda mensal
        const rendaField = document.getElementById('rendaMensal');
        if (rendaField) {
            rendaField.addEventListener('input', (e) => this.formatarMoeda(e.target));
        }

        // Estado (maiúsculo e 2 caracteres)
        const estadoField = document.getElementById('estado');
        if (estadoField) {
            estadoField.addEventListener('input', (e) => {
                e.target.value = e.target.value.toUpperCase().substring(0, 2);
            });
        }
    }

    // Formatação de CEP
    formatarCep(input) {
        let valor = input.value.replace(/\D/g, '');
        valor = valor.substring(0, 8);
        valor = valor.replace(/(\d{5})(\d)/, '$1-$2');
        input.value = valor;
    }

    // Formatação de telefone
    formatarTelefone(input) {
        let valor = input.value.replace(/\D/g, '');
        valor = valor.substring(0, 11);
        
        if (valor.length <= 10) {
            valor = valor.replace(/(\d{2})(\d)/, '($1) $2');
            valor = valor.replace(/(\d{4})(\d)/, '$1-$2');
        } else {
            valor = valor.replace(/(\d{2})(\d)/, '($1) $2');
            valor = valor.replace(/(\d{5})(\d)/, '$1-$2');
        }
        
        input.value = valor;
    }

    focusInitialField() {
        setTimeout(() => {
            this.valorEmprestimoField.focus();
        }, 100);
    }

    formatarMoeda(input) {
        let valor = input.value.replace(/\D/g, '');
        if (valor === '' || valor === '0') {
            input.value = '';
            return;
        }

        // Remover zeros à esquerda desnecessários, mas manter pelo menos um dígito
        valor = valor.replace(/^0+/, '') || '0';

        // Formatação baseada no comprimento
        if (valor.length === 1) {
            input.value = `0,0${valor}`;
            return;
        }
        if (valor.length === 2) {
            input.value = `0,${valor}`;
            return;
        }

        const reais = valor.slice(0, -2);
        const centavos = valor.slice(-2);
        
        const reaisFormatados = reais.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
        input.value = `${reaisFormatados},${centavos}`;
    }

    formatarPercentualTempoReal(input) {
        let valor = input.value.replace(/\D/g, '');
        
        // Limitar a 4 dígitos
        if (valor.length > 4) {
            valor = valor.substring(0, 4);
        }
        
        if (valor === '' || valor === '0') {
            input.value = '';
            return;
        }

        // Remover zeros à esquerda desnecessários, mas manter pelo menos um dígito
        valor = valor.replace(/^0+/, '') || '0';

        // Formatação baseada no comprimento - EXATAMENTE como formatarMoeda()
        if (valor.length === 1) {
            input.value = `0,0${valor}`;
            return;
        }
        if (valor.length === 2) {
            input.value = `0,${valor}`;
            return;
        }
        if (valor.length === 3) {
            input.value = `${valor[0]},${valor.substring(1)}`;
            return;
        }
        if (valor.length === 4) {
            input.value = `${valor.substring(0, 2)},${valor.substring(2)}`;
            return;
        }
    }

    formatarPercentual(input) {
        // Função removida - formatação é feita apenas em tempo real no input
        return;
    }

    formatarData(input) {
        let valor = input.value.replace(/\D/g, '');
        
        // Limitar a 8 dígitos (DDMMAAAA)
        valor = valor.substring(0, 8);
        
        if (valor.length === 0) {
            input.value = '';
            this.marcarDataValida(input);
            return;
        }
        
        if (valor.length <= 2) {
            input.value = valor;
        } else if (valor.length <= 4) {
            input.value = valor.substring(0, 2) + '/' + valor.substring(2);
        } else {
            input.value = valor.substring(0, 2) + '/' + valor.substring(2, 4) + '/' + valor.substring(4);
        }
        
        // Validar data se estiver completa
        if (input.value.length === 10) {
            this.validarData(input);
        } else {
            this.marcarDataValida(input);
        }
    }
    
    validarData(input) {
        const data = input.value;
        const partesData = data.split('/');
        
        if (partesData.length !== 3) {
            this.marcarDataInvalida(input, 'Formato de data inválido');
            return false;
        }
        
        const dia = parseInt(partesData[0]);
        const mes = parseInt(partesData[1]);
        const ano = parseInt(partesData[2]);
        
        // Validar ano
        if (ano < 2020 || ano > 2050) {
            this.marcarDataInvalida(input, 'Ano deve estar entre 2020 e 2050');
            return false;
        }
        
        // Validar mês
        if (mes < 1 || mes > 12) {
            this.marcarDataInvalida(input, 'Mês deve estar entre 1 e 12');
            return false;
        }
        
        // Validar dia
        const diasPorMes = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        
        // Verificar ano bissexto
        if (mes === 2 && this.isAnoBissexto(ano)) {
            diasPorMes[1] = 29;
        }
        
        if (dia < 1 || dia > diasPorMes[mes - 1]) {
            this.marcarDataInvalida(input, `Dia inválido para ${mes}/${ano}`);
            return false;
        }
        
        // Data válida
        this.marcarDataValida(input);
        return true;
    }
    
    isAnoBissexto(ano) {
        return (ano % 4 === 0 && ano % 100 !== 0) || (ano % 400 === 0);
    }
    
    marcarDataInvalida(input, mensagem) {
        input.style.borderColor = '#f44336';
        input.style.color = '#f44336';
        input.title = mensagem;
    }
    
    marcarDataValida(input) {
        input.style.borderColor = '';
        input.style.color = '';
        input.title = '';
    }

    formatarCpf(input) {
        let valor = input.value.replace(/\D/g, '');
        
        // Limitar a 11 dígitos
        valor = valor.substring(0, 11);
        
        if (valor.length === 0) {
            input.value = '';
            return;
        }
        
        if (valor.length <= 3) {
            input.value = valor;
        } else if (valor.length <= 6) {
            input.value = valor.substring(0, 3) + '.' + valor.substring(3);
        } else if (valor.length <= 9) {
            input.value = valor.substring(0, 3) + '.' + valor.substring(3, 6) + '.' + valor.substring(6);
        } else {
            input.value = valor.substring(0, 3) + '.' + valor.substring(3, 6) + '.' + valor.substring(6, 9) + '-' + valor.substring(9);
        }
    }

    obterValorNumerico(valorFormatado) {
        if (!valorFormatado) return 0;
        return parseFloat(valorFormatado.replace(/\./g, '').replace(',', '.')) || 0;
    }

    obterPercentualNumerico(percentualFormatado) {
        if (!percentualFormatado) return 0;
        const valor = percentualFormatado.replace(/[^\d,]/g, '').replace(',', '.');
        return parseFloat(valor) || 0;
    }

    parseData(dataStr) {
        if (!dataStr || dataStr.length < 10) return null;
        const partes = dataStr.split('/');
        if (partes.length !== 3) return null;
        
        const dia = parseInt(partes[0]);
        const mes = parseInt(partes[1]) - 1; // JavaScript mês é 0-indexed
        const ano = parseInt(partes[2]);
        
        if (dia < 1 || dia > 31 || mes < 0 || mes > 11 || ano < 1900) return null;
        return new Date(ano, mes, dia);
    }

    calcularParcela(valor, juros, nParcelas, diasExtra = 0, igpmMensal = 0, metodo = 'primeira') {
        // Obter sistema de juros das configurações
        const configs = this.carregarConfiguracoes();
        const sistemaJuros = configs.sistemaJuros || 'compostos-mensal';
        
        // Taxa efetiva (juros + IGPM)
        const taxaEfetiva = (juros + igpmMensal) / 100;
        
        // Aplicar sistema de juros selecionado
        switch (sistemaJuros) {
            case 'simples':
                return this.calcularJurosSimples(valor, taxaEfetiva, nParcelas, diasExtra, metodo);
            case 'compostos-diario':
                return this.calcularJurosCompostosDiarios(valor, taxaEfetiva, nParcelas, diasExtra, metodo);
            case 'compostos-prorata-real':
                return this.calcularJurosCompostosProRataReal(valor, taxaEfetiva, nParcelas, diasExtra, metodo);
            case 'compostos-mensal':
            default:
                return this.calcularJurosCompostosMensais(valor, taxaEfetiva, nParcelas, diasExtra, metodo);
        }
    }

    // Sistema de Juros Simples: Montante = Capital × (1 + Taxa × Tempo)
    calcularJurosSimples(valor, taxaEfetiva, nParcelas, diasExtra = 0, metodo = 'primeira') {
        const montante = valor * (1 + taxaEfetiva * nParcelas);
        const prestacaoBase = montante / nParcelas;
        
        if (diasExtra !== 0) {
            const taxaDiaria = taxaEfetiva / 30;
            const jurosProrrata = valor * taxaDiaria * diasExtra;
            
            if (metodo === 'distribuir' && nParcelas > 1) {
                const jurosProrrataPorParcela = jurosProrrata / nParcelas;
                const prestacaoDistribuida = prestacaoBase + jurosProrrataPorParcela;
                
                return {
                    parcelaNormal: prestacaoDistribuida,
                    primeiraParcela: prestacaoDistribuida,
                    jurosDiasExtras: jurosProrrata,
                    diasExtra: diasExtra
                };
            } else {
                const primeiraParcela = prestacaoBase + jurosProrrata;
                
                return {
                    parcelaNormal: prestacaoBase,
                    primeiraParcela: primeiraParcela,
                    jurosDiasExtras: jurosProrrata,
                    diasExtra: diasExtra
                };
            }
        }
        
        return {
            parcelaNormal: prestacaoBase,
            primeiraParcela: prestacaoBase,
            jurosDiasExtras: 0,
            diasExtra: 0
        };
    }

    // Sistema de Juros Compostos Diários
    calcularJurosCompostosDiarios(valor, taxaEfetiva, nParcelas, diasExtra = 0, metodo = 'primeira') {
        const taxaDiaria = taxaEfetiva / 30;
        const diasTotais = nParcelas * 30;
        const montante = valor * Math.pow(1 + taxaDiaria, diasTotais);
        const prestacaoBase = montante / nParcelas;
        
        if (diasExtra !== 0) {
            const jurosProrrata = valor * (Math.pow(1 + taxaDiaria, diasExtra) - 1);
            
            if (metodo === 'distribuir' && nParcelas > 1) {
                const jurosProrrataPorParcela = jurosProrrata / nParcelas;
                const prestacaoDistribuida = prestacaoBase + jurosProrrataPorParcela;
                
                return {
                    parcelaNormal: prestacaoDistribuida,
                    primeiraParcela: prestacaoDistribuida,
                    jurosDiasExtras: jurosProrrata,
                    diasExtra: diasExtra
                };
            } else {
                const primeiraParcela = prestacaoBase + jurosProrrata;
                
                return {
                    parcelaNormal: prestacaoBase,
                    primeiraParcela: primeiraParcela,
                    jurosDiasExtras: jurosProrrata,
                    diasExtra: diasExtra
                };
            }
        }
        
        return {
            parcelaNormal: prestacaoBase,
            primeiraParcela: prestacaoBase,
            jurosDiasExtras: 0,
            diasExtra: 0
        };
    }

    // Sistema de Juros Compostos + Pro-rata Real
    calcularJurosCompostosProRataReal(valor, taxaEfetiva, nParcelas, diasExtra = 0, metodo = 'primeira') {
        const montante = valor * Math.pow(1 + taxaEfetiva, nParcelas);
        const prestacaoBase = montante / nParcelas;
        
        if (diasExtra !== 0) {
            // Pro-rata real: cálculo preciso baseado em dias
            const taxaDiaria = Math.pow(1 + taxaEfetiva, 1/30) - 1;
            const jurosProrrata = valor * (Math.pow(1 + taxaDiaria, diasExtra) - 1);
            
            if (metodo === 'distribuir' && nParcelas > 1) {
                const jurosProrrataPorParcela = jurosProrrata / nParcelas;
                const prestacaoDistribuida = prestacaoBase + jurosProrrataPorParcela;
                
                return {
                    parcelaNormal: prestacaoDistribuida,
                    primeiraParcela: prestacaoDistribuida,
                    jurosDiasExtras: jurosProrrata,
                    diasExtra: diasExtra
                };
            } else {
                const primeiraParcela = prestacaoBase + jurosProrrata;
                
                return {
                    parcelaNormal: prestacaoBase,
                    primeiraParcela: primeiraParcela,
                    jurosDiasExtras: jurosProrrata,
                    diasExtra: diasExtra
                };
            }
        }
        
        return {
            parcelaNormal: prestacaoBase,
            primeiraParcela: prestacaoBase,
            jurosDiasExtras: 0,
            diasExtra: 0
        };
    }

    // Sistema de Juros Compostos Mensais (método atual)
    calcularJurosCompostosMensais(valor, taxaEfetiva, nParcelas, diasExtra = 0, metodo = 'primeira') {
        const prestacaoBase = (valor * Math.pow(1 + taxaEfetiva, nParcelas)) / nParcelas;
        
        if (diasExtra !== 0) {
            const taxaDiaria = taxaEfetiva / 30;
            const jurosProrrata = valor * taxaDiaria * diasExtra;
            
            if (metodo === 'distribuir' && nParcelas > 1) {
                const jurosProrrataPorParcela = jurosProrrata / nParcelas;
                const prestacaoDistribuida = prestacaoBase + jurosProrrataPorParcela;
                
                return {
                    parcelaNormal: prestacaoDistribuida,
                    primeiraParcela: prestacaoDistribuida,
                    jurosDiasExtras: jurosProrrata,
                    diasExtra: diasExtra
                };
            } else {
                const primeiraParcela = prestacaoBase + jurosProrrata;
                
                return {
                    parcelaNormal: prestacaoBase,
                    primeiraParcela: primeiraParcela,
                    jurosDiasExtras: jurosProrrata,
                    diasExtra: diasExtra
                };
            }
        }
        
        return {
            parcelaNormal: prestacaoBase,
            primeiraParcela: prestacaoBase,
            jurosDiasExtras: 0,
            diasExtra: 0
        };
    }

    calcular() {
        // Verificar campos obrigatórios
        const valor = this.obterValorNumerico(this.valorEmprestimoField.value);
        const nParcelas = parseInt(this.numeroParcelasField.value) || 0;
        const juros = this.obterPercentualNumerico(this.taxaJurosField.value);
        
        if (!valor || !nParcelas || !juros) {
            this.limparResultado();
            return;
        }

        // Validações
        const validacao = this.validarCampos(valor, nParcelas, juros);
        if (!validacao.sucesso) {
            this.mostrarErro(validacao.mensagem);
            // Aplicar borda vermelha apenas se não estiver em modo livre
            if (!(this.configuracoes.desabilitarRegras && this.configuracoes.isAdmin)) {
                if (validacao.mensagem.includes('PARCELAS')) {
                    this.numeroParcelasField.style.borderColor = '#f44336';
                }
                if (validacao.mensagem.includes('PORCENTAGEM')) {
                    this.taxaJurosField.style.borderColor = '#f44336';
                }
            }
            return;
        }
        
        // Limpar bordas vermelhas se validação passou
        this.numeroParcelasField.style.borderColor = '';
        this.taxaJurosField.style.borderColor = '';

        // Cálculo com data e pró-rata
        const dataSimulacao = new Date();
        const dataInicial = this.parseData(this.dataInicialField.value);
        let diasExtra = 0;

        if (dataInicial) {
            // Data normal da primeira parcela seria 30 dias após o empréstimo
            const dataNormalPrimeiraParcela = new Date(dataSimulacao);
            dataNormalPrimeiraParcela.setDate(dataNormalPrimeiraParcela.getDate() + 30);
            
            // Calcular diferença entre data solicitada e data normal
            const diffTime = dataInicial.getTime() - dataNormalPrimeiraParcela.getTime();
            diasExtra = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        }

        // IGPM mensal (anual dividido por 12)
        const igpmMensal = this.configuracoes.igpmAnual / 12;

        // Obter método de cálculo dos dias extras
        const metodo = this.obterMetodoDiasExtras();

        // Calcular prestação
        const resultadoCalculo = this.calcularParcela(valor, juros, nParcelas, diasExtra, igpmMensal, metodo);
        
        // Mostrar resultado
        this.mostrarResultado(resultadoCalculo, valor, nParcelas, juros);
        this.rolarParaResultado();
    }

    obterLimitesJuros(nParcelas) {
        if (!nParcelas || nParcelas < 1) {
            return null;
        }
        
        // Usar limites personalizados se admin configurou, senão usar padrão
        const limitesPersonalizados = this.configuracoes.limitesPersonalizados?.[nParcelas];
        if (limitesPersonalizados) {
            return { min: limitesPersonalizados.min, max: limitesPersonalizados.max };
        }
        
        // Limites padrão
        const limitesDefault = this.limitesJuros[nParcelas];
        if (limitesDefault) {
            return { min: limitesDefault.min, max: limitesDefault.max };
        }
        
        return null;
    }

    atualizarInformacaoLimites() {
        const limitesInfo = document.getElementById('limitesJuros');
        const nParcelas = parseInt(this.numeroParcelasField.value);
        
        if (!limitesInfo) return;
        
        // Esconder se modo livre está ativo
        if (this.configuracoes.desabilitarRegras && this.configuracoes.isAdmin) {
            limitesInfo.style.display = 'none';
            return;
        }
        
        const limites = this.obterLimitesJuros(nParcelas);
        
        if (!limites || nParcelas > 15) {
            limitesInfo.style.display = 'none';
            return;
        }
        
        const textoParcel = nParcelas === 1 ? 'parcela' : 'parcelas';
        const minimo = limites.min.toFixed(2).replace('.', ',');
        const maximo = limites.max.toFixed(2).replace('.', ',');
        
        limitesInfo.textContent = `Para ${nParcelas} ${textoParcel}, o juros mínimo é ${minimo}% e máximo ${maximo}%`;
        limitesInfo.style.display = 'block';
    }

    validarCampos(valor, nParcelas, juros) {
        // Verificar se regras estão desabilitadas para admin
        if (this.configuracoes.desabilitarRegras && this.configuracoes.isAdmin) {
            // Aplicar classe para desabilitar borda vermelha no modo livre
            this.numeroParcelasField.classList.add('admin-free-mode');
            this.taxaJurosField.classList.add('admin-free-mode');
            
            // Modo livre - apenas validações básicas
            if (nParcelas < 1) {
                return {
                    sucesso: false,
                    mensagem: "NÚMERO DE PARCELAS DEVE SER MAIOR QUE ZERO."
                };
            }
            if (juros < 0) {
                return {
                    sucesso: false,
                    mensagem: "TAXA DE JUROS DEVE SER MAIOR OU IGUAL A ZERO."
                };
            }
            return { sucesso: true };
        }
        
        // Modo normal - remover classe para permitir borda vermelha
        this.numeroParcelasField.classList.remove('admin-free-mode');
        this.taxaJurosField.classList.remove('admin-free-mode');

        // Validações normais
        if (nParcelas < 1) {
            return {
                sucesso: false,
                mensagem: "NÚMERO DE PARCELAS INFERIOR AO MÍNIMO PERMITIDO."
            };
        }

        if (nParcelas > 15) {
            return {
                sucesso: false,
                mensagem: "VOCÊ NÃO TEM PERMISSÃO PARA SIMULAÇÕES ACIMA DE 15 PARCELAS. PARA SIMULAÇÕES SUPERIORES A 15 PARCELAS, CONSULTE MIGUEIS."
            };
        }

        // Obter limites (usar personalizados se admin configurou)
        const limites = this.configuracoes.limitesPersonalizados?.[nParcelas] || this.limitesJuros[nParcelas];
        
        if (juros < limites.min) {
            const mensagem = nParcelas === 1 ? 
                `CÁLCULO DE 1 PARCELA, A PORCENTAGEM MÍNIMA PERMITIDA É DE ${limites.min.toFixed(2).replace('.', ',')} %. PARA EMPRÉSTIMOS COM JUROS FORA DOS LIMITES ESPECIFICADOS, CONSULTE MIGUEIS.` :
                `CÁLCULOS DE ${nParcelas} PARCELAS, A PORCENTAGEM MÍNIMA PERMITIDA É DE ${limites.min.toFixed(2).replace('.', ',')} %. PARA EMPRÉSTIMOS COM JUROS FORA DOS LIMITES ESPECIFICADOS, CONSULTE MIGUEIS.`;
            
            return { sucesso: false, mensagem };
        }

        if (juros > limites.max) {
            const mensagem = nParcelas === 1 ? 
                `CÁLCULO DE 1 PARCELA, A PORCENTAGEM MÁXIMA PERMITIDA É DE ${limites.max.toFixed(2).replace('.', ',')} %. PARA EMPRÉSTIMOS COM JUROS FORA DOS LIMITES ESPECIFICADOS, CONSULTE MIGUEIS.` :
                `CÁLCULOS DE ${nParcelas} PARCELAS, A PORCENTAGEM MÁXIMA PERMITIDA É DE ${limites.max.toFixed(2).replace('.', ',')} %. PARA EMPRÉSTIMOS COM JUROS FORA DOS LIMITES ESPECIFICADOS, CONSULTE MIGUEIS.`;
            
            return { sucesso: false, mensagem };
        }

        return { sucesso: true };
    }

    mostrarResultado(resultadoCalculo, valorEmprestimo, nParcelas, juros) {
        // Formatar valores monetários
        const formatarMoeda = (valor) => new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(valor);

        // Verificar se há diferença entre primeira parcela e demais
        if (resultadoCalculo.diasExtra > 0) {
            const metodo = this.obterMetodoDiasExtras();
            const diasExtras = resultadoCalculo.diasExtra;
            const jurosExtras = formatarMoeda(resultadoCalculo.jurosDiasExtras);
            
            if (metodo === 'distribuir') {
                // Método distribuir - todas as parcelas iguais
                const valorParcela = formatarMoeda(resultadoCalculo.parcelaNormal);
                this.resultValue.innerHTML = `
                    <div style="margin-bottom: 12px;">
                        <strong>${nParcelas} parcelas de:</strong> ${valorParcela}
                        <br><small style="color: #666;">(Juros de dias extras distribuídos igualmente)</small>
                    </div>
                    <div style="font-size: 14px; color: #666; margin-top: 8px;">
                        Dias extras: ${diasExtras} | Juros extras: ${jurosExtras}
                    </div>
                `;
            } else {
                // Método primeira parcela maior
                const primeiraParcela = formatarMoeda(resultadoCalculo.primeiraParcela);
                
                if (nParcelas === 1) {
                    // Apenas 1 parcela - mostrar só o valor total com explicação
                    this.resultValue.innerHTML = `
                        <div style="margin-bottom: 12px;">
                            <strong>Valor da parcela:</strong> ${primeiraParcela}
                        </div>
                        <div style="font-size: 14px; color: #666; margin-top: 8px;">
                            Dias extras: ${diasExtras} | Juros extras: ${jurosExtras}
                        </div>
                    `;
                } else {
                    // Múltiplas parcelas - mostrar primeira e demais
                    const demaisParcelas = formatarMoeda(resultadoCalculo.parcelaNormal);
                    this.resultValue.innerHTML = `
                        <div style="margin-bottom: 12px;">
                            <strong>1ª parcela:</strong> ${primeiraParcela}
                            <br><strong>Demais ${nParcelas - 1} parcelas:</strong> ${demaisParcelas}
                        </div>
                        <div style="font-size: 14px; color: #666; margin-top: 8px;">
                            Dias extras: ${diasExtras} | Juros extras: ${jurosExtras}
                        </div>
                    `;
                }
            }
        } else {
            // Parcelas iguais
            const valorFormatado = formatarMoeda(resultadoCalculo.parcelaNormal);
            const textoParcel = nParcelas === 1 ? 'parcela de:' : 'parcelas de:';
            this.resultValue.innerHTML = `
                <strong>${nParcelas} ${textoParcel}</strong> ${valorFormatado}
            `;
        }

        // Salvar dados para o PDF
        this.ultimoCalculo = {
            valorEmprestimo,
            nParcelas,
            juros,
            resultadoCalculo
        };

        this.resultCard.style.display = 'block';
        this.exportPdfBtn.style.display = 'flex';
        this.esconderErro();
    }

    mostrarErro(mensagem) {
        this.errorMessage.textContent = mensagem;
        this.errorSection.style.display = 'block';
        this.resultCard.style.display = 'none';
        this.exportPdfBtn.style.display = 'none';
    }

    limparResultado() {
        this.resultCard.style.display = 'none';
        this.exportPdfBtn.style.display = 'none';
        this.esconderErro();
    }

    esconderErro() {
        this.errorSection.style.display = 'none';
        
        // Atualizar classes CSS baseado no modo livre administrativo
        this.atualizarClassesModoLivre();
    }

    atualizarClassesModoLivre() {
        // Adicionar/remover classe admin-free-mode para desabilitar bordas vermelhas
        const campos = [this.valorEmprestimoField, this.numeroParcelasField, this.taxaJurosField];
        
        campos.forEach(campo => {
            if (this.configuracoes.desabilitarRegras) {
                campo.classList.add('admin-free-mode');
            } else {
                campo.classList.remove('admin-free-mode');
            }
        });
        
        // Re-validar campo de juros após mudança de modo
        this.validarCampoJuros();
    }

    setupConfigPolling() {
        // Sistema de polling para detectar mudanças
        this.lastConfigHash = this.getConfigHash();
        this.configPollingInterval = setInterval(() => {
            const currentHash = this.getConfigHash();
            if (currentHash !== this.lastConfigHash) {
                console.log('Mudança de configuração detectada via polling');
                this.carregarConfiguracoes();
                this.esconderErro();
                this.atualizarClassesModoLivre();
                this.lastConfigHash = currentHash;
            }
        }, 500); // Verificar a cada 500ms
    }

    getConfigHash() {
        const config = localStorage.getItem('simulador_config');
        return config ? btoa(config).slice(0, 10) : '';
    }

    // Método para ser chamado diretamente após salvar configurações
    forceConfigUpdate() {
        console.log('Atualizando configurações forçadamente');
        this.carregarConfiguracoes();
        this.esconderErro();
        this.atualizarClassesModoLivre();
        this.validarCampoJuros(); // Re-validar juros após mudanças admin
        this.lastConfigHash = this.getConfigHash();
    }

    validarCampoJuros() {
        // Se regras estão desabilitadas, limpar validação
        if (this.configuracoes.desabilitarRegras) {
            this.taxaJurosField.setCustomValidity('');
            return;
        }

        const jurosValue = this.obterPercentualNumerico(this.taxaJurosField.value);
        const nParcelas = parseInt(this.numeroParcelasField.value) || 1;

        // Se campos estão vazios, não validar
        if (!this.taxaJurosField.value || !this.numeroParcelasField.value) {
            this.taxaJurosField.setCustomValidity('');
            return;
        }

        // Obter limites para o número de parcelas atual
        const limites = this.configuracoes.limitesPersonalizados?.[nParcelas] || this.limitesJuros[nParcelas];
        
        if (!limites) {
            this.taxaJurosField.setCustomValidity('');
            return;
        }

        // Validar se juros está dentro dos limites
        if (jurosValue < limites.min || jurosValue > limites.max) {
            this.taxaJurosField.setCustomValidity(`Taxa deve estar entre ${limites.min.toFixed(2).replace('.', ',')}% e ${limites.max.toFixed(2).replace('.', ',')}%`);
        } else {
            this.taxaJurosField.setCustomValidity('');
        }
    }

    rolarParaResultado() {
        setTimeout(() => {
            const resultSection = document.querySelector('.result-section');
            if (resultSection) {
                resultSection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });
            }
        }, 300);
    }

    abrirConfiguracoes() {
        // Carregar valores atuais
        document.getElementById('nomeUsuario').value = this.configuracoes.nomeUsuario || '';
        document.getElementById('themeMode').value = this.configuracoes.themeMode || 'light';
        document.getElementById('colorTheme').value = this.configuracoes.colorTheme || 'default';
        document.getElementById('igpmAnual').value = this.configuracoes.igpmAnual || '';
        document.getElementById('mostrarJurosRelatorio').checked = this.configuracoes.mostrarJurosRelatorio || false;
        
        // Mostrar modal
        const modal = document.getElementById('configModal');
        modal.style.display = 'flex';
        
        // Aplicar tema atual ao modal
        modal.setAttribute('data-theme', this.configuracoes.themeMode);
        modal.setAttribute('data-color-theme', this.configuracoes.colorTheme);
        
        // Se é admin, mostrar painel
        if (this.configuracoes.isAdmin) {
            this.mostrarPainelAdmin();
        }
    }

    fecharModal() {
        document.getElementById('configModal').style.display = 'none';
        document.getElementById('adminPanel').style.display = 'none';
        this.configuracoes.isAdmin = false;
    }

    salvarConfiguracoesModal() {
        this.configuracoes.nomeUsuario = document.getElementById('nomeUsuario').value;
        this.configuracoes.themeMode = document.getElementById('themeMode').value;
        this.configuracoes.colorTheme = document.getElementById('colorTheme').value;
        this.configuracoes.igpmAnual = parseFloat(document.getElementById('igpmAnual').value.replace(',', '.')) || 0;
        this.configuracoes.mostrarJurosRelatorio = document.getElementById('mostrarJurosRelatorio').checked;
        
        // Salvar configuração de desabilitar regras apenas se admin estiver logado
        if (this.configuracoes.isAdmin) {
            this.configuracoes.desabilitarRegras = document.getElementById('desabilitarRegras').checked;
        }
        
        this.aplicarTema(this.configuracoes.themeMode);
        this.aplicarPaletaCores(this.configuracoes.colorTheme);
        this.salvarConfiguracoes();
        
        // Disparar múltiplos métodos de sincronização para garantir funcionamento
        window.dispatchEvent(new CustomEvent('configuracoesAtualizadas'));
        
        // Callback direto para garantia
        if (window.simuladorInstance && window.simuladorInstance.forceConfigUpdate) {
            setTimeout(() => window.simuladorInstance.forceConfigUpdate(), 100);
        }
        
        this.fecharModal();
        alert('Configurações salvas com sucesso!');
    }

    fazerLoginAdmin() {
        const usuario = document.getElementById('adminUser').value;
        const senha = document.getElementById('adminPass').value;
        
        if (usuario === this.configuracoes.adminUser && senha === this.configuracoes.adminPassword) {
            this.configuracoes.isAdmin = true;
            this.mostrarPainelAdmin();
            document.getElementById('adminUser').value = '';
            document.getElementById('adminPass').value = '';
        } else {
            alert('Usuário ou senha incorretos');
        }
    }

    mostrarPainelAdmin() {
        const panel = document.getElementById('adminPanel');
        const table = document.getElementById('limitsTable');
        
        // Carregar configuração de desabilitar regras
        document.getElementById('desabilitarRegras').checked = this.configuracoes.desabilitarRegras || false;
        
        let html = '<div class="limits-table">';
        for (let parcelas = 1; parcelas <= 15; parcelas++) {
            const limite = this.configuracoes.limitesPersonalizados?.[parcelas] || this.limitesJuros[parcelas];
            html += `
                <div class="limit-row">
                    <label>${parcelas}p:</label>
                    <input type="text" id="min_${parcelas}" value="${limite.min.toFixed(2).replace('.', ',')}" placeholder="Mínimo">
                    <input type="text" id="max_${parcelas}" value="${limite.max.toFixed(2).replace('.', ',')}" placeholder="Máximo">
                </div>
            `;
        }
        html += '<button onclick="simulador.salvarLimitesAdmin()" id="saveLimitsBtn" class="admin-btn" style="margin-top: 16px;">Salvar Limites</button>';
        html += '</div>';
        
        table.innerHTML = html;
        panel.style.display = 'block';
        
        // Aplicar tema atual ao painel admin
        panel.setAttribute('data-theme', this.configuracoes.themeMode);
        panel.setAttribute('data-color-theme', this.configuracoes.colorTheme);
    }

    salvarLimitesAdmin() {
        const novosLimites = {};
        
        for (let parcelas = 1; parcelas <= 15; parcelas++) {
            const min = parseFloat(document.getElementById(`min_${parcelas}`).value.replace(',', '.'));
            const max = parseFloat(document.getElementById(`max_${parcelas}`).value.replace(',', '.'));
            
            if (!isNaN(min) && !isNaN(max) && min <= max) {
                novosLimites[parcelas] = { min, max };
            }
        }
        
        // Salvar configuração de desabilitar regras
        this.configuracoes.desabilitarRegras = document.getElementById('desabilitarRegras').checked;
        this.configuracoes.limitesPersonalizados = novosLimites;
        this.salvarConfiguracoes();
        
        // Disparar múltiplos métodos de sincronização para garantir funcionamento
        window.dispatchEvent(new CustomEvent('configuracoesAtualizadas'));
        
        // Callback direto para garantia
        if (window.simuladorInstance && window.simuladorInstance.forceConfigUpdate) {
            setTimeout(() => window.simuladorInstance.forceConfigUpdate(), 100);
        }
        
        alert('Limites atualizados com sucesso!');
    }

    exportarPdf() {
        if (this.resultCard.style.display === 'none' || !this.ultimoCalculo) return;
        
        this.gerarPdfSimples(
            this.ultimoCalculo.valorEmprestimo,
            this.ultimoCalculo.nParcelas,
            this.ultimoCalculo.juros,
            this.ultimoCalculo.resultadoCalculo
        );
    }

    gerarPdfSimples(valor, nParcelas, juros, resultadoCalculo) {
        try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            const dataSimulacao = new Date().toLocaleDateString('pt-BR');
            const nomeUsuario = this.configuracoes.nomeUsuario || '';
            const nomeCliente = this.nomeClienteField.value.trim();
            const cpfCliente = this.cpfClienteField.value.trim();
            
            // Configurar fonte - Cabeçalho
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(20);
            doc.text('ME EMPREENDIMENTOS', 105, 20, { align: 'center' });
            
            doc.setFontSize(16);
            doc.text('Relatório de Simulação de Empréstimo', 105, 32, { align: 'center' });
            
            // Dados do usuário primeiro (somente se tiver nome)
            let yInicial = 50;
            if (nomeUsuario && nomeUsuario.trim() !== '') {
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(14);
                doc.text(`Simulado por: ${nomeUsuario}`, 20, yInicial);
                yInicial += 12;
            }
            
            // Dados do cliente (incluir dados completos se preenchidos)
            const dadosCompletos = this.obterDadosCompletosPdf();
            
            if (nomeCliente) {
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(14);
                doc.text(`Cliente: ${nomeCliente}`, 20, yInicial);
                yInicial += 12;
            }
            
            if (cpfCliente) {
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(14);
                doc.text(`CPF: ${cpfCliente}`, 20, yInicial);
                yInicial += 12;
            }

            // Adicionar dados completos se disponíveis
            if (dadosCompletos.temDados) {
                yInicial += 8;
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(16);
                doc.text('DADOS COMPLETOS DO CLIENTE', 105, yInicial, { align: 'center' });
                yInicial += 16;

                // Dados pessoais
                if (dadosCompletos.pessoais.length > 0) {
                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(12);
                    doc.text('DADOS PESSOAIS:', 20, yInicial);
                    yInicial += 8;
                    doc.setFont('helvetica', 'normal');
                    doc.setFontSize(10);
                    
                    dadosCompletos.pessoais.forEach(item => {
                        doc.text(item, 20, yInicial);
                        yInicial += 6;
                    });
                    yInicial += 4;
                }

                // Dados profissionais
                if (dadosCompletos.profissionais.length > 0) {
                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(12);
                    doc.text('DADOS PROFISSIONAIS:', 20, yInicial);
                    yInicial += 8;
                    doc.setFont('helvetica', 'normal');
                    doc.setFontSize(10);
                    
                    dadosCompletos.profissionais.forEach(item => {
                        doc.text(item, 20, yInicial);
                        yInicial += 6;
                    });
                    yInicial += 4;
                }

                // Referências
                if (dadosCompletos.referencias.length > 0) {
                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(12);
                    doc.text('REFERÊNCIAS:', 20, yInicial);
                    yInicial += 8;
                    doc.setFont('helvetica', 'normal');
                    doc.setFontSize(10);
                    
                    dadosCompletos.referencias.forEach(item => {
                        doc.text(item, 20, yInicial);
                        yInicial += 6;
                    });
                    yInicial += 8;
                }
            }
            
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(14);
            doc.text(`Data da simulação: ${dataSimulacao}`, 20, yInicial);
            yInicial += 20;
            
            // Dados da simulação - Fonte maior e negrito
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(14);
            doc.text(`Valor do empréstimo: R$ ${valor.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, 20, yInicial);
            yInicial += 12;
            
            // Incluir taxa de juros apenas se configurado
            if (this.configuracoes.mostrarJurosRelatorio) {
                doc.text(`Taxa de juros: ${juros.toFixed(2).replace('.', ',')}%`, 20, yInicial);
                yInicial += 12;
            }
            
            doc.text(`Número de parcelas: ${nParcelas}`, 20, yInicial);
            yInicial += 12;
            
            // Mostrar informações das parcelas conforme o tipo de cálculo
            if (resultadoCalculo.diasExtra > 0) {
                const metodo = this.obterMetodoDiasExtras();
                
                if (metodo === 'distribuir') {
                    // Método distribuir - todas as parcelas iguais
                    const textoParcel = nParcelas === 1 ? 'parcela' : 'parcelas';
                    doc.text(`${nParcelas} ${textoParcel} de: R$ ${resultadoCalculo.parcelaNormal.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, 20, yInicial);
                    yInicial += 12;
                    doc.setFont('helvetica', 'normal');
                    doc.setFontSize(12);
                    doc.text(`(Juros de dias extras distribuídos igualmente)`, 20, yInicial);
                    yInicial += 8;
                    doc.text(`(Dias extras: ${resultadoCalculo.diasExtra} | Juros extras: R$ ${resultadoCalculo.jurosDiasExtras.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})})`, 20, yInicial);
                    yInicial += 12;
                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(14);
                } else {
                    // Método primeira parcela maior
                    if (nParcelas === 1) {
                        doc.text(`Valor da parcela: R$ ${resultadoCalculo.primeiraParcela.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, 20, yInicial);
                        yInicial += 12;
                    } else {
                        doc.text(`1ª parcela: R$ ${resultadoCalculo.primeiraParcela.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, 20, yInicial);
                        yInicial += 12;
                        doc.text(`Demais ${nParcelas - 1} parcelas: R$ ${resultadoCalculo.parcelaNormal.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, 20, yInicial);
                        yInicial += 12;
                    }
                    doc.setFont('helvetica', 'normal');
                    doc.setFontSize(12);
                    doc.text(`(Dias extras: ${resultadoCalculo.diasExtra} | Juros extras: R$ ${resultadoCalculo.jurosDiasExtras.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})})`, 20, yInicial);
                    yInicial += 12;
                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(14);
                }
            } else {
                const textoParcel = nParcelas === 1 ? 'parcela' : 'parcelas';
                doc.text(`${nParcelas} ${textoParcel} de: R$ ${resultadoCalculo.parcelaNormal.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, 20, yInicial);
                yInicial += 12;
            }
            yInicial += 8;
            
            // Tabela de parcelas - Título centralizado
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(16);
            doc.text('TABELA DE PARCELAS', 105, yInicial, { align: 'center' });
            yInicial += 15;
            
            // Cabeçalho da tabela - Centralizado e negrito
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(14);
            doc.text('Parcela', 35, yInicial, { align: 'center' });
            doc.text('Vencimento', 105, yInicial, { align: 'center' });
            doc.text('Valor', 165, yInicial, { align: 'center' });
            yInicial += 10;
            
            // Calcular datas de vencimento
            let dataBase;
            if (this.dataInicialField.value) {
                dataBase = this.parseData(this.dataInicialField.value);
            } else {
                dataBase = new Date();
                dataBase.setDate(dataBase.getDate() + 30);
            }
            
            // Linhas da tabela - Centralizadas e negrito
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(12);
            let yPos = yInicial;
            for (let i = 1; i <= nParcelas; i++) {
                const dataVencimento = new Date(dataBase);
                dataVencimento.setMonth(dataVencimento.getMonth() + i - 1);
                
                // Definir valor da parcela conforme método escolhido
                let valorParcela;
                if (resultadoCalculo.diasExtra > 0) {
                    const metodo = this.obterMetodoDiasExtras();
                    if (metodo === 'distribuir') {
                        // Método distribuir - todas as parcelas iguais
                        valorParcela = resultadoCalculo.parcelaNormal;
                    } else {
                        // Método primeira parcela maior
                        if (i === 1) {
                            valorParcela = resultadoCalculo.primeiraParcela;
                        } else {
                            valorParcela = resultadoCalculo.parcelaNormal;
                        }
                    }
                } else {
                    valorParcela = resultadoCalculo.parcelaNormal;
                }
                
                doc.text(i.toString().padStart(2, '0'), 35, yPos, { align: 'center' });
                doc.text(dataVencimento.toLocaleDateString('pt-BR'), 105, yPos, { align: 'center' });
                doc.text(`R$ ${valorParcela.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, 165, yPos, { align: 'center' });
                
                yPos += 10;
                
                // Nova página se necessário
                if (yPos > 270) {
                    doc.addPage();
                    yPos = 20;
                    // Repetir cabeçalho na nova página
                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(14);
                    doc.text('Parcela', 35, yPos, { align: 'center' });
                    doc.text('Vencimento', 105, yPos, { align: 'center' });
                    doc.text('Valor', 165, yPos, { align: 'center' });
                    yPos += 10;
                }
            }
            
            // Salvar PDF
            doc.save(`simulacao_emprestimo_${Date.now()}.pdf`);
            alert('PDF exportado com sucesso!');
            
        } catch (error) {
            console.error('Erro ao gerar PDF:', error);
            alert('Erro ao gerar PDF. Tente novamente.');
        }
    }

    aplicarTema(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        document.body.setAttribute('data-theme', theme);
        
        // Aplicar tema aos modais
        const modal = document.getElementById('configModal');
        const adminPanel = document.getElementById('adminPanel');
        
        if (modal) {
            modal.setAttribute('data-theme', theme);
        }
        
        if (adminPanel) {
            adminPanel.setAttribute('data-theme', theme);
        }
        
        // Salvar a preferência
        localStorage.setItem('app-theme', theme);
        
        // Atualizar o select se necessário
        const themeSelect = document.getElementById('themeMode');
        if (themeSelect && themeSelect.value !== theme) {
            themeSelect.value = theme;
        }
    }

    aplicarPaletaCores(colorTheme) {
        document.documentElement.setAttribute('data-color-theme', colorTheme);
        document.body.setAttribute('data-color-theme', colorTheme);
        
        // Aplicar tema aos modais
        const modal = document.getElementById('configModal');
        const adminPanel = document.getElementById('adminPanel');
        
        if (modal) {
            modal.setAttribute('data-color-theme', colorTheme);
        }
        
        if (adminPanel) {
            adminPanel.setAttribute('data-color-theme', colorTheme);
        }
        
        // Salvar a preferência
        localStorage.setItem('app-color-theme', colorTheme);
        
        // Atualizar o select se necessário
        const colorSelect = document.getElementById('colorTheme');
        if (colorSelect && colorSelect.value !== colorTheme) {
            colorSelect.value = colorTheme;
        }
    }

    salvarCredenciaisAdmin() {
        const novoUsuario = document.getElementById('newAdminUser').value;
        const novaSenha = document.getElementById('newAdminPass').value;
        
        if (!novoUsuario || !novaSenha) {
            alert('Por favor, preencha todos os campos');
            return;
        }
        
        this.configuracoes.adminUser = novoUsuario;
        this.configuracoes.adminPassword = novaSenha;
        this.salvarConfiguracoes();
        
        // Disparar múltiplos métodos de sincronização para garantir funcionamento
        window.dispatchEvent(new CustomEvent('configuracoesAtualizadas'));
        
        // Callback direto para garantia
        if (window.simuladorInstance && window.simuladorInstance.forceConfigUpdate) {
            setTimeout(() => window.simuladorInstance.forceConfigUpdate(), 100);
        }
        
        document.getElementById('newAdminUser').value = '';
        document.getElementById('newAdminPass').value = '';
        
        alert('Credenciais alteradas com sucesso!');
    }

    formatarValorMonetario(valor) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(valor);
    }

    toggleMetodoDiasExtras() {
        const metodoDiasExtras = document.getElementById('metodoDiasExtras');
        if (!metodoDiasExtras || !this.dataInicialField || !this.numeroParcelasField) return;
        
        const dataValue = this.dataInicialField.value.trim();
        const nParcelas = parseInt(this.numeroParcelasField.value) || 1;
        
        if (dataValue && dataValue.length >= 8 && nParcelas > 1) {
            metodoDiasExtras.style.display = 'block';
        } else {
            metodoDiasExtras.style.display = 'none';
        }
    }

    obterMetodoDiasExtras() {
        const metodoSelecionado = document.querySelector('input[name="metodoDias"]:checked');
        return metodoSelecionado ? metodoSelecionado.value : 'primeira';
    }
}

// Inicializar aplicação com fallback
let simulator;

function initializeApp() {
    try {
        simulator = new SimuladorEmprestimos();
        console.log('Simulador inicializado com sucesso');
    } catch (error) {
        console.error('Erro ao inicializar simulador:', error);
        // Tentar novamente após 500ms
        setTimeout(initializeApp, 500);
    }
}

// Múltiplas estratégias de inicialização
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}

// Fallback adicional
setTimeout(() => {
    if (!simulator) {
        console.log('Forçando inicialização...');
        initializeApp();
    }
}, 1000);

// Estratégia adicional: anexar event listener diretamente
function forceAttachEventListener() {
    const taxaField = document.getElementById('taxaJuros');
    if (taxaField && !taxaField.hasAttribute('data-listener-attached')) {
        taxaField.addEventListener('input', function(e) {
            let valor = e.target.value.replace(/\D/g, '');
            
            if (valor.length > 4) {
                valor = valor.substring(0, 4);
            }
            
            if (valor === '' || valor === '0') {
                e.target.value = '';
                return;
            }

            valor = valor.replace(/^0+/, '') || '0';

            if (valor.length === 1) {
                e.target.value = `0,0${valor}`;
                return;
            }
            if (valor.length === 2) {
                e.target.value = `0,${valor}`;
                return;
            }
            if (valor.length === 3) {
                e.target.value = `${valor[0]},${valor.substring(1)}`;
                return;
            }
            if (valor.length === 4) {
                e.target.value = `${valor.substring(0, 2)},${valor.substring(2)}`;
                return;
            }
        });
        taxaField.setAttribute('data-listener-attached', 'true');
        console.log('Event listener anexado diretamente ao campo taxaJuros');
    }
}

// Tentar anexar em múltiplos momentos
setTimeout(forceAttachEventListener, 100);
setTimeout(forceAttachEventListener, 500);
setTimeout(forceAttachEventListener, 1500);