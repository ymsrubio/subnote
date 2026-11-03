import { sectionColours, type SectionColour } from '../design/sections';

export type { SectionColour };

/** What a person asks for: a name and how many pages they want, Title Page included. */
export interface SectionRequest {
	name: string;
	pages: number;
}

/** A Section placed in a Notebook. Pages are numbered from 1; `first` is its Title Page. */
export interface PlacedSection {
	name: string;
	/** The pages asked for. */
	requested: number;
	/** The pages it gets: `requested` rounded up to a power of two. */
	size: number;
	first: number;
	last: number;
	titlePage: number;
	colour: SectionColour;
}

/** A Section with no room in its Notebook, waiting for the next Notebook's Setup. */
export interface PendingSection {
	name: string;
	requested: number;
	size: number;
	reason: string;
}

/** `sections` are in placement order, not page order. Treat values as immutable. */
export interface Notebook {
	pageCount: number;
	sections: PlacedSection[];
	pending: PendingSection[];
}

export type PlacementOutcome =
	{ kind: 'placed'; section: PlacedSection } | { kind: 'pending'; pending: PendingSection };

const pagesWantedMessage = 'Pages wanted must be a whole number of at least 1';

const sameName = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

/** The smallest power of two that holds `pages`. Throws a RangeError unless `pages` is a whole number of at least 1. */
export function sectionSize(pages: number): number {
	if (!Number.isInteger(pages) || pages < 1) throw new RangeError(pagesWantedMessage);
	return 2 ** Math.ceil(Math.log2(pages));
}

/** How many Free Pages the Notebook has. */
export function freePages(notebook: Notebook): number {
	return notebook.pageCount - notebook.sections.reduce((total, s) => total + s.size, 0);
}

function validate(pageCount: number, taken: string[], request: SectionRequest): SectionRequest {
	const name = request.name.trim();
	if (name === '') throw new RangeError('A Section needs a name');
	sectionSize(request.pages);
	if (request.pages > pageCount) {
		throw new RangeError(
			`${name} wants ${request.pages} pages, but the Notebook only has ${pageCount}`
		);
	}
	if (taken.some((other) => sameName(other, name))) {
		throw new RangeError(`There is already a Section called ${name}`);
	}
	return { name, pages: request.pages };
}

function reasonFor(size: number, free: number, fragmented: boolean): string {
	const needs = `needs ${size} pages in one aligned block`;
	if (fragmented) return `${needs}, and the ${free} Free Pages left are split up`;
	return `${needs}, and only ${free} Free ${free === 1 ? 'Page is' : 'Pages are'} left`;
}

/** The first page of the first aligned block of `size` pages with no Section in it, or null. */
function findBlock(notebook: Notebook, size: number): number | null {
	for (let first = 1; first + size - 1 <= notebook.pageCount; first += size) {
		const last = first + size - 1;
		if (notebook.sections.every((s) => s.last < first || s.first > last)) return first;
	}
	return null;
}

const byPage = (sections: PlacedSection[]) => [...sections].sort((a, b) => a.first - b.first);

/** The colours of the Sections directly before and after `first` in page order. */
function neighbourColours(sections: PlacedSection[], first: number): SectionColour[] {
	const sorted = byPage(sections);
	const before = sorted.filter((s) => s.first < first).at(-1);
	const after = sorted.find((s) => s.first > first);
	return [before, after].flatMap((s) => (s ? [s.colour] : []));
}

/** The palette colour for the `position`-th placement (from 0), skipping `avoid`. */
function pickColour(position: number, avoid: SectionColour[]): SectionColour {
	for (let step = 0; step < sectionColours.length; step++) {
		const colour = sectionColours[(position + step) % sectionColours.length];
		if (!avoid.includes(colour)) return colour;
	}
	throw new Error('Two neighbours cannot use up six colours');
}

