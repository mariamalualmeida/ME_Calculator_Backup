import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db.js';
import * as schema from '../../shared/schema.js';
import { eq } from 'drizzle-orm';

export class AuthService {
  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'me-empreendimentos-secret-key';
  }

  async register(username, password, email = null) {
    try {
      // Verificar se usuário já existe
      const [existingUser] = await db.select()
        .from(schema.users)
        .where(eq(schema.users.username, username));

      if (existingUser) {
        throw new Error('Usuário já existe');
      }

      // Hash da senha
      const hashedPassword = await bcrypt.hash(password, 10);

      // Criar usuário
      const [user] = await db.insert(schema.users)
        .values({
          username,
          password: hashedPassword,
          email,
          createdAt: new Date()
        })
        .returning({
          id: schema.users.id,
          username: schema.users.username,
          email: schema.users.email,
          createdAt: schema.users.createdAt
        });

      // Gerar token
      const token = jwt.sign(
        { userId: user.id, username: user.username },
        this.jwtSecret,
        { expiresIn: '24h' }
      );

      return {
        success: true,
        user,
        token
      };
    } catch (error) {
      throw new Error(`Erro ao registrar usuário: ${error.message}`);
    }
  }

  async login(username, password) {
    try {
      // Buscar usuário
      const [user] = await db.select()
        .from(schema.users)
        .where(eq(schema.users.username, username));

      if (!user) {
        throw new Error('Credenciais inválidas');
      }

      // Verificar senha
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        throw new Error('Credenciais inválidas');
      }

      // Gerar token
      const token = jwt.sign(
        { userId: user.id, username: user.username },
        this.jwtSecret,
        { expiresIn: '24h' }
      );

      return {
        success: true,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          createdAt: user.createdAt
        },
        token
      };
    } catch (error) {
      throw new Error(`Erro ao fazer login: ${error.message}`);
    }
  }

  async verifyToken(token) {
    try {
      const decoded = jwt.verify(token, this.jwtSecret);
      return decoded;
    } catch (error) {
      throw new Error('Token inválido');
    }
  }

  generateGuestToken() {
    // Para usuários guest/demo
    const guestId = 'guest_' + Date.now();
    return jwt.sign(
      { userId: guestId, username: 'Guest', isGuest: true },
      this.jwtSecret,
      { expiresIn: '2h' }
    );
  }
}