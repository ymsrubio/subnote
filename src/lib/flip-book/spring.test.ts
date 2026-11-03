import { describe, expect, it } from 'vitest';
import { atRest, DAMPING_RATIO, STIFFNESS, stepSpring } from './spring';

function run(seconds: number, frame = 1 / 60) {
	let state = { x: 0, v: 0 };
	let peak = 0;
	for (let i = 0; i < Math.round(seconds / frame); i++) {
		state = stepSpring(state, 1, frame);
		peak = Math.max(peak, state.x);
	}
	return { state, peak };
}

describe('the page-turn spring', () => {
	it('uses the design system values', () => {
		expect(STIFFNESS).toBe(95);
		expect(DAMPING_RATIO).toBe(0.86);
	});

	it('settles on its target with a barely visible overshoot', () => {
		const { state, peak } = run(2);
		expect(atRest(state, 1)).toBe(true);
		expect(peak).toBeGreaterThan(1);
		expect(peak).toBeLessThan(1.01);
	});

	it('gives the same result whatever the frame length', () => {
		expect(run(0.5, 1 / 30).state.x).toBeCloseTo(run(0.5, 1 / 120).state.x, 6);
	});

	it('is not at rest while still moving', () => {
		expect(atRest({ x: 1, v: 1 }, 1)).toBe(false);
		expect(atRest({ x: 0.5, v: 0 }, 1)).toBe(false);
	});
});
