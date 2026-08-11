import { describe, expect, it } from 'vitest';
import {
  describeQualification,
  describeStatus,
  formatSeconds,
  summarise,
  toneFor,
  verifiedShare,
  type DeliveryCounts,
  type DeliverySummary,
} from './deliveryReport';

function counts(overrides: Partial<DeliveryCounts> = {}): DeliveryCounts {
  return {
    total: 10,
    verifiedPlays: 7,
    verifiedSeconds: 105,
    fullyVerifiedPlays: 5,
    qualifiedPlays: 2,
    pendingEvidencePlays: 2,
    unverifiedPlays: 1,
    rejectedPlays: 0,
    ...overrides,
  };
}

function summary(overrides: Partial<DeliverySummary> = {}): DeliverySummary {
  return {
    campaignId: 'c1',
    campaignName: 'Summer',
    fromUtc: '2026-08-01T00:00:00Z',
    toUtc: '2026-08-11T00:00:00Z',
    generatedAtUtc: '2026-08-11T09:00:00Z',
    hasEvidence: true,
    counts: counts(),
    screenConfirmedPlays: 6,
    deviceDeclaredPlays: 1,
    qualifications: [],
    byDay: [],
    byRegion: [],
    rollupAgrees: true,
    rollupVerifiedSeconds: 105,
    ...overrides,
  };
}

describe('verified share', () => {
  it('is the verified fraction of every claim, not of the successful ones', () => {
    expect(verifiedShare(counts())).toBeCloseTo(0.7);
  });

  it('is zero for an empty period rather than a flattering hundred percent', () => {
    // 0/0 is the case where a naive implementation reports perfect delivery for no delivery.
    expect(verifiedShare(counts({ total: 0, verifiedPlays: 0 }))).toBe(0);
  });

  it('never counts pending claims as delivered', () => {
    const stillArriving = counts({ total: 10, verifiedPlays: 4, pendingEvidencePlays: 6, unverifiedPlays: 0 });

    expect(verifiedShare(stillArriving)).toBeCloseTo(0.4);
  });
});

describe('the headline sentence', () => {
  it('states what is outstanding alongside what was delivered', () => {
    const text = summarise(summary());

    expect(text).toContain('7 of 10 claimed plays are verified');
    expect(text).toContain('2 still awaiting evidence');
    expect(text).toContain('1 could not be verified');
  });

  it('says so plainly when nothing is outstanding', () => {
    const clean = summary({
      counts: counts({ verifiedPlays: 10, pendingEvidencePlays: 0, unverifiedPlays: 0, rejectedPlays: 0 }),
    });

    expect(summarise(clean)).toContain('Nothing is outstanding.');
  });

  it('does not claim delivery for a period with no claims at all', () => {
    const empty = summary({
      hasEvidence: false,
      counts: counts({
        total: 0, verifiedPlays: 0, verifiedSeconds: 0, fullyVerifiedPlays: 0,
        qualifiedPlays: 0, pendingEvidencePlays: 0, unverifiedPlays: 0, rejectedPlays: 0,
      }),
    });

    expect(summarise(empty)).toBe('No playback has been claimed for this campaign in this period.');
  });

  it('names contradicted claims rather than folding them into a failure count', () => {
    const contradicted = summary({ counts: counts({ rejectedPlays: 3 }) });

    expect(summarise(contradicted)).toContain('3 contradicted by the evidence');
  });
});

describe('tone', () => {
  it('separates clean verification from qualified verification', () => {
    expect(toneFor('Verified')).toBe('good');
    expect(toneFor('VerifiedWithQualification')).toBe('qualified');
  });

  it('does not present a claim awaiting evidence as a failure', () => {
    // After an outage this is the normal state, not a problem to alarm anyone about.
    expect(toneFor('PendingVerification')).toBe('pending');
  });

  it('treats unverified and contradicted claims as bad', () => {
    expect(toneFor('Unverified')).toBe('bad');
    expect(toneFor('Rejected')).toBe('bad');
  });
});

describe('wording', () => {
  it('translates every status out of the server vocabulary', () => {
    expect(describeStatus('PendingVerification')).toBe('Awaiting evidence');
    expect(describeStatus('Rejected')).toBe('Contradicted');
  });

  it('explains the trust ceiling on a phone-reported play', () => {
    expect(describeQualification('DeviceDeclaredSource')).toContain("driver's phone");
  });

  it('passes an unrecognised qualification through instead of hiding it', () => {
    // A flag added server-side must still reach the reader, even before the wording catches up.
    expect(describeQualification('SomethingNewEntirely')).toBe('SomethingNewEntirely');
  });

  it('formats durations readably', () => {
    expect(formatSeconds(45)).toBe('45s');
    expect(formatSeconds(105)).toBe('1m 45s');
    expect(formatSeconds(7260)).toBe('2h 1m');
  });
});
