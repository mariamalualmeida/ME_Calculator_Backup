/**
 * ME EMPREENDIMENTOS - Sistema de Chat com IA
 * Miguelita - Assistente Financeira
 */

class ChatSystem {
    constructor() {
        this.socket = null;
        this.currentUser = null;
        this.currentConversation = null;
        this.selectedFiles = [];
        this.isConnected = false;
        
        this.initializeElements();
        this.setupEventListeners();
        this.connectSocket();
        this.loadUserData();
    }

    initializeElements() {
        this.messageInput = document.getElementById('messageInput');
        this.sendBtn = document.getElementById('sendBtn');
        this.chatMessages = document.getElementById('chatMessages');
        this.fileInput = document.getElementById('fileInput');
        this.filePreview = document.getElementById('filePreview');
        this.charCount = document.getElementById('charCount');
        this.statusIndicator = document.getElementById('statusIndicator');
        this.typingIndicator = document.getElementById('typingIndicator');
        this.configModal = document.getElementById('configModal');
    }

    setupEventListeners() {
        // Input de mensagem
        this.messageInput.addEventListener('input', () => {
            this.updateCharCount();
            this.updateSendButton();
            this.autoResize();
        });

        this.messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.enviarMensagem();
            }
        });

        // Upload de arquivos
        this.fileInput.addEventListener('change', (e) => {
            this.handleFileSelection(e.target.files);
        });

        // Aplicar tema
        this.applyTheme();
    }

    connectSocket() {
        try {
            this.socket = io('http://localhost:3001');
            
            this.socket.on('connect', () => {
                console.log('Conectado ao servidor');
                this.isConnected = true;
                this.updateConnectionStatus(true);
            });

            this.socket.on('disconnect', () => {
                console.log('Desconectado do servidor');
                this.isConnected = false;
                this.updateConnectionStatus(false);
            });

            this.socket.on('new-message', (message) => {
                this.displayMessage(message);
                this.hideTypingIndicator();
            });

            this.socket.on('conversation-created', (conversation) => {
                this.currentConversation = conversation;
                this.socket.emit('join-conversation', conversation.id);
            });

            this.socket.on('error', (error) => {
                console.error('Erro do servidor:', error);
                this.showError(error.message);
            });

        } catch (error) {
            console.error('Erro ao conectar com servidor:', error);
            this.updateConnectionStatus(false);
        }
    }

    async loadUserData() {
        try {
            // Tentar carregar dados do usuário do localStorage
            const userData = localStorage.getItem('chatUser');
            if (userData) {
                this.currentUser = JSON.parse(userData);
            } else {
                // Criar usuário guest temporário
                this.currentUser = {
                    id: 'guest_' + Date.now(),
                    username: 'Guest',
                    isGuest: true
                };
                localStorage.setItem('chatUser', JSON.stringify(this.currentUser));
            }

            // Carregar conversas existentes
            await this.loadConversations();
            
        } catch (error) {
            console.error('Erro ao carregar dados do usuário:', error);
        }
    }

    async loadConversations() {
        try {
            if (!this.isConnected) return;

            const response = await fetch(`/api/conversations/${this.currentUser.id}`);
            if (response.ok) {
                const conversations = await response.json();
                
                if (conversations.length > 0) {
                    // Carregar a última conversa
                    this.currentConversation = conversations[0];
                    this.socket.emit('join-conversation', this.currentConversation.id);
                    await this.loadMessages();
                } else {
                    // Criar nova conversa
                    await this.createNewConversation();
                }
            }
        } catch (error) {
            console.error('Erro ao carregar conversas:', error);
        }
    }

    async loadMessages() {
        try {
            if (!this.currentConversation) return;

            const response = await fetch(`/api/conversations/${this.currentConversation.id}/messages`);
            if (response.ok) {
                const messages = await response.json();
                
                // Limpar área de mensagens exceto a mensagem de boas-vindas
                const welcomeMessage = this.chatMessages.querySelector('.welcome-message');
                this.chatMessages.innerHTML = '';
                if (messages.length === 0 && welcomeMessage) {
                    this.chatMessages.appendChild(welcomeMessage);
                }

                // Exibir mensagens
                messages.forEach(message => {
                    this.displayMessage(message, false);
                });

                this.scrollToBottom();
            }
        } catch (error) {
            console.error('Erro ao carregar mensagens:', error);
        }
    }

    async createNewConversation() {
        try {
            const title = 'Nova Conversa';
            this.socket.emit('create-conversation', {
                userId: this.currentUser.id,
                title,
                aiConfigId: null
            });
        } catch (error) {
            console.error('Erro ao criar nova conversa:', error);
        }
    }

    enviarMensagem() {
        const content = this.messageInput.value.trim();
        if (!content && this.selectedFiles.length === 0) return;
        if (!this.isConnected) {
            this.showError('Não conectado ao servidor');
            return;
        }

        // Verificar se existe conversa
        if (!this.currentConversation) {
            this.createNewConversation();
            setTimeout(() => this.enviarMensagem(), 500);
            return;
        }

        // Mostrar indicador de digitação
        this.showTypingIndicator();

        // Enviar mensagem via Socket.IO
        this.socket.emit('send-message', {
            conversationId: this.currentConversation.id,
            userId: this.currentUser.id,
            content,
            files: this.selectedFiles
        });

        // Limpar input
        this.messageInput.value = '';
        this.selectedFiles = [];
        this.updateCharCount();
        this.updateSendButton();
        this.hideFilePreview();
        this.autoResize();
    }

    displayMessage(message, animate = true) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${message.role}`;
        if (animate) {
            messageDiv.style.opacity = '0';
            messageDiv.style.transform = 'translateY(20px)';
        }

        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.textContent = message.role === 'user' ? 'U' : 'M';

        const content = document.createElement('div');
        content.className = 'message-content';

        const bubble = document.createElement('div');
        bubble.className = 'message-bubble';
        
        // Renderizar markdown básico se for mensagem da IA
        if (message.role === 'assistant') {
            bubble.innerHTML = this.renderMarkdown(message.content);
        } else {
            bubble.textContent = message.content;
        }

        const time = document.createElement('div');
        time.className = 'message-time';
        time.textContent = new Date(message.createdAt).toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
        });

        content.appendChild(bubble);
        content.appendChild(time);
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(content);

        // Remover mensagem de boas-vindas se for a primeira mensagem real
        const welcomeMessage = this.chatMessages.querySelector('.welcome-message');
        if (welcomeMessage && this.chatMessages.children.length > 1) {
            welcomeMessage.remove();
        }

        this.chatMessages.appendChild(messageDiv);

        if (animate) {
            setTimeout(() => {
                messageDiv.style.transition = 'all 0.3s ease';
                messageDiv.style.opacity = '1';
                messageDiv.style.transform = 'translateY(0)';
            }, 100);
        }

        this.scrollToBottom();
    }

    renderMarkdown(text) {
        // Renderização básica de markdown
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>')
            .replace(/\n/g, '<br>');
    }

    showTypingIndicator() {
        this.typingIndicator.style.display = 'flex';
        this.scrollToBottom();
    }

    hideTypingIndicator() {
        this.typingIndicator.style.display = 'none';
    }

    updateCharCount() {
        const count = this.messageInput.value.length;
        this.charCount.textContent = count;
        
        if (count > 3500) {
            this.charCount.style.color = 'var(--error-color)';
        } else {
            this.charCount.style.color = 'var(--text-secondary)';
        }
    }

    updateSendButton() {
        const hasContent = this.messageInput.value.trim().length > 0 || this.selectedFiles.length > 0;
        this.sendBtn.disabled = !hasContent || !this.isConnected;
    }

    autoResize() {
        this.messageInput.style.height = 'auto';
        this.messageInput.style.height = Math.min(this.messageInput.scrollHeight, 120) + 'px';
    }

    scrollToBottom() {
        setTimeout(() => {
            this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
        }, 100);
    }

    updateConnectionStatus(connected) {
        if (connected) {
            this.statusIndicator.className = 'status-indicator online';
            this.statusIndicator.querySelector('.status-text').textContent = 'Online';
        } else {
            this.statusIndicator.className = 'status-indicator offline';
            this.statusIndicator.querySelector('.status-text').textContent = 'Offline';
        }
    }

    handleFileSelection(files) {
        this.selectedFiles = Array.from(files);
        this.showFilePreview();
        this.updateSendButton();
    }

    showFilePreview() {
        if (this.selectedFiles.length === 0) {
            this.hideFilePreview();
            return;
        }

        this.filePreview.innerHTML = '';
        this.selectedFiles.forEach((file, index) => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';

            const icon = document.createElement('div');
            icon.className = 'file-icon';
            icon.textContent = this.getFileIcon(file.type);

            const info = document.createElement('div');
            info.className = 'file-info';

            const name = document.createElement('div');
            name.className = 'file-name';
            name.textContent = file.name;

            const size = document.createElement('div');
            size.className = 'file-size';
            size.textContent = this.formatFileSize(file.size);

            const removeBtn = document.createElement('button');
            removeBtn.className = 'file-remove';
            removeBtn.innerHTML = '×';
            removeBtn.onclick = () => this.removeFile(index);

            info.appendChild(name);
            info.appendChild(size);
            fileItem.appendChild(icon);
            fileItem.appendChild(info);
            fileItem.appendChild(removeBtn);

            this.filePreview.appendChild(fileItem);
        });

        this.filePreview.style.display = 'block';
    }

    hideFilePreview() {
        this.filePreview.style.display = 'none';
    }

    removeFile(index) {
        this.selectedFiles.splice(index, 1);
        this.showFilePreview();
        this.updateSendButton();
    }

    getFileIcon(mimeType) {
        if (mimeType.includes('pdf')) return 'PDF';
        if (mimeType.includes('image')) return 'IMG';
        if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'XLS';
        if (mimeType.includes('word')) return 'DOC';
        if (mimeType.includes('csv')) return 'CSV';
        return 'FILE';
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    showError(message) {
        // Implementar notificação de erro
        console.error(message);
    }

    applyTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        const savedColorTheme = localStorage.getItem('colorTheme') || 'teal';
        
        document.body.setAttribute('data-theme', savedTheme);
        document.body.setAttribute('data-color-theme', savedColorTheme);
    }
}

// Funções globais para a interface
function voltarHub() {
    window.location.href = 'hub.html';
}

function abrirUpload() {
    document.getElementById('fileInput').click();
}

function enviarMensagem() {
    if (window.chatSystem) {
        window.chatSystem.enviarMensagem();
    }
}

function novaConversa() {
    if (window.chatSystem) {
        window.chatSystem.createNewConversation();
    }
}

function enviarComando(comando) {
    const input = document.getElementById('messageInput');
    input.value = comando;
    input.focus();
    
    // Atualizar contadores e botões
    if (window.chatSystem) {
        window.chatSystem.updateCharCount();
        window.chatSystem.updateSendButton();
    }
}

function abrirConfiguracoes() {
    document.getElementById('configModal').style.display = 'flex';
}

function fecharConfigModal() {
    document.getElementById('configModal').style.display = 'none';
}

function adicionarNovaConfig() {
    // TODO: Implementar modal de nova configuração
    console.log('Adicionar nova configuração de IA');
}

// Inicializar sistema quando página carrega
document.addEventListener('DOMContentLoaded', function() {
    window.chatSystem = new ChatSystem();
    console.log('Sistema de chat inicializado');
});

// Export para uso em outros arquivos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ChatSystem };
}