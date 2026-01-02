import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service';
import * as bcrypt from 'bcryptjs';

jest.mock('../../db', () => ({
  db: {
    query: {
      users: {
        findFirst: jest.fn(),
      },
    },
  },
  users: {},
}));

describe('AuthService.login', () => {
  let service: AuthService;
  const mockJwtSign = jest.fn(() => 'mock-jwt-token');

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: { sign: mockJwtSign },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should return access token on valid credentials', async () => {
    const hashedPassword = await bcrypt.hash('password123', 12);
    const { db } = require('../../db');
    db.query.users.findFirst.mockResolvedValue({
      id: 'test-uuid',
      email: 'test@example.com',
      displayName: 'Test User',
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await service.login({
      email: 'test@example.com',
      password: 'password123',
    });

    expect(result.accessToken).toBe('mock-jwt-token');
    expect(result.user.email).toBe('test@example.com');
    expect(result.user).not.toHaveProperty('password');
    expect(mockJwtSign).toHaveBeenCalledWith({
      sub: 'test-uuid',
      email: 'test@example.com',
    });
  });

  it('should throw UnauthorizedException when user not found', async () => {
    const { db } = require('../../db');
    db.query.users.findFirst.mockResolvedValue(null);

    await expect(
      service.login({
        email: 'nonexistent@example.com',
        password: 'password123',
      }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException on wrong password', async () => {
    const hashedPassword = await bcrypt.hash('password123', 12);
    const { db } = require('../../db');
    db.query.users.findFirst.mockResolvedValue({
      id: 'test-uuid',
      email: 'test@example.com',
      displayName: 'Test User',
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await expect(
      service.login({
        email: 'test@example.com',
        password: 'wrongpassword',
      }),
    ).rejects.toThrow(UnauthorizedException);
  });
});

