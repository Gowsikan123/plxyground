/**
 * Client-side validation helpers — mirrors backend express-validator rules.
 */

export function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !email.trim()) return 'Email is required';
  if (!re.test(email.trim())) return 'Enter a valid email address';
  return null;
}

export function validatePassword(password) {
  if (!password) return 'Password is required';
  if (password.length < 8) return 'Password must be at least 8 characters';
  if (!/[A-Z]/.test(password)) return 'Password must contain an uppercase letter';
  if (!/[0-9]/.test(password)) return 'Password must contain a number';
  return null;
}

export function validateUsername(username) {
  if (!username || !username.trim()) return 'Username is required';
  if (username.length < 3) return 'Username must be at least 3 characters';
  if (username.length > 30) return 'Username must be 30 characters or fewer';
  if (!/^[a-zA-Z0-9_]+$/.test(username)) return 'Username can only contain letters, numbers, and underscores';
  return null;
}

export function validateRequired(value, label = 'This field') {
  if (!value || (typeof value === 'string' && !value.trim())) {
    return `${label} is required`;
  }
  return null;
}
