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
        // Forçar reset do estado administrativo na inicialização
        this.configuracoes.isAdmin = false;
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
            sistemaJuros: 'compostos-mensal',
            adminUser: 'admin',
            adminPassword: 'admin123',
            diasExtrasConfigurado: 0,
            ajusteAutomaticoMeses: true,
            // Templates para contratos e promissórias
            dadosCredor: {
                nome: '',
                cpfCnpj: '',
                endereco: '',
                rgOrgao: ''
            },
            templateContrato: '',
            promissoriasColoridas: false,
            promissoriasPorFolha: 2
        };
        const loadedConfig = config ? { ...defaultConfig, ...JSON.parse(config) } : defaultConfig;
        this.configuracoes = loadedConfig;
        // Aplicar tema e paleta na inicialização
        this.aplicarTema(loadedConfig.themeMode);
        this.aplicarPaletaCores(loadedConfig.colorTheme);
        
        // Configurar sistema de juros e regras de limite
        setTimeout(() => {
            const sistemaJurosSelect = document.getElementById('sistemaJuros');
            if (sistemaJurosSelect) {
                sistemaJurosSelect.value = loadedConfig.sistemaJuros;
            }
            
            const desabilitarRegrasSelect = document.getElementById('desabilitarRegras');
            if (desabilitarRegrasSelect) {
                desabilitarRegrasSelect.value = loadedConfig.desabilitarRegras ? 'desabilitar' : 'habilitar';
            }
        }, 100);
        
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
        this.calcularBtn = document.getElementById('calcularBtn');
        this.resultCard = document.getElementById('resultCard');
        this.resultValue = document.getElementById('resultValue');
        this.errorSection = document.getElementById('errorSection');
        this.errorMessage = document.getElementById('errorMessage');
        this.exportPdfBtn = document.getElementById('exportPdfBtn');
        this.exportContratoBtn = document.getElementById('exportContratoBtn');
        this.pdfButtons = document.getElementById('pdfButtons');
        this.configBtn = document.getElementById('configBtn');
        this.importarDadosBtn = document.getElementById('importarDadosBtn');
        this.importFileInput = document.getElementById('importFileInput');
        
        console.log('Taxa de juros field encontrado:', !!this.taxaJurosField);
        console.log('ID do campo:', this.taxaJurosField?.id);
    }

    setupEventListeners() {
        // Formatação de campos com validação
        if (this.valorEmprestimoField) {
            this.valorEmprestimoField.addEventListener('input', (e) => {
                this.formatarMoeda(e.target);
                this.limparResultado();
            });
        }
        
        if (this.valorEmprestimoField) {
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
        }

        if (this.taxaJurosField) {
            this.taxaJurosField.addEventListener('input', (e) => {
                this.limparErrosVisuais();
                this.formatarPercentualTempoReal(e.target);
                this.validarCampoJuros();
                this.limparResultado();
            });
        }
        
        if (this.taxaJurosField) {
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
        }

        if (this.dataInicialField) {
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
        }

        if (this.numeroParcelasField) {
            this.numeroParcelasField.addEventListener('input', () => {
                // SOLUÇÃO 2: Limpar erros visuais primeiro
                this.limparErrosVisuais();
                this.limparResultado();
                this.toggleMetodoDiasExtras();
                this.atualizarInformacaoLimites(); // Atualizar limites de juros
                // Re-validar juros apenas se não estiver em modo livre
                if (!(this.configuracoes.desabilitarRegras && this.configuracoes.isAdmin)) {
                    this.validarCampoJuros();
                }
            });
        }

        // Botões
        if (this.calcularBtn) {
            this.calcularBtn.addEventListener('click', () => {
                this.calcular();
            });
        }

        if (this.exportPdfBtn) {
            this.exportPdfBtn.addEventListener('click', () => {
                this.exportarPdf();
            });
        }

        if (this.exportContratoBtn) {
            this.exportContratoBtn.addEventListener('click', () => {
                this.exportarContrato();
            });
        }

        // Importar dados
        if (this.importarDadosBtn) {
            this.importarDadosBtn.addEventListener('click', () => {
                this.importFileInput.click();
            });
        }

        if (this.importFileInput) {
            this.importFileInput.addEventListener('change', (e) => {
                this.importarDados(e.target.files[0]);
            });
        }

        if (this.configBtn) {
            this.configBtn.addEventListener('click', () => {
                this.abrirConfiguracoes();
            });
        }

        // Modal de configurações
        const closeModal = document.getElementById('closeModal');
        if (closeModal) {
            closeModal.addEventListener('click', () => {
                this.fecharModal();
            });
        }

        const saveConfigBtn = document.getElementById('saveConfigBtn');
        if (saveConfigBtn) {
            saveConfigBtn.addEventListener('click', () => {
                this.salvarConfiguracoesModal();
            });
        }

        const adminLoginBtn = document.getElementById('adminLoginBtn');
        if (adminLoginBtn) {
            adminLoginBtn.addEventListener('click', () => {
                this.fazerLoginAdmin();
            });
        }

        const saveCredentialsBtn = document.getElementById('saveCredentialsBtn');
        if (saveCredentialsBtn) {
            saveCredentialsBtn.addEventListener('click', () => {
                this.salvarCredenciaisAdmin();
            });
        }

        // Listener para detectar mudanças no localStorage (sincronização entre abas)
        window.addEventListener('storage', (e) => {
            if (e.key === 'simulador-configuracoes') {
                this.carregarConfiguracoes();
                this.esconderErro();
            }
        });

        // REFATORAÇÃO: Sistema de sincronização automática removido
        // Sincronização manual via interface direta
        
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

        // Event listener para toggle dos limites de juros
        const limitsToggle = document.getElementById('limitsToggle');
        if (limitsToggle) {
            limitsToggle.addEventListener('click', () => this.toggleLimitsSection());
        }

        // Configurar formatação dos campos do formulário completo
        this.setupFormCompletoFormatting();
        this.setupDateMaskFormatting();
    }

    // Função para toggle do formulário completo
    toggleFormularioCompleto() {
        const container = document.getElementById('formCompletoContainer');
        const toggleBtn = document.getElementById('toggleFormCompleto');
        const icon = toggleBtn ? toggleBtn.querySelector('.toggle-icon') : null;
        
        if (!container || !toggleBtn) {
            console.error('Elementos do formulário completo não encontrados');
            return;
        }
        
        if (container.style.display === 'none' || container.style.display === '') {
            container.style.display = 'block';
            toggleBtn.classList.add('expanded');
            if (icon) icon.textContent = '▲';
        } else {
            container.style.display = 'none';
            toggleBtn.classList.remove('expanded');
            if (icon) icon.textContent = '▼';
        }
    }

    // Função para toggle da seção de limites de juros
    toggleLimitsSection() {
        const limitsContent = document.getElementById('limitsTable');
        const limitsHeader = document.getElementById('limitsToggle');
        
        if (!limitsContent || !limitsHeader) {
            console.error('Elementos da seção de limites não encontrados');
            return;
        }
        
        if (limitsContent.style.display === 'none' || limitsContent.style.display === '') {
            limitsContent.style.display = 'block';
            limitsHeader.classList.add('expanded');
        } else {
            limitsContent.style.display = 'none';
            limitsHeader.classList.remove('expanded');
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
        
        // Validar ano (permitir desde 1920 para data de nascimento)
        if (ano < 1920 || ano > new Date().getFullYear()) {
            this.marcarDataInvalida(input, `Ano deve estar entre 1920 e ${new Date().getFullYear()}`);
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
        
        if (dia < 1 || dia > 31 || mes < 0 || mes > 11 || ano < 1920) return null;
        return new Date(ano, mes, dia);
    }

    calcularParcela(valor, juros, nParcelas, diasExtra = 0, igpmMensal = 0, metodo = 'primeira', sistemaJuros = 'compostos-mensal') {
        
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

    // Sistema de Juros Compostos + Pro-rata Real (distribui juros extras em todas as parcelas)
    calcularJurosCompostosProRataReal(valor, taxaEfetiva, nParcelas, diasExtra = 0, metodo = 'primeira') {
        const montante = valor * Math.pow(1 + taxaEfetiva, nParcelas);
        const prestacaoBase = montante / nParcelas;
        
        if (diasExtra !== 0) {
            if (nParcelas === 1) {
                // Para 1 parcela: usar cálculo linear simples igual aos outros sistemas
                const taxaDiaria = taxaEfetiva / 30.0;
                const jurosProrrata = valor * taxaDiaria * diasExtra;
                const prestacaoComJurosExtras = prestacaoBase + jurosProrrata;
                
                return {
                    parcelaNormal: prestacaoComJurosExtras,
                    primeiraParcela: prestacaoComJurosExtras,
                    jurosDiasExtras: jurosProrrata,
                    diasExtra: diasExtra
                };
            } else {
                // Para múltiplas parcelas: calcular juros extras a cada mês e somar à parcela
                const taxaDiaria = Math.pow(1 + taxaEfetiva, 1/30) - 1;
                const jurosExtrasPorParcela = prestacaoBase * (Math.pow(1 + taxaDiaria, diasExtra) - 1);
                const prestacaoComJurosExtras = prestacaoBase + jurosExtrasPorParcela;
                const jurosExtrasTotal = jurosExtrasPorParcela * nParcelas;
                
                return {
                    parcelaNormal: prestacaoComJurosExtras,
                    primeiraParcela: prestacaoComJurosExtras,
                    jurosDiasExtras: jurosExtrasTotal,
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
        // Recarregar configurações mais recentes antes do cálculo
        this.carregarConfiguracoes();
        
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

        // Calcular prestação usando o sistema de juros configurado
        const sistemaJuros = this.configuracoes.sistemaJuros || 'compostos-mensal';
        const resultadoCalculo = this.calcularParcela(valor, juros, nParcelas, diasExtra, igpmMensal, metodo, sistemaJuros);
        
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
        // Debug: Log das configurações atuais
        console.log('Debug - validarCampos:', {
            desabilitarRegras: this.configuracoes.desabilitarRegras,
            isAdmin: this.configuracoes.isAdmin,
            valor: valor,
            nParcelas: nParcelas,
            juros: juros
        });
        
        // Verificar se regras estão desabilitadas para admin
        if (this.configuracoes.desabilitarRegras && this.configuracoes.isAdmin) {
            console.log('Debug - Modo livre ativo, pulando validações');
            
            // Aplicar classe para desabilitar borda vermelha no modo livre
            this.numeroParcelasField.classList.add('admin-free-mode');
            this.taxaJurosField.classList.add('admin-free-mode');
            
            // Modo livre - NENHUMA validação de regras de negócio
            // Apenas verificações básicas de entrada válida
            if (valor <= 0) {
                return { sucesso: false, mensagem: 'VALOR DO EMPRÉSTIMO DEVE SER MAIOR QUE ZERO.' };
            }
            
            // No modo livre, permitir qualquer número de parcelas e juros
            return { sucesso: true };
        }
        
        console.log('Debug - Modo normal, aplicando validações');
        
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

        // Obter nome do sistema de juros usado
        const sistemaJuros = this.configuracoes.sistemaJuros || 'compostos-mensal';
        const nomesSistemas = {
            'simples': 'Juros Simples',
            'compostos-diario': 'Juros Compostos Diários',
            'compostos-mensal': 'Juros Compostos Mensais',
            'compostos-prorata-real': 'Juros Compostos + Pro-rata Real'
        };
        const nomeSistema = nomesSistemas[sistemaJuros] || 'Juros Compostos Mensais';

        // Calcular análise de lucro se modo livre estiver ativo
        let analiseFinanceira = '';
        if (this.configuracoes.desabilitarRegras) {
            const totalReceber = nParcelas === 1 ? 
                resultadoCalculo.primeiraParcela : 
                (resultadoCalculo.primeiraParcela + (resultadoCalculo.parcelaNormal * (nParcelas - 1)));
            
            const lucroLiquido = totalReceber - valorEmprestimo;
            const margemLucro = (lucroLiquido / valorEmprestimo) * 100;
            
            analiseFinanceira = `
                <div style="margin-top: 16px; padding: 16px; background: linear-gradient(135deg, #e8f5e8, #f0f8f0); border-radius: 12px; border-left: 4px solid #4caf50;">
                    <div style="font-weight: 600; color: #2e7d32; margin-bottom: 8px; display: flex; align-items: center;">
                        <span style="margin-right: 8px;">💰</span> ANÁLISE FINANCEIRA (Modo Livre)
                    </div>
                    <div style="font-size: 14px; color: #1b5e20; line-height: 1.4;">
                        <div style="margin-bottom: 4px;"><strong>Capital emprestado:</strong> ${formatarMoeda(valorEmprestimo)}</div>
                        <div style="margin-bottom: 4px;"><strong>Total a receber:</strong> ${formatarMoeda(totalReceber)}</div>
                        <div style="margin-bottom: 4px; color: #4caf50;"><strong>✅ Lucro líquido:</strong> ${formatarMoeda(lucroLiquido)}</div>
                        <div style="color: #4caf50;"><strong>📈 Margem de lucro:</strong> ${margemLucro.toFixed(2)}%</div>
                    </div>
                </div>
            `;
        }

        // Verificar se há diferença entre primeira parcela e demais
        if (resultadoCalculo.diasExtra > 0) {
            const metodo = this.obterMetodoDiasExtras();
            const diasExtras = resultadoCalculo.diasExtra;
            const jurosExtras = formatarMoeda(resultadoCalculo.jurosDiasExtras);
            
            if (metodo === 'distribuir') {
                // Método distribuir - todas as parcelas iguais
                const valorParcela = formatarMoeda(resultadoCalculo.parcelaNormal);
                this.resultValue.innerHTML = `
                    <div style="margin-bottom: 8px; padding: 8px; background: var(--primary-container); border-radius: 8px;">
                        <small style="color: var(--on-primary-container); font-weight: 500;">Sistema: ${nomeSistema}</small>
                    </div>
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
                        <div style="margin-bottom: 8px; padding: 8px; background: var(--primary-container); border-radius: 8px;">
                            <small style="color: var(--on-primary-container); font-weight: 500;">Sistema: ${nomeSistema}</small>
                        </div>
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
                        <div style="margin-bottom: 8px; padding: 8px; background: var(--primary-container); border-radius: 8px;">
                            <small style="color: var(--on-primary-container); font-weight: 500;">Sistema: ${nomeSistema}</small>
                        </div>
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
                <div style="margin-bottom: 8px; padding: 8px; background: var(--primary-container); border-radius: 8px;">
                    <small style="color: var(--on-primary-container); font-weight: 500;">Sistema: ${nomeSistema}</small>
                </div>
                <strong>${nParcelas} ${textoParcel}</strong> ${valorFormatado}
            `;
        }

        // Adicionar análise financeira se modo livre
        this.resultValue.innerHTML += analiseFinanceira;

        // Salvar dados para o PDF
        this.ultimoCalculo = {
            valorEmprestimo,
            nParcelas,
            juros,
            resultadoCalculo
        };

        this.resultCard.style.display = 'block';
        this.pdfButtons.style.display = 'block';
        this.esconderErro();
    }

    mostrarErro(mensagem) {
        this.errorMessage.textContent = mensagem;
        this.errorSection.style.display = 'block';
        this.resultCard.style.display = 'none';
        this.pdfButtons.style.display = 'none';
    }

    limparResultado() {
        this.resultCard.style.display = 'none';
        this.pdfButtons.style.display = 'none';
        this.esconderErro();
    }

    esconderErro() {
        this.errorSection.style.display = 'none';
        
        // Atualizar classes CSS baseado no modo livre administrativo
        this.atualizarClassesModoLivre();
    }

    atualizarClassesModoLivre() {
        // CORREÇÃO: Verificar se admin está ativo E regras estão desabilitadas
        const modoLivreAtivo = this.configuracoes.isAdmin && this.configuracoes.desabilitarRegras;
        
        // Adicionar/remover classe admin-free-mode para desabilitar bordas vermelhas
        const campos = [this.valorEmprestimoField, this.numeroParcelasField, this.taxaJurosField];
        
        campos.forEach(campo => {
            if (campo) {
                if (modoLivreAtivo) {
                    campo.classList.add('admin-free-mode');
                } else {
                    campo.classList.remove('admin-free-mode');
                }
            }
        });
        
        // Re-validar campo de juros após mudança de modo
        this.validarCampoJuros();
    }

    limparErrosVisuais() {
        [this.taxaJurosField, this.numeroParcelasField, this.valorEmprestimoField].forEach(field => {
            if (field) {
                field.style.borderColor = '';
                field.style.color = '';
                field.title = '';
                field.classList.remove('error-state');
            }
        });
    }

    validarCampoJuros() {
        this.limparErrosVisuais();
        
        const modoLivreAtivo = this.configuracoes.isAdmin && this.configuracoes.desabilitarRegras;
        if (modoLivreAtivo || !this.taxaJurosField.value || !this.numeroParcelasField.value) {
            return;
        }

        const jurosValue = this.obterPercentualNumerico(this.taxaJurosField.value);
        const nParcelas = parseInt(this.numeroParcelasField.value) || 1;
        const limites = this.configuracoes.limitesPersonalizados?.[nParcelas] || this.limitesJuros[nParcelas];
        
        if (!limites) return;

        const foraDosLimites = jurosValue < limites.min || jurosValue > limites.max;
        if (foraDosLimites) {
            this.taxaJurosField.style.borderColor = '#d32f2f';
            this.taxaJurosField.style.color = '#d32f2f';
            this.taxaJurosField.title = `Para ${nParcelas} parcela(s), os juros devem estar entre ${limites.min.toFixed(2)}% e ${limites.max.toFixed(2)}%`;
        }
    }

    rolarParaResultado() {
        const resultSection = document.querySelector('.result-section');
        if (resultSection) {
            resultSection.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }
    }

    abrirConfiguracoes() {
        // Carregar valores atuais nos campos básicos
        document.getElementById('nomeUsuario').value = this.configuracoes.nomeUsuario || '';
        document.getElementById('themeMode').value = this.configuracoes.themeMode || 'light';
        document.getElementById('colorTheme').value = this.configuracoes.colorTheme || 'default';
        document.getElementById('mostrarJurosRelatorio').value = this.configuracoes.mostrarJurosRelatorio ? 'true' : 'false';
        
        // NOVA LÓGICA: Sempre ocultar painel administrativo ao abrir configurações
        const adminPanel = document.getElementById('adminPanel');
        const loginSection = document.getElementById('adminLoginSection');
        
        if (adminPanel) {
            adminPanel.style.display = 'none';
        }
        
        // SEMPRE mostrar seção de login (exige reautenticação a cada acesso)
        if (loginSection) {
            loginSection.style.display = 'flex';
        }
        
        // Limpar campos de login para nova autenticação
        const adminUserField = document.getElementById('adminUser');
        const adminPassField = document.getElementById('adminPass');
        if (adminUserField) adminUserField.value = '';
        if (adminPassField) adminPassField.value = '';
        
        // Mostrar modal
        const modal = document.getElementById('configModal');
        modal.style.display = 'flex';
        
        // Aplicar tema atual ao modal
        modal.setAttribute('data-theme', this.configuracoes.themeMode);
        modal.setAttribute('data-color-theme', this.configuracoes.colorTheme);
        
        console.log('Debug - Configurações abertas, painel admin oculto, login obrigatório');
    }

    fecharModal() {
        document.getElementById('configModal').style.display = 'none';
        
        // NOVA LÓGICA: Preservar configurações, resetar apenas UI
        // NÃO destruir this.configuracoes.isAdmin ou configurações salvas
        
        const adminPanel = document.getElementById('adminPanel');
        const loginSection = document.getElementById('adminLoginSection');
        
        // Ocultar painel administrativo (será mostrado novamente após próximo login)
        if (adminPanel) {
            adminPanel.style.display = 'none';
        }
        
        // Mostrar seção de login para próxima autenticação
        if (loginSection) {
            loginSection.style.display = 'flex';
        }
        
        // Limpar campos de login para próxima sessão
        const adminUserField = document.getElementById('adminUser');
        const adminPassField = document.getElementById('adminPass');
        
        if (adminUserField) adminUserField.value = '';
        if (adminPassField) adminPassField.value = '';
        
        // IMPORTANTE: Aplicar configurações administrativas na página principal
        this.atualizarClassesModoLivre();
        
        console.log('Debug - Modal fechado, configurações preservadas, UI resetada');
    }



    // REFATORAÇÃO: Método separado para recarregar sem resetar sessão
    recarregarConfiguracoesSemReset() {
        const config = localStorage.getItem('simulador_config');
        if (config) {
            const loadedConfig = JSON.parse(config);
            // Preservar estado de autenticação atual
            const isAdminAtual = this.configuracoes.isAdmin;
            this.configuracoes = { ...this.configuracoes, ...loadedConfig };
            this.configuracoes.isAdmin = isAdminAtual;
            
            // Aplicar temas e configurações visuais
            this.aplicarTema(this.configuracoes.themeMode);
            this.aplicarPaletaCores(this.configuracoes.colorTheme);
            this.atualizarClassesModoLivre();
        }
    }

    salvarConfiguracoesModal() {
        // Salvar configurações gerais
        this.configuracoes.nomeUsuario = document.getElementById('nomeUsuario').value;
        this.configuracoes.themeMode = document.getElementById('themeMode').value;
        this.configuracoes.colorTheme = document.getElementById('colorTheme').value;
        this.configuracoes.exibirDadosJuros = document.getElementById('exibirDadosJuros').value === 'true';
        
        // Salvar configurações administrativas se logado
        if (this.configuracoes.isAdmin) {
            // IGPM movido para área administrativa
            this.configuracoes.igpmAnual = parseFloat(document.getElementById('igpmAnual').value.replace(',', '.')) || 0;
            
            // Novas configurações
            this.configuracoes.diasExtrasConfigurado = parseInt(document.getElementById('diasExtrasConfigurado').value) || 0;
            this.configuracoes.ajusteAutomaticoMeses = document.getElementById('ajusteAutomaticoMeses').value === 'true';
            
            // Dados do credor
            this.configuracoes.dadosCredor = {
                nome: document.getElementById('credorNome').value || '',
                cpfCnpj: document.getElementById('credorCpfCnpj').value || '',
                endereco: document.getElementById('credorEndereco').value || '',
                rgOrgao: document.getElementById('credorRgOrgao').value || ''
            };
            
            // Configurações de contratos
            this.configuracoes.promissoriasColoridas = document.getElementById('promissoriasColoridas').value === 'true';
            this.configuracoes.promissoriasPorFolha = parseInt(document.getElementById('promissoriasPorFolha').value) || 2;
            this.configuracoes.templateContrato = document.getElementById('templateContrato').value || '';
            this.configuracoes.desabilitarRegras = document.getElementById('desabilitarRegras').value === 'desabilitar';
            this.configuracoes.sistemaJuros = document.getElementById('sistemaJuros').value;
            
            // Salvar credenciais se alteradas
            const novoUsuario = document.getElementById('newAdminUser').value;
            const novaSenha = document.getElementById('newAdminPass').value;
            if (novoUsuario && novaSenha) {
                this.configuracoes.adminUser = novoUsuario;
                this.configuracoes.adminPassword = novaSenha;
            }
            
            // Salvar limites personalizados
            const novosLimites = {};
            for (let parcelas = 1; parcelas <= 15; parcelas++) {
                const minField = document.getElementById(`min_${parcelas}`);
                const maxField = document.getElementById(`max_${parcelas}`);
                if (minField && maxField) {
                    const min = parseFloat(minField.value.replace(',', '.'));
                    const max = parseFloat(maxField.value.replace(',', '.'));
                    
                    if (!isNaN(min) && !isNaN(max) && min <= max) {
                        novosLimites[parcelas] = { min, max };
                    }
                }
            }
            this.configuracoes.limitesPersonalizados = novosLimites;
        }
        
        this.aplicarTema(this.configuracoes.themeMode);
        this.aplicarPaletaCores(this.configuracoes.colorTheme);
        this.salvarConfiguracoes();
        
        // REFATORAÇÃO: Eliminado sistema de sincronização automática
        // Aplicar mudanças imediatamente sem eventos complexos
        this.atualizarClassesModoLivre();
        
        // Fechar modal automaticamente após salvar
        alert('Todas as configurações foram salvas com sucesso!');
        this.fecharModal();
    }

    fazerLoginAdmin() {
        const usuario = document.getElementById('adminUser').value;
        const senha = document.getElementById('adminPass').value;
        
        if (usuario === this.configuracoes.adminUser && senha === this.configuracoes.adminPassword) {
            // Ativar estado administrativo
            this.configuracoes.isAdmin = true;
            
            // Ocultar seção de login
            const loginSection = document.getElementById('adminLoginSection');
            if (loginSection) {
                loginSection.style.display = 'none';
            }
            
            // Mostrar painel administrativo temporariamente (apenas nesta sessão do modal)
            this.mostrarPainelAdmin();
            
            // Limpar campos de login
            document.getElementById('adminUser').value = '';
            document.getElementById('adminPass').value = '';
            
            // Aplicar modo livre imediatamente se configurado
            this.atualizarClassesModoLivre();
            
            console.log('Debug - Login admin realizado, painel temporário exibido');
        } else {
            alert('Usuário ou senha incorretos');
        }
    }

    mostrarPainelAdmin() {
        const panel = document.getElementById('adminPanel');
        const table = document.getElementById('limitsTable');
        
        // REFATORAÇÃO: Formato unificado boolean consistente
        document.getElementById('desabilitarRegras').value = this.configuracoes.desabilitarRegras ? 'desabilitar' : 'habilitar';
        
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
        html += '</div>';
        
        table.innerHTML = html;
        panel.style.display = 'block';
        
        // Aplicar tema atual ao painel admin
        panel.setAttribute('data-theme', this.configuracoes.themeMode);
        panel.setAttribute('data-color-theme', this.configuracoes.colorTheme);
        
        // Carregar configurações nos campos
        document.getElementById('igpmAnual').value = this.configuracoes.igpmAnual || 0;
        
        // Carregar novas configurações
        document.getElementById('diasExtrasConfigurado').value = this.configuracoes.diasExtrasConfigurado || 0;
        document.getElementById('ajusteAutomaticoMeses').value = this.configuracoes.ajusteAutomaticoMeses ? 'true' : 'false';
        
        // Dados do credor
        document.getElementById('credorNome').value = this.configuracoes.dadosCredor?.nome || '';
        document.getElementById('credorCpfCnpj').value = this.configuracoes.dadosCredor?.cpfCnpj || '';
        document.getElementById('credorEndereco').value = this.configuracoes.dadosCredor?.endereco || '';
        document.getElementById('credorRgOrgao').value = this.configuracoes.dadosCredor?.rgOrgao || '';
        
        // Configurações de contratos
        document.getElementById('promissoriasColoridas').value = this.configuracoes.promissoriasColoridas ? 'true' : 'false';
        document.getElementById('promissoriasPorFolha').value = this.configuracoes.promissoriasPorFolha || 2;
        document.getElementById('templateContrato').value = this.configuracoes.templateContrato || this.getTemplateContratoDefault();
    }



    obterDadosCompletosPdf() {
        const dadosCompletos = {
            temDados: false,
            pessoais: [],
            profissionais: [],
            referencias: []
        };

        // Verificar se há dados no formulário completo (independente se está visível)
        const formCompleto = document.getElementById('formCompleto');
        // Remover verificação de display para capturar dados sempre que preenchidos

        // Dados pessoais - incluindo nome e CPF aqui
        const pessoais = [];
        const nomeCompletoField = document.getElementById('nomeCompleto');
        const cpfCompletoField = document.getElementById('cpfCompleto');
        const nomeCompleto = nomeCompletoField?.value?.trim() || '';
        const cpfCompleto = cpfCompletoField?.value?.trim() || '';
        const dataNascimento = document.getElementById('dataNascimento')?.value;
        const estadoCivil = document.getElementById('estadoCivil')?.value;
        const endereco = document.getElementById('endereco')?.value;
        const numero = document.getElementById('numero')?.value;
        const complemento = document.getElementById('complemento')?.value;
        const bairro = document.getElementById('bairro')?.value;
        const cidade = document.getElementById('cidade')?.value;
        const estado = document.getElementById('estado')?.value;
        const cep = document.getElementById('cep')?.value;
        const telefone = document.getElementById('telefoneCompleto')?.value;

        if (nomeCompleto) pessoais.push(`Nome: ${nomeCompleto}`);
        if (cpfCompleto) pessoais.push(`CPF: ${cpfCompleto}`);
        if (dataNascimento) pessoais.push(`Data de Nascimento: ${dataNascimento}`);
        if (estadoCivil) pessoais.push(`Estado Civil: ${estadoCivil}`);
        if (endereco) pessoais.push(`Endereço: ${endereco}${numero ? `, ${numero}` : ''}${complemento ? `, ${complemento}` : ''}`);
        if (bairro) pessoais.push(`Bairro: ${bairro}`);
        if (cidade && estado) pessoais.push(`Cidade: ${cidade} - ${estado}`);
        if (cep) pessoais.push(`CEP: ${cep}`);
        if (telefone) pessoais.push(`Telefone: ${telefone}`);
        
        const email = document.getElementById('email')?.value;
        if (email) pessoais.push(`E-mail: ${email}`);

        // Dados profissionais
        const profissionais = [];
        const profissao = document.getElementById('profissao')?.value;
        const localTrabalho = document.getElementById('localTrabalho')?.value;
        const rendaMensal = document.getElementById('rendaMensal')?.value;
        const tempoEmprego = document.getElementById('tempoEmprego')?.value;

        if (profissao) profissionais.push(`Profissão: ${profissao}`);
        if (localTrabalho) profissionais.push(`Local de Trabalho: ${localTrabalho}`);
        if (rendaMensal) profissionais.push(`Renda Mensal: ${rendaMensal}`);
        if (tempoEmprego) profissionais.push(`Tempo de Emprego: ${tempoEmprego}`);

        // Referências organizadas igual aos dados do cliente (com cidade)
        const referencias1 = [];
        const ref1Nome = document.getElementById('ref1Nome')?.value;
        const ref1Telefone = document.getElementById('ref1Telefone')?.value;
        const ref1Rua = document.getElementById('ref1Rua')?.value;
        const ref1Numero = document.getElementById('ref1Numero')?.value;
        const ref1Bairro = document.getElementById('ref1Bairro')?.value;
        const ref1Cidade = document.getElementById('ref1Cidade')?.value;
        
        if (ref1Nome) referencias1.push(`Nome: ${ref1Nome}`);
        if (ref1Telefone) referencias1.push(`Telefone: ${ref1Telefone}`);
        if (ref1Rua) referencias1.push(`Endereço: ${ref1Rua}${ref1Numero ? `, ${ref1Numero}` : ''}`);
        if (ref1Bairro) referencias1.push(`Bairro: ${ref1Bairro}`);
        if (ref1Cidade) referencias1.push(`Cidade: ${ref1Cidade}`);

        const referencias2 = [];
        const ref2Nome = document.getElementById('ref2Nome')?.value;
        const ref2Telefone = document.getElementById('ref2Telefone')?.value;
        const ref2Rua = document.getElementById('ref2Rua')?.value;
        const ref2Numero = document.getElementById('ref2Numero')?.value;
        const ref2Bairro = document.getElementById('ref2Bairro')?.value;
        const ref2Cidade = document.getElementById('ref2Cidade')?.value;
        
        if (ref2Nome) referencias2.push(`Nome: ${ref2Nome}`);
        if (ref2Telefone) referencias2.push(`Telefone: ${ref2Telefone}`);
        if (ref2Rua) referencias2.push(`Endereço: ${ref2Rua}${ref2Numero ? `, ${ref2Numero}` : ''}`);
        if (ref2Bairro) referencias2.push(`Bairro: ${ref2Bairro}`);
        if (ref2Cidade) referencias2.push(`Cidade: ${ref2Cidade}`);

        dadosCompletos.pessoais = pessoais;
        dadosCompletos.profissionais = profissionais;
        dadosCompletos.referencias1 = referencias1;
        dadosCompletos.referencias2 = referencias2;
        dadosCompletos.temDados = pessoais.length > 0 || profissionais.length > 0 || referencias1.length > 0 || referencias2.length > 0;

        return dadosCompletos;
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
            // Usar dados do formulário completo com verificação segura
            const nomeCompletoField = document.getElementById('nomeCompleto');
            const cpfCompletoField = document.getElementById('cpfCompleto');
            const nomeCliente = nomeCompletoField?.value?.trim() || '';
            const cpfCliente = cpfCompletoField?.value?.trim() || '';
            
            // Configurar fonte - Cabeçalho
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(20);
            doc.text('ME EMPREENDIMENTOS', 105, 20, { align: 'center' });
            
            doc.setFontSize(16);
            doc.text('Relatório de Simulação de Empréstimo', 105, 32, { align: 'center' });
            
            // Simulado por e data da simulação
            let yInicial = 50;
            if (nomeUsuario && nomeUsuario.trim() !== '') {
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(14);
                doc.text(`Simulado por: ${nomeUsuario}`, 20, yInicial);
                yInicial += 12;
            }
            
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(14);
            doc.text(`Data da simulação: ${dataSimulacao}`, 20, yInicial);
            yInicial += 20;

            // Dados cadastrais primeiro (conforme solicitado)
            const dadosCompletos = this.obterDadosCompletosPdf();
            
            if (dadosCompletos.temDados) {
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(16);
                doc.text('DADOS CADASTRAIS DO CLIENTE', 105, yInicial, { align: 'center' });
                yInicial += 16;

                // Dados pessoais
                if (dadosCompletos.pessoais.length > 0) {
                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(14);
                    doc.text('DADOS PESSOAIS:', 20, yInicial);
                    yInicial += 10;
                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(14);
                    
                    dadosCompletos.pessoais.forEach(item => {
                        doc.text(item, 20, yInicial);
                        yInicial += 8;
                    });
                    yInicial += 6;
                }

                // Dados profissionais
                if (dadosCompletos.profissionais.length > 0) {
                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(14);
                    doc.text('DADOS PROFISSIONAIS:', 20, yInicial);
                    yInicial += 10;
                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(14);
                    
                    dadosCompletos.profissionais.forEach(item => {
                        doc.text(item, 20, yInicial);
                        yInicial += 8;
                    });
                    yInicial += 6;
                }

                // 1ª Referência
                if (dadosCompletos.referencias1.length > 0) {
                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(14);
                    doc.text('1ª REFERÊNCIA:', 20, yInicial);
                    yInicial += 10;
                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(14);
                    
                    dadosCompletos.referencias1.forEach(item => {
                        doc.text(item, 20, yInicial);
                        yInicial += 8;
                    });
                    yInicial += 6;
                }

                // 2ª Referência
                if (dadosCompletos.referencias2.length > 0) {
                    // Verificar espaço antes de adicionar 2ª referência
                    if (yInicial > 220) {
                        doc.addPage();
                        yInicial = 20;
                    }
                    
                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(14);
                    doc.text('2ª REFERÊNCIA:', 20, yInicial);
                    yInicial += 10;
                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(14);
                    
                    dadosCompletos.referencias2.forEach(item => {
                        doc.text(item, 20, yInicial);
                        yInicial += 8;
                    });
                    yInicial += 6;
                }
            }
            
            // Verificar se precisa de nova página antes dos dados da simulação
            if (yInicial > 200) {
                doc.addPage();
                yInicial = 20;
            } else {
                yInicial += 20;
            }
            
            // Seção de dados da simulação (sempre exibir após dados cadastrais)
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(16);
            doc.text('DADOS DA SIMULAÇÃO', 105, yInicial, { align: 'center' });
            yInicial += 16;
            
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
            
            // Mostrar sistema de juros utilizado
            const sistemasJuros = {
                'simples': 'Juros Simples',
                'compostos-diarios': 'Juros Compostos Diários', 
                'compostos-mensal': 'Juros Compostos Mensais',
                'pro-rata-real': 'Pro-rata Real'
            };
            const sistemaAtual = sistemasJuros[this.configuracoes.sistemaJuros] || 'Juros Compostos Mensais';
            doc.text(`Sistema de juros: ${sistemaAtual}`, 20, yInicial);
            yInicial += 15;
            
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
            
            // Verificar se precisa de nova página antes da tabela
            if (yInicial > 200) {
                doc.addPage();
                yInicial = 20;
            } else {
                yInicial += 12;
            }
            
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
                // Cada parcela adiciona (i-1) meses à data base
                dataVencimento.setMonth(dataBase.getMonth() + (i - 1));
                
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
        
        // Aplicar tema aos modais e botão expandir
        const modal = document.getElementById('configModal');
        const adminPanel = document.getElementById('adminPanel');
        const formToggleBtn = document.querySelector('.form-toggle-btn');
        
        if (modal) {
            modal.setAttribute('data-color-theme', colorTheme);
        }
        
        if (adminPanel) {
            adminPanel.setAttribute('data-color-theme', colorTheme);
        }
        
        if (formToggleBtn) {
            formToggleBtn.setAttribute('data-color-theme', colorTheme);
        }
        
        // Salvar a preferência
        localStorage.setItem('app-color-theme', colorTheme);
        
        // Atualizar o select se necessário
        const colorSelect = document.getElementById('colorTheme');
        if (colorSelect && colorSelect.value !== colorTheme) {
            colorSelect.value = colorTheme;
        }
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

    setupDateMaskFormatting() {
        const dataNascimentoField = document.getElementById('dataNascimento');
        if (dataNascimentoField) {
            dataNascimentoField.addEventListener('input', (e) => this.formatarData(e.target));
        }
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

// Função para toggle de senha
function togglePassword(fieldId) {
    const field = document.getElementById(fieldId);
    const button = field.nextElementSibling;
    
    if (field.type === 'password') {
        field.type = 'text';
        button.textContent = '○';
    } else {
        field.type = 'password';
        button.textContent = '●';
    }
}