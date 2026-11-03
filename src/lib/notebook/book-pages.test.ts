import { describe, expect, it } from 'vitest';
import { addSection, removeSection, setupNotebook } from '../placement';
import { bookPages, spreadOfSection } from './book-pages';

const small = () =>
	setupNotebook(16, [
		{ name: 'Journal', pages: 8 },
		{ name: 'Calendar', pages: 4 }
	]);

describe('bookPages', () => {
	it('gives one page per Notebook page, coloured by Section, with a Title Page first in each', () => {
		const pages = bookPages(small());
		const sage = { colour: 'sage', name: 'Journal' };
		const clay = { colour: 'clay', name: 'Calendar' };

		expect(pages).toEqual([
			{ section: sage, title: true, range: 'pp. 1–8' },
			...Array.from({ length: 7 }, () => ({ section: sage })),
			{ section: clay, title: true, range: 'pp. 9–12' },
			...Array.from({ length: 3 }, () => ({ section: clay })),
			{},
			{},
			{},
			{}
		]);
	});

	it('leaves a Notebook with no Sections as all Free Pages', () => {
		expect(bookPages({ pageCount: 3, sections: [], pending: [] })).toEqual([{}, {}, {}]);
	});

	it('adds nothing for a Pending Section', () => {
		const { notebook } = addSection(small(), { name: 'Huge', pages: 16 });
		expect(notebook.pending.map((p) => p.name)).toEqual(['Huge']);
		expect(bookPages(notebook)).toEqual(bookPages(small()));
	});

	it('turns a removed Section back into Free Pages', () => {
		const pages = bookPages(removeSection(small(), 'Calendar'));
		expect(pages.slice(8)).toEqual(Array.from({ length: 8 }, () => ({})));
	});
});

describe('spreadOfSection', () => {
	it('opens on the spread holding the Title Page', () => {
		expect(spreadOfSection({ first: 1 })).toBe(0);
		expect(spreadOfSection({ first: 2 })).toBe(1);
		expect(spreadOfSection({ first: 9 })).toBe(4);
	});
});
