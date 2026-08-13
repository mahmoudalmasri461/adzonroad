import { describe, expect, it } from 'vitest';
import {
  canAcceptCreatives,
  completionPercent,
  describeCompletion,
  formatBytes,
  type CreativeListItem,
} from './creatives';

function creative(overrides: Partial<CreativeListItem> = {}): CreativeListItem {
  return {
    creativeId: 'cr1',
    campaignId: 'c1',
    campaignName: 'Beirut Summer Push',
    campaignStatus: 'Active',
    name: 'hero-15s.mp4',
    type: 'Video',
    durationSeconds: 15,
    contentType: 'video/mp4',
    sizeBytes: 2_400_000,
    uploadedAtUtc: '2026-08-01T09:00:00Z',
    verifiedPlays: 0,
    totalClaims: 0,
    averageCompletion: null,
    completionSampleSize: 0,
    ...overrides,
  };
}

describe('completion', () => {
  it('is null when nothing has measured it', () => {
    // Not 0 and not 100: both are claims the platform cannot support.
    expect(completionPercent(creative())).toBeNull();
  });

  it('is a whole percentage when it has been measured', () => {
    expect(completionPercent(creative({ averageCompletion: 0.937, completionSampleSize: 40 })))
      .toBe(94);
  });

  it('distinguishes never played from played but unmeasured', () => {
    expect(describeCompletion(creative({ totalClaims: 0 }))).toBe('Not played yet');

    // Played, but no screen reported what duration it expected — the normal case until hardware.
    expect(describeCompletion(creative({ totalClaims: 20 })))
      .toBe('No screen reported an expected duration');
  });

  it('always says how many plays a rate rests on', () => {
    // "94%" alone reads as a stable rate even when it came from three plays.
    const described = describeCompletion(creative({ averageCompletion: 0.94, completionSampleSize: 3 }));

    expect(described).toContain('94%');
    expect(described).toContain('3 plays');
  });

  it('says one play in the singular', () => {
    expect(describeCompletion(creative({ averageCompletion: 1, completionSampleSize: 1 })))
      .toContain('1 play');
  });
});

describe('only a draft campaign can take a new creative', () => {
  it('accepts drafts', () => {
    expect(canAcceptCreatives('Draft')).toBe(true);
  });

  it('refuses anything a reviewer has already seen', () => {
    // What ran must be what was approved, so uploads stop at submission.
    for (const status of ['PendingApproval', 'Scheduled', 'Active', 'Paused', 'Completed'] as const) {
      expect(canAcceptCreatives(status)).toBe(false);
    }
  });
});

describe('file sizes', () => {
  it('reads at the scale the number lives at', () => {
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(2048)).toBe('2 KB');
    expect(formatBytes(2_400_000)).toBe('2.3 MB');
    expect(formatBytes(120_000_000)).toBe('114 MB');
  });
});
