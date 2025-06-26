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
        // SEGURANÇA: Forçar reset do estado administrativo na inicialização (sessão apenas)
        this.salvarEstadoSessao();
        
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
            limitesPersonalizados: {
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
            },
            themeMode: 'light',
            mostrarJurosRelatorio: false,
            desabilitarRegras: false,
            colorTheme: 'default',
            sistemaJuros: 'compostos-mensal',
            adminUser: 'Migueis',
            adminPassword: 'Laila@1004',
            ajusteMes31Dias: false,
            diasExtrasFixos: 0,
            exibirDetalhesModeLivre: true
        };
        
        const loadedConfig = config ? { ...defaultConfig, ...JSON.parse(config) } : defaultConfig;
        
        // CORREÇÃO: Remover lógica de "consistência" que sobrescrevia configurações válidas
        // Configurações administrativas podem existir independente do estado de autenticação
        this.configuracoes = loadedConfig;
        
        // Aplicar configurações visuais imediatamente
        this.aplicarTema(loadedConfig.themeMode);
        this.aplicarPaletaCores(loadedConfig.colorTheme);
        
        // REFATORAÇÃO: Aplicar estado da UI imediatamente após carregamento
        this.aplicarEstadoUI();
        
        return loadedConfig;
    }
    
    aplicarEstadoUI() {
        // CORREÇÃO: Verificar se elementos foram inicializados antes de aplicar estado
        if (!this.numeroParcelasField || !this.taxaJurosField) {
            // Aguardar inicialização completa dos elementos
            setTimeout(() => this.aplicarEstadoUI(), 100);
            return;
        }
        
        // Centralizar aplicação de estado visual baseado nas configurações carregadas
        
        // 1. Atualizar selects de configuração administrativa (se existirem)
        const sistemaJurosSelect = document.getElementById('sistemaJuros');
        if (sistemaJurosSelect) {
            sistemaJurosSelect.value = this.configuracoes.sistemaJuros;
        }
        
        const desabilitarRegrasSelect = document.getElementById('desabilitarRegras');
        if (desabilitarRegrasSelect) {
            desabilitarRegrasSelect.value = this.configuracoes.desabilitarRegras ? 'true' : 'false';
        }
        
        // 2. Aplicar classes visuais baseadas no modo livre
        this.atualizarClassesModoLivre();
        
        // 3. Atualizar placeholder baseado nas regras
        this.atualizarPlaceholderParcelas();
        
        // 4. Aplicar validações visuais se necessário
        this.aplicarValidacaoConfiguracoes();
        
        // 5. CORREÇÃO: Garantir que funções de UI sejam executadas após carregamento
        setTimeout(() => {
            this.atualizarClassesModoLivre();
            this.atualizarPlaceholderParcelas();
        }, 50);
        
        console.log('Debug - Estado UI aplicado baseado em configurações:', {
            desabilitarRegras: this.configuracoes.desabilitarRegras,
            isAdmin: this.configuracoes.isAdmin,
            sistemaJuros: this.configuracoes.sistemaJuros
        });
    }

    salvarConfiguracoes() {
        localStorage.setItem('simulador_config', JSON.stringify(this.configuracoes));
    }
    
    salvarApenasConfiguracoes() {
        // Salvar todas as configurações EXCETO estado de autenticação
        const configParaSalvar = {
            ...this.configuracoes,
            isAdmin: false // Sempre salvar como não-logado para segurança
        };
        localStorage.setItem('simulador_config', JSON.stringify(configParaSalvar));
        console.log('Debug - Configurações salvas (sem estado de autenticação)');
    }
    
    salvarEstadoSessao() {
        // Salvar apenas controle de estado de sessão (não persiste entre reloads)
        // Esta função reseta apenas o estado na memória, não no localStorage
        this.configuracoes.isAdmin = false;
        console.log('Debug - Estado de sessão resetado (memória apenas)');
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
        this.configBtn = document.getElementById('configBtn');
        
        // Elementos do sistema de importação
        this.importDataBtn = document.getElementById('importDataBtn');
        this.importModal = document.getElementById('importModal');
        this.closeImportModal = document.getElementById('closeImportModal');
        this.tabPdf = document.getElementById('tabPdf');
        this.tabFormulario = document.getElementById('tabFormulario');
        this.contentPdf = document.getElementById('contentPdf');
        this.contentFormulario = document.getElementById('contentFormulario');
        this.pdfTextArea = document.getElementById('pdfTextArea');
        this.formularioTextArea = document.getElementById('formularioTextArea');
        this.previewBtn = document.getElementById('previewBtn');
        this.importBtn = document.getElementById('importBtn');
        this.dataPreview = document.getElementById('dataPreview');
        this.previewContent = document.getElementById('previewContent');
        
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
                // Validar campo apenas se elementos estão prontos
                if (this.numeroParcelasField && this.configuracoes) {
                    this.validarCampoJuros();
                }
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
                // Re-validar juros apenas se não estiver em modo livre (com verificação de segurança)
                if (this.taxaJurosField && this.numeroParcelasField && this.configuracoes && 
                    !(this.configuracoes.desabilitarRegras && this.configuracoes.isAdmin)) {
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
        
        // Event listeners para sistema de importação
        this.setupImportEventListeners();
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
        // Separar diferentes tipos de dias extras
        let diasExtrasData = 0; // Apenas diferença de datas
        let diasCompensacao = this.configuracoes.diasExtrasFixos || 0; // Dias fixos configurados
        let diasMeses31 = 0; // Ajuste automático para meses 31 dias
        
        if (dataInicial) {
            // Data normal da primeira parcela seria 30 dias após o empréstimo
            const dataNormalPrimeiraParcela = new Date(dataSimulacao);
            dataNormalPrimeiraParcela.setDate(dataNormalPrimeiraParcela.getDate() + 30);
            
            // Calcular diferença usando apenas componentes de data (sem horário)
            diasExtrasData = this.calcularDiferencaDias(dataInicial, dataNormalPrimeiraParcela);
        }
        
        // Aplicar ajuste automático para meses de 31 dias
        if (this.configuracoes.ajusteMes31Dias) {
            diasMeses31 = this.calcularAjusteMes31Dias(nParcelas);
        }
        
        // Total de dias extras para cálculo (soma todos os tipos)
        const diasExtra = diasExtrasData + diasCompensacao + diasMeses31;

        // IGPM mensal (anual dividido por 12)
        const igpmMensal = this.configuracoes.igpmAnual / 12;

        // Obter método de cálculo dos dias extras
        const metodo = this.obterMetodoDiasExtras();

        // Calcular prestação usando o sistema de juros configurado
        const sistemaJuros = this.configuracoes.sistemaJuros || 'compostos-mensal';
        const resultadoCalculo = this.calcularParcela(valor, juros, nParcelas, diasExtra, igpmMensal, metodo, sistemaJuros);

        // Adicionar informações separadas dos dias ao resultado
        resultadoCalculo.diasExtrasData = diasExtrasData;
        resultadoCalculo.diasCompensacao = diasCompensacao;
        resultadoCalculo.diasMeses31 = diasMeses31;
        
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

    atualizarPlaceholderParcelas() {
        if (!this.numeroParcelasField) return;
        
        // Atualizar placeholder baseado no estado das regras
        console.log('Debug - Estado atual das configurações:', {
            desabilitarRegras: this.configuracoes.desabilitarRegras,
            isAdmin: this.configuracoes.isAdmin,
            modoLivre: this.configuracoes.desabilitarRegras && this.configuracoes.isAdmin
        });
        
        if (this.configuracoes.desabilitarRegras && this.configuracoes.isAdmin) {
            this.numeroParcelasField.placeholder = 'Quantidade de parcelas';
            console.log('Debug - Placeholder MODO LIVRE aplicado');
        } else {
            this.numeroParcelasField.placeholder = 'Permitido: 1 a 15 parcelas';
            console.log('Debug - Placeholder REGRAS aplicado');
        }
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
        
        // Verificar se regras estão desabilitadas (independente de login)
        if (this.configuracoes.desabilitarRegras) {
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
                mensagem: "SIMULAÇÃO NEGADA. NÚMERO DE PARCELAS INFERIOR AO MÍNIMO PERMITIDO."
            };
        }

        if (nParcelas > 15) {
            return {
                sucesso: false,
                mensagem: "SIMULAÇÃO NEGADA. VOCÊ NÃO TEM PERMISSÃO PARA SIMULAÇÕES ACIMA DE 15 PARCELAS. PARA SIMULAÇÕES SUPERIORES A 15 PARCELAS, CONSULTE MIGUEIS."
            };
        }

        // Obter limites (usar personalizados se admin configurou)
        const limites = this.configuracoes.limitesPersonalizados?.[nParcelas] || this.limitesJuros[nParcelas];
        
        if (juros < limites.min) {
            const mensagem = nParcelas === 1 ? 
                `SIMULAÇÃO NEGADA. CÁLCULO DE 1 PARCELA, A PORCENTAGEM MÍNIMA PERMITIDA É DE ${limites.min.toFixed(2).replace('.', ',')} %. PARA EMPRÉSTIMOS COM JUROS FORA DOS LIMITES ESPECIFICADOS, CONSULTE MIGUEIS.` :
                `SIMULAÇÃO NEGADA. CÁLCULOS DE ${nParcelas} PARCELAS, A PORCENTAGEM MÍNIMA PERMITIDA É DE ${limites.min.toFixed(2).replace('.', ',')} %. PARA EMPRÉSTIMOS COM JUROS FORA DOS LIMITES ESPECIFICADOS, CONSULTE MIGUEIS.`;
            
            return { sucesso: false, mensagem };
        }

        if (juros > limites.max) {
            const mensagem = nParcelas === 1 ? 
                `SIMULAÇÃO NEGADA. CÁLCULO DE 1 PARCELA, A PORCENTAGEM MÁXIMA PERMITIDA É DE ${limites.max.toFixed(2).replace('.', ',')} %. PARA EMPRÉSTIMOS COM JUROS FORA DOS LIMITES ESPECIFICADOS, CONSULTE MIGUEIS.` :
                `SIMULAÇÃO NEGADA. CÁLCULOS DE ${nParcelas} PARCELAS, A PORCENTAGEM MÁXIMA PERMITIDA É DE ${limites.max.toFixed(2).replace('.', ',')} %. PARA EMPRÉSTIMOS COM JUROS FORA DOS LIMITES ESPECIFICADOS, CONSULTE MIGUEIS.`;
            
            return { sucesso: false, mensagem };
        }

        return { sucesso: true };
    }

    mostrarResultado(resultadoCalculo, valorEmprestimo, nParcelas, juros) {
        // Obter variáveis separadas dos dias
        const diasExtrasData = resultadoCalculo.diasExtrasData || 0;
        const diasCompensacao = resultadoCalculo.diasCompensacao || 0;
        const diasMeses31 = resultadoCalculo.diasMeses31 || 0;
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

        // Verificar se há diferença entre primeira parcela e demais
        if (resultadoCalculo.diasExtra > 0) {
            const metodo = this.obterMetodoDiasExtras();
            // Removidas variáveis agrupadas - usando formatação separada
            
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
                        ${this.formatarInfoDiasExtras(diasExtrasData, diasCompensacao, diasMeses31, resultadoCalculo)}
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
                            ${this.formatarInfoDiasExtras(diasExtrasData, diasCompensacao, diasMeses31, resultadoCalculo)}
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
                            ${this.formatarInfoDiasExtras(diasExtrasData, diasCompensacao, diasMeses31, resultadoCalculo)}
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

        // Exibir detalhes no modo livre se habilitado
        if (this.configuracoes.desabilitarRegras && this.configuracoes.exibirDetalhesModeLivre) {
            this.exibirDetalhesModeLivre(valorEmprestimo, nParcelas, juros, resultadoCalculo);
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
        // CORREÇÃO: Verificar apenas desabilitarRegras (independente de login admin)
        const modoLivreAtivo = this.configuracoes.desabilitarRegras;
        
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
        
        // Re-validar campo de juros após mudança de modo (com verificação de segurança)
        if (this.taxaJurosField && this.numeroParcelasField && this.configuracoes) {
            this.validarCampoJuros();
        }
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
        // CORREÇÃO: Verificação de segurança para evitar erros de DOM
        if (!this.taxaJurosField || !this.numeroParcelasField || !this.configuracoes) return;
        
        this.limparErrosVisuais();
        
        // CORREÇÃO: Verificar apenas desabilitarRegras (independente de login admin)
        if (this.configuracoes.desabilitarRegras || !this.taxaJurosField.value || !this.numeroParcelasField.value) {
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
        
        // Configurar botão salvar dinâmico
        this.configurarBotaoSalvarDinamico();
        
        console.log('Debug - Configurações abertas, painel admin oculto, login obrigatório');
    }

    configurarBotaoSalvarDinamico() {
        const saveBtn = document.getElementById('saveConfigBtn');
        if (!saveBtn) return;
        
        // Ocultar botão inicialmente
        saveBtn.style.display = 'none';
        
        // Selecionar todos os campos do modal, excluindo campos de login administrativo
        const campos = document.querySelectorAll('#configModal input, #configModal select');
        const camposExcluidos = ['adminUser', 'adminPass', 'newAdminUser', 'newAdminPass']; // IDs dos campos de login admin
        
        // Filtrar campos para excluir usuário e senha administrativos
        const camposMonitorados = Array.from(campos).filter(campo => 
            !camposExcluidos.includes(campo.id)
        );
        
        // Função para mostrar o botão quando algo for alterado
        const mostrarBotaoSalvar = () => {
            saveBtn.style.display = 'block';
        };
        
        // Remover event listeners anteriores para evitar duplicação
        camposMonitorados.forEach(campo => {
            campo.removeEventListener('input', mostrarBotaoSalvar);
            campo.removeEventListener('change', mostrarBotaoSalvar);
        });
        
        // Adicionar event listeners para detectar mudanças apenas nos campos monitorados
        camposMonitorados.forEach(campo => {
            campo.addEventListener('input', mostrarBotaoSalvar);
            campo.addEventListener('change', mostrarBotaoSalvar);
        });
        
        // Event listener especial para campos de limite de juros que são criados dinamicamente
        const limitsTable = document.getElementById('limitsTable');
        if (limitsTable) {
            limitsTable.addEventListener('input', mostrarBotaoSalvar);
            limitsTable.addEventListener('change', mostrarBotaoSalvar);
        }
    }

    fecharModal() {
        const modal = document.getElementById('configModal');
        if (modal) {
            modal.style.display = 'none';
        }
        
        // REFATORAÇÃO: Usar nova função que reseta apenas estado de sessão
        // NÃO persiste o reset no localStorage (preserva configurações salvas)
        this.salvarEstadoSessao();
        
        // Ocultar painel administrativo
        const adminPanel = document.getElementById('adminPanel');
        if (adminPanel) {
            adminPanel.style.display = 'none';
        }
        
        // Mostrar seção de login novamente
        const loginSection = document.getElementById('adminLoginSection');
        if (loginSection) {
            loginSection.style.display = 'block';
        }
        
        // Limpar campos de login
        const adminUserField = document.getElementById('adminUser');
        const adminPassField = document.getElementById('adminPass');
        
        if (adminUserField) adminUserField.value = '';
        if (adminPassField) adminPassField.value = '';
        
        // Aplicar estado da UI baseado no novo estado de sessão
        this.aplicarEstadoUI();
        
        console.log('Debug - Modal fechado, estado de sessão resetado (configurações preservadas)');
    }



    atualizarPlaceholderParcelas() {
        if (!this.numeroParcelasField) return;
        
        // CORREÇÃO: Verificar apenas desabilitarRegras (independente de login admin)
        if (this.configuracoes.desabilitarRegras) {
            this.numeroParcelasField.placeholder = "Quantidade de parcelas";
        } else {
            this.numeroParcelasField.placeholder = "Permitido: 1 a 15 parcelas";
        }
        
        console.log('Debug - Placeholder atualizado:', {
            modoLivre: this.configuracoes.desabilitarRegras,
            placeholder: this.numeroParcelasField.placeholder,
            isAdmin: this.configuracoes.isAdmin,
            desabilitarRegras: this.configuracoes.desabilitarRegras
        });
    }

    salvarConfiguracoesModal() {
        // Salvar configurações gerais
        this.configuracoes.nomeUsuario = document.getElementById('nomeUsuario').value;
        this.configuracoes.themeMode = document.getElementById('themeMode').value;
        this.configuracoes.colorTheme = document.getElementById('colorTheme').value;
        this.configuracoes.mostrarJurosRelatorio = document.getElementById('mostrarJurosRelatorio').value === 'true';
        
        // Salvar configurações administrativas se logado
        if (this.configuracoes.isAdmin) {
            // Configurações financeiras
            this.configuracoes.igpmAnual = parseFloat(document.getElementById('igpmAnual').value.replace(',', '.')) || 0;
            this.configuracoes.desabilitarRegras = document.getElementById('desabilitarRegras').value === 'true';
            this.configuracoes.sistemaJuros = document.getElementById('sistemaJuros').value;
            
            // Verificar se elementos existem antes de acessar
            const exibirDetalhesElement = document.getElementById('exibirDetalhesModeLivre');
            if (exibirDetalhesElement) {
                this.configuracoes.exibirDetalhesModeLivre = exibirDetalhesElement.value === 'true';
            }
            
            const ajusteMes31Element = document.getElementById('ajusteMes31Dias');
            if (ajusteMes31Element) {
                this.configuracoes.ajusteMes31Dias = ajusteMes31Element.value === 'true';
            }
            
            const diasExtrasFixosElement = document.getElementById('diasExtrasFixos');
            if (diasExtrasFixosElement) {
                this.configuracoes.diasExtrasFixos = parseInt(diasExtrasFixosElement.value) || 0;
            }
            
            // Salvar tabela de limites personalizada (IDs CORRIGIDOS)
            for (let parcelas = 1; parcelas <= 15; parcelas++) {
                const minInput = document.getElementById(`min_${parcelas}`);
                const maxInput = document.getElementById(`max_${parcelas}`);
                
                if (minInput && maxInput) {
                    const minVal = parseFloat(minInput.value.replace(',', '.')) || this.limitesJuros[parcelas].min;
                    const maxVal = parseFloat(maxInput.value.replace(',', '.')) || this.limitesJuros[parcelas].max;
                    
                    this.configuracoes.limitesPersonalizados[parcelas] = {
                        min: minVal,
                        max: maxVal
                    };
                    console.log(`Debug - Limite ${parcelas}p salvo: ${minVal}% - ${maxVal}%`);
                }
            }
            
            // Salvar credenciais administrativas (campos corretos)
            const novoUsuario = document.getElementById('newAdminUser').value;
            const novaSenha = document.getElementById('newAdminPass').value;
            
            if (novoUsuario && novaSenha) {
                this.configuracoes.adminUser = novoUsuario;
                this.configuracoes.adminPassword = novaSenha;
                console.log('Debug - Credenciais administrativas atualizadas');
            }
        }
        
        // Aplicar temas
        this.aplicarTema(this.configuracoes.themeMode);
        this.aplicarPaletaCores(this.configuracoes.colorTheme);
        
        // REFATORAÇÃO: Usar nova função que não afeta estado de autenticação
        this.salvarApenasConfiguracoes();
        
        // Aplicar estado da UI
        this.aplicarEstadoUI();
        
        // Notificar sucesso e fechar modal automaticamente
        alert('Todas as configurações foram salvas com sucesso!');
        this.fecharModal();
        
        // REQUISITO: Atualizar a página principal após fechar modal
        setTimeout(() => {
            location.reload();
        }, 500);
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

    carregarCamposAdmin() {
        // REFATORAÇÃO: Função dedicada para carregamento de todos os campos administrativos
        console.log('Debug - Carregando campos administrativos com configurações atuais');
        
        // 1. Carregar configurações financeiras
        const selectRegras = document.getElementById('desabilitarRegras');
        if (selectRegras) {
            selectRegras.value = this.configuracoes.desabilitarRegras ? 'true' : 'false';
            console.log('Debug - Regras de limite carregadas:', selectRegras.value);
        }
        
        const sistemaJuros = document.getElementById('sistemaJuros');
        if (sistemaJuros) {
            sistemaJuros.value = this.configuracoes.sistemaJuros || 'compostos-mensal';
            console.log('Debug - Sistema de juros carregado:', sistemaJuros.value);
        }
        
        const igpmAnual = document.getElementById('igpmAnual');
        if (igpmAnual) {
            igpmAnual.value = this.configuracoes.igpmAnual ? this.configuracoes.igpmAnual.toString().replace('.', ',') : '0,00';
            console.log('Debug - IGPM anual carregado:', igpmAnual.value);
        }
        
        // 2. Carregar configurações de detalhes
        const exibirDetalhes = document.getElementById('exibirDetalhesModeLivre');
        if (exibirDetalhes) {
            exibirDetalhes.value = this.configuracoes.exibirDetalhesModeLivre ? 'true' : 'false';
            console.log('Debug - Exibir detalhes carregado:', exibirDetalhes.value);
        }
        
        // 3. Carregar ajustes automáticos (CAMPOS QUE FALHAVAM)
        const ajusteMes31 = document.getElementById('ajusteMes31Dias');
        if (ajusteMes31) {
            ajusteMes31.value = this.configuracoes.ajusteMes31Dias ? 'true' : 'false';
            console.log('Debug - Ajuste mês 31 carregado:', ajusteMes31.value);
        }
        
        const diasExtrasFixos = document.getElementById('diasExtrasFixos');
        if (diasExtrasFixos) {
            diasExtrasFixos.value = this.configuracoes.diasExtrasFixos || 0;
            console.log('Debug - Dias extras fixos carregado:', diasExtrasFixos.value);
        }
        
        // 4. Carregar credenciais administrativas
        const adminUser = document.getElementById('newAdminUser');
        const adminPass = document.getElementById('newAdminPass');
        if (adminUser) adminUser.value = this.configuracoes.adminUser || 'Migueis';
        if (adminPass) adminPass.value = this.configuracoes.adminPassword || 'Laila@1004';
        
        console.log('Debug - Todos os campos administrativos carregados com sucesso');
    }
    
    mostrarPainelAdmin() {
        const panel = document.getElementById('adminPanel');
        const table = document.getElementById('limitsTable');
        
        // REFATORAÇÃO: Usar função dedicada de carregamento
        this.carregarCamposAdmin();
        
        // Gerar tabela de limites com IDs CORRETOS
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
        if (endereco) pessoais.push(`Rua: ${endereco}`);
        if (numero) pessoais.push(`Número: ${numero}`);
        if (complemento) pessoais.push(`Complemento: ${complemento}`);
        if (bairro) pessoais.push(`Bairro: ${bairro}`);
        if (cidade) pessoais.push(`Cidade: ${cidade}`);
        if (estado) pessoais.push(`Estado: ${estado}`);
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
        if (ref1Rua) referencias1.push(`Rua: ${ref1Rua}`);
        if (ref1Numero) referencias1.push(`Número: ${ref1Numero}`);
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
        if (ref2Rua) referencias2.push(`Rua: ${ref2Rua}`);
        if (ref2Numero) referencias2.push(`Número: ${ref2Numero}`);
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
                    // Verificar espaço para a seção completa (título + dados + margem)
                    const espacoNecessario = 10 + (dadosCompletos.pessoais.length * 8) + 6;
                    if (yInicial + espacoNecessario > 260) {
                        doc.addPage();
                        yInicial = 20;
                    }
                    
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
                    // Verificar espaço para a seção completa (título + dados + margem)
                    const espacoNecessario = 10 + (dadosCompletos.profissionais.length * 8) + 6;
                    if (yInicial + espacoNecessario > 260) {
                        doc.addPage();
                        yInicial = 20;
                    }
                    
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
                    // Verificar espaço para a seção completa (título + dados + margem)
                    const espacoNecessario = 10 + (dadosCompletos.referencias1.length * 8) + 6;
                    if (yInicial + espacoNecessario > 260) {
                        doc.addPage();
                        yInicial = 20;
                    }
                    
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
                    // Verificar espaço para a seção completa (título + dados + margem)
                    const espacoNecessario = 10 + (dadosCompletos.referencias2.length * 8) + 6;
                    if (yInicial + espacoNecessario > 260) {
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
            // Nova sequência: Valor → Parcelas → Sistema → Taxa (se habilitado)
            doc.text(`Valor do empréstimo: R$ ${valor.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, 20, yInicial);
            yInicial += 12;
            
            doc.text(`Número de parcelas: ${nParcelas}`, 20, yInicial);
            yInicial += 12;
            
            // Mostrar informações de juros apenas se configurado
            if (this.configuracoes.mostrarJurosRelatorio) {
                const sistemasJuros = {
                    'simples': 'Juros Simples',
                    'compostos-diarios': 'Juros Compostos Diários', 
                    'compostos-mensal': 'Juros Compostos Mensais',
                    'pro-rata-real': 'Pro-rata Real'
                };
                const sistemaAtual = sistemasJuros[this.configuracoes.sistemaJuros] || 'Juros Compostos Mensais';
                doc.text(`Sistema de juros: ${sistemaAtual}`, 20, yInicial);
                yInicial += 12;
                
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
                    // Mostrar apenas dias extras da data com juros proporcionais (não compensação nem meses 31)
                    if (resultadoCalculo.diasExtrasData > 0) {
                        const totalDias = (resultadoCalculo.diasExtrasData || 0) + (resultadoCalculo.diasCompensacao || 0) + (resultadoCalculo.diasMeses31 || 0);
                        const jurosExtrasReais = totalDias > 0 ? (resultadoCalculo.jurosDiasExtras * resultadoCalculo.diasExtrasData) / totalDias : 0;
                        doc.text(`(Dias extras: ${resultadoCalculo.diasExtrasData} | Juros: R$ ${jurosExtrasReais.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})})`, 20, yInicial);
                    }
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
                    // Mostrar apenas dias extras da data com juros proporcionais (não compensação nem meses 31)
                    if (resultadoCalculo.diasExtrasData > 0) {
                        const totalDias = (resultadoCalculo.diasExtrasData || 0) + (resultadoCalculo.diasCompensacao || 0) + (resultadoCalculo.diasMeses31 || 0);
                        const jurosExtrasReais = totalDias > 0 ? (resultadoCalculo.jurosDiasExtras * resultadoCalculo.diasExtrasData) / totalDias : 0;
                        doc.text(`(Dias extras: ${resultadoCalculo.diasExtrasData} | Juros: R$ ${jurosExtrasReais.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})})`, 20, yInicial);
                    }
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
            const nomeArquivo = this.gerarNomeArquivoPdf();
            doc.save(nomeArquivo);
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
        
        // Aplicar tema ao botão de importação
        const importBtn = document.querySelector('.import-btn');
        if (importBtn) {
            importBtn.setAttribute('data-color-theme', colorTheme);
        }
        
        // Salvar a preferência
        localStorage.setItem('app-color-theme', colorTheme);
        
        // Atualizar o select se necessário
        const colorSelect = document.getElementById('colorTheme');
        if (colorSelect && colorSelect.value !== colorTheme) {
            colorSelect.value = colorTheme;
        }
    }



    gerarNomeArquivoPdf() {
        // Capturar dados do cliente diretamente do DOM
        const nomeCliente = document.getElementById('nomeCompleto')?.value.trim() || '';
        const cpfCliente = document.getElementById('cpfCompleto')?.value.trim() || '';
        
        // Limpar caracteres especiais para nome de arquivo (mantém espaços e pontos)
        const limparNome = (texto) => texto.replace(/[<>:"/\\|?*]/g, '_');
        
        // Gerar timestamp
        const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '').replace('T', '_');
        
        // Construir nome do arquivo com cliente no início
        let nomeArquivo = '';
        
        if (nomeCliente && cpfCliente) {
            nomeArquivo = `${limparNome(nomeCliente)}_${limparNome(cpfCliente)}_Simulacao_emprestimo_${timestamp}`;
        } else if (nomeCliente) {
            nomeArquivo = `${limparNome(nomeCliente)}_Simulacao_emprestimo_${timestamp}`;
        } else {
            nomeArquivo = `Simulacao_emprestimo_${timestamp}`;
        }
        
        return `${nomeArquivo}.pdf`;
    }

    aplicarValidacaoConfiguracoes() {
        // Limpar bordas vermelhas se modo livre estiver ativo
        if (this.configuracoes.desabilitarRegras && this.configuracoes.isAdmin) {
            this.limparErrosVisuais();
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

    // Nova função para calcular ajuste de meses com 31 dias
    calcularAjusteMes31Dias(nParcelas) {
        const diasPorMes = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        const hoje = new Date();
        let diasAjuste = 0;
        
        for (let i = 0; i < nParcelas; i++) {
            const mesVencimento = (hoje.getMonth() + i) % 12;
            if (diasPorMes[mesVencimento] === 31) {
                diasAjuste += 1;
            }
        }
        
        return diasAjuste;
    }

    // Nova função para exibir detalhes no modo livre
    exibirDetalhesModeLivre(valorEmprestimo, nParcelas, juros, resultadoCalculo) {
        const valorTotal = resultadoCalculo.parcelaNormal * nParcelas;
        const lucroTotal = valorTotal - valorEmprestimo;
        const margemLucro = (lucroTotal / valorEmprestimo) * 100;
        
        let detalhesHtml = `
            <div class="detalhes-modo-livre" style="
                margin-top: 20px;
                padding: 16px;
                background: var(--primary-container);
                border-radius: 12px;
                border-left: 4px solid var(--primary);
            ">
                <h4 style="margin: 0 0 12px 0; color: var(--on-primary-container); font-size: 16px;">
                    ANÁLISE FINANCEIRA
                </h4>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 14px;">
                    <div>
                        <strong>Capital emprestado:</strong><br>
                        <span style="color: var(--primary);">R$ ${valorEmprestimo.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                    </div>
                    <div>
                        <strong>Total a receber:</strong><br>
                        <span style="color: var(--primary);">R$ ${valorTotal.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                    </div>
                    <div>
                        <strong>Lucro líquido:</strong><br>
                        <span style="color: ${lucroTotal > 0 ? '#4CAF50' : '#F44336'};">R$ ${lucroTotal.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                    </div>
                    <div>
                        <strong>Margem de lucro:</strong><br>
                        <span style="color: ${margemLucro > 0 ? '#4CAF50' : '#F44336'};">${margemLucro.toFixed(2)}%</span>
                    </div>
                </div>
        `;
        
        // Adicionar informações de configurações ativas separadamente
        const configuracoeAtivas = [];
        // Remover - detalhamento separado já aparece na interface principal
        if (this.configuracoes.igpmAnual > 0) {
            configuracoeAtivas.push(`IGPM ${this.configuracoes.igpmAnual}%`);
        }
        
        if (configuracoeAtivas.length > 0) {
            detalhesHtml += `
                <div style="margin-top: 12px; font-size: 12px; color: var(--on-primary-container); opacity: 0.8;">
                    <strong>Configurações ativas:</strong><br>${configuracoeAtivas.join('<br>')}
                </div>
            `;
        }
        
        detalhesHtml += '</div>';
        
        this.resultValue.innerHTML += detalhesHtml;
    }

    // Nova função para formatar informações de dias extras separadamente com juros individuais
    calcularDiferencaDias(dataFinal, dataInicial) {
        // Extrair componentes de data sem considerar horário
        const anoFinal = dataFinal.getFullYear();
        const mesFinal = dataFinal.getMonth();
        const diaFinal = dataFinal.getDate();
        
        const anoInicial = dataInicial.getFullYear();
        const mesInicial = dataInicial.getMonth();
        const diaInicial = dataInicial.getDate();
        
        // Criar datas zeradas (sem horário)
        const dataFinalZerada = new Date(anoFinal, mesFinal, diaFinal);
        const dataInicialZerada = new Date(anoInicial, mesInicial, diaInicial);
        
        // Calcular diferença em milissegundos e converter para dias
        const diferencaMs = dataFinalZerada.getTime() - dataInicialZerada.getTime();
        const diferencaDias = diferencaMs / (1000 * 60 * 60 * 24);
        
        // Retorna diferença exata em dias (sempre inteiro)
        return Math.round(diferencaDias);
    }

    formatarInfoDiasExtras(diasExtrasData, diasCompensacao, diasMeses31, resultadoCalculo) {
        const infos = [];
        
        // Calcular juros proporcionais para cada tipo
        const totalDias = diasExtrasData + diasCompensacao + diasMeses31;
        const jurosTotal = resultadoCalculo.jurosDiasExtras || 0;
        
        if (diasExtrasData > 0) {
            const jurosExtras = totalDias > 0 ? (jurosTotal * diasExtrasData) / totalDias : 0;
            infos.push(`Dias extras: ${diasExtrasData} dias | Juros: R$ ${jurosExtras.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`);
        }
        
        if (diasMeses31 > 0) {
            const jurosMeses31 = totalDias > 0 ? (jurosTotal * diasMeses31) / totalDias : 0;
            infos.push(`Meses 31 dias: ${diasMeses31} | Juros: R$ ${jurosMeses31.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`);
        }
        
        if (diasCompensacao > 0) {
            const jurosCompensacao = totalDias > 0 ? (jurosTotal * diasCompensacao) / totalDias : 0;
            infos.push(`Dias compensação: ${diasCompensacao} | Juros: R$ ${jurosCompensacao.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`);
        }
        
        return infos.length > 0 ? infos.join('<br>') : 'Sem dias extras';
    }

    setupDateMaskFormatting() {
        const dataNascimentoField = document.getElementById('dataNascimento');
        if (dataNascimentoField) {
            dataNascimentoField.addEventListener('input', (e) => this.formatarData(e.target));
        }
    }

    // =============================================
    // SISTEMA DE IMPORTAÇÃO DE DADOS EXPANSÍVEL
    // =============================================

    setupImportEventListeners() {
        console.log('Configurando event listeners de importação...');
        
        // Buscar elementos diretamente para garantir que existem
        const importBtn = document.getElementById('importDataBtn');
        const expandArea = document.getElementById('importExpandArea');
        const pdfInput = document.getElementById('pdfFileInput');
        const textArea = document.getElementById('importTextArea');
        const previewBtn = document.getElementById('previewDataBtn');
        const applyBtn = document.getElementById('applyDataBtn');
        const clearBtn = document.getElementById('clearImportBtn');
        
        console.log('Elementos encontrados:', {
            importBtn: !!importBtn,
            expandArea: !!expandArea,
            pdfInput: !!pdfInput,
            textArea: !!textArea,
            previewBtn: !!previewBtn,
            applyBtn: !!applyBtn,
            clearBtn: !!clearBtn
        });

        // Botão principal de importação (expansível)
        if (importBtn) {
            importBtn.addEventListener('click', () => {
                console.log('Clique no botão de importação detectado');
                this.toggleImportArea();
            });
            console.log('Event listener do botão de importação configurado');
        } else {
            console.error('Botão de importação não encontrado!');
        }

        // Upload de arquivo PDF
        if (pdfInput) {
            pdfInput.addEventListener('change', (e) => {
                console.log('Arquivo PDF selecionado');
                this.handlePdfUpload(e.target.files[0]);
            });
        }

        // Área de texto para colar
        if (textArea) {
            textArea.addEventListener('input', () => {
                this.checkImportData();
            });
        }

        // Botões de ação
        if (previewBtn) {
            previewBtn.addEventListener('click', () => {
                this.previewImportData();
            });
        }

        if (applyBtn) {
            applyBtn.addEventListener('click', () => {
                this.applyImportData();
            });
        }

        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                this.clearImportData();
            });
        }
        
        // Armazenar referências dos elementos
        this.importDataBtn = importBtn;
        this.importExpandArea = expandArea;
        this.pdfFileInput = pdfInput;
        this.importTextArea = textArea;
        this.previewDataBtn = previewBtn;
        this.applyDataBtn = applyBtn;
        this.clearImportBtn = clearBtn;
    }

    toggleImportArea() {
        console.log('toggleImportArea chamada');
        
        // Buscar elementos diretamente se não estiverem disponíveis
        const expandArea = this.importExpandArea || document.getElementById('importExpandArea');
        const importBtn = this.importDataBtn || document.getElementById('importDataBtn');
        
        console.log('Elementos para toggle:', {
            expandArea: !!expandArea,
            importBtn: !!importBtn
        });
        
        if (!expandArea || !importBtn) {
            console.error('Elementos necessários para expansão não encontrados');
            return;
        }
        
        const isExpanded = expandArea.classList.contains('expanded');
        console.log('Estado atual - isExpanded:', isExpanded);
        
        if (isExpanded) {
            console.log('Recolhendo área de importação');
            expandArea.classList.remove('expanded');
            importBtn.classList.remove('expanded');
            // Forçar altura 0 para garantir recolhimento
            expandArea.style.maxHeight = '0px';
            this.clearImportData();
        } else {
            console.log('Expandindo área de importação');
            expandArea.classList.add('expanded');
            importBtn.classList.add('expanded');
            // Forçar altura máxima para garantir expansão
            expandArea.style.maxHeight = '2000px';
        }
        
        // Atualizar referências
        this.importExpandArea = expandArea;
        this.importDataBtn = importBtn;
    }

    async handlePdfUpload(file) {
        if (!file) return;

        this.updateFileStatus('Processando PDF...', 'processing');
        
        try {
            // Usar FileReader para ler o arquivo
            const arrayBuffer = await this.readFileAsArrayBuffer(file);
            
            // Tentar extrair texto usando PDF.js
            let text = '';
            
            // Verificar se PDF.js está disponível
            if (typeof pdfjsLib !== 'undefined') {
                try {
                    const pdf = await pdfjsLib.getDocument({data: arrayBuffer}).promise;
                    let fullText = '';
                    
                    for (let i = 1; i <= pdf.numPages; i++) {
                        const page = await pdf.getPage(i);
                        const textContent = await page.getTextContent();
                        const pageText = textContent.items.map(item => item.str).join(' ');
                        fullText += pageText + '\n';
                    }
                    
                    text = fullText;
                    this.updateFileStatus('PDF processado com sucesso!', 'success');
                } catch (pdfError) {
                    console.error('Erro ao processar PDF:', pdfError);
                    this.updateFileStatus('Erro ao processar PDF. Cole o texto manualmente na área abaixo.', 'error');
                    return;
                }
            } else {
                // Fallback: instruir usuário a colar manualmente
                this.updateFileStatus('Biblioteca PDF não carregada. Cole o texto manualmente na área abaixo.', 'error');
                return;
            }

            // Preencher área de texto com conteúdo extraído
            if (text && this.importTextArea) {
                this.importTextArea.value = text;
                this.checkImportData();
                
                // Auto-processar e aplicar dados se o texto foi extraído
                setTimeout(() => {
                    this.previewImportData();
                    // Auto-aplicar dados após preview
                    setTimeout(() => {
                        console.log('🚀 AUTO-APLICANDO DADOS APÓS EXTRAÇÃO PDF');
                        this.applyImportData();
                    }, 1000);
                }, 500);
            }

        } catch (error) {
            console.error('Erro ao processar arquivo:', error);
            this.updateFileStatus('Erro ao ler arquivo. Tente colar o texto manualmente.', 'error');
        }
    }

    readFileAsArrayBuffer(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsArrayBuffer(file);
        });
    }

    updateFileStatus(message, type = '') {
        if (this.fileStatus) {
            this.fileStatus.textContent = message;
            this.fileStatus.className = `file-status ${type}`;
        }
    }

    checkImportData() {
        const hasText = this.importTextArea && this.importTextArea.value.trim().length > 0;
        
        if (this.previewDataBtn) {
            this.previewDataBtn.disabled = !hasText;
        }
        
        if (this.applyDataBtn) {
            this.applyDataBtn.disabled = !hasText;
        }
    }

    previewImportData() {
        const pdfFile = this.pdfFileInput?.files[0];
        const text = this.importTextArea?.value.trim() || '';
        
        if (!pdfFile && !text) {
            this.updateFileStatus('Por favor, anexe um PDF ou cole texto antes de visualizar.', 'error');
            return;
        }

        if (pdfFile) {
            this.updateFileStatus('Processando PDF...', 'processing');
            this.handlePdfUpload(pdfFile);
        } else {
            this.updateFileStatus('Extraindo dados do texto...', 'processing');
            
            try {
                const dadosExtraidos = this.extrairDadosTexto(text);
                console.log('Dados extraídos:', dadosExtraidos);
                this.exibirPreviewDados(dadosExtraidos);
                this.updateFileStatus('Dados extraídos com sucesso!', 'success');
            } catch (error) {
                console.error('Erro ao extrair dados:', error);
                this.updateFileStatus('Erro ao processar dados. Verifique o formato.', 'error');
            }
        }
    }

    applyImportData() {
        const pdfFile = this.pdfFileInput?.files[0];
        const text = this.importTextArea?.value.trim() || '';
        
        if (!pdfFile && !text) {
            this.updateFileStatus('Nenhum dado encontrado para aplicar.', 'error');
            return;
        }

        this.updateFileStatus('Aplicando dados aos formulários...', 'processing');

        try {
            let dadosExtraidos;
            
            if (pdfFile) {
                // Para PDF, usar dados já extraídos no preview
                dadosExtraidos = this.dadosImportados || this.extrairDadosTexto(text);
            } else {
                dadosExtraidos = this.extrairDadosTexto(text);
            }
            
            console.log('Aplicando dados:', dadosExtraidos);
            
            // Preencher formulário da tela principal
            // Usar a nova função aplicarDadosJson com logs detalhados (elimina código duplicado)
            console.log('🔥 CHAMANDO aplicarDadosJson() da função applyImportData');
            this.aplicarDadosJson(dadosExtraidos);
            
            this.updateFileStatus('Dados aplicados com sucesso!', 'success');
            
            // Fechar área de importação após 2 segundos
            setTimeout(() => {
                this.toggleImportArea();
            }, 2000);
            
        } catch (error) {
            console.error('Erro ao aplicar dados:', error);
            this.updateFileStatus('Erro ao aplicar dados. Tente novamente.', 'error');
        }
    }

    updateFileStatus(message, type = '') {
        if (this.fileStatus) {
            this.fileStatus.textContent = message;
            this.fileStatus.className = `file-status ${type}`;
        }
    }

    clearImportData() {
        if (this.pdfFileInput) this.pdfFileInput.value = '';
        if (this.importTextArea) this.importTextArea.value = '';
        
        this.updateFileStatus('', '');
        
        if (this.dataPreviewSection) {
            this.dataPreviewSection.style.display = 'none';
        }
        
        // Limpar dados importados armazenados
        this.dadosImportados = null;
        
        this.checkImportData();
    }

    extrairDadosTexto(texto) {
        const dados = {
            // Dados principais
            nome: '',
            cpf: '',
            dataNascimento: '',
            estadoCivil: '',
            telefone: '',
            email: '',
            
            // Endereço
            rua: '',
            numero: '',
            complemento: '',
            bairro: '',
            cidade: '',
            estado: '',
            cep: '',
            
            // Dados profissionais
            trabalho: '',
            profissao: '',
            renda: '',
            tempoEmprego: '',
            
            // Referências
            referencia1Nome: '',
            referencia1Telefone: '',
            referencia1Rua: '',
            referencia1Numero: '',
            referencia1Bairro: '',
            referencia2Nome: '',
            referencia2Telefone: '',
            referencia2Rua: '',
            referencia2Numero: '',
            referencia2Bairro: ''
        };

        try {
            // Detectar automaticamente se é PDF do sistema ou formulário copiado
            const isPdfSistema = texto.includes('DADOS PESSOAIS') || texto.includes('Data de Nascimento:');
            
            if (isPdfSistema) {
                this.extrairDadosPdfSistema(texto, dados);
            } else {
                this.extrairDadosFormulario(texto, dados);
            }
        } catch (error) {
            console.error('Erro na extração:', error);
        }

        return dados;
    }

    exibirPreviewDados(dados) {
        if (!this.dataPreviewContent) return;

        const campos = [
            { label: 'Nome', value: dados.nome },
            { label: 'CPF', value: dados.cpf },
            { label: 'Data Nascimento', value: dados.dataNascimento },
            { label: 'Estado Civil', value: dados.estadoCivil },
            { label: 'Telefone', value: dados.telefone },
            { label: 'E-mail', value: dados.email },
            { label: 'Rua', value: dados.rua },
            { label: 'Número', value: dados.numero },
            { label: 'Complemento', value: dados.complemento },
            { label: 'Bairro', value: dados.bairro },
            { label: 'Cidade', value: dados.cidade },
            { label: 'Estado', value: dados.estado },
            { label: 'CEP', value: dados.cep },
            { label: 'Local Trabalho', value: dados.trabalho },
            { label: 'Profissão', value: dados.profissao },
            { label: 'Renda', value: dados.renda },
            { label: 'Tempo Emprego', value: dados.tempoEmprego },
            { label: '1ª Ref. Nome', value: dados.referencia1Nome },
            { label: '1ª Ref. Telefone', value: dados.referencia1Telefone },
            { label: '1ª Ref. Rua', value: dados.referencia1Rua },
            { label: '1ª Ref. Número', value: dados.referencia1Numero },
            { label: '1ª Ref. Bairro', value: dados.referencia1Bairro },
            { label: '2ª Ref. Nome', value: dados.referencia2Nome },
            { label: '2ª Ref. Telefone', value: dados.referencia2Telefone },
            { label: '2ª Ref. Rua', value: dados.referencia2Rua },
            { label: '2ª Ref. Número', value: dados.referencia2Numero },
            { label: '2ª Ref. Bairro', value: dados.referencia2Bairro }
        ];

        let html = '';
        let camposEncontrados = 0;

        campos.forEach(campo => {
            const value = campo.value || '';
            const isEmpty = !value;
            
            if (!isEmpty) camposEncontrados++;

            html += `
                <div class="preview-item">
                    <span class="preview-label">${campo.label}:</span>
                    <span class="preview-value ${isEmpty ? 'preview-empty' : ''}">${
                        isEmpty ? '(não encontrado)' : value
                    }</span>
                </div>
            `;
        });

        this.dataPreviewContent.innerHTML = html;
        
        if (this.dataPreviewSection) {
            this.dataPreviewSection.style.display = 'block';
            this.dataPreviewSection.scrollIntoView({ behavior: 'smooth' });
        }

        // Habilitar botão de aplicação se houver dados
        if (this.applyDataBtn) {
            this.applyDataBtn.disabled = camposEncontrados === 0;
        }
    }

    preencherFormularioCompleto(dados) {
        // Expandir formulário automaticamente se houver dados cadastrais
        const temDadosCadastrais = dados.nome || dados.cpf || dados.telefone || dados.rua;
        if (temDadosCadastrais) {
            this.expandirFormularioCompleto();
        }

        // Preencher campos principais (sempre visíveis)
        this.preencherCampo('nomeCompleto', dados.nome);
        this.preencherCampo('cpfCompleto', dados.cpf);

        // Preencher campos do formulário completo
        this.preencherCampo('dataNascimento', dados.dataNascimento);
        this.preencherCampo('estadoCivil', dados.estadoCivil);
        this.preencherCampo('rua', dados.rua);
        this.preencherCampo('numeroEndereco', dados.numero);
        this.preencherCampo('complemento', dados.complemento);
        this.preencherCampo('bairro', dados.bairro);
        this.preencherCampo('cidade', dados.cidade);
        this.preencherCampo('estado', dados.estado);
        this.preencherCampo('cep', dados.cep);
        this.preencherCampo('telefoneCompleto', dados.telefone);
        this.preencherCampo('email', dados.email);
        this.preencherCampo('trabalho', dados.trabalho);
        this.preencherCampo('profissao', dados.profissao);
        this.preencherCampo('renda', dados.renda);
        this.preencherCampo('tempoEmprego', dados.tempoEmprego);

        // Referências
        this.preencherCampo('referencia1Nome', dados.referencia1Nome);
        this.preencherCampo('referencia1Telefone', dados.referencia1Telefone);
        this.preencherCampo('referencia1Rua', dados.referencia1Rua);
        this.preencherCampo('referencia1Numero', dados.referencia1Numero);
        this.preencherCampo('referencia1Bairro', dados.referencia1Bairro);

        this.preencherCampo('referencia2Nome', dados.referencia2Nome);
        this.preencherCampo('referencia2Telefone', dados.referencia2Telefone);
        this.preencherCampo('referencia2Rua', dados.referencia2Rua);
        this.preencherCampo('referencia2Numero', dados.referencia2Numero);
        this.preencherCampo('referencia2Bairro', dados.referencia2Bairro);

        // Aplicar formatação aos campos preenchidos
        this.aplicarFormatacaoImportados();
    }

    preencherCampo(id, valor) {
        if (!valor) return;

        const campo = document.getElementById(id);
        if (campo) {
            campo.value = valor;
        }
    }

    expandirFormularioCompleto() {
        const container = document.getElementById('formCompletoContainer');
        const toggleBtn = document.getElementById('toggleFormCompleto');
        const icon = toggleBtn?.querySelector('.toggle-icon');
        
        if (container && container.style.display !== 'block') {
            container.style.display = 'block';
            if (toggleBtn) toggleBtn.classList.add('expanded');
            if (icon) icon.textContent = '▲';
        }
    }

    aplicarFormatacaoImportados() {
        // Aplicar formatação de CPF
        const cpfField = document.getElementById('cpfCompleto');
        if (cpfField && cpfField.value) {
            this.formatarCpf(cpfField);
        }

        // Aplicar formatação de telefone
        const telefoneField = document.getElementById('telefoneCompleto');
        if (telefoneField && telefoneField.value) {
            this.formatarTelefone(telefoneField);
        }

        // Aplicar formatação de CEP
        const cepField = document.getElementById('cep');
        if (cepField && cepField.value) {
            this.formatarCep(cepField);
        }

        // Aplicar formatação de data
        const dataField = document.getElementById('dataNascimento');
        if (dataField && dataField.value) {
            this.formatarData(dataField);
        }
    }

    fecharModalImportacao() {
        if (this.importModal) {
            this.importModal.style.display = 'none';
            this.limparTextAreas();
            this.limparPreview();
        }
    }

    trocarAbaImportacao(aba) {
        // Remover classes ativas
        this.tabPdf?.classList.remove('active');
        this.tabFormulario?.classList.remove('active');
        this.contentPdf?.classList.remove('active');
        this.contentFormulario?.classList.remove('active');

        // Adicionar classes ativas na aba selecionada
        if (aba === 'pdf') {
            this.tabPdf?.classList.add('active');
            this.contentPdf?.classList.add('active');
        } else {
            this.tabFormulario?.classList.add('active');
            this.contentFormulario?.classList.add('active');
        }

        this.limparPreview();
    }

    limparTextAreas() {
        if (this.pdfTextArea) this.pdfTextArea.value = '';
        if (this.formularioTextArea) this.formularioTextArea.value = '';
    }

    limparPreview() {
        if (this.dataPreview) {
            this.dataPreview.style.display = 'none';
        }
        if (this.previewContent) {
            this.previewContent.innerHTML = '';
        }
        if (this.importBtn) {
            this.importBtn.disabled = true;
        }
    }

    visualizarDados() {
        try {
            const abaAtiva = this.tabPdf?.classList.contains('active') ? 'pdf' : 'formulario';
            const texto = abaAtiva === 'pdf' ? 
                this.pdfTextArea?.value.trim() || '' : 
                this.formularioTextArea?.value.trim() || '';

            if (!texto) {
                alert('Por favor, cole o texto na área correspondente antes de visualizar.');
                return;
            }

            const dadosExtraidos = this.extrairDadosTexto(texto, abaAtiva);
            this.exibirPreview(dadosExtraidos);

        } catch (error) {
            console.error('Erro ao visualizar dados:', error);
            alert('Erro ao processar o texto. Verifique o formato e tente novamente.');
        }
    }

    // Sistema de detecção inteligente de formato de documento
    detectarTipoDocumento(texto) {
        if (texto.includes("FORMULÁRIO: ME EMPREENDIMENTOS")) return "formulario";
        if (texto.includes("Sistema de juros:") && texto.includes("Taxa de juros:")) return "pdf_completo";
        if (texto.includes("DADOS DA SIMULAÇÃO")) return "pdf_simples";
        return "desconhecido";
    }

    // Normalização automática de dados
    normalizarDados(dados) {
        // Normalizar CPF
        if (dados.cpf) {
            dados.cpf = dados.cpf.replace(/\D/g, '');
            if (dados.cpf.length === 11) {
                dados.cpf = dados.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
            }
        }

        // Normalizar telefone
        if (dados.telefone) {
            dados.telefone = dados.telefone.replace(/\D/g, '');
            if (dados.telefone.length === 11) {
                dados.telefone = dados.telefone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
            }
        }

        // Normalizar valores monetários
        if (dados.valorEmprestimo) {
            dados.valorEmprestimo = dados.valorEmprestimo.replace(/[R$\s]/g, '').replace(/\./g, '').replace(',', '.');
        }
        if (dados.renda) {
            dados.renda = dados.renda.replace(/[R$\s]/g, '').replace(/\./g, '').replace(',', '.');
        }

        // Normalizar CEP
        if (dados.cep) {
            dados.cep = dados.cep.replace(/\D/g, '');
            if (dados.cep.length === 8) {
                dados.cep = dados.cep.replace(/(\d{5})(\d{3})/, '$1-$2');
            }
        }

        // Normalizar referências
        if (dados.referencia1Telefone) {
            dados.referencia1Telefone = dados.referencia1Telefone.replace(/\D/g, '');
            if (dados.referencia1Telefone.length === 11) {
                dados.referencia1Telefone = dados.referencia1Telefone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
            }
        }
        if (dados.referencia2Telefone) {
            dados.referencia2Telefone = dados.referencia2Telefone.replace(/\D/g, '');
            if (dados.referencia2Telefone.length === 11) {
                dados.referencia2Telefone = dados.referencia2Telefone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
            }
        }

        return dados;
    }

    // Nova função para pré-processar texto do PDF e recriar quebras de linha
    preprocessarTextoPdf(texto) {
        console.log('=== INÍCIO PRÉ-PROCESSAMENTO ===');
        console.log('Texto original (primeiros 800 chars):', texto.substring(0, 800));
        
        // Padrões de campos que devem ter quebra de linha antes
        const padroesQuebra = [
            'CPF:', 'Data de Nascimento:', 'Estado Civil:', 'Endereço:', 'Bairro:', 'Cidade:', 
            'CEP:', 'Telefone:', 'E-mail:', 'Profissão:', 'Local de Trabalho:', 'Renda Mensal:', 
            'Tempo de Emprego:', 'Nome:', 'Número:', 'Complemento:', 'Estado:', 'Valor do empréstimo:', 
            'Número de parcelas:', 'Taxa de juros:', 'Sistema de juros:', '1ª REFERÊNCIA:', 
            '2ª REFERÊNCIA:', 'DADOS PESSOAIS:', 'DADOS PROFISSIONAIS:', 'DADOS DA SIMULAÇÃO:'
        ];

        // Adicionar quebra de linha antes de cada padrão identificado
        let textoProcessado = texto;
        padroesQuebra.forEach(padrao => {
            const regex = new RegExp(`(?<!^|\\n)\\s*(${padrao.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
            const antes = textoProcessado.length;
            textoProcessado = textoProcessado.replace(regex, '\n$1');
            const depois = textoProcessado.length;
            if (depois !== antes) {
                console.log(`Padrão "${padrao}" encontrado e quebra adicionada`);
            }
        });

        // Limpar quebras de linha múltiplas e espaços extras
        textoProcessado = textoProcessado.replace(/\n\s*\n/g, '\n').trim();

        console.log('=== RESULTADO PRÉ-PROCESSAMENTO ===');
        console.log('Texto processado (primeiros 800 chars):', textoProcessado.substring(0, 800));
        console.log('=== FIM PRÉ-PROCESSAMENTO ===');
        
        return textoProcessado;
    }

    // Calcular data inicial de vencimento a partir dos PDFs
    calcularDataInicialVencimento(texto) {
        try {
            // Extrair primeira data de vencimento da tabela
            const primeiraParcelaMatch = texto.match(/01\s+(\d{2}\/\d{2}\/\d{4})/);
            
            if (primeiraParcelaMatch) {
                return primeiraParcelaMatch[1];
            }
            
            return null;
        } catch (error) {
            console.error('Erro ao calcular data inicial:', error);
            return null;
        }
    }

    extrairDadosTexto(texto, tipoFonte) {
        console.log('Iniciando extração de dados...');
        
        const dados = {
            // Dados principais
            nome: '',
            cpf: '',
            dataNascimento: '',
            estadoCivil: '',
            telefone: '',
            email: '',
            
            // Dados do empréstimo
            valorEmprestimo: '',
            numeroParcelas: '',
            taxaJuros: '',
            sistemaJuros: '',
            dataVencimentoInicial: '',
            
            // Endereço
            rua: '',
            numero: '',
            complemento: '',
            bairro: '',
            cidade: '',
            estado: '',
            cep: '',
            
            // Dados profissionais
            trabalho: '',
            profissao: '',
            renda: '',
            tempoEmprego: '',
            
            // Referências
            referencia1Nome: '',
            referencia1Telefone: '',
            referencia1Rua: '',
            referencia1Numero: '',
            referencia1Bairro: '',
            referencia2Nome: '',
            referencia2Telefone: '',
            referencia2Rua: '',
            referencia2Numero: '',
            referencia2Bairro: ''
        };

        try {
            // Detectar tipo de documento automaticamente
            const tipoDetectado = this.detectarTipoDocumento(texto);
            console.log('Tipo de documento detectado:', tipoDetectado);

            // Aplicar extração específica baseada no tipo
            switch (tipoDetectado) {
                case 'formulario':
                    this.extrairDadosFormularioEstruturado(texto, dados);
                    break;
                case 'pdf_completo':
                    this.extrairDadosPdfCompleto(texto, dados);
                    break;
                case 'pdf_simples':
                    this.extrairDadosPdfSimples(texto, dados);
                    break;
                default:
                    // Usar método original como fallback
                    if (tipoFonte === 'pdf') {
                        this.extrairDadosPdfSistema(texto, dados);
                    } else {
                        this.extrairDadosFormulario(texto, dados);
                    }
            }

            // Normalizar dados extraídos
            const dadosNormalizados = this.normalizarDados(dados);
            console.log('Dados extraídos e normalizados:', dadosNormalizados);
            
            return dadosNormalizados;

        } catch (error) {
            console.error('Erro na extração:', error);
            return dados;
        }
    }

    // Extração específica para formulário estruturado
    extrairDadosFormularioEstruturado(texto, dados) {
        try {
            // Dados do empréstimo
            const valorMatch = texto.match(/Valor:\s*R\$?\s*([0-9,.]+)/i);
            const parcelasMatch = texto.match(/Parcelas:\s*(\d+)/i);
            const dataVencMatch = texto.match(/Data Venc\. Inicial:\s*(\d{2}\/\d{2}\/\d{4})/i);

            if (valorMatch) dados.valorEmprestimo = valorMatch[1];
            if (parcelasMatch) dados.numeroParcelas = parcelasMatch[1];
            if (dataVencMatch) dados.dataVencimentoInicial = dataVencMatch[1];

            // Dados pessoais
            const nomeMatch = texto.match(/Nome:\s*([^\n]+)/i);
            const cpfMatch = texto.match(/CPF:\s*([0-9]+)/i);
            const nascimentoMatch = texto.match(/Data nascimento:\s*(\d{2}\/\d{2}\/\d{4})/i);
            const estadoCivilMatch = texto.match(/Estado Civil:\s*([^\n]+)/i);
            const ruaMatch = texto.match(/Rua:\s*([^\n]+)/i);
            const numeroMatch = texto.match(/Número:\s*([^\n]+)/i);
            const complementoMatch = texto.match(/Complemento:\s*([^\n]+)/i);
            const bairroMatch = texto.match(/Bairro:\s*([^\n]+)/i);
            const cidadeMatch = texto.match(/Cidade:\s*([^\n]+)/i);
            const estadoMatch = texto.match(/Estado:\s*([^\n]+)/i);
            const cepMatch = texto.match(/CEP:\s*([0-9-]+)/i);
            const telefoneMatch = texto.match(/Telefone:\s*\(?\d+\)?\s*[0-9-]+/i);
            const emailMatch = texto.match(/E-mail:\s*([^\n]+)/i);

            if (nomeMatch) dados.nome = nomeMatch[1].trim();
            if (cpfMatch) dados.cpf = cpfMatch[1];
            if (nascimentoMatch) dados.dataNascimento = nascimentoMatch[1];
            if (estadoCivilMatch) dados.estadoCivil = estadoCivilMatch[1].trim();
            if (ruaMatch) dados.rua = ruaMatch[1].trim();
            if (numeroMatch) dados.numero = numeroMatch[1].trim();
            if (complementoMatch) dados.complemento = complementoMatch[1].trim();
            if (bairroMatch) dados.bairro = bairroMatch[1].trim();
            if (cidadeMatch) dados.cidade = cidadeMatch[1].trim();
            if (estadoMatch) dados.estado = estadoMatch[1].trim();
            if (cepMatch) dados.cep = cepMatch[1];
            if (telefoneMatch) dados.telefone = telefoneMatch[0].replace('Telefone:', '').trim();
            if (emailMatch) dados.email = emailMatch[1].trim();

            // Dados profissionais
            const trabalhoMatch = texto.match(/Local de trabalho:\s*([^\n]+)/i);
            const profissaoMatch = texto.match(/Profissão:\s*([^\n]+)/i);
            const rendaMatch = texto.match(/Renda Mensal:\s*R\$?\s*([0-9,.]+)/i);
            const tempoEmpregoMatch = texto.match(/Tempo de emprego:\s*([^\n]+)/i);

            if (trabalhoMatch) dados.trabalho = trabalhoMatch[1].trim();
            if (profissaoMatch) dados.profissao = profissaoMatch[1].trim();
            if (rendaMatch) dados.renda = rendaMatch[1];
            if (tempoEmpregoMatch) dados.tempoEmprego = tempoEmpregoMatch[1].trim();

            // Extrair referências
            const ref1Match = texto.match(/1º REREFENCIA[\s\S]*?Nome:\s*([^\n]+)[\s\S]*?Rua:\s*([^\n]+)[\s\S]*?Numero:\s*([^\n]+)[\s\S]*?Bairro:\s*([^\n]+)[\s\S]*?Telefone:\s*([^\n]+)/i);
            const ref2Match = texto.match(/2º REFERENCIA[\s\S]*?Nome:\s*([^\n]+)[\s\S]*?Rua:\s*([^\n]+)[\s\S]*?Numero:\s*([^\n]+)[\s\S]*?Bairro:\s*([^\n]+)[\s\S]*?Telefone:\s*([^\n]+)/i);

            if (ref1Match) {
                dados.referencia1Nome = ref1Match[1].trim();
                dados.referencia1Rua = ref1Match[2].trim();
                dados.referencia1Numero = ref1Match[3].trim();
                dados.referencia1Bairro = ref1Match[4].trim();
                dados.referencia1Telefone = ref1Match[5].trim();
            }

            if (ref2Match) {
                dados.referencia2Nome = ref2Match[1].trim();
                dados.referencia2Rua = ref2Match[2].trim();
                dados.referencia2Numero = ref2Match[3].trim();
                dados.referencia2Bairro = ref2Match[4].trim();
                dados.referencia2Telefone = ref2Match[5].trim();
            }

        } catch (error) {
            console.error('Erro na extração do formulário estruturado:', error);
        }
    }

    // Extração específica para PDF completo (com taxa de juros)
    extrairDadosPdfCompleto(texto, dados) {
        try {
            console.log('=== EXTRAÇÃO PDF COMPLETO ===');
            
            // Pré-processar texto para recriar quebras de linha
            const textoProcessado = this.preprocessarTextoPdf(texto);
            
            console.log('=== TESTANDO REGEX DADOS SIMULAÇÃO ===');
            
            // Dados da simulação com regex melhorados
            const valorMatch = textoProcessado.match(/Valor do empréstimo:\s*R\$\s*([0-9,.]+?)(?=\s*Número de parcelas:|$)/i);
            console.log('Regex Valor:', '/Valor do empréstimo:\\s*R\\$\\s*([0-9,.]+?)(?=\\s*Número de parcelas:|$)/i');
            console.log('Resultado Valor:', valorMatch);
            
            const parcelasMatch = textoProcessado.match(/Número de parcelas:\s*(\d+?)(?=\s*Sistema de juros:|Taxa de juros:|$)/i);
            console.log('Regex Parcelas:', '/Número de parcelas:\\s*(\\d+?)(?=\\s*Sistema de juros:|Taxa de juros:|$)/i');
            console.log('Resultado Parcelas:', parcelasMatch);
            
            const sistemaJurosMatch = textoProcessado.match(/Sistema de juros:\s*([^\n\r]+?)(?=\s*Taxa de juros:|$)/i);
            console.log('Regex Sistema:', '/Sistema de juros:\\s*([^\\n\\r]+?)(?=\\s*Taxa de juros:|$)/i');
            console.log('Resultado Sistema:', sistemaJurosMatch);
            
            const taxaJurosMatch = textoProcessado.match(/Taxa de juros:\s*([0-9,]+?)%/i);
            console.log('Regex Taxa:', '/Taxa de juros:\\s*([0-9,]+?)%/i');
            console.log('Resultado Taxa:', taxaJurosMatch);

            console.log('=== APLICANDO DADOS EXTRAÍDOS ===');
            if (valorMatch) {
                dados.valorEmprestimo = valorMatch[1];
                console.log('Valor extraído:', valorMatch[1]);
            } else {
                console.log('VALOR NÃO ENCONTRADO!');
            }
            
            if (parcelasMatch) {
                dados.numeroParcelas = parcelasMatch[1];
                console.log('Parcelas extraídas:', parcelasMatch[1]);
            } else {
                console.log('PARCELAS NÃO ENCONTRADAS!');
            }
            
            if (sistemaJurosMatch) {
                dados.sistemaJuros = sistemaJurosMatch[1].trim();
                console.log('Sistema extraído:', sistemaJurosMatch[1].trim());
            } else {
                console.log('SISTEMA DE JUROS NÃO ENCONTRADO!');
            }
            
            if (taxaJurosMatch) {
                dados.taxaJuros = taxaJurosMatch[1];
                console.log('Taxa extraída:', taxaJurosMatch[1]);
            } else {
                console.log('TAXA DE JUROS NÃO ENCONTRADA!');
            }

            // Calcular data inicial de vencimento
            const dataInicial = this.calcularDataInicialVencimento(textoProcessado);
            if (dataInicial) {
                dados.dataVencimentoInicial = dataInicial;
                console.log('Data inicial extraída:', dataInicial);
            }

            // Extrair dados cadastrais com texto pré-processado
            this.extrairDadosPdfSistemaComPreprocessamento(textoProcessado, dados);

            console.log('=== DADOS FINAIS EXTRAÍDOS ===');
            console.log('dados.valorEmprestimo:', dados.valorEmprestimo);
            console.log('dados.numeroParcelas:', dados.numeroParcelas);
            console.log('dados.taxaJuros:', dados.taxaJuros);
            console.log('dados.sistemaJuros:', dados.sistemaJuros);
            console.log('=== FIM EXTRAÇÃO PDF COMPLETO ===');

        } catch (error) {
            console.error('Erro na extração do PDF completo:', error);
        }
    }

    // Nova função para extrair dados cadastrais com texto pré-processado
    extrairDadosPdfSistemaComPreprocessamento(textoProcessado, dados) {
        try {
            console.log('Extraindo dados cadastrais com texto pré-processado...');
            
            // Dados principais com regex limitados por próximo campo
            dados.nome = this.extrairMatch(/Nome:\s*([^\n\r]+?)(?=\s*CPF:|$)/i, textoProcessado);
            dados.cpf = this.extrairMatch(/CPF:\s*([\d.-]+?)(?=\s*Data de Nascimento:|$)/i, textoProcessado);
            dados.dataNascimento = this.extrairMatch(/Data de Nascimento:\s*([\d\/]+?)(?=\s*Estado Civil:|$)/i, textoProcessado);
            dados.estadoCivil = this.extrairMatch(/Estado Civil:\s*([^\n\r]+?)(?=\s*Rua:|$)/i, textoProcessado);
            dados.telefone = this.extrairMatch(/Telefone:\s*([\d\s\(\)-]+?)(?=\s*E-mail:|$)/i, textoProcessado);
            dados.email = this.extrairMatch(/E-mail:\s*([^\n\r]+?)(?=\s*DADOS PROFISSIONAIS:|$)/i, textoProcessado);

            // Endereço agora separado em campos individuais
            dados.rua = this.extrairMatch(/Rua:\s*([^\n\r]+?)(?=\s*Número:|$)/i, textoProcessado);
            dados.numero = this.extrairMatch(/Número:\s*([^\n\r]+?)(?=\s*Complemento:|$)/i, textoProcessado);
            dados.complemento = this.extrairMatch(/Complemento:\s*([^\n\r]+?)(?=\s*Bairro:|$)/i, textoProcessado);
            dados.bairro = this.extrairMatch(/Bairro:\s*([^\n\r]+?)(?=\s*Cidade:|$)/i, textoProcessado);
            dados.cidade = this.extrairMatch(/Cidade:\s*([^\n\r]+?)(?=\s*Estado:|$)/i, textoProcessado);
            dados.estado = this.extrairMatch(/Estado:\s*([^\n\r]+?)(?=\s*CEP:|$)/i, textoProcessado);
            dados.cep = this.extrairMatch(/CEP:\s*([\d-]+?)(?=\s*Telefone:|$)/i, textoProcessado);

            // Dados profissionais
            dados.profissao = this.extrairMatch(/Profissão:\s*([^\n\r]+?)(?=\s*Local de Trabalho:|$)/i, textoProcessado);
            dados.trabalho = this.extrairMatch(/Local de Trabalho:\s*([^\n\r]+?)(?=\s*Renda Mensal:|$)/i, textoProcessado);
            dados.renda = this.extrairMatch(/Renda Mensal:\s*([\d.,]+?)(?=\s*Tempo de Emprego:|$)/i, textoProcessado);
            dados.tempoEmprego = this.extrairMatch(/Tempo de Emprego:\s*([^\n\r]+?)(?=\s*1ª REFERÊNCIA:|$)/i, textoProcessado);

            // Referências com parsing de seções usando campos separados
            const ref1Section = textoProcessado.match(/1ª REFERÊNCIA:([\s\S]*?)(?=2ª REFERÊNCIA|$)/i);
            if (ref1Section) {
                const ref1Texto = ref1Section[1];
                dados.referencia1Nome = this.extrairMatch(/Nome:\s*([^\n\r]+?)(?=\s*Telefone:|$)/i, ref1Texto);
                dados.referencia1Telefone = this.extrairMatch(/Telefone:\s*([\d\s\(\)-]+?)(?=\s*Rua:|$)/i, ref1Texto);
                dados.referencia1Rua = this.extrairMatch(/Rua:\s*([^\n\r]+?)(?=\s*Número:|$)/i, ref1Texto);
                dados.referencia1Numero = this.extrairMatch(/Número:\s*([^\n\r]+?)(?=\s*Bairro:|$)/i, ref1Texto);
                dados.referencia1Bairro = this.extrairMatch(/Bairro:\s*([^\n\r]+?)(?=\s*Cidade:|$)/i, ref1Texto);
                dados.referencia1Cidade = this.extrairMatch(/Cidade:\s*([^\n\r]+?)(?=\s*2ª REFERÊNCIA:|$)/i, ref1Texto);
            }

            const ref2Section = textoProcessado.match(/2ª REFERÊNCIA:([\s\S]*?)$/i);
            if (ref2Section) {
                const ref2Texto = ref2Section[1];
                dados.referencia2Nome = this.extrairMatch(/Nome:\s*([^\n\r]+?)(?=\s*Telefone:|$)/i, ref2Texto);
                dados.referencia2Telefone = this.extrairMatch(/Telefone:\s*([\d\s\(\)-]+?)(?=\s*Rua:|$)/i, ref2Texto);
                dados.referencia2Rua = this.extrairMatch(/Rua:\s*([^\n\r]+?)(?=\s*Número:|$)/i, ref2Texto);
                dados.referencia2Numero = this.extrairMatch(/Número:\s*([^\n\r]+?)(?=\s*Bairro:|$)/i, ref2Texto);
                dados.referencia2Bairro = this.extrairMatch(/Bairro:\s*([^\n\r]+?)(?=\s*Cidade:|$)/i, ref2Texto);
                dados.referencia2Cidade = this.extrairMatch(/Cidade:\s*([^\n\r]+?)$/i, ref2Texto);
            }

        } catch (error) {
            console.error('Erro na extração de dados cadastrais:', error);
        }
    }

    // Extração específica para PDF simples (sem taxa de juros)
    extrairDadosPdfSimples(texto, dados) {
        try {
            console.log('Extraindo dados de PDF simples com pré-processamento...');
            
            // Pré-processar texto para recriar quebras de linha
            const textoProcessado = this.preprocessarTextoPdf(texto);
            
            // Dados da simulação com regex melhorados
            const valorMatch = textoProcessado.match(/Valor do empréstimo:\s*R\$\s*([0-9,.]+?)(?=\s*Número de parcelas:|$)/i);
            const parcelasMatch = textoProcessado.match(/Número de parcelas:\s*(\d+?)(?=\s*TABELA|$)/i);

            if (valorMatch) dados.valorEmprestimo = valorMatch[1];
            if (parcelasMatch) dados.numeroParcelas = parcelasMatch[1];

            // Calcular data inicial de vencimento
            const dataInicial = this.calcularDataInicialVencimento(textoProcessado);
            if (dataInicial) dados.dataVencimentoInicial = dataInicial;

            // Extrair dados cadastrais com texto pré-processado
            this.extrairDadosPdfSistemaComPreprocessamento(textoProcessado, dados);

        } catch (error) {
            console.error('Erro na extração do PDF simples:', error);
        }
    }

    extrairDadosPdfSistema(texto, dados) {
        // Regex para dados pessoais no PDF do sistema
        const regexNome = /Nome:\s*([^\n\r]+)/i;
        const regexCpf = /CPF:\s*([\d\.\-]+)/i;
        const regexDataNasc = /Data de Nascimento:\s*(\d{2}\/\d{2}\/\d{4})/i;
        const regexEstadoCivil = /Estado Civil:\s*([^\n\r]+)/i;
        const regexTelefone = /Telefone:\s*(\([0-9]{2}\)\s*[0-9\-\s]+)/i;
        const regexEmail = /E-mail:\s*([^\n\r\s]+)/i;

        // Endereço separado em campos individuais
        const regexRua = /Rua:\s*([^\n\r]+)/i;
        const regexNumero = /Número:\s*([^\n\r]+)/i;
        const regexComplemento = /Complemento:\s*([^\n\r]+)/i;
        const regexBairro = /Bairro:\s*([^\n\r]+)/i;
        const regexCidade = /Cidade:\s*([^\-\n\r]+)(?:\s*\-\s*([A-Z]{2}))?/i;
        const regexCep = /CEP:\s*([\d\-]+)/i;

        // Dados profissionais
        const regexProfissao = /Profissão:\s*([^\n\r]+)/i;
        const regexTrabalho = /Local de Trabalho:\s*([^\n\r]+)/i;
        const regexRenda = /Renda Mensal:\s*([\d\.,]+)/i;
        const regexTempo = /Tempo de Emprego:\s*([^\n\r]+)/i;

        // Referências
        const regexRef1Nome = /1ª REFERÊNCIA:\s*\n\s*Nome:\s*([^\n\r]+)/i;
        const regexRef1Tel = /1ª REFERÊNCIA:[\s\S]*?Telefone:\s*(\([0-9]{2}\)\s*[0-9\-\s]+)/i;
        const regexRef1Rua = /1ª REFERÊNCIA:[\s\S]*?Rua:\s*([^\n\r]+)/i;
        const regexRef1Numero = /1ª REFERÊNCIA:[\s\S]*?Número:\s*([^\n\r]+)/i;
        const regexRef1Bairro = /1ª REFERÊNCIA:[\s\S]*?Bairro:\s*([^\n\r]+)/i;

        const regexRef2Nome = /2ª REFERÊNCIA:\s*\n\s*Nome:\s*([^\n\r]+)/i;
        const regexRef2Tel = /2ª REFERÊNCIA:[\s\S]*?Telefone:\s*(\([0-9]{2}\)\s*[0-9\-\s]+)/i;
        const regexRef2Rua = /2ª REFERÊNCIA:[\s\S]*?Rua:\s*([^\n\r]+)/i;
        const regexRef2Numero = /2ª REFERÊNCIA:[\s\S]*?Número:\s*([^\n\r]+)/i;
        const regexRef2Bairro = /2ª REFERÊNCIA:[\s\S]*?Bairro:\s*([^\n\r]+)/i;

        // Aplicar extrações
        dados.nome = this.extrairMatch(regexNome, texto);
        dados.cpf = this.extrairMatch(regexCpf, texto);
        dados.dataNascimento = this.extrairMatch(regexDataNasc, texto);
        dados.estadoCivil = this.extrairMatch(regexEstadoCivil, texto);
        dados.telefone = this.extrairMatch(regexTelefone, texto);
        dados.email = this.extrairMatch(regexEmail, texto);

        // Endereço separado
        dados.rua = this.extrairMatch(regexRua, texto);
        dados.numero = this.extrairMatch(regexNumero, texto);
        dados.complemento = this.extrairMatch(regexComplemento, texto);

        dados.bairro = this.extrairMatch(regexBairro, texto);
        
        const cidadeMatch = texto.match(regexCidade);
        if (cidadeMatch) {
            dados.cidade = cidadeMatch[1]?.trim() || '';
            dados.estado = cidadeMatch[2]?.trim() || '';
        }

        dados.cep = this.extrairMatch(regexCep, texto);

        // Dados profissionais
        dados.profissao = this.extrairMatch(regexProfissao, texto);
        dados.trabalho = this.extrairMatch(regexTrabalho, texto);
        dados.renda = this.extrairMatch(regexRenda, texto);
        dados.tempoEmprego = this.extrairMatch(regexTempo, texto);

        // Referências com campos separados
        dados.referencia1Nome = this.extrairMatch(regexRef1Nome, texto);
        dados.referencia1Telefone = this.extrairMatch(regexRef1Tel, texto);
        dados.referencia1Rua = this.extrairMatch(regexRef1Rua, texto);
        dados.referencia1Numero = this.extrairMatch(regexRef1Numero, texto);
        dados.referencia1Bairro = this.extrairMatch(regexRef1Bairro, texto);

        dados.referencia2Nome = this.extrairMatch(regexRef2Nome, texto);
        dados.referencia2Telefone = this.extrairMatch(regexRef2Tel, texto);
        dados.referencia2Rua = this.extrairMatch(regexRef2Rua, texto);
        dados.referencia2Numero = this.extrairMatch(regexRef2Numero, texto);
        dados.referencia2Bairro = this.extrairMatch(regexRef2Bairro, texto);
    }

    extrairDadosFormulario(texto, dados) {
        // Regex para formulário copiado (formato mais livre)
        const regexNome = /Nome:\s*([^\n\r]+)/i;
        const regexCpf = /CPF:\s*([\d\.\-]*\d)/i;
        const regexDataNasc = /Data nascimento:\s*(\d{2}\/\d{2}\/\d{4})/i;
        const regexEstadoCivil = /Estado Civil:\s*([^\n\r]+)/i;
        const regexTelefone = /Telefone:\s*(\([0-9]{2}\)[0-9\-\s]*)/i;
        const regexEmail = /E-mail:\s*([^\n\r\s]+)/i;

        // Endereço separado
        const regexRua = /Endereço:\s*([^\n\r]+)/i;
        const regexNumero = /Número:\s*([^\n\r]+)/i;
        const regexComplemento = /Complemento:\s*([^\n\r]+)/i;
        const regexBairro = /Bairro:\s*([^\n\r]+)/i;
        const regexCidade = /Cidade:\s*([^\n\r]+)/i;
        const regexEstado = /Estado:\s*([^\n\r]+)/i;
        const regexCep = /CEP:\s*([\d\-]+)/i;

        // Dados profissionais
        const regexTrabalho = /Local de trabalho:\s*([^\n\r]+)/i;
        const regexProfissao = /Profissão:\s*([^\n\r]+)/i;
        const regexRenda = /Renda Mensal:\s*R\$\s*([\d\.,]+)/i;
        const regexTempo = /Tempo de emprego:\s*([^\n\r]+)/i;

        // Referências (1º REREFENCIA pode ter typo)
        const regexRef1Nome = /1[ºo°]\s*REFER[EÊ]NCIA[\s\S]*?Nome:\s*([^\n\r]+)/i;
        const regexRef1Rua = /1[ºo°]\s*REFER[EÊ]NCIA[\s\S]*?Rua:\s*([^\n\r]+)/i;
        const regexRef1Numero = /1[ºo°]\s*REFER[EÊ]NCIA[\s\S]*?Numero:\s*([^\n\r]+)/i;
        const regexRef1Bairro = /1[ºo°]\s*REFER[EÊ]NCIA[\s\S]*?Bairro:\s*([^\n\r]+)/i;
        const regexRef1Tel = /1[ºo°]\s*REFER[EÊ]NCIA[\s\S]*?Telefone:\s*(\([0-9]{2}\)[0-9\-\s]*)/i;

        const regexRef2Nome = /2[ºo°]\s*REFER[EÊ]NCIA[\s\S]*?Nome:\s*([^\n\r]+)/i;
        const regexRef2Rua = /2[ºo°]\s*REFER[EÊ]NCIA[\s\S]*?Rua:\s*([^\n\r]+)/i;
        const regexRef2Numero = /2[ºo°]\s*REFER[EÊ]NCIA[\s\S]*?Numero:\s*([^\n\r]+)/i;
        const regexRef2Bairro = /2[ºo°]\s*REFER[EÊ]NCIA[\s\S]*?Bairro:\s*([^\n\r]+)/i;
        const regexRef2Tel = /2[ºo°]\s*REFER[EÊ]NCIA[\s\S]*?Telefone:\s*(\([0-9]{2}\)[0-9\-\s]*)/i;

        // Aplicar extrações
        dados.nome = this.extrairMatch(regexNome, texto);
        dados.cpf = this.extrairMatch(regexCpf, texto);
        dados.dataNascimento = this.extrairMatch(regexDataNasc, texto);
        dados.estadoCivil = this.extrairMatch(regexEstadoCivil, texto);
        dados.telefone = this.extrairMatch(regexTelefone, texto);
        dados.email = this.extrairMatch(regexEmail, texto);

        // Endereço
        dados.rua = this.extrairMatch(regexRua, texto);
        dados.numero = this.extrairMatch(regexNumero, texto);
        dados.complemento = this.extrairMatch(regexComplemento, texto);
        dados.bairro = this.extrairMatch(regexBairro, texto);
        dados.cidade = this.extrairMatch(regexCidade, texto);
        dados.estado = this.extrairMatch(regexEstado, texto);
        dados.cep = this.extrairMatch(regexCep, texto);

        // Dados profissionais
        dados.trabalho = this.extrairMatch(regexTrabalho, texto);
        dados.profissao = this.extrairMatch(regexProfissao, texto);
        dados.renda = this.extrairMatch(regexRenda, texto);
        dados.tempoEmprego = this.extrairMatch(regexTempo, texto);

        // Referências
        dados.referencia1Nome = this.extrairMatch(regexRef1Nome, texto);
        dados.referencia1Rua = this.extrairMatch(regexRef1Rua, texto);
        dados.referencia1Numero = this.extrairMatch(regexRef1Numero, texto);
        dados.referencia1Bairro = this.extrairMatch(regexRef1Bairro, texto);
        dados.referencia1Telefone = this.extrairMatch(regexRef1Tel, texto);

        dados.referencia2Nome = this.extrairMatch(regexRef2Nome, texto);
        dados.referencia2Rua = this.extrairMatch(regexRef2Rua, texto);
        dados.referencia2Numero = this.extrairMatch(regexRef2Numero, texto);
        dados.referencia2Bairro = this.extrairMatch(regexRef2Bairro, texto);
        dados.referencia2Telefone = this.extrairMatch(regexRef2Tel, texto);
    }

    extrairMatch(regex, texto) {
        const match = texto.match(regex);
        return match ? match[1]?.trim() || '' : '';
    }

    exibirPreview(dados) {
        if (!this.dataPreview || !this.previewContent) return;

        const campos = [
            { label: 'Nome', value: dados.nome },
            { label: 'CPF', value: dados.cpf },
            { label: 'Data Nascimento', value: dados.dataNascimento },
            { label: 'Estado Civil', value: dados.estadoCivil },
            { label: 'Telefone', value: dados.telefone },
            { label: 'E-mail', value: dados.email },
            { label: 'Rua', value: dados.rua },
            { label: 'Número', value: dados.numero },
            { label: 'Complemento', value: dados.complemento },
            { label: 'Bairro', value: dados.bairro },
            { label: 'Cidade', value: dados.cidade },
            { label: 'Estado', value: dados.estado },
            { label: 'CEP', value: dados.cep },
            { label: 'Local Trabalho', value: dados.trabalho },
            { label: 'Profissão', value: dados.profissao },
            { label: 'Renda', value: dados.renda },
            { label: 'Tempo Emprego', value: dados.tempoEmprego },
            { label: '1ª Ref. Nome', value: dados.referencia1Nome },
            { label: '1ª Ref. Telefone', value: dados.referencia1Telefone },
            { label: '1ª Ref. Rua', value: dados.referencia1Rua },
            { label: '1ª Ref. Número', value: dados.referencia1Numero },
            { label: '1ª Ref. Bairro', value: dados.referencia1Bairro },
            { label: '2ª Ref. Nome', value: dados.referencia2Nome },
            { label: '2ª Ref. Telefone', value: dados.referencia2Telefone },
            { label: '2ª Ref. Rua', value: dados.referencia2Rua },
            { label: '2ª Ref. Número', value: dados.referencia2Numero },
            { label: '2ª Ref. Bairro', value: dados.referencia2Bairro }
        ];

        let html = '';
        let camposEncontrados = 0;

        campos.forEach(campo => {
            const value = campo.value || '';
            const isEmpty = !value;
            
            if (!isEmpty) camposEncontrados++;

            html += `
                <div class="preview-item">
                    <span class="preview-label">${campo.label}:</span>
                    <span class="preview-value ${isEmpty ? 'preview-empty' : ''}">${
                        isEmpty ? '(não encontrado)' : value
                    }</span>
                </div>
            `;
        });

        this.previewContent.innerHTML = html;
        this.dataPreview.style.display = 'block';

        // Habilitar botão de importação se houver dados
        if (this.importBtn) {
            this.importBtn.disabled = camposEncontrados === 0;
        }

        // Rolar para o preview
        this.dataPreview.scrollIntoView({ behavior: 'smooth' });
    }

    importarDados() {
        try {
            const abaAtiva = this.tabPdf?.classList.contains('active') ? 'pdf' : 'formulario';
            const texto = abaAtiva === 'pdf' ? 
                this.pdfTextArea?.value.trim() || '' : 
                this.formularioTextArea?.value.trim() || '';

            if (!texto) {
                alert('Nenhum texto encontrado para importar.');
                return;
            }

            console.log('Importando dados com sistema inteligente...');
            const dadosExtraidos = this.extrairDadosTexto(texto, 'auto');
            
            // Usar nova função aplicarDadosJson com sistema inteligente
            this.aplicarDadosJson(dadosExtraidos);
            
            alert('Dados importados com sucesso!');
            this.fecharModalImportacao();

        } catch (error) {
            console.error('Erro ao importar dados:', error);
            alert('Erro ao importar dados. Tente novamente.');
        }
    }

    // Nova função aplicarDadosJson para sistema de importação inteligente
    aplicarDadosJson(dados) {
        console.log('🚀 FUNÇÃO aplicarDadosJson() CHAMADA');
        console.log('🔍 Dados recebidos:', dados);
        try {
            console.log('=== INÍCIO APLICAÇÃO DOS DADOS ===');
            console.log('Aplicando dados extraídos pelo sistema inteligente:', dados);
            console.log('Função aplicarDadosJson() executando - versão com logs detalhados');

            // Dados principais da simulação (IDs corretos da interface)
            console.log('=== PREENCHENDO CAMPOS PRINCIPAIS ===');
            if (dados.valorEmprestimo) {
                console.log('Preenchendo valorEmprestimo com:', dados.valorEmprestimo);
                // Limpar formatação: remover pontos, vírgulas e deixar apenas números
                const valorLimpo = String(dados.valorEmprestimo).replace(/[.,]/g, '');
                this.preencherCampo('valorEmprestimo', valorLimpo);
            }
            if (dados.numeroParcelas) {
                console.log('Preenchendo numeroParcelas com:', dados.numeroParcelas);
                this.preencherCampo('numeroParcelas', String(dados.numeroParcelas));
            }
            if (dados.taxaJuros) {
                console.log('Preenchendo taxaJuros com:', dados.taxaJuros);
                // Limpar formatação: remover vírgulas e deixar apenas números
                const taxaLimpa = String(dados.taxaJuros).replace(/,/g, '');
                this.preencherCampo('taxaJuros', taxaLimpa);
            }

            // Preencher data de vencimento inicial se disponível
            if (dados.dataVencimentoInicial) {
                console.log('Preenchendo dataInicial com:', dados.dataVencimentoInicial);
                // Limpar formatação: remover barras e deixar apenas números
                const dataLimpa = dados.dataVencimentoInicial.replace(/\//g, '');
                this.preencherCampo('dataInicial', dataLimpa);
            }

            // Campos de nome e CPF na tela principal  
            this.preencherCampo('nomeCompleto', dados.nome || '');
            this.preencherCampo('cpfCompleto', dados.cpf ? dados.cpf.replace(/[.-]/g, '') : '');

            // Verificar se há dados cadastrais completos para expandir formulário
            const temDadosCadastrais = dados.rua || dados.telefone || dados.email || 
                                     dados.dataNascimento || dados.profissao || 
                                     dados.referencia1Nome || dados.referencia2Nome;

            if (temDadosCadastrais) {
                console.log('Dados cadastrais detectados, expandindo formulário...');
                this.expandirFormularioCompleto();
                
                // Aguardar expansão antes de preencher
                setTimeout(() => {
                    // Dados pessoais completos
                    this.preencherCampo('dataNascimento', dados.dataNascimento ? dados.dataNascimento.replace(/\//g, '') : '');
                    this.preencherCampo('estadoCivil', dados.estadoCivil || '');
                    this.preencherCampo('telefone', dados.telefone ? dados.telefone.replace(/[()\ -]/g, '') : '');
                    this.preencherCampo('email', dados.email || '');
                    
                    // Endereço completo
                    this.preencherCampo('endereco', dados.rua || '');
                    this.preencherCampo('numeroEndereco', dados.numero || '');
                    this.preencherCampo('complemento', dados.complemento || '');
                    this.preencherCampo('bairro', dados.bairro || '');
                    this.preencherCampo('cidade', dados.cidade || '');
                    this.preencherCampo('estado', dados.estado || '');
                    this.preencherCampo('cep', dados.cep ? dados.cep.replace(/[.-]/g, '') : '');
                    
                    // Dados profissionais
                    this.preencherCampo('trabalho', dados.trabalho || '');
                    this.preencherCampo('profissao', dados.profissao || '');
                    this.preencherCampo('renda', dados.renda ? dados.renda.replace(/[.,]/g, '') : '');
                    this.preencherCampo('tempoEmprego', dados.tempoEmprego || '');
                    
                    // Referências (limpando telefones)
                    this.preencherCampo('referencia1Nome', dados.referencia1Nome || '');
                    this.preencherCampo('referencia1Telefone', dados.referencia1Telefone ? dados.referencia1Telefone.replace(/[()\ -]/g, '') : '');
                    this.preencherCampo('referencia1Endereco', dados.referencia1Rua || '');
                    this.preencherCampo('referencia1Bairro', dados.referencia1Bairro || '');
                    this.preencherCampo('referencia1Cidade', dados.referencia1Cidade || '');
                    
                    this.preencherCampo('referencia2Nome', dados.referencia2Nome || '');
                    this.preencherCampo('referencia2Telefone', dados.referencia2Telefone ? dados.referencia2Telefone.replace(/[()\ -]/g, '') : '');
                    this.preencherCampo('referencia2Endereco', dados.referencia2Rua || '');
                    this.preencherCampo('referencia2Bairro', dados.referencia2Bairro || '');
                    this.preencherCampo('referencia2Cidade', dados.referencia2Cidade || '');
                    
                    // Aplicar formatação automática
                    this.aplicarFormatacaoImportados();
                    
                    console.log('Formulário completo preenchido com sucesso');
                }, 300);
            }

            // Aplicar formatação nos campos da tela principal
            this.aplicarFormatacaoImportados();

            // Configurar sistema de juros se disponível no PDF completo
            if (dados.sistemaJuros) {
                console.log('Sistema de juros detectado:', dados.sistemaJuros);
                // Mapear sistema de juros para configuração administrativa
                const mapeamentoSistemas = {
                    'Juros Simples': 'simples',
                    'Juros Compostos Diários': 'compostos-diarios',
                    'Juros Compostos Mensais': 'compostos-mensal',
                    'Pro-rata Real': 'pro-rata-real'
                };
                
                const sistemaConfig = mapeamentoSistemas[dados.sistemaJuros];
                if (sistemaConfig) {
                    // Atualizar configuração do sistema
                    this.configuracoes = this.configuracoes || {};
                    this.configuracoes.sistemaJuros = sistemaConfig;
                    this.salvarApenasConfiguracoes();
                }
            }

            console.log('Importação de dados concluída com sucesso');
            this.updateFileStatus('Dados importados e aplicados com sucesso!', 'success');

        } catch (error) {
            console.error('=== ERRO CRÍTICO NA APLICAÇÃO DOS DADOS ===');
            console.error('Erro detalhado:', error);
            console.error('Stack trace:', error.stack);
            console.error('Dados que causaram erro:', dados);
            this.updateFileStatus('Erro ao aplicar dados importados: ' + error.message, 'error');
        }
    }

    preencherFormulario(dados) {
        // Função mantida para compatibilidade - redireciona para aplicarDadosJson
        this.aplicarDadosJson(dados);
    }

    preencherCampo(id, valor) {
        console.log(`=== PREENCHENDO CAMPO ===`);
        console.log(`ID: ${id}`);
        console.log(`Valor: ${valor}`);
        
        if (!valor) {
            console.log(`Valor vazio para ${id}, pulando`);
            return;
        }

        const campo = document.getElementById(id);
        console.log(`Elemento encontrado:`, campo !== null);
        
        if (campo) {
            console.log(`Valor anterior:`, campo.value);
            campo.value = valor;
            console.log(`Valor definido:`, campo.value);
            
            // Disparar evento input para formatação automática
            campo.dispatchEvent(new Event('input', { bubbles: true }));
            console.log(`Evento input disparado para ${id}`);
            
            // Verificar valor após formatação
            setTimeout(() => {
                console.log(`Valor FINAL em ${id}:`, campo.value);
            }, 100);
        } else {
            console.error(`ERRO: Elemento '${id}' não encontrado!`);
            // Listar IDs disponíveis
            const todosIds = Array.from(document.querySelectorAll('[id]')).map(el => el.id);
            const idsRelevantes = todosIds.filter(id => 
                id.includes('valor') || id.includes('parcela') || id.includes('taxa') || 
                id.includes('data') || id.includes('nome') || id.includes('cpf')
            );
            console.log('IDs relevantes disponíveis:', idsRelevantes);
        }
        console.log(`=== FIM PREENCHIMENTO ===`);
    }

    expandirFormularioCompleto() {
        const container = document.getElementById('formCompletoContainer');
        const toggleBtn = document.getElementById('toggleFormCompleto');
        const icon = toggleBtn?.querySelector('.toggle-icon');
        
        if (container && container.style.display !== 'block') {
            container.style.display = 'block';
            if (toggleBtn) toggleBtn.classList.add('expanded');
            if (icon) icon.textContent = '▲';
        }
    }

    aplicarFormatacaoImportados() {
        // Aplicar formatação de CPF
        const cpfField = document.getElementById('cpfCompleto');
        if (cpfField && cpfField.value) {
            this.formatarCpf(cpfField);
        }

        // Aplicar formatação de telefone
        const telefoneField = document.getElementById('telefoneCompleto');
        if (telefoneField && telefoneField.value) {
            this.formatarTelefone(telefoneField);
        }

        // Aplicar formatação de CEP
        const cepField = document.getElementById('cep');
        if (cepField && cepField.value) {
            this.formatarCep(cepField);
        }

        // Aplicar formatação de data
        const dataField = document.getElementById('dataNascimento');
        if (dataField && dataField.value) {
            this.formatarData(dataField);
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