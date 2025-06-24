import { pgTable, serial, text, timestamp, boolean, integer, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Tabela de usuários para autenticação
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  password: text('password').notNull(),
  email: text('email'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Tabela de configurações de IA
export const aiConfigs = pgTable('ai_configs', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  name: text('name').notNull(),
  provider: text('provider').notNull(), // 'openai', 'gemini', 'claude', 'grok'
  apiKey: text('api_key').notNull(),
  model: text('model').notNull(),
  systemPrompt: text('system_prompt').notNull(),
  temperature: text('temperature').default('0.7'),
  maxTokens: integer('max_tokens').default(2000),
  isActive: boolean('is_active').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Tabela de conversas
export const conversations = pgTable('conversations', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  title: text('title').notNull(),
  aiConfigId: integer('ai_config_id'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Tabela de mensagens
export const messages = pgTable('messages', {
  id: serial('id').primaryKey(),
  conversationId: integer('conversation_id').notNull(),
  role: text('role').notNull(), // 'user', 'assistant', 'system'
  content: text('content').notNull(),
  metadata: jsonb('metadata'), // Para arquivos, análises, etc.
  createdAt: timestamp('created_at').defaultNow(),
});

// Tabela de arquivos enviados
export const uploadedFiles = pgTable('uploaded_files', {
  id: serial('id').primaryKey(),
  messageId: integer('message_id').notNull(),
  filename: text('filename').notNull(),
  originalName: text('original_name').notNull(),
  mimeType: text('mime_type').notNull(),
  size: integer('size').notNull(),
  path: text('path').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Tabela de análises financeiras
export const financialAnalyses = pgTable('financial_analyses', {
  id: serial('id').primaryKey(),
  conversationId: integer('conversation_id').notNull(),
  fileId: integer('file_id'),
  analysisType: text('analysis_type').notNull(), // 'extrato', 'fatura', 'contracheque'
  results: jsonb('results').notNull(),
  summary: text('summary'),
  score: integer('score'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Relações
export const usersRelations = relations(users, ({ many }) => ({
  aiConfigs: many(aiConfigs),
  conversations: many(conversations),
}));

export const aiConfigsRelations = relations(aiConfigs, ({ one, many }) => ({
  user: one(users, {
    fields: [aiConfigs.userId],
    references: [users.id],
  }),
  conversations: many(conversations),
}));

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  user: one(users, {
    fields: [conversations.userId],
    references: [users.id],
  }),
  aiConfig: one(aiConfigs, {
    fields: [conversations.aiConfigId],
    references: [aiConfigs.id],
  }),
  messages: many(messages),
  analyses: many(financialAnalyses),
}));

export const messagesRelations = relations(messages, ({ one, many }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
  files: many(uploadedFiles),
}));

export const uploadedFilesRelations = relations(uploadedFiles, ({ one }) => ({
  message: one(messages, {
    fields: [uploadedFiles.messageId],
    references: [messages.id],
  }),
}));

export const financialAnalysesRelations = relations(financialAnalyses, ({ one }) => ({
  conversation: one(conversations, {
    fields: [financialAnalyses.conversationId],
    references: [conversations.id],
  }),
  file: one(uploadedFiles, {
    fields: [financialAnalyses.fileId],
    references: [uploadedFiles.id],
  }),
}));

// Tipos TypeScript
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type AiConfig = typeof aiConfigs.$inferSelect;
export type InsertAiConfig = typeof aiConfigs.$inferInsert;
export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = typeof conversations.$inferInsert;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;
export type UploadedFile = typeof uploadedFiles.$inferSelect;
export type InsertUploadedFile = typeof uploadedFiles.$inferInsert;
export type FinancialAnalysis = typeof financialAnalyses.$inferSelect;
export type InsertFinancialAnalysis = typeof financialAnalyses.$inferInsert;