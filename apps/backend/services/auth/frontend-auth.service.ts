import { GraphQLError } from 'graphql';
import { randomBytes } from 'crypto';
import bcrypt from 'bcryptjs';
import type { FrontendAccount as FrontendAccountModel, User } from '@prisma/client';
import { BaseService, ServiceDependencies } from '../core';
import { generateToken } from '../../utils/jwt';

export enum FrontendAuthProvider {
  PASSWORD = 'PASSWORD',
  GOOGLE = 'GOOGLE',
  APPLE = 'APPLE',
}

export interface FrontendPasswordSignupInput {
  email: string;
  password: string;
  name?: string;
}

export interface FrontendPasswordLoginInput {
  email: string;
  password: string;
}

export interface FrontendOAuthInput {
  email: string;
  providerAccountId: string;
  name?: string;
  avatarUrl?: string;
}

export interface FrontendAuthResult {
  token: string;
  jwt: string;
  user: User;
}

export class FrontendAuthService extends BaseService {
  constructor(deps: ServiceDependencies) {
    super(deps);
  }

  async registerWithPassword(input: FrontendPasswordSignupInput): Promise<FrontendAuthResult> {
    const email = this.normalizeEmail(input.email);
    const password = input.password?.trim();

    if (!email || !password) {
      throw new GraphQLError('Email and password are required', {
        extensions: { code: 'BAD_USER_INPUT' },
      });
    }

    if (password.length < 10) {
      throw new GraphQLError('Password must be at least 10 characters long', {
        extensions: { code: 'BAD_USER_INPUT' },
      });
    }

    const existingAccount = await this.context.prisma.frontendAccount.findUnique({
      where: { email },
    });

    if (existingAccount) {
      throw new GraphQLError('An account already exists for this email', {
        extensions: { code: 'BAD_USER_INPUT' },
      });
    }

    const hashedPassword = await this.hashPassword(password);
    const account = await this.context.prisma.frontendAccount.create({
      data: {
        email,
        password: hashedPassword,
        providerType: FrontendAuthProvider.PASSWORD,
      },
    });

    const { user } = await this.ensureKeystoneUser(account, { name: input.name });
    await this.context.prisma.frontendAccount.update({
      where: { id: account.id },
      data: {
        isKeystoneUserCreated: true,
        lastLoginAt: new Date(),
      },
    });
    await this.touchUserLogin(user.id, { name: input.name });

    return this.buildAuthResult(user);
  }

  async loginWithPassword(input: FrontendPasswordLoginInput): Promise<FrontendAuthResult> {
    const email = this.normalizeEmail(input.email);
    const password = input.password?.trim();

    if (!email || !password) {
      throw new GraphQLError('Email and password are required', {
        extensions: { code: 'BAD_USER_INPUT' },
      });
    }

    const account = await this.context.prisma.frontendAccount.findUnique({
      where: { email },
      include: { user: true },
    });

    if (!account || account.providerType !== FrontendAuthProvider.PASSWORD || !account.password) {
      throw new GraphQLError('Invalid credentials', {
        extensions: { code: 'UNAUTHENTICATED' },
      });
    }

    const isMatch = await bcrypt.compare(password, account.password);
    if (!isMatch) {
      throw new GraphQLError('Invalid credentials', {
        extensions: { code: 'UNAUTHENTICATED' },
      });
    }

    const { user } = account.user
      ? { account, user: account.user }
      : await this.ensureKeystoneUser(account);

    await this.context.prisma.frontendAccount.update({
      where: { id: account.id },
      data: {
        lastLoginAt: new Date(),
        isKeystoneUserCreated: true,
      },
    });
    await this.touchUserLogin(user.id);

    return this.buildAuthResult(user);
  }

