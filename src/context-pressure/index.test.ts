import { describe, expect, test } from 'bun:test';
import { buildPressureProfiles } from './index';

describe('buildPressureProfiles', () => {
  test('uses defaults when no config provided', () => {
    const profiles = buildPressureProfiles();

    expect(profiles.engineering.thresholds).toEqual({
      l1: 0.5,
      l2: 0.65,
      l3: 0.8,
    });
    expect(profiles.bio.thresholds).toEqual({
      l1: 0.55,
      l2: 0.7,
      l3: 0.85,
    });
  });

  test('accepts valid configured overrides', () => {
    const profiles = buildPressureProfiles({
      engineering: { l1: 0.45, l2: 0.6, l3: 0.78 },
      bio: { l1: 0.52, l2: 0.68, l3: 0.83 },
    });

    expect(profiles.engineering.thresholds).toEqual({
      l1: 0.45,
      l2: 0.6,
      l3: 0.78,
    });
    expect(profiles.bio.thresholds).toEqual({
      l1: 0.52,
      l2: 0.68,
      l3: 0.83,
    });
  });

  test('falls back to defaults when thresholds are invalid', () => {
    const profiles = buildPressureProfiles({
      engineering: { l1: 0.7, l2: 0.6, l3: 0.8 },
      bio: { l1: 0.6, l2: 0.9, l3: 1.1 },
    });

    expect(profiles.engineering.thresholds).toEqual({
      l1: 0.5,
      l2: 0.65,
      l3: 0.8,
    });
    expect(profiles.bio.thresholds).toEqual({
      l1: 0.55,
      l2: 0.7,
      l3: 0.85,
    });
  });
});
