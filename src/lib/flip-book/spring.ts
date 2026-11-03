/** The one spring behind every page turn: following a drag, settling, taps, keys and riffles. */
export const STIFFNESS = 95;
export const DAMPING_RATIO = 0.86;

export interface SpringState {
	x: number;
	v: number;
}

const omega = Math.sqrt(STIFFNESS);
const omegaDamped = omega * Math.sqrt(1 - DAMPING_RATIO ** 2);
const decay = DAMPING_RATIO * omega;

/** Moves a unit-mass spring towards `target` by `dt` seconds. Exact, so any frame length is stable. */
export function stepSpring({ x, v }: SpringState, target: number, dt: number): SpringState {
	const y0 = x - target;
	const envelope = Math.exp(-decay * dt);
	const cos = Math.cos(omegaDamped * dt);
	const sin = Math.sin(omegaDamped * dt);
	const k = (v + decay * y0) / omegaDamped;
	return {
		x: target + envelope * (y0 * cos + k * sin),
		v: envelope * (v * cos - ((decay * v + STIFFNESS * y0) / omegaDamped) * sin)
	};
}

export function atRest({ x, v }: SpringState, target: number): boolean {
	return Math.abs(x - target) < 0.0005 && Math.abs(v) < 0.005;
}
