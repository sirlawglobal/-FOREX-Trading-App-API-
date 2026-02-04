import { UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from './auth.guard';

describe('AuthGuard', () => {
  let guard: AuthGuard;

  beforeEach(() => {
    guard = new AuthGuard();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('handleRequest', () => {
    it('should return user for successful authentication', () => {
      const user = { id: 'userId', email: 'test@example.com' };
      const result = guard.handleRequest(null, user);
      expect(result).toEqual(user);
    });

    it('should throw UnauthorizedException for authentication error', () => {
      const error = new Error('Invalid token');
      expect(() => guard.handleRequest(error, null)).toThrow(UnauthorizedException);
      expect(() => guard.handleRequest(error, null)).toThrow('Unauthorized');
    });

    it('should throw UnauthorizedException when no user', () => {
      expect(() => guard.handleRequest(null, null)).toThrow(UnauthorizedException);
      expect(() => guard.handleRequest(null, null)).toThrow('Unauthorized');
    });

    it('should throw UnauthorizedException when user is falsy', () => {
      expect(() => guard.handleRequest(null, false)).toThrow(UnauthorizedException);
      expect(() => guard.handleRequest(null, undefined)).toThrow(UnauthorizedException);
    });
  });
});
