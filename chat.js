/**
 * CHAT ME EMPREENDIMENTOS - Sistema de chat com IA
 * Suporte a múltiplos providers: OpenAI, Claude, Gemini, Grok
 * Upload de arquivos para análise financeira
 */

class ChatController {
    constructor() {
        this.socket = null;
        this.currentUser = null;
        this.currentConversation = null;
        this.selectedFiles = [];
        this.isConnected = false;
        this.messageHistory = [];
        
        this.initializeElements();
        this.setupEventListeners();
        this.loadStoredAuth();
        this.initializeSocket();
        this.loadThemeSettings();
    }

    initializeElements() {
        this.elements = {
            messagesContainer: document.getElementById('messagesContainer'),
            messageInput: document.getElementById('messageInput'),
            sendBtn: document.getElementById('sendBtn'),
            fileInput: document.getElementById('fileInput'),
            filePreview: document.getElementById('filePreview'),
            conversationsList: document.getElementById('conversationsList'),
            
            // Auth elements
            authSection: document.getElementById('authSection'),
            configSection: document.getElementById('configSection'),
            username: document.getElementById('username'),
            password: document.getElementById('password'),
            
            // AI Config elements
            aiProvider: document.getElementById('aiProvider'),
            apiKey: document.getElementById('apiKey'),
            aiModel: document.getElementById('aiModel'),
            configName: document.getElementById('configName'),
            systemPrompt: document.getElementById('systemPrompt'),
            temperature: document.getElementById('temperature'),
            temperatureValue: document.getElementById('temperatureValue'),
            maxTokens: document.getElementById('maxTokens'),
            isActive: document.getElementById('isActive'),
            configsList: document.getElementById('configsList')
        };
    }

