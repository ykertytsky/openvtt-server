import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConflictException } from '@nestjs/common';
import { AuthService } from '../auth.service';

jest.mock('../../db', () => ({
  db: {
    query: {
      users: {
        findFirst: jest.fn(),
      },
    },
    insert: jest.fn(() => ({
      values: jest.fn(() => ({
        returning: jest.fn(() =>
          Promise.resolve([
            {
              id: 'test-uuid',
              email: 'test@example.com',
              displayName: 'Test User',
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ]),
        ),
      })),
    })),
  },
  users: {},
}));

describe('AuthService.register', () => {
  let service: AuthService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: { sign: jest.fn(() => 'mock-token') },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should create user successfully', async () => {
    const { db } = require('../../db');
    db.query.users.findFirst.mockResolvedValue(null);

    const result = await service.register({
      displayName: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    });

    expect(result).toEqual({ message: 'User created successfully' });
    expect(db.insert).toHaveBeenCalled();
  });

  it('should throw ConflictException when email exists', async () => {
    const { db } = require('../../db');
    db.query.users.findFirst.mockResolvedValue({
      id: 'existing-uuid',
      email: 'test@example.com',
    });

    await expect(
      service.register({
        displayName: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      }),
    ).rejects.toThrow(ConflictException);
  });
});

