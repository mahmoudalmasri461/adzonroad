import { describe, expect, it } from 'vitest';
import { problemsWith } from './password';

describe('what stops a password being accepted', () => {
  it('reports every rule broken at once, not the first', () => {
    // Being told about one missing requirement at a time is how somebody ends up guessing at a
    // policy across four attempts.
    const problems = problemsWith('abc', '');

    expect(problems).toContain('Use at least 8 characters.');
    expect(problems).toContain('Include an uppercase letter.');
    expect(problems).toContain('Include a digit.');
    expect(problems.length).toBeGreaterThanOrEqual(3);
  });

  it('accepts a password that meets the policy', () => {
    expect(problemsWith('Passw0rdish', 'Passw0rdish')).toEqual([]);
  });

  it('does not complain about a mismatch before the second entry is started', () => {
    // Otherwise the form shows an error while the user is still on the first field.
    expect(problemsWith('Passw0rdish', '')).toEqual([]);
  });

  it('complains once the second entry disagrees', () => {
    expect(problemsWith('Passw0rdish', 'Passw0rdisc')).toContain('Both entries must match.');
  });

  it('accepts the temporary passwords the server generates', () => {
    // The alphabet the API uses excludes symbols, so a client rule requiring one would reject the
    // very password an administrator just issued.
    const serverStyle = ['Kx7-mQ2vRt4.zPnB', 'Ry5_wTn8xKm3.QaZ', 'Bn4!tYq7vRs2mXjK'];

    for (const password of serverStyle) {
      expect(problemsWith(password, password)).toEqual([]);
    }
  });
});
