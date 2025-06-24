import { db } from '../db.js';
import * as schema from '../../shared/schema.js';
import { eq, desc } from 'drizzle-orm';

export class ChatService {
  async createConversation(userId, title, aiConfigId = null) {
    try {
      const [conversation] = await db.insert(schema.conversations)
        .values({
          userId: parseInt(userId),
          title: title || 'Nova Conversa',
          aiConfigId: aiConfigId ? parseInt(aiConfigId) : null,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();
      
      return conversation;
    } catch (error) {
      throw new Error(`Erro ao criar conversa: ${error.message}`);
    }
  }

  async getUserConversations(userId) {
    try {
      const userConversations = await db.select()
        .from(schema.conversations)
        .where(eq(schema.conversations.userId, parseInt(userId)))
        .orderBy(desc(schema.conversations.updatedAt));
      
      return userConversations;
    } catch (error) {
      throw new Error(`Erro ao buscar conversas: ${error.message}`);
    }
  }

  async getConversationMessages(conversationId) {
    try {
      const conversationMessages = await db.select()
        .from(schema.messages)
        .where(eq(schema.messages.conversationId, parseInt(conversationId)))
        .orderBy(schema.messages.createdAt);
      
      return conversationMessages;
    } catch (error) {
      throw new Error(`Erro ao buscar mensagens: ${error.message}`);
    }
  }

  async saveMessage(conversationId, role, content, metadata = null) {
    try {
      const [message] = await db.insert(schema.messages)
        .values({
          conversationId: parseInt(conversationId),
          role,
          content,
          metadata,
          createdAt: new Date()
        })
        .returning();

      // Atualizar timestamp da conversa
      await db.update(schema.conversations)
        .set({ updatedAt: new Date() })
        .where(eq(schema.conversations.id, parseInt(conversationId)));
      
      return message;
    } catch (error) {
      throw new Error(`Erro ao salvar mensagem: ${error.message}`);
    }
  }

  async updateConversationTitle(conversationId, title) {
    try {
      const [conversation] = await db.update(schema.conversations)
        .set({ 
          title,
          updatedAt: new Date()
        })
        .where(eq(schema.conversations.id, parseInt(conversationId)))
        .returning();
      
      return conversation;
    } catch (error) {
      throw new Error(`Erro ao atualizar título da conversa: ${error.message}`);
    }
  }

  async deleteConversation(conversationId) {
    try {
      // Primeiro deletar todas as mensagens da conversa
      await db.delete(schema.messages)
        .where(eq(schema.messages.conversationId, parseInt(conversationId)));
      
      // Depois deletar a conversa
      await db.delete(schema.conversations)
        .where(eq(schema.conversations.id, parseInt(conversationId)));
    } catch (error) {
      throw new Error(`Erro ao deletar conversa: ${error.message}`);
    }
  }

  async generateConversationTitle(firstMessage) {
    // Gera um título baseado na primeira mensagem
    const maxLength = 50;
    if (firstMessage.length <= maxLength) {
      return firstMessage;
    }
    
    return firstMessage.substring(0, maxLength - 3) + '...';
  }
}