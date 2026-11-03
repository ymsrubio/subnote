/**
 * The curl of a turning page. The page is cut into strips, each hinged on the one before. Every strip
 * turns a little further than the one before it, so the outer edge leads and the page bows.
 */

export const STRIPS = 12;
/** How far, in turns, the outermost strip runs ahead of the hinge at the peak of a turn. */
const CURL = 0.24;

function clamp01(n: number): number {
	return Math.min(Math.max(n, 0), 1);
}

/**
 * How far each strip is turned, from the one at the spine to the outer edge: 0 flat on the right, 1
 * flat on the left. `t` is the page's own turn and `lean` is +1 turning forward, where the outer edge
 * is ahead and more turned, or -1 turning back, where it is ahead and less turned. At 0 and 1 the page is flat.
 */
export function stripTurns(t: number, lean: number, strips = STRIPS): number[] {
	const lift = Math.sin(Math.PI * clamp01(t));
	return Array.from({ length: strips }, (_, i) => {
		const reach = strips > 1 ? (i / (strips - 1)) ** 1.4 : 0;
		return clamp01(t + lean * CURL * reach * lift);
	});
}

/** The darkness, 0 to 0.36, on a strip's front and back at `turn`: a strip is lit when facing flat on and dark edge-on. */
export function stripShade(turn: number): { front: number; back: number } {
	const c = Math.cos(turn * Math.PI);
	return { front: 0.36 * (1 - c), back: 0.36 * (1 + c) };
}
