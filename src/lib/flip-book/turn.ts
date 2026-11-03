/**
 * The flip-book's geometry. Pages are numbered from 1 and sit on leaves: leaf `j` has page `2j + 1` on
 * its front (the right-hand page) and page `2j + 2` on its back (the left-hand page). Spread `k` shows
 * leaves `0..k-1` turned over, so its left page is `2k` and its right page is `2k + 1`.
 */

/** How many spreads a book of `pageCount` pages has: the first shows page 1 alone. */
export function spreadCount(pageCount: number): number {
	return Math.floor(Math.max(pageCount, 0) / 2) + 1;
}

export function clampSpread(spread: number, pageCount: number): number {
	return Math.min(Math.max(Math.round(spread) || 0, 0), spreadCount(pageCount) - 1);
}

/** The spread that shows page `number`. */
export function spreadOfPage(number: number): number {
	return Math.floor(number / 2);
}

export function leafCount(pageCount: number): number {
	return Math.ceil(Math.max(pageCount, 0) / 2);
}

/**
 * Where the spring has the book. `pos` is the spring's position in spreads, moving from `anchor`, the
 * spread the book last rested on, towards its target. `speed` is the spring's velocity in spreads a second.
 */
export interface Flight {
	pos: number;
	anchor: number;
	speed: number;
}

/** A single turn peaks at about 4 spreads a second; only faster flights, riffles, fan out. */
const RIFFLE_SPEED = 6;
const RIFFLE_RANGE = 20;
/** How many leaves a full-speed riffle has in the air at once. */
const RIFFLE_LEAVES = 4;

function clamp01(n: number): number {
	return Math.min(Math.max(n, 0), 1);
}

/**
 * How far leaf `j` is turned: 0 flat on the right, 1 flat on the left. Leaves trail the spring, one
 * spread of travel each; a fast flight stretches that so several are in the air. At rest it is exact.
 */
export function leafTurn(j: number, { pos, anchor, speed }: Flight): number {
	const reach = 1 + (RIFFLE_LEAVES - 1) * clamp01((Math.abs(speed) - RIFFLE_SPEED) / RIFFLE_RANGE);
	if (pos >= anchor) return j < anchor ? 1 : clamp01((pos - j) / reach);
	return j >= anchor ? 0 : 1 - clamp01((j + 1 - pos) / reach);
}

/**
 * The leaves worth drawing: any mid-turn, plus the top of each stack. Leaves under those are covered.
 */
export function visibleLeaves(leaves: number, flight: Flight): number[] {
	const turns = Array.from({ length: leaves }, (_, j) => leafTurn(j, flight));
	const topLeft = turns.lastIndexOf(1);
	const topRight = turns.indexOf(0);
	return turns.flatMap((t, j) => ((t > 0 && t < 1) || j === topLeft || j === topRight ? [j] : []));
}
