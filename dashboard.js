/**
 * ME EMPREENDIMENTOS - Dashboard Principal
 * Sistema de navegação entre módulos com autenticação
 */

class DashboardController {
    constructor() {
        this.checkAuthentication();
        this.loadSettings();
        this.setupEventListeners();
    }

    checkAuthentication() {
        const isLoggedIn = localStorage.getItem('isLoggedIn');
        const loginTime = localStorage.getItem('loginTime');
        
        // Verificar se não está logado ou se a sessão expirou (24 horas)
        if (isLoggedIn !== 'true' || !loginTime || 
            (Date.now() - parseInt(loginTime)) > 24 * 60 * 60 * 1000) {
            this.logout();
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
        // Verificar autenticação periodicamente
        setInterval(() => {
            this.checkAuthentication();
        }, 5 * 60 * 1000); // Verificar a cada 5 minutos
    }

    openModule(module) {
        switch (module) {
            case 'simulador':
                window.location.href = 'simulador.html';
                break;
            case 'chat':
                window.location.href = 'chat.html';
                break;
            case 'configuracoes':
                window.location.href = 'configuracoes.html';
                break;
            default:
                console.error('Módulo não reconhecido:', module);
        }
    }

    logout() {
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('loginTime');
        window.location.href = 'login.html';
    }
}

// Funções globais para compatibilidade
function openModule(module) {
    dashboard.openModule(module);
}

function logout() {
    dashboard.logout();
}

// Inicializar dashboard
const dashboard = new DashboardController();