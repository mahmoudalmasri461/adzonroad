import { apiJson } from './apiClient';

/**
 * Changing your own password.
 *
 * There is no self-service reset: the platform has no email or SMS provider, so a "forgot password"
 * link would mint a token it could not deliver. An administrator issues a temporary password
 * instead and reads it out, which is what this screen exists to replace.
 */

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

export function changePassword(input: ChangePasswordInput): Promise<void> {
  return apiJson<void>('/api/v1/auth/change-password', 'POST', input);
}

/**
 * Every rule the password breaks, checked before asking the server.
 *
 * These mirror Identity's configured policy (`RequiredLength = 8`, non-alphanumeric not required).
 * Duplicating them client-side is a deliberate trade: it means a typo is caught instantly rather
 * than after a round trip, at the cost of two places to change if the policy moves. The server
 * remains the authority — it returns its own list, and this never claims a password is acceptable,
 * only that it is obviously not.
 */
export function problemsWith(password: string, confirmation: string): string[] {
  const problems: string[] = [];

  if (password.length < 8) problems.push('Use at least 8 characters.');
  if (!/[a-z]/.test(password)) problems.push('Include a lowercase letter.');
  if (!/[A-Z]/.test(password)) problems.push('Include an uppercase letter.');
  if (!/[0-9]/.test(password)) problems.push('Include a digit.');
  if (confirmation.length > 0 && password !== confirmation) problems.push('Both entries must match.');

  return problems;
}
