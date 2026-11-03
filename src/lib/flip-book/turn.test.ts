import { describe, expect, it } from 'vitest';
import { clampSpread, leafTurn, spreadCount, spreadOfPage, visibleLeaves } from './turn';
import { stepSpring } from './spring';

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

const rest = (shown: number) => ({ pos: shown, anchor: shown, speed: 0 });

describe('leafTurn', () => {
	it('lays leaves before the spread flat on the left and the rest flat on the right', () => {
		expect([0, 1, 2, 3].map((j) => leafTurn(j, rest(2)))).toEqual([1, 1, 0, 0]);
	});

	it('turns one leaf with the spring, in either direction', () => {
		expect(leafTurn(2, { pos: 2.25, anchor: 2, speed: 2 })).toBe(0.25);
		expect(leafTurn(2, { pos: 2.75, anchor: 3, speed: -2 })).toBe(0.75);
	});

	it('never turns back a leaf that is already over, or ahead of one that has not started', () => {
		expect(leafTurn(1, { pos: 2.1, anchor: 2, speed: 30 })).toBe(1);
		expect(leafTurn(5, { pos: 2.1, anchor: 2, speed: 30 })).toBe(0);
		expect(leafTurn(4, { pos: 2.9, anchor: 3, speed: -30 })).toBe(0);
	});

	it('fans a fast flight so several leaves are in the air at once, and not a slow one', () => {
		const inAir = (speed: number) =>
			[2, 3, 4, 5, 6, 7].filter((j) => {
				const t = leafTurn(j, { pos: 6.5, anchor: 2, speed });
				return t > 0 && t < 1;
			}).length;
		expect(inAir(4)).toBe(1);
		expect(inAir(40)).toBeGreaterThan(2);
	});

	it('is continuous when the spring is retargeted mid-turn', () => {
		let state = { x: 0, v: 0 };
		for (let i = 0; i < 12; i++) state = stepSpring(state, 1, 1 / 60);
		const before = leafTurn(0, { pos: state.x, anchor: 0, speed: state.v });
		state = stepSpring(state, 2, 1 / 600);
		const after = leafTurn(0, { pos: state.x, anchor: 0, speed: state.v });
		expect(Math.abs(after - before)).toBeLessThan(0.02);
		expect(state.v).toBeGreaterThan(0);
	});
});

describe('visibleLeaves', () => {
	it('draws only the tops of the two stacks at rest', () => {
		expect(visibleLeaves(20, rest(5))).toEqual([4, 5]);
		expect(visibleLeaves(20, rest(0))).toEqual([0]);
		expect(visibleLeaves(3, rest(3))).toEqual([2]);
	});

	it('adds the leaves in flight', () => {
		expect(visibleLeaves(20, { pos: 5.5, anchor: 5, speed: 2 })).toEqual([4, 5, 6]);
	});
});
