import { describe, expect, it } from 'vitest';
import {
	dragDirection,
	dragPosition,
	dragProgress,
	pushSample,
	releaseTarget,
	releaseVelocity,
	type Sample
} from './drag';

describe('dragDirection', () => {
	it('turns forward from the right-hand page and back from the left-hand one', () => {
		expect(dragDirection(0.9, 3, 10)).toBe(1);
		expect(dragDirection(0.1, 3, 10)).toBe(-1);
	});

	it('has nothing to turn past the ends of the book', () => {
		expect(dragDirection(0.9, 10, 10)).toBe(0);
		expect(dragDirection(0.1, 0, 10)).toBe(0);
	});
});

describe('dragPosition', () => {
	it('follows the pointer: 85% of a page width turns the page', () => {
		expect(dragPosition(2, 1, -170, 200)).toBeCloseTo(3);
		expect(dragPosition(2, 1, -85, 200)).toBeCloseTo(2.5);
		expect(dragPosition(2, -1, 85, 200)).toBeCloseTo(1.5);
	});

	it('stays within the one page being turned', () => {
		expect(dragPosition(2, 1, -900, 200)).toBe(3);
		expect(dragPosition(2, 1, 40, 200)).toBe(2);
		expect(dragPosition(2, -1, 900, 200)).toBe(1);
		expect(dragPosition(2, -1, -40, 200)).toBe(2);
	});

	it('reports progress from 0 to 1', () => {
		expect(dragProgress(1, -17, 200)).toBeCloseTo(0.1);
	});
});

describe('releaseTarget', () => {
	it('completes the turn past halfway and falls back before it', () => {
		expect(releaseTarget(2, 1, 2.51)).toBe(3);
		expect(releaseTarget(2, 1, 2.49)).toBe(2);
		expect(releaseTarget(2, -1, 1.49)).toBe(1);
		expect(releaseTarget(2, -1, 1.51)).toBe(2);
	});

	it('falls back when released exactly at halfway or never moved', () => {
		expect(releaseTarget(2, 1, 2.5)).toBe(2);
		expect(releaseTarget(2, 1, 2)).toBe(2);
	});
});

describe('releaseVelocity', () => {
	const at = (time: number, position: number): Sample => ({ time, position });

	it('reads the speed of the last 100ms in spreads a second', () => {
		const samples = [at(0, 0.1), at(50, 0.2), at(100, 0.3)];
		expect(releaseVelocity(samples, 105)).toBeCloseTo(2);
	});

	it('is negative when the finger moved back', () => {
		expect(releaseVelocity([at(0, 0.5), at(50, 0.4)], 55)).toBeCloseTo(-2);
	});

	it('is zero for a finger that stopped before it let go', () => {
		expect(releaseVelocity([at(0, 0.1), at(50, 0.5)], 400)).toBe(0);
	});

	it('is zero with one sample', () => {
		expect(releaseVelocity([at(0, 0.5)], 10)).toBe(0);
	});

	it('drops samples older than 100ms when pushing', () => {
		let samples: Sample[] = [];
		for (const [time, position] of [
			[0, 0],
			[60, 0.1],
			[120, 0.2],
			[180, 0.3]
		])
			samples = pushSample(samples, at(time, position));
		expect(samples.map((s) => s.time)).toEqual([120, 180]);
		expect(releaseVelocity(samples, 185)).toBeCloseTo(1.667, 2);
	});
});
