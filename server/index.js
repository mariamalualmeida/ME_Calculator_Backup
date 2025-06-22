import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Importar serviços
import { AIService } from './services/aiService.js';
import { FileService } from './services/fileService.js';
import { ChatService } from './services/chatService.js';
import { AuthService } from './services/authService.js';

dotenv.config();

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
app.use(express.static(path.join(__dirname, '../public')));

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

// Inicializar serviços
const aiService = new AIService();
const fileService = new FileService();
const chatService = new ChatService();
const authService = new AuthService();

// Rotas de autenticação
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const result = await authService.login(username, password);
    res.json(result);
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password, email } = req.body;
    const result = await authService.register(username, password, email);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Rotas de configuração de IA
app.get('/api/ai-configs/:userId', async (req, res) => {
  try {
    const configs = await aiService.getUserConfigs(req.params.userId);
    res.json(configs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/ai-configs', async (req, res) => {
  try {
    const config = await aiService.createConfig(req.body);
    res.json(config);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.put('/api/ai-configs/:id', async (req, res) => {
  try {
    const config = await aiService.updateConfig(req.params.id, req.body);
    res.json(config);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/ai-configs/:id', async (req, res) => {
  try {
    await aiService.deleteConfig(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Rotas de conversas
app.get('/api/conversations/:userId', async (req, res) => {
  try {
    const conversations = await chatService.getUserConversations(req.params.userId);
    res.json(conversations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/conversations/:id/messages', async (req, res) => {
  try {
    const messages = await chatService.getConversationMessages(req.params.id);
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Upload de arquivos
app.post('/api/upload', upload.array('files', 10), async (req, res) => {
  try {
    const files = req.files;
    const results = [];
    
    for (const file of files) {
      const processedFile = await fileService.processFile(file);
      results.push(processedFile);
    }
    
    res.json({ files: results });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Socket.IO para chat em tempo real
io.on('connection', (socket) => {
  console.log('Usuário conectado:', socket.id);

  // Entrar em uma conversa
  socket.on('join-conversation', (conversationId) => {
    socket.join(conversationId);
    console.log(`Socket ${socket.id} entrou na conversa ${conversationId}`);
  });

  // Enviar mensagem
  socket.on('send-message', async (data) => {
    try {
      const { conversationId, userId, content, files } = data;
      
      // Salvar mensagem do usuário
      const userMessage = await chatService.saveMessage(conversationId, 'user', content, { files });
      
      // Emitir mensagem do usuário para todos na conversa
      io.to(conversationId).emit('new-message', userMessage);
      
      // Processar arquivos se houver
      let fileAnalysis = null;
      if (files && files.length > 0) {
        fileAnalysis = await fileService.analyzeFiles(files);
      }
      
      // Obter configuração de IA ativa do usuário
      const aiConfig = await aiService.getActiveConfig(userId);
      if (!aiConfig) {
        throw new Error('Nenhuma configuração de IA ativa encontrada');
      }
      
      // Obter histórico da conversa
      const messages = await chatService.getConversationMessages(conversationId);
      
      // Gerar resposta da IA
      const aiResponse = await aiService.generateResponse(aiConfig, messages, content, fileAnalysis);
      
      // Salvar resposta da IA
      const assistantMessage = await chatService.saveMessage(conversationId, 'assistant', aiResponse, { fileAnalysis });
      
      // Emitir resposta da IA
      io.to(conversationId).emit('new-message', assistantMessage);
      
    } catch (error) {
      console.error('Erro ao processar mensagem:', error);
      socket.emit('error', { message: error.message });
    }
  });

  // Criar nova conversa
  socket.on('create-conversation', async (data) => {
    try {
      const { userId, title, aiConfigId } = data;
      const conversation = await chatService.createConversation(userId, title, aiConfigId);
      socket.emit('conversation-created', conversation);
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  socket.on('disconnect', () => {
    console.log('Usuário desconectado:', socket.id);
  });
});

// Criar pasta de uploads se não existir
import fs from 'fs';
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

export { app, io };