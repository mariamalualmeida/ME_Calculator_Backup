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
            adminUser: 'Migueis',
            adminPassword: 'Laila@10042009'
        };
        const loadedConfig = config ? { ...defaultConfig, ...JSON.parse(config) } : defaultConfig;
        
        // Aplicar tema na inicialização
        this.aplicarTema(loadedConfig.themeMode);
        
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

        this.taxaJurosField.addEventListener('input', (e) => {
            this.formatarPercentual(e.target);
            this.limparResultado();
        });

        this.dataInicialField.addEventListener('input', (e) => {
            this.formatarData(e.target);
            this.limparResultado();
        });

        this.numeroParcelasField.addEventListener('input', () => {
            this.limparResultado();
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
        if (valor === '') {
            input.value = '';
            return;
        }

        // Não adicionar zeros à esquerda desnecessários
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
        
        // Permitir apenas uma vírgula
        const virgulas = valor.split(',');
        if (virgulas.length > 2) {
            valor = virgulas[0] + ',' + virgulas[1];
        }
        
        // Limitar casas decimais
        if (virgulas.length === 2 && virgulas[1].length > 2) {
            valor = virgulas[0] + ',' + virgulas[1].substring(0, 2);
        }
        
        input.value = valor;
    }

    formatarData(input) {
        let valor = input.value.replace(/\D/g, '');
        
        if (valor.length >= 2) {
            valor = valor.substring(0, 2) + '/' + valor.substring(2);
        }
        if (valor.length >= 5) {
            valor = valor.substring(0, 5) + '/' + valor.substring(5, 9);
        }
        
        input.value = valor;
    }

    obterValorNumerico(valorFormatado) {
        if (!valorFormatado) return 0;
        return parseFloat(valorFormatado.replace(/\./g, '').replace(',', '.')) || 0;
    }

    obterPercentualNumerico(percentualFormatado) {
        if (!percentualFormatado) return 0;
        return parseFloat(percentualFormatado.replace(',', '.')) || 0;
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
        
        // Cálculo pró-rata se houver diferença de dias
        if (diasExtra !== 0) {
            const taxaDiaria = taxaEfetiva / 30; // Taxa mensal dividida por 30 dias
            const jurosProrrata = valor * taxaDiaria * diasExtra;
            const valorAjustado = valor + jurosProrrata;
            return (valorAjustado * Math.pow(1 + taxaEfetiva, nParcelas)) / nParcelas;
        }
        
        return prestacaoBase;
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
        const valorPrestacao = this.calcularParcela(valor, juros, nParcelas, diasExtra, igpmMensal);
        
        // Mostrar resultado
        this.mostrarResultado(valorPrestacao);
        this.rolarParaResultado();
    }

    validarCampos(valor, nParcelas, juros) {
        // Validar número de parcelas
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

    mostrarResultado(valor) {
        const valorFormatado = new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(valor);

        this.resultValue.textContent = valorFormatado;
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
            document.querySelector('.result-section').scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }, 100);
    }

    abrirConfiguracoes() {
        // Carregar valores atuais
        document.getElementById('nomeUsuario').value = this.configuracoes.nomeUsuario || '';
        document.getElementById('themeMode').value = this.configuracoes.themeMode || 'light';
        document.getElementById('igpmAnual').value = this.configuracoes.igpmAnual || '';
        
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
        this.configuracoes.igpmAnual = parseFloat(document.getElementById('igpmAnual').value.replace(',', '.')) || 0;
        
        this.aplicarTema(this.configuracoes.themeMode);
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
        html += '<button onclick="simulator.salvarLimitesAdmin()" style="margin-top: 16px; padding: 8px 16px; background: #6750a4; color: white; border: none; border-radius: 4px; cursor: pointer;">Salvar Limites</button>';
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
        if (this.resultCard.style.display === 'none') return;
        
        const valor = this.obterValorNumerico(this.valorEmprestimoField.value);
        const nParcelas = parseInt(this.numeroParcelasField.value);
        const juros = this.obterPercentualNumerico(this.taxaJurosField.value);
        const prestacao = this.obterValorNumerico(this.resultValue.textContent);
        
        this.gerarPdfSimples(valor, nParcelas, juros, prestacao);
    }

    gerarPdfSimples(valor, nParcelas, juros, prestacao) {
        // Simulação simples de exportação PDF
        const dataSimulacao = new Date().toLocaleDateString('pt-BR');
        const nomeUsuario = this.configuracoes.nomeUsuario || 'Cliente';
        
        let conteudo = `ME EMPREENDIMENTOS\n`;
        conteudo += `Relatório de Simulação de Empréstimo\n\n`;
        conteudo += `Cliente: ${nomeUsuario}\n`;
        conteudo += `Data da simulação: ${dataSimulacao}\n\n`;
        conteudo += `Valor do empréstimo: R$ ${valor.toLocaleString('pt-BR', {minimumFractionDigits: 2})}\n`;
        conteudo += `Taxa de juros: ${juros.toFixed(2).replace('.', ',')}%\n`;
        conteudo += `Número de parcelas: ${nParcelas}\n`;
        conteudo += `Valor da prestação: R$ ${prestacao.toLocaleString('pt-BR', {minimumFractionDigits: 2})}\n\n`;
        
        conteudo += `TABELA DE PARCELAS:\n`;
        
        // Calcular datas de vencimento - começar 30 dias após simulação ou usar data preenchida
        let dataBase;
        if (this.dataInicialField.value) {
            dataBase = this.parseData(this.dataInicialField.value);
        } else {
            dataBase = new Date();
            dataBase.setDate(dataBase.getDate() + 30); // 30 dias após simulação
        }
        
        for (let i = 1; i <= nParcelas; i++) {
            const dataVencimento = new Date(dataBase);
            dataVencimento.setMonth(dataVencimento.getMonth() + i - 1);
            
            conteudo += `${i.toString().padStart(2, '0')}  ${dataVencimento.toLocaleDateString('pt-BR')}  R$ ${prestacao.toLocaleString('pt-BR', {minimumFractionDigits: 2})}\n`;
        }
        
        // Criar e baixar arquivo
        const blob = new Blob([conteudo], { type: 'text/plain;charset=utf-8' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `simulacao_emprestimo_${Date.now()}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        alert('Relatório exportado para Downloads!');
    }

    aplicarTema(theme) {
        document.documentElement.setAttribute('data-theme', theme);
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
}

// Inicializar aplicação
let simulator;
document.addEventListener('DOMContentLoaded', () => {
    simulator = new SimuladorEmprestimos();
});