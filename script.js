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

        // Cache de elementos DOM
        this.elements = {};
        
        this.configuracoes = this.carregarConfiguracoes();
        this.configuracoes.isAdmin = false;
        
        // Inicializar sistema de debounce de notificações
        this.lastNotification = '';
        this.lastNotificationTime = 0;
        
        this.initializeElements();
        this.setupEventListeners();
        this.setupNotificationSystem();
        this.focusInitialField();
    }

    carregarConfiguracoes() {
        let config = null;
        try {
            config = localStorage.getItem('simulador_config');
        } catch (error) {
            // localStorage não disponível ou erro ao acessar
        }
        const defaultConfig = {
            nomeUsuario: '',
            igpmAnual: 0.0,
            isAdmin: false,
            limitesPersonalizados: null,
            themeMode: 'light',
            exibirDadosJuros: true,
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
        
        // Configurar selects de sistema de juros e regras
        this.configurarSelects(loadedConfig);
        
        // Aplicar classes de modo livre
        if (this.atualizarClassesModoLivre) {
            this.atualizarClassesModoLivre();
        }
        
        return loadedConfig;
    }

    configurarSelects(config) {
        const sistemaJurosSelect = document.getElementById('sistemaJuros');
        if (sistemaJurosSelect) {
            sistemaJurosSelect.value = config.sistemaJuros || 'compostos-mensal';
        }
        
        const desabilitarRegrasSelect = document.getElementById('desabilitarRegras');
        if (desabilitarRegrasSelect) {
            desabilitarRegrasSelect.value = config.desabilitarRegras ? 'desabilitar' : 'habilitar';
        }
    }

    setupNotificationSystem() {
        // Criar container de notificações se não existir
        if (!document.getElementById('notification-container')) {
            const container = document.createElement('div');
            container.id = 'notification-container';
            container.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                pointer-events: none;
            `;
            document.body.appendChild(container);
        }
    }

    showNotification(message, type = 'info', duration = 3000) {
        // Debounce para evitar notificações duplicadas
        const notificationKey = `${type}_${message}`;
        if (this.lastNotification === notificationKey && Date.now() - this.lastNotificationTime < 1000) {
            return; // Ignorar notificação duplicada
        }
        this.lastNotification = notificationKey;
        this.lastNotificationTime = Date.now();
        
        const container = document.getElementById('notification-container');
        const notification = document.createElement('div');
        
        const colors = {
            success: '#4caf50',
            error: '#f44336',
            info: '#2196f3',
            warning: '#ff9800'
        };
        
        notification.style.cssText = `
            background: ${colors[type] || colors.info};
            color: white;
            padding: 12px 20px;
            margin-bottom: 10px;
            border-radius: 8px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
            pointer-events: auto;
            opacity: 0;
            transform: translateX(100%);
            transition: all 0.3s ease;
            max-width: 300px;
            word-wrap: break-word;
        `;
        
        notification.textContent = message;
        container.appendChild(notification);
        
        // Animar entrada
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        }, 10);
        
        // Remover após duração especificada
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, duration);
    }

    salvarConfiguracoes() {
        try {
            localStorage.setItem('simulador_config', JSON.stringify(this.configuracoes));
        } catch (error) {
            this.showNotification('Erro ao salvar configurações. Verifique o armazenamento do navegador.', 'error');
        }
    }

    initializeElements() {
        // Inicializando elementos DOM
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
        
        // Validação de elementos críticos
        if (!this.taxaJurosField) {
            throw new Error('Campo taxa de juros não encontrado');
        }
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
                // Validar campo de juros atualmente
                this.validarCampoJuros();
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
                const arquivo = e.target.files[0];
                if (arquivo) {
                    this.importarDados(arquivo);
                }
                // Limpar input para permitir selecionar o mesmo arquivo novamente
                e.target.value = '';
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
            // Formulário completo não encontrado - modo básico
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
            // Seção de limites não encontrada
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
        // Focar no campo inicial quando DOM estiver pronto
        if (this.valorEmprestimoField) {
            this.valorEmprestimoField.focus();
        }
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
        // Recarregar configurações antes de cada cálculo
        this.configuracoes = this.carregarConfiguracoes();
        
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
        // Verificar se regras estão desabilitadas para admin
        const modoLivreAtivo = this.configuracoes.desabilitarRegras && this.configuracoes.isAdmin;
        
        if (modoLivreAtivo) {
            
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
        
        // Aplicando validações do modo normal
        
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
                <div class="analise-financeira-box" style="margin-top: 16px; padding: 16px; background: var(--surface-container-low); border-radius: 12px; border: 1px solid var(--outline-variant); max-width: 400px; margin-left: auto; margin-right: auto; text-align: center;">
                    <div style="font-weight: 600; color: var(--on-surface); margin-bottom: 8px; display: flex; align-items: center; justify-content: center;">
                        ANÁLISE FINANCEIRA (Modo Livre)
                    </div>
                    <div style="font-size: 14px; color: var(--on-surface); line-height: 1.4;">
                        <div style="margin-bottom: 4px;"><strong>Capital emprestado:</strong> ${formatarMoeda(valorEmprestimo)}</div>
                        <div style="margin-bottom: 4px;"><strong>Total a receber:</strong> ${formatarMoeda(totalReceber)}</div>
                        <div style="margin-bottom: 4px; color: var(--primary);"><strong>✅ Lucro líquido:</strong> ${formatarMoeda(lucroLiquido)}</div>
                        <div style="color: var(--primary);"><strong>📈 Margem de lucro:</strong> ${margemLucro.toFixed(2)}%</div>
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
                    // Limpar qualquer borda vermelha existente
                    campo.style.borderColor = '';
                    campo.style.color = '';
                    campo.title = '';
                } else {
                    campo.classList.remove('admin-free-mode');
                }
            }
        });
        

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
        document.getElementById('exibirDadosJuros').value = this.configuracoes.exibirDadosJuros ? 'true' : 'false';
        
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
        
        // Configurações abertas - painel admin oculto por segurança
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
        
        // Modal fechado - configurações preservadas
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
        this.fecharModal();
        this.showNotification('Todas as configurações foram salvas com sucesso!', 'success');
        

    }

    fazerLoginAdmin() {
        const usuario = document.getElementById('adminUser')?.value;
        const senha = document.getElementById('adminPass')?.value;
        
        if (!usuario || !senha) {
            this.showNotification('Preencha usuário e senha', 'warning');
            return;
        }
        
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
            
            this.showNotification('Login administrativo realizado com sucesso', 'success');
        } else {
            this.showNotification('Usuário ou senha incorretos', 'error');
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
        document.getElementById('sistemaJuros').value = this.configuracoes.sistemaJuros || 'compostos-mensal';
        document.getElementById('desabilitarRegras').value = this.configuracoes.desabilitarRegras ? 'desabilitar' : 'habilitar';
        
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
        // Template de contrato - usar valor salvo ou padrão
        const templateField = document.getElementById('templateContrato');
        if (templateField) {
            templateField.value = this.configuracoes.templateContrato || this.getTemplateContratoDefault();
        }
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
            // Verificar se jsPDF está disponível com timeout para carregamento
            const checkJsPDF = () => {
                if (typeof window.jspdf !== 'undefined') {
                    return true;
                }
                // Tentar acessar jsPDF de forma alternativa
                if (typeof jsPDF !== 'undefined') {
                    window.jspdf = { jsPDF };
                    return true;
                }
                return false;
            };
            
            if (!checkJsPDF()) {
                // Aguardar um pouco para biblioteca carregar
                setTimeout(() => {
                    if (checkJsPDF()) {
                        this.exportarPdf();
                    } else {
                        throw new Error('Biblioteca jsPDF não carregada. Recarregue a página.');
                    }
                }, 1000);
                return;
            }
            
            if (typeof window.jspdf === 'undefined') {
                throw new Error('Biblioteca jsPDF não carregada. Recarregue a página.');
            }
            
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
            
            doc.text(`Número de parcelas: ${nParcelas}`, 20, yInicial);
            yInicial += 12;
            
            // Sistema de juros depois do número de parcelas
            if (this.configuracoes.exibirDadosJuros) {
                const sistemaJurosTexto = this.configuracoes.sistemaJuros === 'simples' ? 'Juros Simples' :
                                        this.configuracoes.sistemaJuros === 'compostos-diarios' ? 'Juros Compostos Diários' :
                                        this.configuracoes.sistemaJuros === 'pro-rata-real' ? 'Pro-rata Real' :
                                        'Juros Compostos Mensais';
                doc.text(`Sistema de juros: ${sistemaJurosTexto}`, 20, yInicial);
                yInicial += 12;
            }
            
            // Taxa de juros por último
            if (this.configuracoes.exibirDadosJuros) {
                doc.text(`Taxa de juros: ${juros.toFixed(2).replace('.', ',')}%`, 20, yInicial);
                yInicial += 12;
            }

            yInicial += 3;
            
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
            
            // Gerar nome do arquivo com dados do cliente
            const agora = new Date();
            const timestamp = agora.getFullYear().toString() +
                             (agora.getMonth() + 1).toString().padStart(2, '0') +
                             agora.getDate().toString().padStart(2, '0') +
                             agora.getHours().toString().padStart(2, '0') +
                             agora.getMinutes().toString().padStart(2, '0') +
                             agora.getSeconds().toString().padStart(2, '0');
            
            // Verificar se nome e CPF estão preenchidos para nomear arquivo
            const nomeClienteValue = this.nomeClienteField?.value?.trim();
            const cpfClienteValue = this.cpfClienteField?.value?.trim();
            
            let nomeArquivo;
            if (nomeClienteValue && cpfClienteValue) {
                const nomeClientePdf = nomeClienteValue.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');
                const cpfClientePdf = cpfClienteValue.replace(/[^0-9]/g, '');
                nomeArquivo = `${nomeClientePdf}_${cpfClientePdf}_${timestamp}.pdf`;
            } else {
                nomeArquivo = `Simulacao_Emprestimos_${timestamp}.pdf`;
            }

            
            doc.save(nomeArquivo);
            this.showNotification('PDF exportado com sucesso!', 'success');
            
            // Gerar automaticamente arquivo JSON para importação
            setTimeout(() => this.exportarDadosJSON(), 100);
            
        } catch (error) {
            console.error('Erro detalhado na geração de PDF:', error);
            alert('Erro ao gerar PDF: ' + error.message);
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
        
        // Aplicar paleta às caixas de análise financeira
        const analiseBoxes = document.querySelectorAll('.analise-financeira-box');
        analiseBoxes.forEach(box => {
            box.setAttribute('data-color-theme', colorTheme);
        });
        
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

    getTemplateContratoDefault() {
        return `CONTRATO DE EMPRÉSTIMO

CONTRATO PARTICULAR DE EMPRÉSTIMO DE VALOR
Pelo presente instrumento particular de contrato de empréstimo, de um lado:
(1) Nome do CREDOR: {{NOME_CREDOR}}
CPF/CNPJ: {{CPF_CREDOR}}
Endereço: {{ENDERECO_CREDOR}}

E de outro:
(2) Nome do DEVEDOR: {{NOME_DEVEDOR}}
CPF: {{CPF_DEVEDOR}}
Endereço: {{ENDERECO_DEVEDOR}}

Têm entre si justo e contratado o seguinte:

CLÁUSULA PRIMEIRA – DO EMPRÉSTIMO
O CREDOR empresta ao DEVEDOR a quantia de {{VALOR_EMPRESTIMO}} ({{VALOR_EXTENSO}}), neste ato recebida em moeda corrente nacional e para fins pessoais.

CLÁUSULA SEGUNDA – DO PRAZO E PAGAMENTO
O DEVEDOR se compromete a pagar o valor emprestado em {{NUMERO_PARCELAS}} parcelas mensais de {{VALOR_PARCELA}}, vencendo-se a primeira em {{DATA_PRIMEIRA_PARCELA}}.

CLÁUSULA TERCEIRA – DOS JUROS REMUNERATÓRIOS
Sobre o valor emprestado incidirão juros remuneratórios de {{TAXA_JUROS}}% ao mês, calculados de forma composta, conforme acordado.

CLÁUSULA QUARTA – DA MORA E MULTA
Em caso de atraso, incidirão:
1. Multa de 2%;
2. Juros de mora de 1% ao mês;
3. Correção do saldo com os encargos.

CLÁUSULA QUINTA – DAS GARANTIAS (SE APLICÁVEL)
Se houver garantia, será descrita em anexo.

CLÁUSULA SEXTA – DA NOTA PROMISSÓRIA
O DEVEDOR assina nota promissória de {{VALOR_EMPRESTIMO}}, vencível em {{DATA_VENCIMENTO}}.

CLÁUSULA SÉTIMA – DA RESCISÃO
O inadimplemento autoriza vencimento antecipado da dívida.

CLÁUSULA OITAVA – DO FORO
Fica eleito o foro da comarca de {{COMARCA}}.

{{LOCAL}}, {{DATA_CONTRATO}}.

CREDOR: _________________________________________
{{NOME_CREDOR}}

DEVEDOR: ________________________________________
{{NOME_DEVEDOR}}

Testemunha 1: _____________________________________ CPF: _______________________

Testemunha 2: _____________________________________ CPF: _______________________`;
    }

    // Função principal de importação com JSON intermediário
    async importarDadosPDF(arquivo) {
        try {
            console.log('Iniciando importação do PDF...');
            const dadosJson = await this.extrairDadosPDF(arquivo);
            
            console.log('JSON extraído do PDF:', dadosJson);
            
            // Aplicar dados usando JSON estruturado
            this.aplicarDadosJson(dadosJson);
            
            this.fecharModalImportacao();
            this.esconderErro();
            this.showNotification('Dados do PDF importados com sucesso!', 'success');
            
        } catch (error) {
            console.error('Erro detalhado ao importar PDF:', error);
            this.showNotification('Erro ao importar dados do PDF: ' + error.message, 'error');
        }
    }
    
    // Função unificada para aplicar dados JSON
    aplicarDadosJson(dadosJson) {
        console.log('Aplicando dados JSON:', dadosJson);
        
        // Preencher campos básicos da simulação
        if (dadosJson.simulacao) {
            const sim = dadosJson.simulacao;
            
            if (sim.valor) {
                this.valorField.value = sim.valor;
                this.formatarMoeda(this.valorField);
                console.log('Valor aplicado:', sim.valor);
            }
            
            if (sim.parcelas) {
                this.parcelasField.value = sim.parcelas;
                console.log('Parcelas aplicadas:', sim.parcelas);
            }
            
            if (sim.juros) {
                this.taxaField.value = sim.juros;
                console.log('Taxa aplicada:', sim.juros);
            }
            
            if (sim.dataVencimentoInicial) {
                this.dataInicialField.value = sim.dataVencimentoInicial;
                console.log('Data inicial aplicada:', sim.dataVencimentoInicial);
            }
        }
        
        // Preencher dados do cliente
        if (dadosJson.cliente) {
            const cliente = dadosJson.cliente;
            
            if (cliente.nome && this.nomeClienteField) {
                this.nomeClienteField.value = cliente.nome;
                console.log('Nome aplicado:', cliente.nome);
            }
            
            if (cliente.cpf && this.cpfClienteField) {
                this.cpfClienteField.value = cliente.cpf;
                this.formatarCpf(this.cpfClienteField);
                console.log('CPF aplicado:', cliente.cpf);
            }
            
            // Expandir formulário se há dados cadastrais
            const temDadosCompletos = cliente.nome || cliente.cpf || cliente.dataNascimento;
            if (temDadosCompletos) {
                console.log('Expandindo formulário automaticamente...');
                const toggleBtn = document.getElementById('formToggleBtn');
                const formSection = document.getElementById('formCompleto');
                
                if (toggleBtn && formSection) {
                    formSection.style.display = 'block';
                    toggleBtn.textContent = '▲ DADOS COMPLETOS DO CLIENTE';
                }
                
                // Preencher campos do formulário expandido
                this.preencherFormularioCompleto(cliente);
            }
        }
    }
    
    // Função para preencher formulário completo
    preencherFormularioCompleto(cliente) {
        const campos = {
            'dataNascimento': cliente.dataNascimento,
            'estadoCivil': cliente.estadoCivil,
            'endereco': cliente.endereco,
            'numero': cliente.numero,
            'complemento': cliente.complemento,
            'bairro': cliente.bairro,
            'cidade': cliente.cidade,
            'estado': cliente.estado,
            'cep': cliente.cep,
            'telefone': cliente.telefone,
            'email': cliente.email,
            'localTrabalho': cliente.localTrabalho,
            'profissao': cliente.profissao,
            'rendaMensal': cliente.rendaMensal,
            'tempoEmprego': cliente.tempoEmprego,
            'ref1Nome': cliente.ref1Nome,
            'ref1Telefone': cliente.ref1Telefone,
            'ref1Endereco': cliente.ref1Endereco,
            'ref1Bairro': cliente.ref1Bairro,
            'ref2Nome': cliente.ref2Nome,
            'ref2Telefone': cliente.ref2Telefone,
            'ref2Endereco': cliente.ref2Endereco,
            'ref2Bairro': cliente.ref2Bairro
        };
        
        Object.keys(campos).forEach(campo => {
            const elemento = document.getElementById(campo);
            if (elemento && campos[campo]) {
                elemento.value = campos[campo];
                
                // Aplicar formatação específica se necessário
                if (campo === 'telefone') {
                    this.formatarTelefone(elemento);
                } else if (campo === 'cep') {
                    this.formatarCep(elemento);
                } else if (campo === 'rendaMensal') {
                    this.formatarMoeda(elemento);
                }
                
                console.log(`Campo ${campo} preenchido:`, campos[campo]);
            }
        });
    }

    // Nova função para abrir modal de importação
    abrirModalImportacao() {
        const modal = document.getElementById('importModal');
        if (modal) {
            modal.style.display = 'flex';
            // Resetar para aba PDF por padrão
            this.selecionarAbaImportacao('pdf');
        }
    }
    
    fecharModalImportacao() {
        const modal = document.getElementById('importModal');
        if (modal) {
            modal.style.display = 'none';
            // Limpar campos com IDs corretos
            const textarea = document.getElementById('textoFormulario');
            const fileInput = document.getElementById('pdfFile');
            if (textarea) textarea.value = '';
            if (fileInput) fileInput.value = '';
        }
    }
    
    selecionarAbaImportacao(tipo) {
        // Atualizar abas visuais
        const tabPdf = document.getElementById('tabPdf');
        const tabTexto = document.getElementById('tabTexto');
        
        if (tabPdf) tabPdf.classList.toggle('active', tipo === 'pdf');
        if (tabTexto) tabTexto.classList.toggle('active', tipo === 'texto');
        
        // Mostrar seção correspondente
        const secaoPdf = document.getElementById('secaoPdf');
        const secaoTexto = document.getElementById('secaoTexto');
        
        if (secaoPdf) secaoPdf.style.display = tipo === 'pdf' ? 'block' : 'none';
        if (secaoTexto) secaoTexto.style.display = tipo === 'texto' ? 'block' : 'none';
        
        // Atualizar texto do botão
        const btnProcessar = document.getElementById('btnProcessarImportacao');
        if (btnProcessar) {
            btnProcessar.textContent = tipo === 'pdf' ? 'PROCESSAR PDF' : 'PROCESSAR TEXTO';
        }
    }
    
    processarImportacao() {
        const abaAtiva = document.querySelector('.import-tab.active');
        const tipo = abaAtiva ? abaAtiva.textContent.includes('PDF') ? 'pdf' : 'texto' : 'pdf';
        
        console.log('Processando importação, tipo:', tipo);
        
        if (tipo === 'pdf') {
            const fileInput = document.getElementById('pdfFile');
            const arquivo = fileInput?.files?.[0];
            
            console.log('Arquivo PDF selecionado:', arquivo?.name, arquivo?.type, arquivo?.size);
            
            if (!arquivo) {
                this.showNotification('Selecione um arquivo PDF primeiro', 'error');
                return;
            }
            
            if (arquivo.type !== 'application/pdf') {
                console.error('Tipo de arquivo inválido:', arquivo.type);
                this.showNotification('Arquivo deve ser um PDF', 'error');
                return;
            }
            
            console.log('Iniciando importação do PDF...');
            this.importarDadosPDF(arquivo);
            
        } else {
            const textoInput = document.getElementById('textoFormulario');
            const texto = textoInput?.value?.trim();
            
            console.log('Texto para processar:', texto?.substring(0, 100) + '...');
            
            if (!texto) {
                this.showNotification('Cole o texto do formulário primeiro', 'error');
                return;
            }
            
            this.processarTextoFormulario(texto);
        }
    }
    
    processarTextoFormulario(texto) {
        try {
            console.log('Processando texto do formulário...');
            
            // Converter texto para JSON estruturado
            const dadosJson = this.converterTextoParaJson(texto);
            console.log('JSON gerado do texto:', dadosJson);
            
            // Aplicar dados usando mesma lógica do PDF
            this.aplicarDadosJson(dadosJson);
            
            this.fecharModalImportacao();
            this.showNotification('Dados do formulário importados com sucesso!', 'success');
            
        } catch (error) {
            console.error('Erro ao processar texto:', error);
            this.showNotification('Erro ao processar texto. Verifique o formato.', 'error');
        }
    }
    
    // Nova função para converter texto em JSON estruturado
    converterTextoParaJson(texto) {
        const dadosJson = {
            simulacao: {},
            cliente: {}
        };
        
        console.log('Convertendo texto para JSON...');
        
        // Extrair dados da seção EMPRESTIMO (novo formato)
        const secaoEmprestimo = texto.match(/EMPRESTIMO([\s\S]*?)(?=DADOS CADASTRAIS|$)/i);
        if (secaoEmprestimo) {
            const emprestimoTexto = secaoEmprestimo[1];
            console.log('Seção empréstimo encontrada:', emprestimoTexto);
            
            const valorMatch = emprestimoTexto.match(/Valor:\s*R\$\s*([\d.,]+)/i);
            if (valorMatch) {
                dadosJson.simulacao.valor = valorMatch[1];
                console.log('Valor extraído:', valorMatch[1]);
            }
            
            const parcelasMatch = emprestimoTexto.match(/Parcelas:\s*(\d+)/i);
            if (parcelasMatch) {
                dadosJson.simulacao.parcelas = parcelasMatch[1];
                console.log('Parcelas extraídas:', parcelasMatch[1]);
            }
            
            const dataVencMatch = emprestimoTexto.match(/Data Venc\. Inicial:\s*([\d\/]*)/i);
            if (dataVencMatch && dataVencMatch[1].trim()) {
                dadosJson.simulacao.dataVencimentoInicial = dataVencMatch[1].trim();
                console.log('Data vencimento extraída:', dataVencMatch[1]);
            }
        }
        
        // Extrair dados cadastrais do cliente
        const dadosCliente = this.extrairDadosFormulario(texto);
        dadosJson.cliente = {
            nome: dadosCliente.nomeCliente,
            cpf: dadosCliente.cpfCliente,
            dataNascimento: dadosCliente.dataNascimento,
            estadoCivil: dadosCliente.estadoCivil,
            endereco: dadosCliente.endereco,
            numero: dadosCliente.numero,
            complemento: dadosCliente.complemento,
            bairro: dadosCliente.bairro,
            cidade: dadosCliente.cidade,
            estado: dadosCliente.estado,
            cep: dadosCliente.cep,
            telefone: dadosCliente.telefone,
            email: dadosCliente.email,
            localTrabalho: dadosCliente.localTrabalho,
            profissao: dadosCliente.profissao,
            rendaMensal: dadosCliente.rendaMensal,
            tempoEmprego: dadosCliente.tempoEmprego,
            ref1Nome: dadosCliente.ref1Nome,
            ref1Telefone: dadosCliente.ref1Telefone,
            ref1Endereco: dadosCliente.ref1Endereco,
            ref1Bairro: dadosCliente.ref1Bairro,
            ref2Nome: dadosCliente.ref2Nome,
            ref2Telefone: dadosCliente.ref2Telefone,
            ref2Endereco: dadosCliente.ref2Endereco,
            ref2Bairro: dadosCliente.ref2Bairro
        };
        
        console.log('JSON final gerado:', dadosJson);
        return dadosJson;
    }
    
    extrairDadosFormulario(texto) {
        const dados = {};
        
        // Mapeamento de campos do formulário para IDs dos elementos
        const mapeamento = {
            'Nome:': 'nomeCliente',
            'CPF:': 'cpfCliente',
            'Data nascimento:': 'dataNascimento',
            'Estado Civil:': 'estadoCivil',
            'Endereço:': 'endereco',
            'Número:': 'numero',
            'Complemento:': 'complemento',
            'Bairro:': 'bairro',
            'Cidade:': 'cidade',
            'Estado:': 'estado',
            'CEP:': 'cep',
            'Telefone:': 'telefone',
            'E-mail:': 'email',
            'Local de trabalho:': 'localTrabalho',
            'Profissão:': 'profissao',
            'Renda Mensal:': 'rendaMensal',
            'Tempo de emprego:': 'tempoEmprego'
        };
        
        // Extrair dados usando regex
        Object.keys(mapeamento).forEach(label => {
            const regex = new RegExp(label.replace(':', ':\\s*') + '([^\\n]+)', 'i');
            const match = texto.match(regex);
            if (match && match[1].trim()) {
                dados[mapeamento[label]] = match[1].trim();
            }
        });
        
        // Extrair referências (formato especial) - adaptado para novo template
        const ref1Nome = texto.match(/1º REREFENCIA[\s\S]*?Nome:\s*([^\n]+)/i);
        const ref1Telefone = texto.match(/1º REREFENCIA[\s\S]*?Telefone:\s*([^\n]+)/i);
        const ref1Endereco = texto.match(/1º REREFENCIA[\s\S]*?Rua:\s*([^\n]+)/i);
        const ref1Numero = texto.match(/1º REREFENCIA[\s\S]*?Numero:\s*([^\n]+)/i);
        const ref1Bairro = texto.match(/1º REREFENCIA[\s\S]*?Bairro:\s*([^\n]+)/i);
        
        if (ref1Nome && ref1Nome[1].trim()) dados.ref1Nome = ref1Nome[1].trim();
        if (ref1Telefone && ref1Telefone[1].trim()) dados.ref1Telefone = ref1Telefone[1].trim();
        if (ref1Endereco && ref1Endereco[1].trim()) dados.ref1Endereco = ref1Endereco[1].trim();
        if (ref1Numero && ref1Numero[1].trim()) dados.ref1Numero = ref1Numero[1].trim();
        if (ref1Bairro && ref1Bairro[1].trim()) dados.ref1Bairro = ref1Bairro[1].trim();
        
        const ref2Nome = texto.match(/2º REFERENCIA[\s\S]*?Nome:\s*([^\n]+)/i);
        const ref2Telefone = texto.match(/2º REFERENCIA[\s\S]*?Telefone:\s*([^\n]+)/i);
        const ref2Endereco = texto.match(/2º REFERENCIA[\s\S]*?Rua:\s*([^\n]+)/i);
        const ref2Numero = texto.match(/2º REFERENCIA[\s\S]*?Numero:\s*([^\n]+)/i);
        const ref2Bairro = texto.match(/2º REFERENCIA[\s\S]*?Bairro:\s*([^\n]+)/i);
        
        if (ref2Nome && ref2Nome[1].trim()) dados.ref2Nome = ref2Nome[1].trim();
        if (ref2Telefone && ref2Telefone[1].trim()) dados.ref2Telefone = ref2Telefone[1].trim();
        if (ref2Endereco && ref2Endereco[1].trim()) dados.ref2Endereco = ref2Endereco[1].trim();
        if (ref2Numero && ref2Numero[1].trim()) dados.ref2Numero = ref2Numero[1].trim();
        if (ref2Bairro && ref2Bairro[1].trim()) dados.ref2Bairro = ref2Bairro[1].trim();
        
        // Mapear telefone diretamente
        const telefoneFormulario = texto.match(/Telefone:\s*([^\n]+)/i);
        if (telefoneFormulario && telefoneFormulario[1].trim()) {
            dados.telefone = telefoneFormulario[1].trim();
        }
        
        return dados;
    }

    // Função para extrair dados de PDF de simulação
    async extrairDadosPDF(arquivo) {
        try {
            console.log('Iniciando extração do PDF...');
            
            // Verificar se a biblioteca PDF.js está disponível
            if (typeof pdfjsLib === 'undefined') {
                console.error('pdfjsLib não está definido');
                throw new Error('Biblioteca PDF.js não carregada. Recarregue a página.');
            }
            
            console.log('PDF.js disponível, lendo arquivo...');
            
            const arrayBuffer = await arquivo.arrayBuffer();
            console.log('ArrayBuffer criado, tamanho:', arrayBuffer.byteLength);
            
            const loadingTask = pdfjsLib.getDocument({
                data: arrayBuffer,
                verbosity: 0 // Reduzir logs da biblioteca
            });
            
            const pdf = await loadingTask.promise;
            console.log(`PDF carregado com ${pdf.numPages} páginas`);
            
            let textoCompleto = '';
            
            // Extrair texto de todas as páginas
            for (let i = 1; i <= pdf.numPages; i++) {
                console.log(`Processando página ${i}...`);
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                const pageText = textContent.items.map(item => item.str).join(' ');
                textoCompleto += pageText + '\n';
                console.log(`Página ${i} - texto extraído (${pageText.length} caracteres)`);
            }
            
            console.log('Texto completo extraído:', textoCompleto.substring(0, 500) + '...');
            
            // Extrair dados usando regex específicos
            const dadosExtraidos = this.extrairDadosTexto(textoCompleto);
            console.log('Dados extraídos do texto:', dadosExtraidos);
            
            return dadosExtraidos;
            
        } catch (error) {
            console.error('Erro detalhado na extração PDF:', error);
            throw new Error('Erro ao extrair dados do PDF: ' + error.message);
        }
    }
    
    extrairDadosTexto(texto) {
        console.log('Extraindo dados do texto para JSON...');
        
        const dadosJson = {
            simulacao: {},
            cliente: {}
        };
        
        // Extrair dados básicos de simulação do PDF gerado - ordem corrigida
        const secaoDadosSimulacao = texto.match(/DADOS DA SIMULAÇÃO([\s\S]*?)(?=TABELA DE PARCELAS|$)/i);
        
        if (secaoDadosSimulacao) {
            const dadosSimulacao = secaoDadosSimulacao[1];
            console.log('Seção DADOS DA SIMULAÇÃO encontrada:', dadosSimulacao);
            
            const valorMatch = dadosSimulacao.match(/Valor do empréstimo:\s*R\$\s*([\d.,]+)/i);
            if (valorMatch) {
                dadosJson.simulacao.valor = valorMatch[1];
                console.log('Valor extraído:', valorMatch[1]);
            }
            
            const parcelasMatch = dadosSimulacao.match(/Número de parcelas:\s*(\d+)/i);
            if (parcelasMatch) {
                dadosJson.simulacao.parcelas = parcelasMatch[1];
                console.log('Parcelas extraídas:', parcelasMatch[1]);
            }
            
            const sistemaMatch = dadosSimulacao.match(/Sistema de juros:\s*([^\n\r]+)/i);
            if (sistemaMatch) {
                dadosJson.simulacao.sistemaJuros = sistemaMatch[1].trim();
                console.log('Sistema de juros extraído:', sistemaMatch[1]);
            }
            
            const taxaMatch = dadosSimulacao.match(/Taxa de juros:\s*([\d,]+)%/i);
            if (taxaMatch) {
                dadosJson.simulacao.juros = taxaMatch[1];
                console.log('Taxa extraída:', taxaMatch[1]);
            }
        }
        
        // Extrair datas para calcular dias extras - melhorado
        const dataSimulacaoMatch = texto.match(/Data da simulação:\s*([\d\/]+)/i);
        
        // Buscar primeiro vencimento na tabela - formato "01            DD/MM/AAAA"
        const tabelaMatch = texto.match(/TABELA DE PARCELAS([\s\S]*?)$/i);
        let primeiroVencimentoMatch = null;
        
        if (tabelaMatch) {
            const tabelaTexto = tabelaMatch[1];
            primeiroVencimentoMatch = tabelaTexto.match(/01\s+(\d{2}\/\d{2}\/\d{4})/);
        }
        
        if (dataSimulacaoMatch && primeiroVencimentoMatch) {
            const dataSimulacao = dataSimulacaoMatch[1];
            const primeiroVencimento = primeiroVencimentoMatch[1];
            
            dados.dataEmprestimo = dataSimulacao;
            dados.dataPrimeiraParcela = primeiroVencimento;
            
            // Calcular dias extras usando lógica correta
            const [diaS, mesS, anoS] = dataSimulacao.split('/').map(Number);
            const [diaV, mesV, anoV] = primeiroVencimento.split('/').map(Number);
            
            const dataSimulacaoObj = new Date(anoS, mesS - 1, diaS);
            const proximoMes = new Date(anoS, mesS, diaS); // Mesmo dia, próximo mês
            const primeiroVencimentoObj = new Date(anoV, mesV - 1, diaV);
            
            const diasExtras = Math.round((primeiroVencimentoObj - proximoMes) / (1000 * 60 * 60 * 24));
            
            if (diasExtras > 0) {
                dados.diasExtras = diasExtras;
            }
        }
        
        // Extrair dados cadastrais específicos do PDF - usando estrutura de seções
        const secaoDadosPessoais = texto.match(/DADOS PESSOAIS:([\s\S]*?)(?=DADOS PROFISSIONAIS:|1ª REFERÊNCIA:|$)/i);
        const secaoDadosProfissionais = texto.match(/DADOS PROFISSIONAIS:([\s\S]*?)(?=1ª REFERÊNCIA:|$)/i);
        const secaoRef1 = texto.match(/1ª REFERÊNCIA:([\s\S]*?)(?=2ª REFERÊNCIA:|$)/i);
        const secaoRef2 = texto.match(/2ª REFERÊNCIA:([\s\S]*?)(?=$)/i);
        
        console.log('Seções encontradas:');
        console.log('- DADOS PESSOAIS:', !!secaoDadosPessoais);
        console.log('- DADOS PROFISSIONAIS:', !!secaoDadosProfissionais);
        console.log('- 1ª REFERÊNCIA:', !!secaoRef1);
        console.log('- 2ª REFERÊNCIA:', !!secaoRef2);
        
        if (secaoDadosPessoais) {
            const dadosPessoais = secaoDadosPessoais[1];
            console.log('Texto da seção DADOS PESSOAIS:', dadosPessoais);
            
            // Nome - regex mais específico
            const nomeMatch = dadosPessoais.match(/Nome:\s*([^\n\r]+?)(?:\s*CPF:|$)/i);
            if (nomeMatch) {
                dadosJson.cliente.nome = nomeMatch[1].trim();
                console.log('Nome extraído:', dadosJson.cliente.nome);
            }
            
            // CPF - regex mais específico
            const cpfMatch = dadosPessoais.match(/CPF:\s*([\d\.\-]+)(?:\s|$)/i);
            if (cpfMatch) {
                dadosJson.cliente.cpf = cpfMatch[1].trim();
                console.log('CPF extraído:', dadosJson.cliente.cpf);
            }
            
            // Data de nascimento
            const nascimentoMatch = dadosPessoais.match(/Data de Nascimento:\s*([\d\/]+)/i);
            if (nascimentoMatch) {
                dadosJson.dataNascimento = nascimentoMatch[1].trim();
                console.log('Data nascimento extraída:', dadosJson.dataNascimento);
            }
            
            // Estado civil
            const estadoCivilMatch = dadosPessoais.match(/Estado Civil:\s*([^\n\r]+?)(?:\s*Endereço:|$)/i);
            if (estadoCivilMatch) {
                dadosJson.estadoCivil = estadoCivilMatch[1].trim();
                console.log('Estado civil extraído:', dadosJson.estadoCivil);
            }
            
            // Endereço
            const enderecoMatch = dadosPessoais.match(/Endereço:\s*([^\n\r]+?)(?:\s*Bairro:|$)/i);
            if (enderecoMatch) {
                dadosJson.endereco = enderecoMatch[1].trim();
                console.log('Endereço extraído:', dadosJson.endereco);
            }
            
            // Bairro
            const bairroMatch = dadosPessoais.match(/Bairro:\s*([^\n\r]+?)(?:\s*Cidade:|$)/i);
            if (bairroMatch) {
                dadosJson.bairro = bairroMatch[1].trim();
                console.log('Bairro extraído:', dadosJson.bairro);
            }
            
            // Cidade
            const cidadeMatch = dadosPessoais.match(/Cidade:\s*([^\n\r]+?)(?:\s*CEP:|$)/i);
            if (cidadeMatch) {
                dadosJson.cidade = cidadeMatch[1].trim();
                console.log('Cidade extraída:', dadosJson.cidade);
            }
            
            // CEP
            const cepMatch = dadosPessoais.match(/CEP:\s*([\d\-]+)/i);
            if (cepMatch) {
                dadosJson.cep = cepMatch[1].trim();
                console.log('CEP extraído:', dadosJson.cep);
            }
            
            // Telefone
            const telefoneMatch = dadosPessoais.match(/Telefone:\s*([^\n\r]+?)(?:\s*E-mail:|$)/i);
            if (telefoneMatch) {
                dadosJson.telefone = telefoneMatch[1].trim();
                console.log('Telefone extraído:', dadosJson.telefone);
            }
            
            // E-mail
            const emailMatch = dadosPessoais.match(/E-mail:\s*([^\n\r]+)/i);
            if (emailMatch) {
                dadosJson.email = emailMatch[1].trim();
                console.log('E-mail extraído:', dadosJson.email);
            }
        }
        
        if (secaoDadosProfissionais) {
            const dadosProfissionais = secaoDadosProfissionais[1];
            
            const profissaoMatch = dadosProfissionais.match(/Profissão:\s*([^\n\r]+)/i);
            if (profissaoMatch) dados.profissao = profissaoMatch[1].trim();
            
            const localTrabalhoMatch = dadosProfissionais.match(/Local de Trabalho:\s*([^\n\r]+)/i);
            if (localTrabalhoMatch) dados.localTrabalho = localTrabalhoMatch[1].trim();
            
            const rendaMatch = dadosProfissionais.match(/Renda Mensal:\s*([^\n\r]+)/i);
            if (rendaMatch) {
                let rendaTexto = rendaMatch[1].trim();
                // Remover R$ e espaços, manter apenas números e vírgulas/pontos
                rendaTexto = rendaTexto.replace(/R\$/g, '').replace(/\s/g, '');
                // Se tem vírgula como separador decimal, trocar por ponto
                if (rendaTexto.includes(',') && !rendaTexto.includes('.')) {
                    rendaTexto = rendaTexto.replace(',', '.');
                } else if (rendaTexto.includes('.') && rendaTexto.includes(',')) {
                    // Formato brasileiro: 1.234,56 -> 1234.56
                    rendaTexto = rendaTexto.replace(/\./g, '').replace(',', '.');
                }
                dados.renda = rendaTexto;
            }
            
            const tempoEmpregoMatch = dadosProfissionais.match(/Tempo de Emprego:\s*([^\n\r]+)/i);
            if (tempoEmpregoMatch) dados.tempoEmprego = tempoEmpregoMatch[1].trim();
        }
        
        if (secaoRef1) {
            const ref1Texto = secaoRef1[1];
            
            const ref1NomeMatch = ref1Texto.match(/Nome:\s*([^\n\r]+)/i);
            if (ref1NomeMatch) dados.ref1Nome = ref1NomeMatch[1].trim();
            
            const ref1TelefoneMatch = ref1Texto.match(/Telefone:\s*([^\n\r]+)/i);
            if (ref1TelefoneMatch) dados.ref1Telefone = ref1TelefoneMatch[1].trim();
            
            const ref1EnderecoMatch = ref1Texto.match(/Endereço:\s*([^\n\r]+)/i);
            if (ref1EnderecoMatch) dados.ref1Endereco = ref1EnderecoMatch[1].trim();
            
            const ref1BairroMatch = ref1Texto.match(/Bairro:\s*([^\n\r]+)/i);
            if (ref1BairroMatch) dados.ref1Bairro = ref1BairroMatch[1].trim();
        }
        
        if (secaoRef2) {
            const ref2Texto = secaoRef2[1];
            
            const ref2NomeMatch = ref2Texto.match(/Nome:\s*([^\n\r]+)/i);
            if (ref2NomeMatch) dados.ref2Nome = ref2NomeMatch[1].trim();
            
            const ref2TelefoneMatch = ref2Texto.match(/Telefone:\s*([^\n\r]+)/i);
            if (ref2TelefoneMatch) dados.ref2Telefone = ref2TelefoneMatch[1].trim();
            
            const ref2EnderecoMatch = ref2Texto.match(/Endereço:\s*([^\n\r]+)/i);
            if (ref2EnderecoMatch) dados.ref2Endereco = ref2EnderecoMatch[1].trim();
            
            const ref2BairroMatch = ref2Texto.match(/Bairro:\s*([^\n\r]+)/i);
            if (ref2BairroMatch) dados.ref2Bairro = ref2BairroMatch[1].trim();
        }
        
        console.log('Dados extraídos do texto (estrutura antiga):', dados);
        
        // Converter para estrutura JSON nova
        const jsonFinal = {
            simulacao: {
                valor: dados.valor,
                parcelas: dados.nParcelas,
                juros: dados.juros,
                dataVencimentoInicial: dados.dataEmprestimo
            },
            cliente: {
                nome: dados.nomeCliente,
                cpf: dados.cpfCliente,
                dataNascimento: dados.dataNascimento,
                estadoCivil: dados.estadoCivil,
                endereco: dados.endereco,
                numero: dados.numero,
                complemento: dados.complemento,
                bairro: dados.bairro,
                cidade: dados.cidade,
                estado: dados.estado,
                cep: dados.cep,
                telefone: dados.telefone,
                email: dados.email,
                localTrabalho: dados.localTrabalho,
                profissao: dados.profissao,
                rendaMensal: dados.rendaMensal,
                tempoEmprego: dados.tempoEmprego,
                ref1Nome: dados.ref1Nome,
                ref1Telefone: dados.ref1Telefone,
                ref1Endereco: dados.ref1Endereco,
                ref1Bairro: dados.ref1Bairro,
                ref2Nome: dados.ref2Nome,
                ref2Telefone: dados.ref2Telefone,
                ref2Endereco: dados.ref2Endereco,
                ref2Bairro: dados.ref2Bairro
            }
        };
        
        console.log('JSON final extraído do PDF:', jsonFinal);
        return jsonFinal;
    }



            
            if (dados.ref2Endereco) {
                const ref2EnderecoInput = document.getElementById('ref2Endereco');
                if (ref2EnderecoInput) ref2EnderecoInput.value = dados.ref2Endereco;
            }
            
            if (dados.ref2Bairro) {
                const ref2BairroInput = document.getElementById('ref2Bairro');
                if (ref2BairroInput) ref2BairroInput.value = dados.ref2Bairro;
            }
            
            // Debug: mostrar dados extraídos
            console.log('Dados extraídos do PDF:', dados);
            console.log('Seção dados pessoais encontrada:', !!secaoDadosPessoais);
            if (secaoDadosPessoais) {
                console.log('Texto da seção dados pessoais:', secaoDadosPessoais[1]);
            }
            
            // Se há dados cadastrais, expandir automaticamente o formulário
            if (dados.nomeCliente || dados.cpfCliente || dados.dataNascimento) {
                const formToggleBtn = document.getElementById('formToggleBtn');
                const formCompleto = document.getElementById('formCompleto');
                if (formToggleBtn && formCompleto && formCompleto.style.display === 'none') {
                    this.toggleFormularioCompleto();
                }
            }
            
            let mensagem = 'Dados importados com sucesso do PDF!';
            if (dados.diasExtras > 0) {
                mensagem += ` (${dados.diasExtras} dias extras detectados)`;
            }
            this.showNotification(mensagem, 'success');
            
        } catch (error) {
            console.error('Erro na importação PDF:', error);
            this.showNotification('Erro ao importar dados do PDF.', 'error');
        }
    }

    // Função para aplicar modo livre completo após inicialização
    aplicarModoLivreCompleto() {
        if (this.configuracoes.isAdmin && this.configuracoes.desabilitarRegras) {
            this.limparErrosVisuais();
        }
    }
}

// Inicialização robusta com timeout para compatibilidade Replit preview
let simulator;

function initializeApp() {
    try {
        window.simulator = new SimuladorEmprestimos();
        simulator = window.simulator; // Para compatibilidade
        return true;
    } catch (error) {
        // Log do erro para depuração
        if (error.message.includes('Campo taxa de juros não encontrado')) {
            // DOM ainda não está pronto, aguardar um pouco mais
            if (document.readyState !== 'complete') {
                return false;
            }
        }
        throw error;
    }
}

function tryInitialize() {
    try {
        const success = initializeApp();
        if (!success && document.readyState !== 'complete') {
            // Aguardar DOM completar se ainda não está pronto
            window.addEventListener('load', tryInitialize, { once: true });
        }
    } catch (error) {
        // Tentar novamente após timeout se necessário
        setTimeout(tryInitialize, 500);
    }
}

// Estratégia de inicialização simples e eficiente
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', tryInitialize);
} else {
    // DOM já carregado, tentar imediatamente
    tryInitialize();
}





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

// Função para alternar seções expansíveis
function toggleSection(sectionId) {
    const section = document.getElementById(sectionId);
    const toggle = document.getElementById(sectionId.replace('Section', 'Toggle'));
    
    if (section && toggle) {
        if (section.style.display === 'none') {
            section.style.display = 'block';
            toggle.textContent = '▼';
        } else {
            section.style.display = 'none';
            toggle.textContent = '▶';
        }
    }
}