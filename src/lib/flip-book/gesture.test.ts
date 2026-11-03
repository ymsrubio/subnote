import { describe, expect, it } from 'vitest';
import { land, move, press, release, resting, retarget, type Gesture } from './gesture';

const W = 200;
const down = { id: 1, x: 300, y: 100, button: 0, primary: true, fraction: 0.9, lastSpread: 5 };
const step = (g: Gesture, x: number, now: number, id = 1) =>
	move(g, { id, x, y: 100, buttonUp: false, now, pageWidth: W, reducedMotion: false });
const lift = (g: Gesture, now: number, cancelled = false, id = 1) =>
	release(g, { id, cancelled, now, pageWidth: W, reducedMotion: false });

describe('press', () => {
	it('starts a press from the right-hand page of a resting book', () => {
		expect(press(resting(2), down).press).toEqual({
			id: 1,
			x: 300,
			y: 100,
			dir: 1,
			origin: 2,
			grabbed: 0,
			dx: 0,
			dragging: false,
			samples: []
		});
	});

	it('leaves an active press alone when a second finger or the wrong button goes down', () => {
		const held = press(resting(2), down);
		expect(press(held, { ...down, id: 2, primary: false })).toBe(held);
		expect(press(held, { ...down, id: 3, button: 2 })).toBe(held);
	});

	it('has no press where there is no page to turn', () => {
		expect(press(resting(5), down).press).toBeNull();
	});
});

describe('a second finger mid-drag', () => {
	it('does not strand the page: the first finger still drags and releases', () => {
		let g = press(resting(2), down);
		g = step(g, 250, 0);
		const dragged = g.pos;
		g = press(g, { ...down, id: 2, primary: false });
		expect(g.press?.dragging).toBe(true);
		g = step(g, 100, 50, 2);
		expect(g.pos).toBe(dragged);
		g = lift(g, 70, false, 2);
		expect(g.press?.id).toBe(1);
		g = step(g, 100, 80);
		g = lift(g, 500);
		expect(g).toEqual({ pos: 3, anchor: 3, speed: 0, target: 3, press: null });
	});
});

describe('release', () => {
	it('lands at once when a full drag is held still and let go', () => {
		let g = press(resting(2), down);
		g = step(g, 100, 0);
		g = step(g, 50, 20);
		expect(g.pos).toBe(3);
		g = lift(g, 500);
		expect(g).toEqual({ pos: 3, anchor: 3, speed: 0, target: 3, press: null });
	});

	it('lands back on the origin when a held drag stays short of halfway', () => {
		let g = press(resting(2), down);
		g = step(g, 290, 0);
		g = step(g, 260, 20);
		g = lift(g, 500);
		expect(g.anchor).toBe(2);
		expect(g.target).toBe(2);
		expect(g.pos).toBeCloseTo(2.2353, 3);
		expect(g.speed).toBe(0);
	});

	it('hands a moving release to the spring with the finger velocity', () => {
		let g = press(resting(2), down);
		g = step(g, 290, 0);
		g = step(g, 200, 100);
		g = lift(g, 100);
		expect(g.anchor).toBe(2);
		expect(g.target).toBe(3);
		expect(g.speed).toBeCloseTo(5.294, 2);
		expect(g.press).toBeNull();
	});

	it('cancels back to the origin', () => {
		let g = press(resting(2), down);
		g = step(g, 150, 0);
		g = step(g, 140, 10);
		g = lift(g, 20, true);
		expect(g.target).toBe(2);
	});

	it('lands immediately under reduced motion', () => {
		let g = press(resting(2), down);
		g = move(g, {
			id: 1,
			x: 100,
			y: 100,
			buttonUp: false,
			now: 0,
			pageWidth: W,
			reducedMotion: true
		});
		g = release(g, { id: 1, cancelled: false, now: 5, pageWidth: W, reducedMotion: true });
		expect(g).toEqual({ pos: 3, anchor: 3, speed: 0, target: 3, press: null });
	});
});

describe('move', () => {
	it('stays a press inside the slop, and gives up on a vertical move', () => {
		const g = press(resting(2), down);
		expect(step(g, 295, 0)).toBe(g);
		const vertical = move(g, {
			id: 1,
			x: 300,
			y: 140,
			buttonUp: false,
			now: 0,
			pageWidth: W,
			reducedMotion: false
		});
		expect(vertical.press).toBeNull();
	});

	it('gives up a mouse press that was released out of sight', () => {
		const g = press(resting(2), down);
		const gone = move(g, {
			id: 1,
			x: 250,
			y: 100,
			buttonUp: true,
			now: 0,
			pageWidth: W,
			reducedMotion: false
		});
		expect(gone.press).toBeNull();
	});
});

describe('grabbing a page in flight', () => {
	const flying: Gesture = { pos: 2.5, anchor: 2, speed: 3, target: 3, press: null };

	it('grabs the moving leaf where it is and drags on from there', () => {
		let g = press(flying, down);
		expect(g.press).toMatchObject({ dir: 1, origin: 2, grabbed: 0.5 });
		g = step(g, 270, 0);
		expect(g.pos).toBeCloseTo(2.5 + 30 / 170, 5);
		g = step(g, 400, 10);
		expect(g.pos).toBe(2);
	});

	it('grabs a page turning back', () => {
		const back: Gesture = { pos: 2.5, anchor: 3, speed: -3, target: 2, press: null };
		expect(press(back, down).press).toMatchObject({ dir: -1, origin: 3, grabbed: 0.5 });
	});

	it('does not grab a riffle', () => {
		expect(press({ ...flying, target: 5 }, down).press).toBeNull();
	});
});

describe('retarget and land', () => {
	it('lands a book already on its target and at rest, so its anchor never goes stale', () => {
		const stale: Gesture = { pos: 3, anchor: 2, speed: 0, target: 3, press: null };
		expect(retarget(stale, 3)).toEqual({ pos: 3, anchor: 3, speed: 0, target: 3, press: null });
	});

	it('keeps a moving book moving towards its new target', () => {
		const moving: Gesture = { pos: 2.5, anchor: 2, speed: 3, target: 3, press: null };
		expect(retarget(moving, 4)).toEqual({ pos: 2.5, anchor: 2, speed: 3, target: 4, press: null });
		expect(land({ ...moving, target: 4 })).toEqual({
			pos: 4,
			anchor: 4,
			speed: 0,
			target: 4,
			press: null
		});
	});
});
