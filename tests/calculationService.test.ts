import { describe, expect, it } from 'vitest';
import { calculateRatios, generateCsvContent } from '../services/calculationService';
import { Archetype, BodyMeasurements } from '../types';

const body = (o: Partial<BodyMeasurements> = {}): BodyMeasurements => ({
  name: 'Test',
  height: 176,
  wingspan: 176,
  headLength: 22,
  ...o,
});

describe('calculateRatios', () => {
  it('returns neutral defaults when given no data', () => {
    expect(calculateRatios(null as unknown as BodyMeasurements)).toEqual({
      apeIndex: 1,
      headRatio: 8,
      handRatio: null,
      footRatio: null,
      vitruvianScore: 0,
      archetype: Archetype.UNDEFINED,
    });
  });

  it('scores a perfectly Vitruvian body at 100', () => {
    const r = calculateRatios(body());
    expect(r.apeIndex).toBe(1);
    expect(r.headRatio).toBe(8);
    expect(r.vitruvianScore).toBe(100);
    expect(r.archetype).toBe(Archetype.VITRUVIAN_IDEAL);
  });

  it('falls back to 175/175/22 for missing measurements', () => {
    const r = calculateRatios({ name: 'x' } as BodyMeasurements);
    expect(r.apeIndex).toBe(1);
    expect(r.headRatio).toBeCloseTo(175 / 22, 5);
    expect(r.vitruvianScore).toBeGreaterThan(99);
  });

  it('classifies tall-headed proportions as Modern Heroic', () => {
    const r = calculateRatios(body({ height: 190, headLength: 21 }));
    expect(r.headRatio).toBeGreaterThan(8.2);
    expect(r.vitruvianScore).toBeLessThanOrEqual(90);
    expect(r.archetype).toBe(Archetype.MODERN_HEROIC);
  });

  it('classifies short-headed ratios as Renaissance Realism', () => {
    const r = calculateRatios(body({ height: 170, headLength: 24 }));
    expect(r.headRatio).toBeLessThan(7.5);
    expect(r.archetype).toBe(Archetype.RENAISSANCE_REALISM);
  });

  it('classifies a long wingspan as Neoclassical Power', () => {
    const r = calculateRatios(body({ height: 170, wingspan: 190, headLength: 21.5 }));
    expect(r.apeIndex).toBeGreaterThan(1.05);
    expect(r.vitruvianScore).toBeLessThanOrEqual(90);
    expect(r.archetype).toBe(Archetype.NEOCLASSICAL_POWER);
  });

  it('defaults to Renaissance Realism for mid-range, sub-ideal proportions', () => {
    const r = calculateRatios(body({ height: 175, wingspan: 183.5, headLength: 23.3 }));
    expect(r.headRatio).toBeGreaterThan(7.5);
    expect(r.headRatio).toBeLessThan(8.2);
    expect(r.apeIndex).toBeLessThanOrEqual(1.05);
    expect(r.vitruvianScore).toBeLessThanOrEqual(90);
    expect(r.archetype).toBe(Archetype.RENAISSANCE_REALISM);
  });

  it('weights head ratio (60%) above ape index (40%)', () => {
    // Same 10% deviation: on the head ratio vs. on the ape index.
    const headOff = calculateRatios(body({ height: 176, headLength: 20 })); // ratio 8.8
    const apeOff = calculateRatios(body({ height: 176, wingspan: 193.6 })); // ape 1.1
    expect(headOff.vitruvianScore).toBeLessThan(apeOff.vitruvianScore);
  });

  it('clamps the score to the 0-100 range', () => {
    const r = calculateRatios(body({ height: 100, headLength: 1, wingspan: 300 }));
    expect(r.vitruvianScore).toBe(0);
  });

  it('rounds the score to one decimal place', () => {
    const r = calculateRatios(body({ height: 180, wingspan: 182, headLength: 22.3 }));
    expect(r.vitruvianScore).toBe(Math.round(r.vitruvianScore * 10) / 10);
  });

  it('computes hand and foot ratios only when provided', () => {
    const without = calculateRatios(body());
    expect(without.handRatio).toBeNull();
    expect(without.footRatio).toBeNull();

    const withBoth = calculateRatios(body({ handLength: 17.6, footLength: 26.4 }));
    expect(withBoth.handRatio).toBeCloseTo(0.1, 5);
    expect(withBoth.footRatio).toBeCloseTo(0.15, 5);
  });
});

describe('generateCsvContent', () => {
  const data = body({ height: 180, wingspan: 182, headLength: 22.5 });

  it('returns an empty string without data or analysis', () => {
    expect(generateCsvContent(null as unknown as BodyMeasurements, calculateRatios(data))).toBe('');
    expect(generateCsvContent(data, null as never)).toBe('');
  });

  it('emits a CSV data URL with header and metric rows', () => {
    const csv = generateCsvContent(data, calculateRatios(data));
    expect(csv.startsWith('data:text/csv;charset=utf-8,')).toBe(true);
    const lines = csv.replace('data:text/csv;charset=utf-8,', '').split('\n');
    expect(lines[0]).toBe('Metric,Value,Ideal Target,Difference');
    expect(lines).toHaveLength(7);
    expect(lines.find((l) => l.startsWith('Height'))).toBe('Height,180cm,N/A,-');
    expect(lines.find((l) => l.startsWith('Wingspan'))).toBe('Wingspan,182cm,180cm,2.0cm');
    expect(lines.find((l) => l.startsWith('Head Length'))).toBe('Head Length,22.5cm,22.5cm,0.0cm');
  });

  it('reports the ape index and score against their ideals', () => {
    const analysis = calculateRatios(data);
    const lines = generateCsvContent(data, analysis).split('\n');
    expect(lines.find((l) => l.startsWith('Ape Index'))).toContain(`${analysis.apeIndex.toFixed(3)},1.000`);
    expect(lines.find((l) => l.startsWith('Vitruvian Score'))).toContain(`${analysis.vitruvianScore},100,`);
  });
});