function tryPlace(notebook: Notebook, request: SectionRequest): PlacementOutcome {
	const size = sectionSize(request.pages);
	const first = findBlock(notebook, size);
	if (first === null) {
		const free = freePages(notebook);
		return {
			kind: 'pending',
			pending: {
				name: request.name,
				requested: request.pages,
				size,
				reason: reasonFor(size, free, free >= size)
			}
		};
	}
	return {
		kind: 'placed',
		section: {
			name: request.name,
			requested: request.pages,
			size,
			first,
			last: first + size - 1,
			titlePage: first,
			colour: pickColour(notebook.sections.length, neighbourColours(notebook.sections, first))
		}
	};
}

function withOutcome(notebook: Notebook, outcome: PlacementOutcome): Notebook {
	return outcome.kind === 'placed'
		? { ...notebook, sections: [...notebook.sections, outcome.section] }
		: { ...notebook, pending: [...notebook.pending, outcome.pending] };
}

const takenNames = (notebook: Notebook) => [
	...notebook.sections.map((s) => s.name),
	...notebook.pending.map((p) => p.name)
];

/**
 * Places every Section for a new Notebook, largest first (ties keep the order given), each on a page
 * boundary matching its size. Sections with no room become Pending Sections. Throws a RangeError for
 * an invalid request.
 */
export function setupNotebook(pageCount: number, requests: SectionRequest[]): Notebook {
	if (!Number.isInteger(pageCount) || pageCount < 1) {
		throw new RangeError('A Notebook needs at least 1 page');
	}
	const valid: SectionRequest[] = [];
	for (const request of requests) {
		valid.push(
			validate(
				pageCount,
				valid.map((r) => r.name),
				request
			)
		);
	}
	const largestFirst = valid
		.map((request, index) => ({ request, index, size: sectionSize(request.pages) }))
		.sort((a, b) => b.size - a.size || a.index - b.index);
	let notebook: Notebook = { pageCount, sections: [], pending: [] };
	for (const { request } of largestFirst)
		notebook = withOutcome(notebook, tryPlace(notebook, request));
	return { ...notebook, pending: notebook.pending.slice().sort(inInputOrder(valid)) };
}

const inInputOrder = (requests: SectionRequest[]) => (a: PendingSection, b: PendingSection) =>
	requests.findIndex((r) => r.name === a.name) - requests.findIndex((r) => r.name === b.name);

/**
 * What would happen if `request` were added, without changing the Notebook: the placed Section
 * (range and Title Page) or the Pending Section with its reason. Throws a RangeError for an
 * invalid request.
 */
export function previewAddSection(notebook: Notebook, request: SectionRequest): PlacementOutcome {
	const valid = validate(notebook.pageCount, takenNames(notebook), request);
	return tryPlace(notebook, valid);
}

/** Adds a Section after Setup. Existing Sections never move. Returns the new Notebook and what happened. */
export function addSection(
	notebook: Notebook,
	request: SectionRequest
): { notebook: Notebook; outcome: PlacementOutcome } {
	const outcome = previewAddSection(notebook, request);
	return { notebook: withOutcome(notebook, outcome), outcome };
}

/**
 * Removes a placed Section, turning its pages into Free Pages. Nothing moves. If its neighbours now
 * share a colour, the one placed later takes a new one. Throws a RangeError if no Section has that name.
 */
export function removeSection(notebook: Notebook, name: string): Notebook {
	if (!notebook.sections.some((s) => sameName(s.name, name))) {
		throw new RangeError(`There is no Section called ${name}`);
	}
	let sections = notebook.sections.filter((s) => !sameName(s.name, name));
	const sorted = byPage(sections);
	for (let i = 1; i < sorted.length; i++) {
		const [left, right] = [sorted[i - 1], sorted[i]];
		if (left.colour !== right.colour) continue;
		const recolour = sections.indexOf(left) > sections.indexOf(right) ? left : right;
		const others = sections.filter((s) => s !== recolour);
		const colour = pickColour(sections.indexOf(recolour), neighbourColours(others, recolour.first));
		sections = sections.map((s) => (s === recolour ? { ...s, colour } : s));
		sorted[sorted.indexOf(recolour)] = { ...recolour, colour };
	}
	return { ...notebook, sections };
}
