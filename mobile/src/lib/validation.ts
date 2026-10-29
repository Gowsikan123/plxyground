import { z } from 'zod';

// Mirrors the API's rules (backend/src/routes/auth.js and businessAuth.js),
// so users see problems before a request is sent.

export const email = z.string().trim().email('Enter a valid email address');

export const password = z
  .string()
  .min(8, 'Use at least 8 characters')
  .regex(/[A-Z]/, 'Include an uppercase letter')
  .regex(/[0-9]/, 'Include a number');

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Enter your password'),
});

export const creatorSignupSchema = z.object({
  displayName: z.string().trim().min(1, 'Enter your name').max(50, 'Keep it under 50 characters'),
  username: z
    .string()
    .trim()
    .regex(/^[a-zA-Z0-9_]{3,20}$/, '3 to 20 letters, numbers or underscores'),
  email,
  password,
  sport: z.string().trim().max(40).optional(),
});

export const businessSignupSchema = z.object({
  companyName: z.string().trim().min(1, 'Enter your company name').max(80, 'Keep it under 80 characters'),
  email,
  password,
  industry: z.string().trim().max(60).optional(),
});

/** Turns a zod error into { field: firstMessage } for showing under inputs. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? 'form');
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
