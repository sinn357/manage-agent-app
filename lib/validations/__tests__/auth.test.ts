import { describe, it, expect } from 'vitest';
import { registerSchema, loginSchema } from '../auth';

describe('registerSchema', () => {
  it('should validate valid registration data', () => {
    const result = registerSchema.safeParse({
      email: 'test@example.com',
      username: 'testuser123',
      password: 'Password123',
      name: 'Test User',
    });

    expect(result.success).toBe(true);
  });

  it('should reject invalid email', () => {
    const result = registerSchema.safeParse({
      email: 'invalid-email',
      username: 'testuser',
      password: 'Password123',
      name: 'Test User',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('유효한 이메일을 입력하세요');
    }
  });

  it('should reject username shorter than 3 characters', () => {
    const result = registerSchema.safeParse({
      email: 'test@example.com',
      username: 'ab',
      password: 'Password123',
      name: 'Test User',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('사용자명은 최소 3자 이상이어야 합니다');
    }
  });

  it('should reject username longer than 20 characters', () => {
    const result = registerSchema.safeParse({
      email: 'test@example.com',
      username: 'a'.repeat(21),
      password: 'Password123',
      name: 'Test User',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('사용자명은 20자 이하여야 합니다');
    }
  });

  it('should reject username with invalid characters', () => {
    const invalidUsernames = ['test@user', 'test user', 'test-user', 'test.user'];

    invalidUsernames.forEach(username => {
      const result = registerSchema.safeParse({
        email: 'test@example.com',
        username,
        password: 'Password123',
        name: 'Test User',
      });

      expect(result.success).toBe(false);
    });
  });

  it('should accept username with underscores', () => {
    const result = registerSchema.safeParse({
      email: 'test@example.com',
      username: 'test_user_123',
      password: 'Password123',
      name: 'Test User',
    });

    expect(result.success).toBe(true);
  });

  it('should reject password shorter than 8 characters', () => {
    const result = registerSchema.safeParse({
      email: 'test@example.com',
      username: 'testuser',
      password: 'Pass1',
      name: 'Test User',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('비밀번호는 최소 8자 이상이어야 합니다');
    }
  });

  it('should reject password without uppercase letter', () => {
    const result = registerSchema.safeParse({
      email: 'test@example.com',
      username: 'testuser',
      password: 'password123',
      name: 'Test User',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const upperCaseError = result.error.issues.find(issue => issue.message.includes('대문자'));
      expect(upperCaseError).toBeDefined();
    }
  });

  it('should reject password without lowercase letter', () => {
    const result = registerSchema.safeParse({
      email: 'test@example.com',
      username: 'testuser',
      password: 'PASSWORD123',
      name: 'Test User',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const lowerCaseError = result.error.issues.find(issue => issue.message.includes('소문자'));
      expect(lowerCaseError).toBeDefined();
    }
  });

  it('should reject password without number', () => {
    const result = registerSchema.safeParse({
      email: 'test@example.com',
      username: 'testuser',
      password: 'PasswordABC',
      name: 'Test User',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const numberError = result.error.issues.find(issue => issue.message.includes('숫자'));
      expect(numberError).toBeDefined();
    }
  });

  it('should reject name shorter than 2 characters', () => {
    const result = registerSchema.safeParse({
      email: 'test@example.com',
      username: 'testuser',
      password: 'Password123',
      name: 'A',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('이름은 최소 2자 이상이어야 합니다');
    }
  });

  it('should reject name longer than 50 characters', () => {
    const result = registerSchema.safeParse({
      email: 'test@example.com',
      username: 'testuser',
      password: 'Password123',
      name: 'a'.repeat(51),
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('이름은 50자 이하여야 합니다');
    }
  });
});

describe('loginSchema', () => {
  it('should validate valid login data with email', () => {
    const result = loginSchema.safeParse({
      emailOrUsername: 'test@example.com',
      password: 'password',
    });

    expect(result.success).toBe(true);
  });

  it('should validate valid login data with username', () => {
    const result = loginSchema.safeParse({
      emailOrUsername: 'testuser',
      password: 'password',
    });

    expect(result.success).toBe(true);
  });

  it('should reject empty emailOrUsername', () => {
    const result = loginSchema.safeParse({
      emailOrUsername: '',
      password: 'password',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('이메일 또는 사용자명을 입력하세요');
    }
  });

  it('should reject empty password', () => {
    const result = loginSchema.safeParse({
      emailOrUsername: 'test@example.com',
      password: '',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('비밀번호를 입력하세요');
    }
  });
});
