import { describe, expect, it } from 'vitest';
import { setupNotebook } from '../placement';
import {
	confirmBlockedReason,
	freeRanges,
	parseSectionForm,
	requestsOf,
	roundsUpHelp,
	titlePages
} from './setup-sections';

const spring = [
	{ name: 'Journal', pages: 64 },
	{ name: 'Habit tracker', pages: 20 },
	{ name: 'Idea capture', pages: 10 },
	{ name: 'Calendar', pages: 4 },
	{ name: 'Reading log', pages: 12 }
];

describe('roundsUpHelp', () => {
	it('says what a typed count rounds up to', () => {
		expect(roundsUpHelp('20', 120)).toBe('Rounds up to 32 pages.');
		expect(roundsUpHelp(' 64 ', 120)).toBe('Rounds up to 64 pages.');
		expect(roundsUpHelp('1', 120)).toBe('Rounds up to 1 page.');
	});

	it('lists the sizes the Notebook can hold until a valid count is typed', () => {
		const sizes =
			'Sizes round up to 1, 2, 4, 8, 16, 32 or 64 pages. The Title Page counts as one of them.';
		expect(roundsUpHelp('', 120)).toBe(sizes);
		expect(roundsUpHelp('abc', 120)).toBe(sizes);
		expect(roundsUpHelp('0', 120)).toBe(sizes);
		expect(roundsUpHelp('2.5', 120)).toBe(sizes);
	});

	it('copes with a one-page Notebook', () => {
		expect(roundsUpHelp('', 1)).toBe(
			'Sizes round up to 1 page. The Title Page counts as one of them.'
		);
	});
});

describe('parseSectionForm', () => {
	it('trims the name and reads the count', () => {
		expect(parseSectionForm({ name: '  Journal ', pages: ' 64 ' }, 120, [])).toEqual({
			ok: true,
			request: { name: 'Journal', pages: 64 }
		});
	});

	it('reports each missing field', () => {
		expect(parseSectionForm({ name: ' ', pages: '' }, 120, [])).toEqual({
			ok: false,
			errors: { name: 'Give the Section a name', pages: 'Enter how many pages you want' }
		});
	});

	it('rejects counts that are not whole numbers from 1 to the page count', () => {
		const pagesError = (pages: string) => {
			const result = parseSectionForm({ name: 'A', pages }, 120, []);
			return result.ok ? undefined : result.errors.pages;
		};
		expect(pagesError('1.5')).toBe('Pages wanted must be a whole number');
		expect(pagesError('abc')).toBe('Pages wanted must be a whole number');
		expect(pagesError('0')).toBe('Pages wanted must be at least 1');
		expect(pagesError('121')).toBe('The Notebook only has 120 pages');
		expect(pagesError('120')).toBeUndefined();
	});

	it('rejects a name that is taken, ignoring case', () => {
		expect(parseSectionForm({ name: 'journal', pages: '4' }, 120, ['Journal'])).toEqual({
			ok: false,
			errors: { name: 'There is already a Section called journal' }
		});
	});
});

describe('Setup views of a Notebook', () => {
	const notebook = setupNotebook(120, spring);

	it('round-trips a Notebook with a Pending Section back through setupNotebook', () => {
		expect(setupNotebook(120, requestsOf(notebook))).toEqual(notebook);
	});

	it('finds the Free Pages left after the spring example', () => {
		expect(freeRanges(notebook)).toEqual([{ first: 117, last: 120 }]);
		expect(freeRanges(setupNotebook(120, []))).toEqual([{ first: 1, last: 120 }]);
	});

	it('lists the Title Pages in page order', () => {
		expect(titlePages(notebook).map((t) => t.titlePage)).toEqual([1, 65, 97, 113]);
	});

	it('blocks Confirm until a Section is placed', () => {
		expect(confirmBlockedReason(setupNotebook(120, []))).toBe('Add a Section to confirm Setup.');
		expect(confirmBlockedReason(notebook)).toBeUndefined();
	});
});
