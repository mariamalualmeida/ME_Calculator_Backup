/**
 * ME EMPREENDIMENTOS - Simulador de Empréstimos
 * Implementa cálculo com pró-rata, IGPM e área administrativa
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
        
        return loadedConfig;
    }

    salvarConfiguracoes() {
        localStorage.setItem('simulador_config', JSON.stringify(this.configuracoes));
    }

    initializeElements() {
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

        this.taxaJurosField.addEventListener('input', (e) => {
            this.formatarPercentual(e.target);
            this.limparResultado();
        });
        
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

    formatarPercentual(input) {
        let valor = input.value.replace(/[^\d,]/g, '');
        
        // Se valor está vazio, deixar vazio
        if (valor === '') {
            input.value = '';
            return;
        }
        
        // Permitir apenas uma vírgula
        const virgulas = valor.split(',');
        if (virgulas.length > 2) {
            valor = virgulas[0] + ',' + virgulas.slice(1).join('');
        }
        
        // Limitar casas decimais a 2
        if (virgulas.length === 2 && virgulas[1].length > 2) {
            valor = virgulas[0] + ',' + virgulas[1].substring(0, 2);
        }
        
        input.value = valor;
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

    calcularParcela(valor, juros, nParcelas, diasExtra = 0, igpmMensal = 0) {
        // Taxa efetiva (juros + IGPM)
        const taxaEfetiva = (juros + igpmMensal) / 100;
        
        // Prestação base: P = Valor × (1 + JurosMensal)^N ÷ N
        const prestacaoBase = (valor * Math.pow(1 + taxaEfetiva, nParcelas)) / nParcelas;
        
        // Método da primeira parcela maior - juros dos dias extras apenas na primeira parcela
        if (diasExtra !== 0) {
            const taxaDiaria = taxaEfetiva / 30; // Taxa mensal dividida por 30 dias
            const jurosProrrata = valor * taxaDiaria * diasExtra;
            const primeiraParcela = prestacaoBase + jurosProrrata;
            
            return {
                parcelaNormal: prestacaoBase,
                primeiraParcela: primeiraParcela,
                jurosDiasExtras: jurosProrrata,
                diasExtra: diasExtra
            };
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
            return;
        }

        // Cálculo com data e pró-rata
        const dataSimulacao = new Date();
        const dataInicial = this.parseData(this.dataInicialField.value);
        let diasExtra = 0;

        if (dataInicial) {
            const diffTime = dataInicial.getTime() - dataSimulacao.getTime();
            diasExtra = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        }

        // IGPM mensal (anual dividido por 12)
        const igpmMensal = this.configuracoes.igpmAnual / 12;

        // Calcular prestação
        const resultadoCalculo = this.calcularParcela(valor, juros, nParcelas, diasExtra, igpmMensal);
        
        // Mostrar resultado
        this.mostrarResultado(resultadoCalculo, valor, nParcelas, juros);
        this.rolarParaResultado();
    }

    validarCampos(valor, nParcelas, juros) {
        // Verificar se regras estão desabilitadas para admin
        if (this.configuracoes.desabilitarRegras && this.configuracoes.isAdmin) {
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
            // Primeira parcela maior
            const primeiraParcela = formatarMoeda(resultadoCalculo.primeiraParcela);
            const demaisParcelas = formatarMoeda(resultadoCalculo.parcelaNormal);
            const diasExtras = resultadoCalculo.diasExtra;
            const jurosExtras = formatarMoeda(resultadoCalculo.jurosDiasExtras);
            
            this.resultValue.innerHTML = `
                <div style="margin-bottom: 12px;">
                    <strong>1ª parcela:</strong> ${primeiraParcela}
                    <br><strong>Demais ${nParcelas - 1} parcelas:</strong> ${demaisParcelas}
                </div>
                <div style="font-size: 14px; color: #666; margin-top: 8px;">
                    Dias extras: ${diasExtras} | Juros extras: ${jurosExtras}
                </div>
            `;
        } else {
            // Parcelas iguais
            const valorFormatado = formatarMoeda(resultadoCalculo.parcelaNormal);
            this.resultValue.innerHTML = `
                <strong>${nParcelas} parcelas de:</strong> ${valorFormatado}
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
        document.getElementById('configModal').style.display = 'flex';
        
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
        html += '<button onclick="simulador.salvarLimitesAdmin()" style="margin-top: 16px; padding: 8px 16px; background: #6750a4; color: white; border: none; border-radius: 4px; cursor: pointer;">Salvar Limites</button>';
        html += '</div>';
        
        table.innerHTML = html;
        panel.style.display = 'block';
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
        
        this.configuracoes.limitesPersonalizados = novosLimites;
        this.salvarConfiguracoes();
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
            
            // Dados do cliente (somente se preenchidos)
            let yInicial = 50;
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
            
            // Dados do usuário (somente se tiver nome)
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
                doc.text(`1ª parcela: R$ ${resultadoCalculo.primeiraParcela.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, 20, yInicial);
                yInicial += 12;
                doc.text(`Demais ${nParcelas - 1} parcelas: R$ ${resultadoCalculo.parcelaNormal.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, 20, yInicial);
                yInicial += 12;
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(12);
                doc.text(`(Dias extras: ${resultadoCalculo.diasExtra} | Juros extras: R$ ${resultadoCalculo.jurosDiasExtras.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})})`, 20, yInicial);
                yInicial += 12;
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(14);
            } else {
                doc.text(`Valor da prestação: R$ ${resultadoCalculo.parcelaNormal.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, 20, yInicial);
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
                
                doc.text(i.toString().padStart(2, '0'), 35, yPos, { align: 'center' });
                doc.text(dataVencimento.toLocaleDateString('pt-BR'), 105, yPos, { align: 'center' });
                doc.text(`R$ ${prestacao.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, 165, yPos, { align: 'center' });
                
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
}

// Inicializar aplicação
let simulator;
document.addEventListener('DOMContentLoaded', () => {
    simulator = new SimuladorEmprestimos();
});