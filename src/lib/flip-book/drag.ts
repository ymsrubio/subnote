/**
 * Dragging a page. A drag moves the book's spring position directly; on release the same spring takes
 * over from where the finger left it, with the finger's velocity.
 */

/** How far a pointer travels, in page widths, to turn a page all the way. A little short of the full width. */
export const DRAG_REACH = 0.85;
/** How far the pointer moves, in px, before a press becomes a drag rather than a tap. */
export const DRAG_SLOP = 8;

/** Turning forward grabs the right-hand page and drags it left; turning back grabs the left-hand page. */
export type DragDirection = 1 | -1;

function clamp01(n: number): number {
	return Math.min(Math.max(n, 0), 1);
}

/** The direction a press at `x` (0 at the book's left edge, 1 at its right) turns, or none where there is no page to turn. */
export function dragDirection(x: number, origin: number, lastSpread: number): DragDirection | 0 {
	if (x >= 0.5) return origin < lastSpread ? 1 : 0;
	return origin > 0 ? -1 : 0;
}

/** How far a drag has turned its page, 0 to 1, after the pointer has moved `dx` px from where it pressed. */
export function dragProgress(
	dir: DragDirection,
	dx: number,
	pageWidth: number,
	clamped = true
): number {
	const progress = (-dir * dx) / (pageWidth * DRAG_REACH);
	return clamped ? clamp01(progress) : progress;
}

/**
 * The spring position a drag puts the book at: `origin` plus the page's progress towards the next
 * spread. A page grabbed in flight starts from `grabbed`, the progress it had, instead of from 0.
 */
export function dragPosition(
	origin: number,
	dir: DragDirection,
	dx: number,
	pageWidth: number,
	grabbed = 0
): number {
	return origin + dir * clamp01(grabbed + dragProgress(dir, dx, pageWidth, false));
}

/** Where a released drag settles: the next spread when it is past halfway, otherwise back where it began. */
export function releaseTarget(origin: number, dir: DragDirection, position: number): number {
	return Math.abs(position - origin) > 0.5 ? origin + dir : origin;
}

export interface Sample {
	time: number;
	position: number;
}

/** Samples older than this no longer say how fast the finger is moving. */
const WINDOW_MS = 100;

/** Adds a sample, dropping those too old to count. */
export function pushSample(samples: Sample[], sample: Sample): Sample[] {
	return [...samples.filter((s) => sample.time - s.time <= WINDOW_MS), sample];
}

/**
 * The finger's velocity in spreads a second, from the samples in the last 100ms. A finger that has
 * stopped, or moved too little to tell, has none: the page is let go, not thrown.
 */
export function releaseVelocity(samples: Sample[], now: number): number {
	const recent = samples.filter((s) => now - s.time <= WINDOW_MS);
	if (recent.length < 2) return 0;
	const first = recent[0];
	const last = recent[recent.length - 1];
	const seconds = (last.time - first.time) / 1000;
	return seconds > 0 ? (last.position - first.position) / seconds : 0;
}
