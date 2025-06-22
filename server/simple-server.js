import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

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
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, '../')));

// Configuração do multer para upload de arquivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB
  }
});

// Storage simples em memória para demonstração
let users = new Map();
let conversations = new Map();
let messages = new Map();
let aiConfigs = new Map();
let currentUserId = 1;
let currentConversationId = 1;
let currentMessageId = 1;
let currentConfigId = 1;

// Rotas de autenticação
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  
  // Buscar usuário
  const user = Array.from(users.values()).find(u => u.username === username);
  
  if (!user || user.password !== password) {
    return res.status(401).json({ error: 'Credenciais inválidas' });
  }

  const token = 'simple-token-' + user.id;
  res.json({
    success: true,
    user: { id: user.id, username: user.username, email: user.email },
    token
  });
});

app.post('/api/auth/register', (req, res) => {
  const { username, password, email } = req.body;
  
  // Verificar se usuário já existe
  const existingUser = Array.from(users.values()).find(u => u.username === username);
  if (existingUser) {
    return res.status(400).json({ error: 'Usuário já existe' });
  }

  // Criar usuário
  const user = {
    id: currentUserId++,
    username,
    password, // Em produção, usar hash
    email: email || null,
    createdAt: new Date()
  };
  
  users.set(user.id, user);
  
  const token = 'simple-token-' + user.id;
  res.json({
    success: true,
    user: { id: user.id, username: user.username, email: user.email },
    token
  });
});

// Rotas de configuração de IA
app.get('/api/ai-configs/:userId', (req, res) => {
  const userId = parseInt(req.params.userId);
  const userConfigs = Array.from(aiConfigs.values()).filter(c => c.userId === userId);
  res.json(userConfigs);
});

app.post('/api/ai-configs', (req, res) => {
  const config = {
    id: currentConfigId++,
    ...req.body,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  // Se esta configuração deve ser ativa, desativar as outras
  if (config.isActive) {
    aiConfigs.forEach((c, id) => {
      if (c.userId === config.userId && c.id !== config.id) {
        c.isActive = false;
      }
    });
  }
  
  aiConfigs.set(config.id, config);
  res.json(config);
});

app.put('/api/ai-configs/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const config = aiConfigs.get(id);
  
  if (!config) {
    return res.status(404).json({ error: 'Configuração não encontrada' });
  }
  
  // Se esta configuração deve ser ativa, desativar as outras
  if (req.body.isActive) {
    aiConfigs.forEach((c, configId) => {
      if (c.userId === config.userId && configId !== id) {
        c.isActive = false;
      }
    });
  }
  
  Object.assign(config, req.body, { updatedAt: new Date() });
  aiConfigs.set(id, config);
  res.json(config);
});

app.delete('/api/ai-configs/:id', (req, res) => {
  const id = parseInt(req.params.id);
  aiConfigs.delete(id);
  res.json({ success: true });
});

// Rotas de conversas
app.get('/api/conversations/:userId', (req, res) => {
  const userId = parseInt(req.params.userId);
  const userConversations = Array.from(conversations.values())
    .filter(c => c.userId === userId)
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  res.json(userConversations);
});

app.get('/api/conversations/:id/messages', (req, res) => {
  const conversationId = parseInt(req.params.id);
  const conversationMessages = Array.from(messages.values())
    .filter(m => m.conversationId === conversationId)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  res.json(conversationMessages);
});

// Upload de arquivos
app.post('/api/upload', upload.array('files', 10), (req, res) => {
  const files = req.files;
  const results = files.map(file => ({
    filename: file.filename,
    originalName: file.originalname,
    mimeType: file.mimetype,
    size: file.size,
    path: file.path
  }));
  
  res.json({ files: results });
});

// Socket.IO para chat em tempo real
io.on('connection', (socket) => {
  console.log('Usuário conectado:', socket.id);

  socket.on('join-conversation', (conversationId) => {
    socket.join(conversationId);
  });

  socket.on('send-message', async (data) => {
    try {
      const { conversationId, userId, content, files } = data;
      
      // Salvar mensagem do usuário
      const userMessage = {
        id: currentMessageId++,
        conversationId: parseInt(conversationId),
        role: 'user',
        content,
        metadata: { files },
        createdAt: new Date()
      };
      
      messages.set(userMessage.id, userMessage);
      
      // Atualizar timestamp da conversa
      const conversation = conversations.get(parseInt(conversationId));
      if (conversation) {
        conversation.updatedAt = new Date();
      }
      
      // Emitir mensagem do usuário
      io.to(conversationId).emit('new-message', userMessage);
      
      // Simular resposta da IA (placeholder)
      setTimeout(() => {
        const aiResponse = generateAIResponse(content, files);
        const assistantMessage = {
          id: currentMessageId++,
          conversationId: parseInt(conversationId),
          role: 'assistant',
          content: aiResponse,
          metadata: null,
          createdAt: new Date()
        };
        
        messages.set(assistantMessage.id, assistantMessage);
        io.to(conversationId).emit('new-message', assistantMessage);
      }, 1000);
      
    } catch (error) {
      console.error('Erro ao processar mensagem:', error);
      socket.emit('error', { message: error.message });
    }
  });

  socket.on('create-conversation', (data) => {
    try {
      const { userId, title, aiConfigId } = data;
      const conversation = {
        id: currentConversationId++,
        userId: parseInt(userId),
        title: title || 'Nova Conversa',
        aiConfigId: aiConfigId ? parseInt(aiConfigId) : null,
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

// Função para gerar resposta da IA (placeholder)
function generateAIResponse(userMessage, files) {
  const responses = [
    "Olá! Entendi sua mensagem. Como posso ajudá-lo com questões financeiras?",
    "Interessante! Posso analisar seus documentos financeiros se você enviou algum arquivo.",
    "Para uma análise mais detalhada, preciso configurar uma IA. Você pode fazer isso nas configurações.",
    "Estou aqui para ajudar com simulações de empréstimo e análise financeira.",
    "Se você tem documentos para analisar, posso processar extratos bancários, faturas de cartão e contracheques."
  ];
  
  if (files && files.length > 0) {
    return `Recebi ${files.length} arquivo(s). Para analisar completamente, configure uma IA nas configurações. Por enquanto, posso confirmar que os arquivos foram recebidos com sucesso.`;
  }
  
  if (userMessage.includes('/simular')) {
    return "Para simular um empréstimo, você pode usar o módulo Simulador de Empréstimos. Precisa de ajuda com algum cálculo específico?";
  }
  
  if (userMessage.includes('/analisar')) {
    return "Para análise de documentos, envie seus extratos bancários, faturas de cartão ou contracheques. Configure uma IA para análise completa.";
  }
  
  if (userMessage.includes('/configurar')) {
    return "Para configurar a IA, clique no ícone de configurações e adicione sua chave de API do OpenAI, Claude, Gemini ou Grok.";
  }
  
  return responses[Math.floor(Math.random() * responses.length)];
}

// Criar pasta de uploads se não existir
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor de chat rodando na porta ${PORT}`);
});

export { app, io };