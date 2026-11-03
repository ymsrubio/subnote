import type { SectionColour } from '../design/sections';
import { freePages, type Notebook, type PlacementOutcome } from '../placement';
import { freeRanges } from '../setup/setup-sections';

const pageRange = (first: number, last: number) =>
	first === last ? `page ${first}` : `pages ${first}–${last}`;

/** What Add Section shows before anything is added. */
export type AddPreview =
	| {
			kind: 'fits';
			name: string;
			colour: SectionColour;
			/** "pages 117–120" */
			range: string;
			/** The Title Page to write the name on. */
			instruction: string;
	  }
	| { kind: 'pending'; name: string; colour: SectionColour; title: string; detail: string };

/** The words for a placement outcome: the range and Title Page when it fits, the reason when it doesn't. */
export function previewOf(outcome: PlacementOutcome, notebookName: string): AddPreview {
	if (outcome.kind === 'placed') {
		const { name, colour, first, last, titlePage } = outcome.section;
		return {
			kind: 'fits',
			name,
			colour,
			range: pageRange(first, last),
			instruction: `Write its name on page ${titlePage}, its Title Page.`
		};
	}
	const { name, colour, reason } = outcome.pending;
	return {
		kind: 'pending',
		name,
		colour,
		title: `No room in ${notebookName}.`,
		detail: `${name} ${reason}. It'll become a Pending Section and wait for your next Notebook.`
	};
}

/** The notice that repeats on the Notebook screen after a Section became Pending. Null when it was placed. */
export function noticeOf(outcome: PlacementOutcome) {
	if (outcome.kind === 'placed') return null;
	const { name, colour, reason } = outcome.pending;
	const past = reason
		.replace(/ Page is left$/, ' Page was left')
		.replace(/ Pages are left$/, ' Pages were left');
	return { name, colour, text: `didn't fit: it ${past}. It'll wait for your next Notebook.` };
}

/** The line under "Add Section": how many Free Pages are left and where. */
export function freeSummary(notebook: Notebook): string {
	const free = freePages(notebook);
	if (free === 0) return 'No Free Pages left';
	const ranges = freeRanges(notebook)
		.map((r) => (r.first === r.last ? `${r.first}` : `${r.first}–${r.last}`))
		.join(', ');
	return `${free} Free ${free === 1 ? 'Page' : 'Pages'} left, ${ranges}`;
}

/** The line under the title on desktop: "120 pages · 5 Sections · 4 Free Pages". */
export function summaryLine(notebook: Notebook): string {
	const sections = notebook.sections.length;
	const free = freePages(notebook);
	return [
		`${notebook.pageCount} ${notebook.pageCount === 1 ? 'page' : 'pages'}`,
		`${sections} ${sections === 1 ? 'Section' : 'Sections'}`,
		free === 0 ? 'no Free Pages' : `${free} Free ${free === 1 ? 'Page' : 'Pages'}`
	].join(' · ');
}

export type NotebookRow =
	| {
			kind: 'placed';
			name: string;
			colour: SectionColour;
			first: number;
			last: number;
			requested: number;
			size: number;
	  }
	| { kind: 'free'; first: number; last: number };

/** Sections and Free Pages together in page order, the Notebook's index. */
export function rowsInPageOrder(notebook: Notebook): NotebookRow[] {
	const placed: NotebookRow[] = notebook.sections.map((s) => ({
		kind: 'placed',
		name: s.name,
		colour: s.colour,
		first: s.first,
		last: s.last,
		requested: s.requested,
		size: s.size
	}));
	const free: NotebookRow[] = freeRanges(notebook).map((r) => ({ kind: 'free', ...r }));
	return [...placed, ...free].sort((a, b) => a.first - b.first);
}
