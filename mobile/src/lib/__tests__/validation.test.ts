import { creatorSignupSchema, fieldErrors, opportunitySchema, password } from '../validation';

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

describe('opportunity form', () => {
  it('drops empty optional fields and checks the date format', () => {
    const ok = opportunitySchema.safeParse({ title: ' Ambassador ', description: 'Promote shoes', sport: '', deadline: '2026-12-01' });
    expect(ok.success && ok.data).toEqual({ title: 'Ambassador', description: 'Promote shoes', deadline: '2026-12-01' });
    expect(opportunitySchema.safeParse({ title: 'A', description: 'B', deadline: '01/12/2026' }).success).toBe(false);
  });
});
