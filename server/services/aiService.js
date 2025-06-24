import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenAI } from '@google/genai';
import { db } from '../db.js';
import * as schema from '../../shared/schema.js';
import { eq, and } from 'drizzle-orm';

export class AIService {
  constructor() {
    this.providers = {
      openai: this.createOpenAIInstance,
      claude: this.createClaudeInstance,
      gemini: this.createGeminiInstance,
      grok: this.createGrokInstance
    };
  }

  createOpenAIInstance(apiKey) {
    return new OpenAI({ apiKey });
  }

  createClaudeInstance(apiKey) {
    return new Anthropic({ apiKey });
  }

  createGeminiInstance(apiKey) {
    return new GoogleGenAI({ apiKey });
  }

  createGrokInstance(apiKey) {
    return new OpenAI({ 
      baseURL: "https://api.x.ai/v1", 
      apiKey 
    });
  }

  async getUserConfigs(userId) {
    try {
      const configs = await db.select().from(schema.aiConfigs).where(eq(schema.aiConfigs.userId, parseInt(userId)));
      return configs;
    } catch (error) {
      throw new Error(`Erro ao buscar configurações: ${error.message}`);
    }
  }

  async getActiveConfig(userId) {
    try {
      const [config] = await db.select()
        .from(schema.aiConfigs)
        .where(and(eq(schema.aiConfigs.userId, parseInt(userId)), eq(schema.aiConfigs.isActive, true)));
      return config;
    } catch (error) {
      throw new Error(`Erro ao buscar configuração ativa: ${error.message}`);
    }
  }

  async createConfig(configData) {
    try {
      // Se esta configuração deve ser ativa, desativar as outras
      if (configData.isActive) {
        await db.update(schema.aiConfigs)
          .set({ isActive: false })
          .where(eq(schema.aiConfigs.userId, configData.userId));
      }

      const [config] = await db.insert(schema.aiConfigs)
        .values({
          ...configData,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();
      
      return config;
    } catch (error) {
      throw new Error(`Erro ao criar configuração: ${error.message}`);
    }
  }

  async updateConfig(id, updateData) {
    try {
      // Se esta configuração deve ser ativa, desativar as outras
      if (updateData.isActive) {
        const [config] = await db.select().from(schema.aiConfigs).where(eq(schema.aiConfigs.id, parseInt(id)));
        if (config) {
          await db.update(schema.aiConfigs)
            .set({ isActive: false })
            .where(eq(schema.aiConfigs.userId, config.userId));
        }
      }

      const [updatedConfig] = await db.update(schema.aiConfigs)
        .set({ ...updateData, updatedAt: new Date() })
        .where(eq(schema.aiConfigs.id, parseInt(id)))
        .returning();
      
      return updatedConfig;
    } catch (error) {
      throw new Error(`Erro ao atualizar configuração: ${error.message}`);
    }
  }

  async deleteConfig(id) {
    try {
      await db.delete(schema.aiConfigs).where(eq(schema.aiConfigs.id, parseInt(id)));
    } catch (error) {
      throw new Error(`Erro ao deletar configuração: ${error.message}`);
    }
  }

  async generateResponse(aiConfig, messages, userMessage, fileAnalysis = null) {
    try {
      const provider = this.providers[aiConfig.provider];
      if (!provider) {
        throw new Error(`Provider ${aiConfig.provider} não suportado`);
      }

      const aiInstance = provider(aiConfig.apiKey);
      
      // Preparar contexto da conversa
      let conversationHistory = this.formatConversationHistory(messages);
      
      // Adicionar análise de arquivos ao contexto se houver
      if (fileAnalysis) {
        conversationHistory += `\n\nAnálise de arquivos enviados:\n${JSON.stringify(fileAnalysis, null, 2)}`;
      }

      // Preparar prompt do sistema
      const systemPrompt = aiConfig.systemPrompt || this.getDefaultSystemPrompt();

      let response;

      switch (aiConfig.provider) {
        case 'openai':
        case 'grok':
          response = await this.generateOpenAIResponse(aiInstance, systemPrompt, conversationHistory, userMessage, aiConfig);
          break;
        case 'claude':
          response = await this.generateClaudeResponse(aiInstance, systemPrompt, conversationHistory, userMessage, aiConfig);
          break;
        case 'gemini':
          response = await this.generateGeminiResponse(aiInstance, systemPrompt, conversationHistory, userMessage, aiConfig);
          break;
        default:
          throw new Error(`Provider ${aiConfig.provider} não implementado`);
      }

      return response;
    } catch (error) {
      console.error('Erro ao gerar resposta da IA:', error);
      throw new Error(`Erro na IA: ${error.message}`);
    }
  }

  async generateOpenAIResponse(openai, systemPrompt, conversationHistory, userMessage, config) {
    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Histórico da conversa:\n${conversationHistory}\n\nMensagem atual: ${userMessage}` }
    ];

    const response = await openai.chat.completions.create({
      model: config.model || 'gpt-4o',
      messages,
      temperature: parseFloat(config.temperature) || 0.7,
      max_tokens: config.maxTokens || 2000,
    });

    return response.choices[0].message.content;
  }

  async generateClaudeResponse(claude, systemPrompt, conversationHistory, userMessage, config) {
    const response = await claude.messages.create({
      model: config.model || 'claude-sonnet-4-20250514',
      system: systemPrompt,
      messages: [
        { 
          role: 'user', 
          content: `Histórico da conversa:\n${conversationHistory}\n\nMensagem atual: ${userMessage}` 
        }
      ],
      max_tokens: config.maxTokens || 2000,
      temperature: parseFloat(config.temperature) || 0.7,
    });

    return response.content[0].text;
  }

  async generateGeminiResponse(gemini, systemPrompt, conversationHistory, userMessage, config) {
    const model = gemini.models.generateContent({
      model: config.model || 'gemini-2.5-flash',
      config: {
        systemInstruction: systemPrompt,
        temperature: parseFloat(config.temperature) || 0.7,
        maxOutputTokens: config.maxTokens || 2000,
      },
      contents: `Histórico da conversa:\n${conversationHistory}\n\nMensagem atual: ${userMessage}`,
    });

    const response = await model;
    return response.text || "Erro na resposta do Gemini";
  }

  formatConversationHistory(messages) {
    return messages.map(msg => {
      const timestamp = new Date(msg.createdAt).toLocaleString('pt-BR');
      return `[${timestamp}] ${msg.role}: ${msg.content}`;
    }).join('\n');
  }

  getDefaultSystemPrompt() {
    return `Você é Miguelita, uma assistente financeira especializada da ME EMPREENDIMENTOS. 

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

Sempre responda em português brasileiro e seja prestativa!`;
  }
}