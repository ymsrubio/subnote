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

/** A turn between two spreads. `progress` runs 0 to 1 on the spring. */
export interface Turn {
	from: number;
	to: number;
	progress: number;
}

/** Where the later leaves of a riffle start, as a share of the whole turn. */
const RIFFLE_SPREAD = 0.6;

/** How far leaf `j` is turned: 0 flat on the right, 1 flat on the left. */
export function leafTurn(j: number, shown: number, turn: Turn | null): number {
	if (!turn) return j < shown ? 1 : 0;
	const forward = turn.to > turn.from;
	const first = Math.min(turn.from, turn.to);
	const last = Math.max(turn.from, turn.to) - 1;
	if (j < first) return 1;
	if (j > last) return 0;
	const count = last - first + 1;
	const order = forward ? j - first : last - j;
	const stagger = count > 1 ? RIFFLE_SPREAD / (count - 1) : 0;
	const duration = count > 1 ? 1 - RIFFLE_SPREAD : 1;
	const t = Math.min(Math.max((turn.progress - order * stagger) / duration, 0), 1);
	return forward ? t : 1 - t;
}

/**
 * The leaves worth drawing: any mid-turn, plus the top of each stack. Leaves under those are covered.
 */
export function visibleLeaves(leaves: number, shown: number, turn: Turn | null): number[] {
	const turns = Array.from({ length: leaves }, (_, j) => leafTurn(j, shown, turn));
	const topLeft = turns.lastIndexOf(1);
	const topRight = turns.indexOf(0);
	return turns.flatMap((t, j) => ((t > 0 && t < 1) || j === topLeft || j === topRight ? [j] : []));
}
