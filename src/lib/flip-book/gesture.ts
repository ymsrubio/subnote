/**
 * The flip-book's state through a press, a drag, a release and a landing. Every function takes the
 * state and an event and returns the next state, so the component only forwards pointer events and
 * runs the spring.
 */
import {
	DRAG_SLOP,
	dragDirection,
	dragPosition,
	pushSample,
	releaseTarget,
	releaseVelocity,
	type DragDirection,
	type Sample
} from './drag';

/** A press on a page. Once the pointer has moved far enough it is a drag. */
export interface Press {
	id: number;
	x: number;
	y: number;
	dir: DragDirection;
	/** The spread the turning page leaves. */
	origin: number;
	/** How far the page had already turned, 0 to 1, when a press grabbed it in flight. */
	grabbed: number;
	dx: number;
	dragging: boolean;
	samples: Sample[];
}

/**
 * `pos` is the spring's position in spreads, moving from `anchor`, the spread the book last rested on,
 * towards `target`. `speed` is the spring's velocity in spreads a second.
 */
export interface Gesture {
	pos: number;
	anchor: number;
	speed: number;
	target: number;
	press: Press | null;
}

export function resting(spread: number): Gesture {
	return { pos: spread, anchor: spread, speed: 0, target: spread, press: null };
}

/** The book has come to rest on its target. */
export function land(g: Gesture): Gesture {
	return { ...g, pos: g.target, anchor: g.target, speed: 0 };
}

/** Whether the spring still has somewhere to go. */
export function inMotion(g: Gesture): boolean {
	return g.pos !== g.target || g.speed !== 0;
}

/** Aim the book at `to`. A book that is already there and still lands, so it never rests with a stale anchor. */
export function retarget(g: Gesture, to: number): Gesture {
	const next = { ...g, target: to };
	return g.press?.dragging || inMotion(next) ? next : land(next);
}

export interface PressEvent {
	id: number;
	x: number;
	y: number;
	button: number;
	primary: boolean;
	/** Where across the book the press landed, 0 at its left edge and 1 at its right. */
	fraction: number;
	lastSpread: number;
}

/**
 * A press on a page. Only the primary pointer's main button counts; any other pointer leaves the press
 * alone. A page in flight can be grabbed where it is, so long as it is a single page turning.
 */
export function press(g: Gesture, e: PressEvent): Gesture {
	if (e.button !== 0 || !e.primary) return g;
	const flying = g.pos !== g.anchor || g.speed !== 0 || g.target !== g.anchor;
	let dir: DragDirection | 0;
	let grabbed = 0;
	if (flying) {
		if (Math.abs(g.target - g.anchor) > 1) return { ...g, press: null };
		dir = (Math.sign(g.pos - g.anchor) || Math.sign(g.target - g.anchor)) as DragDirection | 0;
		grabbed = Math.min(Math.max(dir * (g.pos - g.anchor), 0), 1);
	} else dir = dragDirection(e.fraction, g.anchor, e.lastSpread);
	if (!dir) return { ...g, press: null };
	return {
		...g,
		press: {
			id: e.id,
			x: e.x,
			y: e.y,
			dir,
			origin: g.anchor,
			grabbed,
			dx: 0,
			dragging: false,
			samples: []
		}
	};
}

export interface MoveEvent {
	id: number;
	x: number;
	y: number;
	/** A mouse that moves with no button down has been released out of sight. */
	buttonUp: boolean;
	now: number;
	pageWidth: number;
	reducedMotion: boolean;
}

/** The pointer moved: past the slop a horizontal move starts a drag, a vertical one gives the press up. */
export function move(g: Gesture, e: MoveEvent): Gesture {
	const p = g.press;
	if (!p || e.id !== p.id) return g;
	if (e.buttonUp) return { ...g, press: null };
	const dx = e.x - p.x;
	const dy = e.y - p.y;
	if (!p.dragging) {
		if (Math.hypot(dx, dy) < DRAG_SLOP) return g;
		if (Math.abs(dy) > Math.abs(dx)) return { ...g, press: null };
	}
	if (e.reducedMotion) return { ...g, press: { ...p, dx, dragging: true } };
	const pos = dragPosition(p.origin, p.dir, dx, e.pageWidth, p.grabbed);
	const samples = pushSample(p.samples, { time: e.now, position: pos });
	return { ...g, pos, speed: 0, press: { ...p, dx, dragging: true, samples } };
}

export interface ReleaseEvent {
	id: number;
	cancelled: boolean;
	now: number;
	pageWidth: number;
	reducedMotion: boolean;
}

/**
 * The pointer lifted or was lost. A drag settles on the halfway rule with the pointer's velocity, and
 * lands at once when it is already at rest on its target.
 */
export function release(g: Gesture, e: ReleaseEvent): Gesture {
	const p = g.press;
	if (!p || e.id !== p.id) return g;
	if (!p.dragging) return { ...g, press: null };
	const held = e.reducedMotion
		? dragPosition(p.origin, p.dir, p.dx, e.pageWidth, p.grabbed)
		: g.pos;
	const to = e.cancelled ? p.origin : releaseTarget(p.origin, p.dir, held);
	const speed = e.reducedMotion ? 0 : releaseVelocity(p.samples, e.now);
	const next = { ...g, press: null, target: to, speed };
	return e.reducedMotion || !inMotion(next) ? land(next) : next;
}
