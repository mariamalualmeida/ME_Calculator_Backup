/**
 * HUB ME EMPREENDIMENTOS - Página principal para seleção de módulos
 * Permite acesso ao Simulador de Empréstimos e Assistente Financeira
 */

class HubController {
    constructor() {
        this.loadSettings();
        this.applyStoredTheme();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Detectar clique fora do modal para fechar
        window.addEventListener('click', (event) => {
            const modal = document.getElementById('configModal');
            if (event.target === modal) {
                this.closeModal();
            }
        });

        // Tecla ESC para fechar modal
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                this.closeModal();
            }
        });
    }

    openModule(module) {
        switch (module) {
            case 'simulador':
                window.location.href = 'index.html';
                break;
            case 'chat':
                window.location.href = 'chat.html';
                break;
            default:
                console.error('Módulo não encontrado:', module);
        }
    }

    openSettings() {
        const modal = document.getElementById('configModal');
        modal.style.display = 'flex';
        
        // Carregar configurações atuais nos selects
        this.loadCurrentSettings();
    }

    closeModal() {
        const modal = document.getElementById('configModal');
        modal.style.display = 'none';
    }

    loadCurrentSettings() {
        const settings = this.getStoredSettings();
        
        const themeSelect = document.getElementById('themeSelect');
        const colorThemeSelect = document.getElementById('colorThemeSelect');
        
        if (themeSelect) themeSelect.value = settings.theme;
        if (colorThemeSelect) colorThemeSelect.value = settings.colorTheme;
    }

    changeTheme() {
        const themeSelect = document.getElementById('themeSelect');
        const theme = themeSelect.value;
        this.applyTheme(theme);
    }

    changeColorTheme() {
        const colorThemeSelect = document.getElementById('colorThemeSelect');
        const colorTheme = colorThemeSelect.value;
        this.applyColorTheme(colorTheme);
    }

    saveSettings() {
        const themeSelect = document.getElementById('themeSelect');
        const colorThemeSelect = document.getElementById('colorThemeSelect');
        
        const settings = {
            theme: themeSelect.value,
            colorTheme: colorThemeSelect.value
        };
        
        localStorage.setItem('hubSettings', JSON.stringify(settings));
        this.closeModal();
        
        // Mostrar confirmação
        this.showToast('Configurações salvas com sucesso!');
    }

    loadSettings() {
        const defaultSettings = {
            theme: 'light',
            colorTheme: 'blue'
        };
        
        const stored = localStorage.getItem('hubSettings');
        this.settings = stored ? JSON.parse(stored) : defaultSettings;
    }

    getStoredSettings() {
        return this.settings;
    }

    applyStoredTheme() {
        this.applyTheme(this.settings.theme);
        this.applyColorTheme(this.settings.colorTheme);
    }

    applyTheme(theme) {
        document.body.setAttribute('data-theme', theme);
        this.settings.theme = theme;
    }

    applyColorTheme(colorTheme) {
        document.body.setAttribute('data-color-theme', colorTheme);
        this.settings.colorTheme = colorTheme;
    }

    showToast(message) {
        // Criar elemento de toast
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        
        // Adicionar ao corpo da página
        document.body.appendChild(toast);
        
        // Mostrar com animação
        setTimeout(() => toast.classList.add('show'), 100);
        
        // Remover após 3 segundos
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => document.body.removeChild(toast), 300);
        }, 3000);
    }
}

// Funções globais para compatibilidade com onclick
function openModule(module) {
    hubController.openModule(module);
}

function openSettings() {
    hubController.openSettings();
}

function closeModal() {
    hubController.closeModal();
}

function changeTheme() {
    hubController.changeTheme();
}

function changeColorTheme() {
    hubController.changeColorTheme();
}

function saveSettings() {
    hubController.saveSettings();
}

// Inicializar quando DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    window.hubController = new HubController();
});