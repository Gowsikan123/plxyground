import { creatorSignupSchema, fieldErrors, password } from '../validation';

describe('password rules (match the API)', () => {
  it.each([
    ['short1A', false],
    ['alllowercase1', false],
    ['NoNumbersHere', false],
    ['Password1', true],
  ])('%s → valid: %s', (value, valid) => {
    expect(password.safeParse(value).success).toBe(valid);
  });
});

describe('creator sign-up', () => {
  it('reports the first problem per field', () => {
    const result = creatorSignupSchema.safeParse({
      displayName: '',
      username: 'a',
      email: 'nope',
      password: 'weak',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = fieldErrors(result.error);
      expect(Object.keys(errors).sort()).toEqual(['displayName', 'email', 'password', 'username']);
      expect(errors.password).toBe('Use at least 8 characters');
    }
  });
});
