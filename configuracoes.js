/**
 * ME EMPREENDIMENTOS - Sistema de Configurações Unificadas
 * Gerencia configurações do simulador, chat IA e interface
 */

class ConfiguracoesController {
    constructor() {
        this.checkAuthentication();
        this.loadSettings();
        this.setupEventListeners();
        this.loadConfiguracoes();
    }

    checkAuthentication() {
        const isLoggedIn = localStorage.getItem('isLoggedIn');
        if (isLoggedIn !== 'true') {
            window.location.href = 'login.html';
            return;
        }
    }

    loadSettings() {
        // Aplicar tema armazenado
        const savedTheme = localStorage.getItem('theme') || 'light';
        const savedColorTheme = localStorage.getItem('colorTheme') || 'blue';
        document.documentElement.setAttribute('data-theme', savedTheme);
        document.documentElement.setAttribute('data-color-theme', savedColorTheme);
    }

    setupEventListeners() {
        // Event listeners para mudança de tema e cor
        document.querySelectorAll('input[name="theme"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.changeTheme(e.target.value);
            });
        });

        document.querySelectorAll('input[name="colorTheme"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.changeColorTheme(e.target.value);
            });
        });

        // Formatação de campos de percentual
        document.querySelectorAll('.percentage-input').forEach(input => {
            input.addEventListener('blur', (e) => {
                this.formatarPercentual(e.target);
            });
        });
    }

    switchTab(tabName) {
        // Remover active de todas as abas
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

        // Ativar aba selecionada
        document.querySelector(`[onclick="switchTab('${tabName}')"]`).classList.add('active');
        document.getElementById(`tab-${tabName}`).classList.add('active');
    }

    loadConfiguracoes() {
        // Carregar configurações do simulador
        const savedConfig = localStorage.getItem('simuladorConfig');
        if (savedConfig) {
            const config = JSON.parse(savedConfig);
            
            // Sistema de juros
            if (config.sistemaJuros) {
                document.getElementById('sistemaJuros').value = config.sistemaJuros;
            }
            
            // Regras de limite
            if (config.regraLimites) {
                document.getElementById('regraLimites').value = config.regraLimites;
            }
            
            // Limites de juros
            if (config.limites) {
                document.getElementById('min1-3').value = config.limites.min1_3 || '15,00';
                document.getElementById('max1-3').value = config.limites.max1_3 || '30,00';
                document.getElementById('min4-15').value = config.limites.min4_15 || '15,00';
                document.getElementById('max4-15').value = config.limites.max4_15 || '24,00';
            }
            
            // IGPM
            if (config.igpmMensal !== undefined) {
                document.getElementById('igpmMensal').value = config.igpmMensal;
            }
            
            // PDF
            if (config.mostrarJurosPdf !== undefined) {
                document.getElementById('mostrarJurosPdf').checked = config.mostrarJurosPdf;
            }
        }

        // Carregar configurações do chat
        const chatConfig = localStorage.getItem('chatConfig');
        if (chatConfig) {
            const config = JSON.parse(chatConfig);
            
            if (config.openaiKey) document.getElementById('openaiKey').value = config.openaiKey;
            if (config.claudeKey) document.getElementById('claudeKey').value = config.claudeKey;
            if (config.geminiKey) document.getElementById('geminiKey').value = config.geminiKey;
            if (config.grokKey) document.getElementById('grokKey').value = config.grokKey;
            if (config.defaultProvider) document.getElementById('defaultProvider').value = config.defaultProvider;
            if (config.systemPrompt) document.getElementById('systemPrompt').value = config.systemPrompt;
        }

        // Carregar configurações da interface
        const currentTheme = localStorage.getItem('theme') || 'light';
        const currentColorTheme = localStorage.getItem('colorTheme') || 'blue';
        
        document.querySelector(`input[name="theme"][value="${currentTheme}"]`).checked = true;
        document.querySelector(`input[name="colorTheme"][value="${currentColorTheme}"]`).checked = true;
    }

    saveConfiguracoes() {
        // Salvar configurações do simulador
        const simuladorConfig = {
            sistemaJuros: document.getElementById('sistemaJuros').value,
            regraLimites: document.getElementById('regraLimites').value,
            limites: {
                min1_3: document.getElementById('min1-3').value,
                max1_3: document.getElementById('max1-3').value,
                min4_15: document.getElementById('min4-15').value,
                max4_15: document.getElementById('max4-15').value
            },
            igpmMensal: document.getElementById('igpmMensal').value,
            mostrarJurosPdf: document.getElementById('mostrarJurosPdf').checked
        };

        // Salvar configurações do chat
        const chatConfig = {
            openaiKey: document.getElementById('openaiKey').value,
            claudeKey: document.getElementById('claudeKey').value,
            geminiKey: document.getElementById('geminiKey').value,
            grokKey: document.getElementById('grokKey').value,
            defaultProvider: document.getElementById('defaultProvider').value,
            systemPrompt: document.getElementById('systemPrompt').value
        };

        // Salvar no localStorage
        localStorage.setItem('simuladorConfig', JSON.stringify(simuladorConfig));
        localStorage.setItem('chatConfig', JSON.stringify(chatConfig));

        // Mostrar confirmação
        this.showToast('Configurações salvas com sucesso!', 'success');
    }

    changeTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }

    changeColorTheme(colorTheme) {
        document.documentElement.setAttribute('data-color-theme', colorTheme);
        localStorage.setItem('colorTheme', colorTheme);
    }

    togglePassword(fieldId) {
        const field = document.getElementById(fieldId);
        const icon = field.nextElementSibling.querySelector('.password-icon');
        
        if (field.type === 'password') {
            field.type = 'text';
            icon.textContent = '○';
        } else {
            field.type = 'password';
            icon.textContent = '●';
        }
    }

    formatarPercentual(input) {
        let valor = input.value.replace(/[^\d,.-]/g, '');
        valor = valor.replace('.', ',');
        
        if (valor && !isNaN(parseFloat(valor.replace(',', '.')))) {
            const num = parseFloat(valor.replace(',', '.'));
            input.value = num.toFixed(2).replace('.', ',');
        }
    }

    goBack() {
        window.location.href = 'dashboard.html';
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-weight: bold;
            z-index: 10000;
            animation: slideIn 0.3s ease-out;
        `;
        
        if (type === 'success') {
            toast.style.background = 'linear-gradient(135deg, #10b981, #059669)';
        } else if (type === 'error') {
            toast.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
        }
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }
}

// Funções globais para compatibilidade
function switchTab(tabName) {
    configuracoes.switchTab(tabName);
}

function saveConfiguracoes() {
    configuracoes.saveConfiguracoes();
}

function togglePassword(fieldId) {
    configuracoes.togglePassword(fieldId);
}

function goBack() {
    configuracoes.goBack();
}

// Inicializar configurações
const configuracoes = new ConfiguracoesController();