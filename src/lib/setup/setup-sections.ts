import { sectionSize, type Notebook, type SectionRequest } from '../placement';

export interface SectionFormInput {
	name: string;
	/** What the person typed. */
	pages: string;
}

export type SectionFormResult =
	{ ok: true; request: SectionRequest } | { ok: false; errors: { name?: string; pages?: string } };

const digitsOnly = /^\d+$/;

const tooManyPages = (pageCount: number) =>
	`The Notebook only has ${pageCount} ${pageCount === 1 ? 'page' : 'pages'}`;

const sameName = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

/** Checks the add form against the Notebook's page count and the names already taken. Each error is the text to show under its field. */
export function parseSectionForm(
	input: SectionFormInput,
	pageCount: number,
	taken: string[]
): SectionFormResult {
	const name = input.name.trim();
	const typed = input.pages.trim();
	const pages = Number(typed);
	const errors: { name?: string; pages?: string } = {};
	if (name === '') errors.name = 'Give the Section a name';
	else if (taken.some((other) => sameName(other, name))) {
		errors.name = `There is already a Section called ${name}`;
	}
	if (typed === '') errors.pages = 'Enter how many pages you want';
	else if (!digitsOnly.test(typed)) errors.pages = 'Pages wanted must be a whole number';
	else if (pages < 1) errors.pages = 'Pages wanted must be at least 1';
	else if (pages > pageCount) errors.pages = tooManyPages(pageCount);
	if (errors.name || errors.pages) return { ok: false, errors };
	return { ok: true, request: { name, pages } };
}

/** The sizes a Section can take in a Notebook: powers of two up to its page count. */
function sizesFor(pageCount: number): number[] {
	const sizes: number[] = [];
	for (let size = 1; size <= pageCount; size *= 2) sizes.push(size);
	return sizes;
}

/** The help line under "Pages wanted": what a typed count rounds up to, or the sizes available before anything valid is typed. */
export function roundsUpHelp(typed: string, pageCount: number): string {
	const digits = typed.trim();
	const pages = Number(digits);
	if (digitsOnly.test(digits) && pages >= 1) {
		if (pages > pageCount) return tooManyPages(pageCount);
		const size = sectionSize(pages);
		if (size > pageCount) return tooManyPages(pageCount);
		return `Rounds up to ${size} ${size === 1 ? 'page' : 'pages'}.`;
	}
	const sizes = sizesFor(pageCount);
	const last = sizes.pop();
	const list = sizes.length === 0 ? `${last}` : `${sizes.join(', ')} or ${last}`;
	return `Sizes round up to ${list} ${last === 1 ? 'page' : 'pages'}. The Title Page counts as one of them.`;
}

/**
 * The requests that produce `notebook` when placed again: placed Sections in placement order, then
 * Pending ones. Setup stores the placed result, so this is how a saved draft becomes editable.
 */
export function requestsOf(notebook: Notebook): SectionRequest[] {
	return [...notebook.sections, ...notebook.pending].map((s) => ({
		name: s.name,
		pages: s.requested
	}));
}

/** The runs of Free Pages, in page order. */
export function freeRanges(notebook: Notebook): { first: number; last: number }[] {
	const ranges: { first: number; last: number }[] = [];
	let next = 1;
	for (const s of [...notebook.sections].sort((a, b) => a.first - b.first)) {
		if (s.first > next) ranges.push({ first: next, last: s.first - 1 });
		next = s.last + 1;
	}
	if (next <= notebook.pageCount) ranges.push({ first: next, last: notebook.pageCount });
	return ranges;
}

/** Why Confirm Setup can't be pressed yet, or undefined once a Section is placed. */
export function confirmBlockedReason(notebook: Notebook): string | undefined {
	return notebook.sections.length === 0 ? 'Add a Section to confirm Setup.' : undefined;
}

/** Each placed Section's Title Page, in page order: the pages to write names on. */
export function titlePages(notebook: Notebook) {
	return [...notebook.sections]
		.sort((a, b) => a.titlePage - b.titlePage)
		.map(({ name, titlePage, colour }) => ({ name, titlePage, colour }));
}

/** The placed Sections largest first (ties in placement order), as Setup lists them. */
export function placedLargestFirst(notebook: Notebook) {
	return [...notebook.sections].sort((a, b) => b.size - a.size);
}
