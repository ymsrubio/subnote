import { sectionColours } from '../design/sections';
import {
	setupNotebook,
	type Notebook,
	type PendingSection,
	type PlacedSection
} from '../placement';

/** Where a prefilled Setup row came from: a Section the previous Notebook placed, or one that was Pending there. */
export type CarriedOrigin = 'placed' | 'pending';

/**
 * What a next Notebook's draft Setup was prefilled with, so the markers ("from Spring", "was Pending")
 * survive a reload. A row leaves `sections` when it is removed, so a Section added later by hand has no marker.
 */
export interface Carried {
	/** The previous Notebook's name. */
	from: string;
	sections: { name: string; origin: CarriedOrigin }[];
	/** Names left out because they ask for more pages than the new Notebook has. */
	tooBig: string[];
}

/** A Notebook as kept on this device: the placement module's Notebook, plus what a person calls it and where Setup stands. */
export interface SavedNotebook {
	id: string;
	name: string;
	/** False until the person confirms Setup. */
	setupConfirmed: boolean;
	notebook: Notebook;
	/** Set on a Notebook started from a previous one. Notebooks saved before this existed have none. */
	carried?: Carried;
}

/** A new Notebook with its Setup unconfirmed: every Page is a Free Page. */
export function newSavedNotebook(id: string, name: string, pageCount: number): SavedNotebook {
	return { id, name, setupConfirmed: false, notebook: setupNotebook(pageCount, []) };
}

type Parsed<T> = { ok: true; value: T } | { ok: false };

const fail = { ok: false } as const;
const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === 'object' && value !== null && !Array.isArray(value);
const isCount = (value: unknown): value is number =>
	typeof value === 'number' && Number.isInteger(value) && value >= 1;
const isColour = (value: unknown) => sectionColours.some((colour) => colour === value);

function isPlaced(value: unknown): value is PlacedSection {
	return (
		isRecord(value) &&
		typeof value.name === 'string' &&
		isCount(value.requested) &&
		isCount(value.size) &&
		isCount(value.first) &&
		isCount(value.last) &&
		isCount(value.titlePage) &&
		isColour(value.colour)
	);
}

function isPending(value: unknown): value is PendingSection {
	return (
		isRecord(value) &&
		typeof value.name === 'string' &&
		isCount(value.requested) &&
		isCount(value.size) &&
		typeof value.reason === 'string' &&
		isColour(value.colour)
	);
}

function isCarried(value: unknown): value is Carried {
	return (
		isRecord(value) &&
		typeof value.from === 'string' &&
		Array.isArray(value.sections) &&
		value.sections.every(
			(item) =>
				isRecord(item) &&
				typeof item.name === 'string' &&
				(item.origin === 'placed' || item.origin === 'pending')
		) &&
		Array.isArray(value.tooBig) &&
		value.tooBig.every((item) => typeof item === 'string')
	);
}

/** Checks data read from storage. Anything that is not a whole SavedNotebook is rejected, never repaired. */
export function parseSavedNotebook(value: unknown): Parsed<SavedNotebook> {
	if (!isRecord(value) || !isRecord(value.notebook)) return fail;
	const { id, name, setupConfirmed } = value;
	const { pageCount, sections, pending } = value.notebook;
	if (typeof id !== 'string' || id === '') return fail;
	if (typeof name !== 'string' || name.trim() === '') return fail;
	if (typeof setupConfirmed !== 'boolean') return fail;
	const { carried } = value;
	if (carried !== undefined && !isCarried(carried)) return fail;
	if (!isCount(pageCount)) return fail;
	if (!Array.isArray(sections) || !sections.every(isPlaced)) return fail;
	if (!Array.isArray(pending) || !pending.every(isPending)) return fail;
	const parsed: SavedNotebook = {
		id,
		name,
		setupConfirmed,
		notebook: { pageCount, sections, pending }
	};
	if (carried !== undefined) {
		parsed.carried = {
			from: carried.from,
			sections: carried.sections.map(({ name, origin }) => ({ name, origin })),
			tooBig: [...carried.tooBig]
		};
	}
	return { ok: true, value: parsed };
}
