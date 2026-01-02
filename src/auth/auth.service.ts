import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { db, users, User } from '../db';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(private jwtService: JwtService) {}

  async register(registerDto: RegisterDto): Promise<{ message: string }> {
    const { displayName, email, password } = registerDto;
    this.logger.debug(`Processing registration for: ${email}`);

    // Check if user already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (existingUser) {
      this.logger.warn(`Registration failed - user already exists: ${email}`);
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    this.logger.debug(`Password hashed for: ${email}`);

    // Create user
    const [newUser] = await db
      .insert(users)
      .values({
        email,
        password: hashedPassword,
        displayName,
      })
      .returning();

    this.logger.log(`User created successfully: ${email} (id: ${newUser.id})`);

    return { message: 'User created successfully' };
  }

  async login(
    loginDto: LoginDto,
  ): Promise<{ accessToken: string; user: Omit<User, 'password'> }> {
    const { email, password } = loginDto;
    this.logger.debug(`Processing login for: ${email}`);

    // Find user
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!user) {
      this.logger.warn(`Login failed - user not found: ${email}`);
      throw new UnauthorizedException('Invalid email or password');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      this.logger.warn(`Login failed - invalid password for: ${email}`);
      throw new UnauthorizedException('Invalid email or password');
    }

    // Generate JWT
    const payload = { sub: user.id, email: user.email };
    const accessToken = this.jwtService.sign(payload);
    this.logger.debug(`JWT generated for: ${email}`);

    // Return token and user info (without password)
    const { password: _, ...userWithoutPassword } = user;

    this.logger.log(`Login successful for: ${email}`);
    return {
      accessToken,
      user: userWithoutPassword,
    };
  }

  async validateUserById(
    userId: string,
  ): Promise<Omit<User, 'password'> | null> {
    this.logger.debug(`Validating user by ID: ${userId}`);

    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      this.logger.warn(`User not found by ID: ${userId}`);
      return null;
    }

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async getProfile(userId: string): Promise<Omit<User, 'password'>> {
    const user = await this.validateUserById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return user;
  }
}