    setupEventListeners() {
        // Message input
        if (this.elements.messageInput) {
            this.elements.messageInput.addEventListener('input', () => {
                this.autoResizeTextarea();
                this.updateSendButton();
            });

            this.elements.messageInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });
        }

        // File input
        if (this.elements.fileInput) {
            this.elements.fileInput.addEventListener('change', (e) => {
                this.handleFileSelect(e.target.files);
            });
        }

        // Temperature slider
        if (this.elements.temperature) {
            this.elements.temperature.addEventListener('input', (e) => {
                this.elements.temperatureValue.textContent = e.target.value;
            });
        }

        // AI Provider change
        if (this.elements.aiProvider) {
            this.elements.aiProvider.addEventListener('change', () => {
                this.updateModelOptions();
            });
        }

        // System prompt templates
        this.setupSystemPromptTemplates();
    }

    initializeSocket() {
        try {
            this.socket = io({
                transports: ['polling', 'websocket'],
                upgrade: true,
                rememberUpgrade: true
            });

            this.socket.on('connect', () => {
                this.isConnected = true;
                console.log('Conectado ao servidor');
                this.showToast('Conectado ao servidor', 'success');
            });

            this.socket.on('disconnect', () => {
                this.isConnected = false;
                console.log('Desconectado do servidor');
                this.showToast('Conexão perdida', 'error');
            });

            this.socket.on('new-message', (message) => {
                this.displayMessage(message);
                this.scrollToBottom();
            });

            this.socket.on('conversation-created', (conversation) => {
                this.currentConversation = conversation;
                this.loadConversations();
                this.showToast('Nova conversa criada', 'success');
            });

            this.socket.on('error', (error) => {
                console.error('Erro do servidor:', error);
                this.showToast(error.message, 'error');
            });

        } catch (error) {
            console.error('Erro ao conectar com servidor:', error);
            this.showToast('Erro na conexão. Funcionalidade limitada.', 'error');
        }
    }

    loadStoredAuth() {
        const stored = localStorage.getItem('chatAuth');
        if (stored) {
            try {
                const authData = JSON.parse(stored);
                this.currentUser = authData.user;
                this.showConfigSection();
                this.loadConversations();
                this.loadAiConfigs();
            } catch (error) {
                console.error('Erro ao carregar autenticação:', error);
                localStorage.removeItem('chatAuth');
            }
        }
    }

    loadThemeSettings() {
        const hubSettings = localStorage.getItem('hubSettings');
        if (hubSettings) {
            try {
                const settings = JSON.parse(hubSettings);
                document.body.setAttribute('data-theme', settings.theme || 'light');
                document.body.setAttribute('data-color-theme', settings.colorTheme || 'blue');
            } catch (error) {
                console.error('Erro ao carregar configurações de tema:', error);
            }
        }
    }

    // Authentication methods
    async login() {
        const username = this.elements.username.value.trim();
        const password = this.elements.password.value.trim();

        if (!username || !password) {
            this.showToast('Preencha usuário e senha', 'error');
            return;
        }

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (data.success) {
                this.currentUser = data.user;
                localStorage.setItem('chatAuth', JSON.stringify(data));
                this.showConfigSection();
                this.loadConversations();
                this.loadAiConfigs();
                this.showToast('Login realizado com sucesso!', 'success');
            } else {
                this.showToast(data.error || 'Erro no login', 'error');
            }
        } catch (error) {
            console.error('Erro no login:', error);
            this.showToast('Erro de conexão', 'error');
        }
    }

    async register() {
        const username = this.elements.username.value.trim();
        const password = this.elements.password.value.trim();

        if (!username || !password) {
            this.showToast('Preencha usuário e senha', 'error');
            return;
        }

        if (password.length < 6) {
            this.showToast('Senha deve ter pelo menos 6 caracteres', 'error');
            return;
        }

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (data.success) {
                this.currentUser = data.user;
                localStorage.setItem('chatAuth', JSON.stringify(data));
                this.showConfigSection();
                this.loadConversations();
                this.showToast('Conta criada com sucesso!', 'success');
            } else {
                this.showToast(data.error || 'Erro no registro', 'error');
            }
        } catch (error) {
            console.error('Erro no registro:', error);
            this.showToast('Erro de conexão', 'error');
        }
    }

    showConfigSection() {
        if (this.elements.authSection) this.elements.authSection.style.display = 'none';
        if (this.elements.configSection) this.elements.configSection.style.display = 'block';
    }

    // AI Configuration methods
    updateModelOptions() {
        const provider = this.elements.aiProvider.value;
        const modelSelect = this.elements.aiModel;
        
        // Clear existing options
        modelSelect.innerHTML = '<option value="">Selecione um modelo</option>';

        const models = {
            openai: [
                { value: 'gpt-4o', text: 'GPT-4 Turbo (Recomendado)' },
                { value: 'gpt-4', text: 'GPT-4' },
                { value: 'gpt-3.5-turbo', text: 'GPT-3.5 Turbo' }
            ],
            claude: [
                { value: 'claude-sonnet-4-20250514', text: 'Claude 4 Sonnet (Recomendado)' },
                { value: 'claude-3-7-sonnet-20250219', text: 'Claude 3.7 Sonnet' },
                { value: 'claude-3-5-sonnet-20241022', text: 'Claude 3.5 Sonnet' }
            ],
            gemini: [
                { value: 'gemini-2.5-flash', text: 'Gemini 2.5 Flash (Recomendado)' },
                { value: 'gemini-2.5-pro', text: 'Gemini 2.5 Pro' },
                { value: 'gemini-1.5-pro', text: 'Gemini 1.5 Pro' }
            ],
            grok: [
                { value: 'grok-2-1212', text: 'Grok-2 (Recomendado)' },
                { value: 'grok-2-vision-1212', text: 'Grok-2 Vision' },
                { value: 'grok-beta', text: 'Grok Beta' }
            ]
        };

        if (models[provider]) {
            models[provider].forEach(model => {
                const option = document.createElement('option');
                option.value = model.value;
                option.textContent = model.text;
                modelSelect.appendChild(option);
            });
        }
    }

    setupSystemPromptTemplates() {
        const templates = {
            consultora: `Você é Miguelita, uma consultora financeira especializada da ME EMPREENDIMENTOS.

Sua função é ajudar com:
1. Análise de documentos financeiros (extratos, faturas, contracheques)
2. Consultoria financeira personalizada
3. Análise de risco de crédito
4. Simulação de empréstimos
5. Orientações financeiras gerais

Características da sua personalidade:
- Profissional, mas amigável
- Didática e clara nas explicações
- Focada em soluções práticas
- Sempre pergunta se precisa de mais esclarecimentos
- Usa linguagem acessível, evitando jargões

Comandos especiais:
- /simular: Para simular empréstimos
- /analisar: Para analisar documentos financeiros
- /configurar: Para ajustar configurações

Sempre responda em português brasileiro e seja prestativa!`,
            
            analista: `Você é um analista financeiro senior especializado em análise de crédito.

Seu foco é:
1. Avaliação detalhada de risco de crédito
2. Análise de capacidade de pagamento
3. Identificação de padrões de comportamento financeiro
4. Detecção de inconsistências e riscos
5. Recomendações objetivas de concessão

Características:
- Técnico e preciso
- Baseado em dados e métricas
- Conservador na análise de risco
- Explicativo sobre metodologias
- Objetivo nas recomendações`,

            assistente: `Você é uma assistente pessoal financeira amigável.

Sua função é:
1. Responder dúvidas sobre finanças pessoais
2. Ensinar conceitos financeiros
3. Ajudar com organização financeira
4. Dar dicas de economia e investimento
5. Motivar bons hábitos financeiros

Características:
- Muito amigável e empática
- Linguagem simples e descontraída
- Paciente para explicar conceitos
- Positiva e motivadora
- Focada em educação financeira`
        };

        // Adicionar seletor de templates se necessário
        if (this.elements.systemPrompt) {
            this.elements.systemPrompt.placeholder = "Escolha um template acima ou escreva seu próprio prompt...";
        }
    }

    async saveAiConfig() {
        if (!this.currentUser) {
            this.showToast('Faça login primeiro', 'error');
            return;
        }

        const config = {
            userId: this.currentUser.id,
            name: this.elements.configName.value.trim(),
            provider: this.elements.aiProvider.value,
            apiKey: this.elements.apiKey.value.trim(),
            model: this.elements.aiModel.value,
            systemPrompt: this.elements.systemPrompt.value.trim(),
            temperature: this.elements.temperature.value,
            maxTokens: parseInt(this.elements.maxTokens.value),
            isActive: this.elements.isActive.checked
        };

        // Validações
        if (!config.name || !config.provider || !config.apiKey || !config.model) {
            this.showToast('Preencha todos os campos obrigatórios', 'error');
            return;
        }

        try {
            const response = await fetch('/api/ai-configs', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(config),
            });

            const data = await response.json();

            if (response.ok) {
                this.showToast('Configuração salva com sucesso!', 'success');
                this.loadAiConfigs();
                this.clearConfigForm();
            } else {
                this.showToast(data.error || 'Erro ao salvar configuração', 'error');
            }
        } catch (error) {
            console.error('Erro ao salvar configuração:', error);
            this.showToast('Erro de conexão', 'error');
        }
    }

    async loadAiConfigs() {
        if (!this.currentUser) return;

        try {
            const response = await fetch(`/api/ai-configs/${this.currentUser.id}`);
            const configs = await response.json();

            this.displayAiConfigs(configs);
        } catch (error) {
            console.error('Erro ao carregar configurações:', error);
        }
    }

    displayAiConfigs(configs) {
        const container = this.elements.configsList;
        if (!container) return;

        container.innerHTML = '';

        configs.forEach(config => {
            const configElement = document.createElement('div');
            configElement.className = `config-item ${config.isActive ? 'active' : ''}`;
            
            configElement.innerHTML = `
                <div class="config-item-info">
                    <div class="config-item-name">${config.name}</div>
                    <div class="config-item-details">
                        ${config.provider.toUpperCase()} - ${config.model}
                        ${config.isActive ? ' (Ativa)' : ''}
                    </div>
                </div>
                <div class="config-item-actions">
                    ${!config.isActive ? `<button class="activate-btn" onclick="chatController.activateConfig(${config.id})">Ativar</button>` : ''}
                    <button class="edit-btn" onclick="chatController.editConfig(${config.id})">Editar</button>
                    <button class="delete-btn" onclick="chatController.deleteConfig(${config.id})">Excluir</button>
                </div>
            `;

            container.appendChild(configElement);
        });
    }

    async activateConfig(configId) {
        try {
            const response = await fetch(`/api/ai-configs/${configId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ isActive: true }),
            });

            if (response.ok) {
                this.showToast('Configuração ativada!', 'success');
                this.loadAiConfigs();
            }
        } catch (error) {
            console.error('Erro ao ativar configuração:', error);
            this.showToast('Erro ao ativar configuração', 'error');
        }
    }

    async deleteConfig(configId) {
        if (!confirm('Tem certeza que deseja excluir esta configuração?')) {
            return;
        }

        try {
            const response = await fetch(`/api/ai-configs/${configId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                this.showToast('Configuração excluída!', 'success');
                this.loadAiConfigs();
            }
        } catch (error) {
            console.error('Erro ao excluir configuração:', error);
            this.showToast('Erro ao excluir configuração', 'error');
        }
    }

    clearConfigForm() {
        this.elements.configName.value = '';
        this.elements.aiProvider.value = '';
        this.elements.apiKey.value = '';
        this.elements.aiModel.innerHTML = '<option value="">Selecione um modelo</option>';
        this.elements.systemPrompt.value = '';
        this.elements.temperature.value = '0.7';
        this.elements.temperatureValue.textContent = '0.7';
        this.elements.maxTokens.value = '2000';
        this.elements.isActive.checked = false;
    }

    // Chat functionality
    async createNewConversation() {
        if (!this.currentUser) {
            this.showToast('Faça login primeiro', 'error');
            return;
        }

        const title = 'Nova Conversa';
        
        if (this.isConnected && this.socket) {
            this.socket.emit('create-conversation', {
                userId: this.currentUser.id,
                title: title
            });
        } else {
            this.showToast('Sem conexão com servidor', 'error');
        }
    }

    async loadConversations() {
        if (!this.currentUser) return;

        try {
            const response = await fetch(`/api/conversations/${this.currentUser.id}`);
            const conversations = await response.json();

            this.displayConversations(conversations);
        } catch (error) {
            console.error('Erro ao carregar conversas:', error);
        }
    }

    displayConversations(conversations) {
        const container = this.elements.conversationsList;
        if (!container) return;

        container.innerHTML = '';

        conversations.forEach(conv => {
            const convElement = document.createElement('div');
            convElement.className = `conversation-item ${conv.id === this.currentConversation?.id ? 'active' : ''}`;
            
            convElement.innerHTML = `
                <div class="conversation-title">${conv.title}</div>
                <div class="conversation-time">${new Date(conv.updatedAt).toLocaleDateString('pt-BR')}</div>
            `;

            convElement.addEventListener('click', () => {
                this.selectConversation(conv);
            });

            container.appendChild(convElement);
        });
    }

    async selectConversation(conversation) {
        this.currentConversation = conversation;
        
        // Atualizar UI
        this.displayConversations(await this.getConversations());
        
        // Carregar mensagens
        await this.loadMessages(conversation.id);
        
        // Entrar na sala do socket
        if (this.isConnected && this.socket) {
            this.socket.emit('join-conversation', conversation.id);
        }
    }

    async loadMessages(conversationId) {
        try {
            const response = await fetch(`/api/conversations/${conversationId}/messages`);
            const messages = await response.json();

            // Limpar container
            this.clearWelcomeMessage();
            
            // Exibir mensagens
            messages.forEach(message => {
                this.displayMessage(message);
            });

            this.scrollToBottom();
        } catch (error) {
            console.error('Erro ao carregar mensagens:', error);
        }
    }

    clearWelcomeMessage() {
        const welcomeMsg = this.elements.messagesContainer.querySelector('.welcome-message');
        if (welcomeMsg) {
            welcomeMsg.style.display = 'none';
        }
    }

    displayMessage(message) {
        const messageElement = document.createElement('div');
        messageElement.className = `message ${message.role}`;
        
        const time = new Date(message.createdAt).toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
        });

        const avatar = message.role === 'user' ? 
            this.currentUser?.username?.charAt(0).toUpperCase() || 'U' : 
            '🤖';

        messageElement.innerHTML = `
            <div class="message-avatar">${avatar}</div>
            <div class="message-bubble">
                <div class="message-text">${this.formatMessageContent(message.content)}</div>
                <div class="message-time">${time}</div>
            </div>
        `;

        this.elements.messagesContainer.appendChild(messageElement);
        this.messageHistory.push(message);
    }

    formatMessageContent(content) {
        // Converter markdown básico para HTML
        return content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\n/g, '<br>');
    }

    async sendMessage() {
        const content = this.elements.messageInput.value.trim();
        
        if (!content && this.selectedFiles.length === 0) {
            return;
        }

        if (!this.currentConversation) {
            await this.createNewConversation();
            // Aguardar criação da conversa
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        if (!this.currentConversation) {
            this.showToast('Erro ao criar conversa', 'error');
            return;
        }

        // Limpar input
        this.elements.messageInput.value = '';
        this.selectedFiles = [];
        this.updateFilePreview();
        this.updateSendButton();
        this.autoResizeTextarea();

        // Enviar via socket
        if (this.isConnected && this.socket) {
            this.socket.emit('send-message', {
                conversationId: this.currentConversation.id,
                userId: this.currentUser.id,
                content: content || '[Arquivos enviados]',
                files: this.selectedFiles
            });
        } else {
            this.showToast('Sem conexão com servidor', 'error');
        }
    }

    sendQuickMessage(command) {
        this.elements.messageInput.value = command;
        this.updateSendButton();
        this.sendMessage();
    }

    // File handling
    selectFiles() {
        this.elements.fileInput.click();
    }

    handleFileSelect(files) {
        Array.from(files).forEach(file => {
            if (this.validateFile(file)) {
                this.selectedFiles.push(file);
            }
        });
        
        this.updateFilePreview();
        this.updateSendButton();
    }

    validateFile(file) {
        const maxSize = 50 * 1024 * 1024; // 50MB
        const allowedTypes = [
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel',
            'text/csv',
            'image/jpeg',
            'image/png',
            'image/jpg',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];

        if (file.size > maxSize) {
            this.showToast(`Arquivo muito grande: ${file.name}`, 'error');
            return false;
        }

        if (!allowedTypes.includes(file.type)) {
            this.showToast(`Tipo não suportado: ${file.name}`, 'error');
            return false;
        }

        return true;
    }

    updateFilePreview() {
        const preview = this.elements.filePreview;
        
        if (this.selectedFiles.length === 0) {
            preview.style.display = 'none';
            return;
        }

        preview.style.display = 'block';
        preview.innerHTML = '';

        this.selectedFiles.forEach((file, index) => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            
            fileItem.innerHTML = `
                <span class="file-icon">📄</span>
                <div class="file-info">
                    <div class="file-name">${file.name}</div>
                    <div class="file-size">${this.formatFileSize(file.size)}</div>
                </div>
                <button class="remove-file-btn" onclick="chatController.removeFile(${index})">×</button>
            `;

            preview.appendChild(fileItem);
        });
    }

    removeFile(index) {
        this.selectedFiles.splice(index, 1);
        this.updateFilePreview();
        this.updateSendButton();
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // UI helpers
    updateSendButton() {
        const hasContent = this.elements.messageInput.value.trim().length > 0;
        const hasFiles = this.selectedFiles.length > 0;
        this.elements.sendBtn.disabled = !hasContent && !hasFiles;
    }

    autoResizeTextarea() {
        const textarea = this.elements.messageInput;
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }

    scrollToBottom() {
        this.elements.messagesContainer.scrollTop = this.elements.messagesContainer.scrollHeight;
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        setTimeout(() => toast.classList.add('show'), 100);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => document.body.removeChild(toast), 300);
        }, 3000);
    }

    // Modal handlers
    openChatSettings() {
        document.getElementById('aiConfigModal').style.display = 'flex';
        if (!this.currentUser) {
            this.elements.authSection.style.display = 'block';
            this.elements.configSection.style.display = 'none';
        } else {
            this.elements.authSection.style.display = 'none';
            this.elements.configSection.style.display = 'block';
            this.loadAiConfigs();
        }
    }

    closeAiConfigModal() {
        document.getElementById('aiConfigModal').style.display = 'none';
    }

    goBack() {
        window.location.href = 'dashboard.html';
    }

    toggleSidebar() {
        const sidebar = document.getElementById('chatSidebar');
        const overlay = document.getElementById('sidebarOverlay');
        
        this.sidebarOpen = !this.sidebarOpen;
        
        if (this.sidebarOpen) {
            sidebar.classList.add('open');
            overlay.classList.add('active');
        } else {
            sidebar.classList.remove('open');
            overlay.classList.remove('active');
        }
    }

    loadConversations() {
        // Carregar conversas do localStorage ou API
        const conversations = JSON.parse(localStorage.getItem('conversations') || '[]');
        this.displayConversations(conversations);
    }

    displayConversations(conversations) {
        const conversationsList = document.getElementById('conversationsList');
        
        if (conversations.length === 0) {
            conversationsList.innerHTML = '<div class="no-conversations">Nenhuma conversa ainda</div>';
            return;
        }

        conversationsList.innerHTML = conversations.map(conv => `
            <div class="conversation-item ${conv.id === this.currentConversationId ? 'active' : ''}" 
                 onclick="selectConversation('${conv.id}')">
                <div class="conversation-title">${conv.title || 'Nova Conversa'}</div>
                <div class="conversation-date">${new Date(conv.createdAt).toLocaleDateString('pt-BR')}</div>
                <button class="delete-conversation" onclick="deleteConversation('${conv.id}')" title="Excluir">×</button>
            </div>
        `).join('');
    }

    selectConversation(conversationId) {
        this.currentConversationId = conversationId;
        this.loadMessages(conversationId);
        this.loadConversations(); // Atualizar lista para mostrar conversa ativa
        
        // Fechar sidebar no mobile
        if (window.innerWidth <= 768) {
            this.toggleSidebar();
        }
    }

    deleteConversation(conversationId) {
        const conversations = JSON.parse(localStorage.getItem('conversations') || '[]');
        const filteredConversations = conversations.filter(conv => conv.id !== conversationId);
        localStorage.setItem('conversations', JSON.stringify(filteredConversations));
        
        // Se a conversa deletada estava ativa, limpar chat
        if (this.currentConversationId === conversationId) {
            this.currentConversationId = null;
            document.getElementById('messages').innerHTML = '';
        }
        
        this.loadConversations();
    }
}

// Global functions for onclick handlers
function login() {
    chatController.login();
}

function register() {
    chatController.register();
}

function saveAiConfig() {
    chatController.saveAiConfig();
}

function openChatSettings() {
    chatController.openChatSettings();
}

function closeAiConfigModal() {
    chatController.closeAiConfigModal();
}

function goBack() {
    chatController.goBack();
}

function toggleSidebar() {
    chatController.toggleSidebar();
}

function selectConversation(conversationId) {
    chatController.selectConversation(conversationId);
}

function deleteConversation(conversationId) {
    event.stopPropagation();
    if (confirm('Tem certeza que deseja excluir esta conversa?')) {
        chatController.deleteConversation(conversationId);
    }
}

function selectFiles() {
    chatController.selectFiles();
}

function sendMessage() {
    chatController.sendMessage();
}

function sendQuickMessage(command) {
    chatController.sendQuickMessage(command);
}

function createNewConversation() {
    chatController.createNewConversation();
}

function updateModelOptions() {
    chatController.updateModelOptions();
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.chatController = new ChatController();
});