  async upsertOAuthAccount(
    providerType: FrontendAuthProvider,
    input: FrontendOAuthInput
  ): Promise<FrontendAuthResult> {
    if (providerType === FrontendAuthProvider.PASSWORD) {
      throw new GraphQLError('Password accounts must use the password login flow', {
        extensions: { code: 'BAD_USER_INPUT' },
      });
    }

    const email = this.normalizeEmail(input.email);
    const providerAccountId = input.providerAccountId?.trim();

    if (!email || !providerAccountId) {
      throw new GraphQLError('Provider account ID and email are required', {
        extensions: { code: 'BAD_USER_INPUT' },
      });
    }

    let account = await this.context.prisma.frontendAccount.findFirst({
      where: {
        OR: [{ providerAccountId }, { email }],
      },
      include: { user: true },
    });

    if (!account) {
      account = await this.context.prisma.frontendAccount.create({
        data: {
          email,
          providerType,
          providerAccountId,
        },
        include: { user: true },
      });
    } else if (
      account.providerAccountId !== providerAccountId ||
      account.providerType !== providerType
    ) {
      account = await this.context.prisma.frontendAccount.update({
        where: { id: account.id },
        data: {
          providerType,
          providerAccountId,
        },
        include: { user: true },
      });
    }

    const { user } = account.user
      ? { account, user: account.user }
      : await this.ensureKeystoneUser(account, { name: input.name, avatarUrl: input.avatarUrl });

    await this.context.prisma.frontendAccount.update({
      where: { id: account.id },
      data: {
        lastLoginAt: new Date(),
        isKeystoneUserCreated: true,
      },
    });
    await this.touchUserLogin(user.id, { name: input.name, avatarUrl: input.avatarUrl });

    return this.buildAuthResult(user);
  }

  private async ensureKeystoneUser(
    account: FrontendAccountModel & { user?: User | null },
    profile?: { name?: string; avatarUrl?: string }
  ): Promise<{ account: FrontendAccountModel; user: User }> {
    if (account.userId) {
      const existingUser =
        account.user ||
        (await this.context.prisma.user.findUnique({
          where: { id: account.userId },
        }));

      if (existingUser) {
        return { account, user: existingUser };
      }
    }

    const randomPassword = await this.generateRandomPasswordHash();
    const derivedName = profile?.name?.trim() || this.deriveNameFromEmail(account.email);

    const user = await this.context.prisma.user.create({
      data: {
        email: account.email,
        name: derivedName,
        avatarUrl: profile?.avatarUrl ?? '',
        password: randomPassword,
        privacyToggle: true,
        isAdmin: false,
        lastLoginDate: new Date(),
      },
    });

    const updatedAccount = await this.context.prisma.frontendAccount.update({
      where: { id: account.id },
      data: {
        user: { connect: { id: user.id } },
        isKeystoneUserCreated: true,
      },
    });

    return { account: updatedAccount, user };
  }

  private normalizeEmail(email?: string) {
    return email?.trim().toLowerCase() ?? '';
  }

  private deriveNameFromEmail(email: string) {
    return email.split('@')[0] || email;
  }

  private async hashPassword(passwordValue: string) {
    const saltRounds = Number(process.env.AUTH_HASH_ROUNDS ?? 12);
    return bcrypt.hash(passwordValue, saltRounds);
  }

  private async generateRandomPasswordHash() {
    const randomSecret = randomBytes(32).toString('hex');
    return this.hashPassword(randomSecret);
  }

  private async touchUserLogin(userId: string, overrides?: { name?: string; avatarUrl?: string }) {
    await this.context.prisma.user.update({
      where: { id: userId },
      data: {
        lastLoginDate: new Date(),
        name: overrides?.name?.trim() || undefined,
        avatarUrl: overrides?.avatarUrl || undefined,
      },
    });
  }

  private async buildAuthResult(user: User): Promise<FrontendAuthResult> {
    const token = await this.startSession(user);
    const jwt = generateToken({ id: user.id, email: user.email });
    return { token, jwt, user };
  }

  private async startSession(user: User) {
    const sessionStrategy = this.context.sessionStrategy;
    if (!sessionStrategy) {
      throw new GraphQLError('Session strategy is not configured', {
        extensions: { code: 'INTERNAL_SERVER_ERROR' },
      });
    }

    const sessionToken = await sessionStrategy.start({
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role ?? 'user',
        isAdmin: user.isAdmin ?? false,
      },
      context: this.context,
    });

    if (!sessionToken) {
      throw new GraphQLError('Failed to issue session token', {
        extensions: { code: 'INTERNAL_SERVER_ERROR' },
      });
    }

    return sessionToken;
  }
}
