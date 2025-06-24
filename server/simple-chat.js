import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../')));

// Armazenamento em memória para demonstração
let conversations = new Map();
let messages = new Map();
let currentConversationId = 1;
let currentMessageId = 1;

// Mock das configurações de IA
const defaultAIResponse = (userMessage) => {
  const responses = {
    '/simular': 'Para simular um empréstimo, acesse o módulo "Simulador de Empréstimos" no hub principal. Lá você pode calcular parcelas, definir juros e gerar relatórios em PDF.',
    '/analisar': 'Para análise de documentos financeiros, envie seus extratos bancários ou faturas. Posso ajudar a categorizar gastos e identificar padrões financeiros.',
    '/consultoria': 'Oferecemos consultoria personalizada para otimização financeira. Posso analisar seu perfil de gastos e sugerir estratégias de economia e investimento.',
  };

  // Verificar se é um comando específico
  for (const [command, response] of Object.entries(responses)) {
    if (userMessage.toLowerCase().includes(command)) {
      return response;
    }
  }

  // Resposta padrão inteligente
  const keywords = {
    'empréstimo': 'Para simulações de empréstimo, use nosso calculador avançado que suporta diferentes sistemas de juros e pró-rata.',
    'juros': 'Trabalhamos com múltiplos sistemas: juros simples, compostos mensais, compostos diários e pro-rata real.',
    'pdf': 'Todos os cálculos podem ser exportados em PDF com informações detalhadas do cliente e cronograma de pagamento.',
    'análise': 'Posso analisar extratos bancários, faturas de cartão e contracheques para gerar relatórios financeiros.',
    'risco': 'Avaliamos risco de crédito baseado em padrões de movimentação, uso de limite e histórico financeiro.',
    'consulta': 'Oferecemos consultoria para otimização financeira e estratégias de recuperação.',
  };

  for (const [keyword, response] of Object.entries(keywords)) {
    if (userMessage.toLowerCase().includes(keyword)) {
      return `${response}\n\nPosso detalhar mais algum aspecto específico?`;
    }
  }

  return `Olá! Sou a Miguelita, sua assistente financeira da ME EMPREENDIMENTOS.

Recebi: "${userMessage}"

Posso ajudar com:
• 📊 Simulação de empréstimos com cálculos avançados
• 📈 Análise de documentos financeiros
• 💡 Consultoria personalizada
• 🔍 Avaliação de risco de crédito

Use comandos como /simular, /analisar ou /consultoria para respostas específicas.

Como posso ajudá-lo hoje?`;
};

// Rotas API básicas
app.get('/api/conversations/:userId', (req, res) => {
  const userId = req.params.userId;
  const userConversations = Array.from(conversations.values())
    .filter(conv => conv.userId === userId)
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  
  res.json(userConversations);
});

app.get('/api/conversations/:id/messages', (req, res) => {
  const conversationId = parseInt(req.params.id);
  const conversationMessages = Array.from(messages.values())
    .filter(msg => msg.conversationId === conversationId)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  
  res.json(conversationMessages);
});

// Socket.IO para chat em tempo real
io.on('connection', (socket) => {
  console.log('Usuário conectado:', socket.id);

  socket.on('join-conversation', (conversationId) => {
    socket.join(conversationId);
    console.log(`Socket ${socket.id} entrou na conversa ${conversationId}`);
  });

  socket.on('send-message', async (data) => {
    try {
      const { conversationId, userId, content } = data;
      
      // Criar conversa se não existir
      let conversation = conversations.get(conversationId);
      if (!conversation) {
        conversation = {
          id: currentConversationId++,
          userId,
          title: content.substring(0, 50) + (content.length > 50 ? '...' : ''),
          createdAt: new Date(),
          updatedAt: new Date()
        };
        conversations.set(conversation.id, conversation);
        
        // Emitir criação da conversa
        socket.emit('conversation-created', conversation);
        socket.join(conversation.id);
      }

      // Salvar mensagem do usuário
      const userMessage = {
        id: currentMessageId++,
        conversationId: conversation.id,
        role: 'user',
        content,
        createdAt: new Date()
      };
      messages.set(userMessage.id, userMessage);

      // Emitir mensagem do usuário
      io.to(conversation.id).emit('new-message', userMessage);

      // Gerar resposta da IA (simulada)
      setTimeout(() => {
        const aiResponse = defaultAIResponse(content);
        
        const assistantMessage = {
          id: currentMessageId++,
          conversationId: conversation.id,
          role: 'assistant',
          content: aiResponse,
          createdAt: new Date()
        };
        messages.set(assistantMessage.id, assistantMessage);

        // Atualizar timestamp da conversa
        conversation.updatedAt = new Date();
        conversations.set(conversation.id, conversation);

        // Emitir resposta da IA
        io.to(conversation.id).emit('new-message', assistantMessage);
      }, 1000 + Math.random() * 2000); // Simular tempo de processamento

    } catch (error) {
      console.error('Erro ao processar mensagem:', error);
      socket.emit('error', { message: error.message });
    }
  });

  socket.on('create-conversation', (data) => {
    try {
      const { userId, title } = data;
      const conversation = {
        id: currentConversationId++,
        userId,
        title: title || 'Nova Conversa',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      conversations.set(conversation.id, conversation);
      socket.emit('conversation-created', conversation);
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  socket.on('disconnect', () => {
    console.log('Usuário desconectado:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor de chat rodando na porta ${PORT}`);
});

export { app, io };