import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';
import { UserRole } from '@prisma/client';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
}

export class AuthService {
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  static async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  static generateToken(payload: TokenPayload): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  }

  static verifyToken(token: string): TokenPayload {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  }

  static async register(
    email: string,
    password: string,
    name: string,
    role: UserRole = UserRole.PARTICIPANT
  ) {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new Error('User already exists');
    }

    const hashedPassword = await this.hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    const token = this.generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return { user, token };
  }

  static async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isValidPassword = await this.comparePassword(password, user.password);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    const token = this.generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt,
      },
      token,
    };
  }

  static async createDefaultAdmin() {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@lightexec.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
    if (existingAdmin) {
      return null;
    }

    const hashedPassword = await this.hashPassword(adminPassword);
    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        name: 'Administrator',
        role: UserRole.ADMIN,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    return admin;
  }
}
