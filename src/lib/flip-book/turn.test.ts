import { describe, expect, it } from 'vitest';
import { clampSpread, leafTurn, spreadCount, spreadOfPage, visibleLeaves } from './turn';

describe('spreads', () => {
	it('counts them: page 1 is alone, then pairs', () => {
		expect(spreadCount(1)).toBe(1);
		expect(spreadCount(2)).toBe(2);
		expect(spreadCount(5)).toBe(3);
		expect(spreadCount(120)).toBe(61);
	});

	it('finds the spread that shows a page', () => {
		expect([1, 2, 3, 4, 5].map(spreadOfPage)).toEqual([0, 1, 1, 2, 2]);
	});

	it('clamps to the book', () => {
		expect(clampSpread(-3, 10)).toBe(0);
		expect(clampSpread(99, 10)).toBe(5);
		expect(clampSpread(NaN, 10)).toBe(0);
	});
});

describe('leafTurn', () => {
	it('lays leaves before the spread flat on the left and the rest flat on the right', () => {
		expect([0, 1, 2, 3].map((j) => leafTurn(j, 2, null))).toEqual([1, 1, 0, 0]);
	});

	it('turns one leaf with the spring for a single turn, in either direction', () => {
		expect(leafTurn(2, 2, { from: 2, to: 3, progress: 0.25 })).toBe(0.25);
		expect(leafTurn(2, 3, { from: 3, to: 2, progress: 0.25 })).toBe(0.75);
	});

	it('staggers the leaves of a riffle so several are mid-turn at once', () => {
		const turn = { from: 0, to: 6, progress: 0.5 };
		const mid = [0, 1, 2, 3, 4, 5].filter((j) => {
			const t = leafTurn(j, 0, turn);
			return t > 0 && t < 1;
		});
		expect(mid.length).toBeGreaterThan(1);
		expect([0, 1, 2, 3, 4, 5].map((j) => leafTurn(j, 0, { ...turn, progress: 1 }))).toEqual(
			Array(6).fill(1)
		);
		expect([0, 1, 2, 3, 4, 5].map((j) => leafTurn(j, 0, { ...turn, progress: 0 }))).toEqual(
			Array(6).fill(0)
		);
	});
});

describe('visibleLeaves', () => {
	it('draws only the tops of the two stacks at rest', () => {
		expect(visibleLeaves(20, 5, null)).toEqual([4, 5]);
		expect(visibleLeaves(20, 0, null)).toEqual([0]);
		expect(visibleLeaves(3, 3, null)).toEqual([2]);
	});

	it('adds the leaves in flight', () => {
		expect(visibleLeaves(20, 5, { from: 5, to: 6, progress: 0.5 })).toEqual([4, 5, 6]);
	});
});
