import { describe, expect, it } from 'vitest';
import { STRIPS, stripShade, stripTurns } from './curl';

describe('stripTurns', () => {
	it('is flat at both rests', () => {
		expect(stripTurns(0, 1)).toEqual(Array(STRIPS).fill(0));
		expect(stripTurns(1, -1)).toEqual(Array(STRIPS).fill(1));
	});

	it('keeps the strip on the spine with the page and runs the outer edge ahead', () => {
		const forward = stripTurns(0.5, 1);
		expect(forward[0]).toBe(0.5);
		expect(forward[STRIPS - 1]).toBeCloseTo(0.74);
		expect(forward).toEqual([...forward].sort((a, b) => a - b));
	});

	it('runs the outer edge ahead the other way when turning back', () => {
		const back = stripTurns(0.5, -1);
		expect(back[0]).toBe(0.5);
		expect(back[STRIPS - 1]).toBeCloseTo(0.26);
		expect(back).toEqual([...back].sort((a, b) => b - a));
	});

	it('never turns a strip past flat', () => {
		for (const t of [0.05, 0.3, 0.7, 0.95]) {
			for (const turn of [...stripTurns(t, 1), ...stripTurns(t, -1)]) {
				expect(turn).toBeGreaterThanOrEqual(0);
				expect(turn).toBeLessThanOrEqual(1);
			}
		}
	});
});

describe('stripShade', () => {
	it('is unshaded on the face flat to the viewer and darkest edge-on', () => {
		expect(stripShade(0)).toEqual({ front: 0, back: 0.72 });
		expect(stripShade(1).back).toBeCloseTo(0);
		expect(stripShade(0.5).front).toBeCloseTo(0.36);
		expect(stripShade(0.5).back).toBeCloseTo(0.36);
	});
});
