import { describe, expect, it } from 'vitest';
import {
	addSection,
	freePages,
	previewAddSection,
	removeSection,
	sectionSize,
	setupNotebook,
	type Notebook,
	type PlacedSection
} from './index';

/** The design canvas's Spring notebook: 120 pages, Reading log doesn't fit, pages 117–120 stay free. */
const spring = () =>
	setupNotebook(120, [
		{ name: 'Journal', pages: 64 },
		{ name: 'Habit tracker', pages: 20 },
		{ name: 'Idea capture', pages: 10 },
		{ name: 'Calendar', pages: 4 },
		{ name: 'Reading log', pages: 12 }
	]);

const ranges = (notebook: Notebook) =>
	notebook.sections.map((s) => [s.name, s.first, s.last, s.size] as const);

describe('sectionSize', () => {
	it.each([
		[1, 1],
		[2, 2],
		[3, 4],
		[8, 8],
		[9, 16],
		[20, 32],
		[33, 64],
		[64, 64],
		[65, 128]
	])('%i pages wanted gets %i', (wanted, size) => {
		expect(sectionSize(wanted)).toBe(size);
	});

	it('rejects zero, negative and fractional page counts', () => {
		expect(() => sectionSize(0)).toThrow('Pages wanted must be a whole number of at least 1');
		expect(() => sectionSize(-4)).toThrow('Pages wanted must be a whole number of at least 1');
		expect(() => sectionSize(2.5)).toThrow('Pages wanted must be a whole number of at least 1');
	});
});

describe('setupNotebook', () => {
	it('places the Spring notebook largest first on aligned boundaries', () => {
		const notebook = spring();
		expect(ranges(notebook)).toEqual([
			['Journal', 1, 64, 64],
			['Habit tracker', 65, 96, 32],
			['Idea capture', 97, 112, 16],
			['Calendar', 113, 116, 4]
		]);
		expect(notebook.sections.map((s) => s.titlePage)).toEqual([1, 65, 97, 113]);
		expect(notebook.sections.map((s) => s.requested)).toEqual([64, 20, 10, 4]);
		expect(notebook.sections.map((s) => s.colour)).toEqual(['sage', 'clay', 'ochre', 'slate']);
		expect(freePages(notebook)).toBe(4);
	});

	it('makes Reading log a Pending Section with the reason', () => {
		expect(spring().pending).toEqual([
			{
				name: 'Reading log',
				requested: 12,
				size: 16,
				reason: 'needs 16 pages in one aligned block, and only 4 Free Pages are left',
				colour: 'plum'
			}
		]);
	});

	it('starts every Section on a page matching its size', () => {
		const notebook = setupNotebook(100, [
			{ name: 'A', pages: 3 },
			{ name: 'B', pages: 5 },
			{ name: 'C', pages: 2 },
			{ name: 'D', pages: 17 }
		]);
		expect(ranges(notebook)).toEqual([
			['D', 1, 32, 32],
			['B', 33, 40, 8],
			['A', 41, 44, 4],
			['C', 45, 46, 2]
		]);
		for (const s of notebook.sections) expect((s.first - 1) % s.size).toBe(0);
	});

	it('keeps input order between equal sizes', () => {
		const notebook = setupNotebook(16, [
			{ name: 'Second', pages: 4 },
			{ name: 'First', pages: 3 }
		]);
		expect(ranges(notebook)).toEqual([
			['Second', 1, 4, 4],
			['First', 5, 8, 4]
		]);
	});

	it('says when enough Free Pages are left but split up', () => {
		const notebook = addSection(
			addSection(setupNotebook(16, [{ name: 'A', pages: 4 }]), { name: 'B', pages: 4 }).notebook,
			{ name: 'C', pages: 4 }
		).notebook;
		const withGap = removeSection(notebook, 'B');
		const { outcome } = addSection(withGap, { name: 'D', pages: 8 });
		expect(outcome).toEqual({
			kind: 'pending',
			pending: {
				name: 'D',
				requested: 8,
				size: 8,
				reason: 'needs 8 pages in one aligned block, and the 8 Free Pages left are split up',
				colour: 'ochre'
			}
		});
	});

	it('rejects invalid input with a clear message', () => {
		expect(() => setupNotebook(120, [{ name: '  ', pages: 8 }])).toThrow('A Section needs a name');
		expect(() => setupNotebook(120, [{ name: 'A', pages: 0 }])).toThrow(
			'Pages wanted must be a whole number of at least 1'
		);
		expect(() => setupNotebook(120, [{ name: 'A', pages: -3 }])).toThrow(
			'Pages wanted must be a whole number of at least 1'
		);
		expect(() => setupNotebook(120, [{ name: 'A', pages: 121 }])).toThrow(
			'A wants 121 pages, but the Notebook only has 120'
		);
		expect(() =>
			setupNotebook(120, [
				{ name: 'A', pages: 4 },
				{ name: 'a ', pages: 4 }
			])
		).toThrow('There is already a Section called a');
		expect(() => setupNotebook(0, [])).toThrow('A Notebook needs at least 1 page');
	});
});

describe('addSection', () => {
	it('takes the first aligned free block, skipping smaller gaps', () => {
		// A holds 1–4 and C holds 5–6, leaving 7–8 free; an 8-page Section skips that gap for 9–16.
		const base = addSection(setupNotebook(16, [{ name: 'A', pages: 4 }]), {
			name: 'C',
			pages: 2
		}).notebook;
		expect(ranges(base)).toEqual([
			['A', 1, 4, 4],
			['C', 5, 6, 2]
		]);
		const { notebook, outcome } = addSection(base, { name: 'D', pages: 8 });
		expect(outcome).toMatchObject({ kind: 'placed', section: { name: 'D', first: 9, last: 16 } });
		expect(ranges(notebook)).toEqual([...ranges(base), ['D', 9, 16, 8]]);
	});

	it('skips pages that fit by size but not by alignment', () => {
		// A holds 1–2, so free pages start at 3; a 4-page Section can't start at 3 and goes to 5.
		const notebook = setupNotebook(16, [{ name: 'A', pages: 2 }]);
		const { outcome } = addSection(notebook, { name: 'B', pages: 4 });
		expect(outcome).toMatchObject({
			kind: 'placed',
			section: { first: 5, last: 8, size: 4, requested: 4, titlePage: 5 }
		});
	});

	it('never moves existing Sections', () => {
		const before = spring();
		const { notebook, outcome } = addSection(before, { name: 'Travel', pages: 3 });
		expect(ranges(notebook).slice(0, 4)).toEqual(ranges(before));
		expect(ranges(notebook)[4]).toEqual(['Travel', 117, 120, 4]);
		expect(outcome).toMatchObject({ section: { colour: 'teal' } });
		expect(freePages(notebook)).toBe(0);
	});

	it('does not change the Notebook it was given', () => {
		const before = spring();
		const snapshot = structuredClone(before);
		addSection(before, { name: 'Travel', pages: 3 });
		expect(before).toEqual(snapshot);
	});

	it('names the block needed and the Free Pages left when nothing fits', () => {
		const { notebook, outcome } = addSection(spring(), { name: 'Recipes', pages: 6 });
		expect(outcome).toEqual({
			kind: 'pending',
			pending: {
				name: 'Recipes',
				requested: 6,
				size: 8,
				reason: 'needs 8 pages in one aligned block, and only 4 Free Pages are left',
				colour: 'teal'
			}
		});
		expect(notebook.pending.map((p) => p.name)).toEqual(['Reading log', 'Recipes']);
		expect(notebook.sections).toHaveLength(4);
	});

	it('uses the singular for one Free Page', () => {
		const full = setupNotebook(3, [{ name: 'A', pages: 2 }]);
		const { outcome } = addSection(full, { name: 'B', pages: 2 });
		expect(outcome).toMatchObject({
			pending: { reason: 'needs 2 pages in one aligned block, and only 1 Free Page is left' }
		});
	});

	it('rejects invalid input and duplicate names', () => {
		expect(() => addSection(spring(), { name: '', pages: 4 })).toThrow('A Section needs a name');
		expect(() => addSection(spring(), { name: 'X', pages: 0 })).toThrow(
			'Pages wanted must be a whole number of at least 1'
		);
		expect(() => addSection(spring(), { name: 'X', pages: 121 })).toThrow(
			'X wants 121 pages, but the Notebook only has 120'
		);
		expect(() => addSection(spring(), { name: 'journal', pages: 4 })).toThrow(
			'There is already a Section called journal'
		);
	});
});

describe('removeSection', () => {
	it('frees exactly its pages and moves nothing else', () => {
		const before = spring();
		const after = removeSection(before, 'Habit tracker');
		expect(ranges(after)).toEqual([
			['Journal', 1, 64, 64],
			['Idea capture', 97, 112, 16],
			['Calendar', 113, 116, 4]
		]);
		expect(freePages(after)).toBe(36);
	});

	it('lets a later Section claim the freed pages', () => {
		const freed = removeSection(spring(), 'Idea capture');
		const { outcome } = addSection(freed, { name: 'Recipes', pages: 9 });
		expect(outcome).toMatchObject({
			kind: 'placed',
			section: { name: 'Recipes', first: 97, last: 112 }
		});
	});

	it('keeps Pending Sections untouched', () => {
		expect(removeSection(spring(), 'Journal').pending).toEqual(spring().pending);
	});

	it('rejects an unknown Section', () => {
		expect(() => removeSection(spring(), 'Travel')).toThrow('There is no Section called Travel');
	});
});

describe('colours', () => {
	it('assigns the palette in placement order', () => {
		expect(spring().sections.map((s) => s.colour)).toEqual(['sage', 'clay', 'ochre', 'slate']);
		expect(spring().pending[0].colour).toBe('plum');
	});

	it('skips a colour a page neighbour already has', () => {
		// A is sage and B clay. With A removed, C is the second placement, so it would be clay, but
		// its neighbour B already is: it takes ochre.
		const notebook = setupNotebook(16, [
			{ name: 'A', pages: 4 },
			{ name: 'B', pages: 4 }
		]);
		const { notebook: after } = addSection(removeSection(notebook, 'A'), { name: 'C', pages: 4 });
		expect(after.sections.map((s) => [s.name, s.first, s.colour])).toEqual([
			['B', 5, 'clay'],
			['C', 1, 'ochre']
		]);
	});

	it('never gives page neighbours the same colour, with more than six Sections', () => {
		const requests = Array.from({ length: 10 }, (_, i) => ({ name: `S${i}`, pages: 4 }));
		const notebook = setupNotebook(64, requests);
		expect(notebook.sections).toHaveLength(10);
		const byPage = [...notebook.sections].sort((a, b) => a.first - b.first);
		for (let i = 1; i < byPage.length; i++) {
			expect(byPage[i].colour).not.toBe(byPage[i - 1].colour);
		}
		expect(byPage.map((s) => s.colour)).toEqual([
			'sage',
			'clay',
			'ochre',
			'slate',
			'plum',
			'teal',
			'sage',
			'clay',
			'ochre',
			'slate'
		]);
	});

	it('keeps neighbours different after a removal makes two Sections neighbours', () => {
		const notebook = setupNotebook(16, [
			{ name: 'A', pages: 4 },
			{ name: 'B', pages: 4 },
			{ name: 'C', pages: 4 }
		]);
		expect(notebook.sections.map((s) => s.colour)).toEqual(['sage', 'clay', 'ochre']);
		const after = removeSection(notebook, 'B');
		expect(after.sections.map((s) => [s.name, s.colour])).toEqual([
			['A', 'sage'],
			['C', 'ochre']
		]);
	});
});

describe('removing a Section between same-coloured neighbours', () => {
	const section = (
		name: string,
		index: number,
		colour: PlacedSection['colour']
	): PlacedSection => ({
		name,
		requested: 4,
		size: 4,
		first: index * 4 + 1,
		last: index * 4 + 4,
		titlePage: index * 4 + 1,
		colour
	});

	it('recolours the later-placed neighbour and leaves the rest alone', () => {
		const notebook: Notebook = {
			pageCount: 28,
			pending: [],
			sections: [
				section('A', 0, 'sage'),
				section('B', 1, 'clay'),
				section('C', 2, 'sage'),
				section('D', 3, 'ochre'),
				section('E', 4, 'slate'),
				section('F', 5, 'plum'),
				section('G', 6, 'teal')
			]
		};
		const after = removeSection(notebook, 'B');
		expect(after.sections.map((s) => [s.name, s.colour])).toEqual([
			['A', 'sage'],
			['C', 'clay'],
			['D', 'ochre'],
			['E', 'slate'],
			['F', 'plum'],
			['G', 'teal']
		]);
	});
});

describe('previewAddSection', () => {
	it('returns the range and Title Page when it fits, matching a real add', () => {
		const notebook = removeSection(spring(), 'Idea capture');
		const preview = previewAddSection(notebook, { name: 'Recipes', pages: 9 });
		expect(preview).toEqual({
			kind: 'placed',
			section: {
				name: 'Recipes',
				requested: 9,
				size: 16,
				first: 97,
				last: 112,
				titlePage: 97,
				colour: 'plum'
			}
		});
		expect(addSection(notebook, { name: 'Recipes', pages: 9 }).outcome).toEqual(preview);
	});

	it('returns the Pending reason when it does not fit, matching a real add', () => {
		const notebook = spring();
		const preview = previewAddSection(notebook, { name: 'Recipes', pages: 9 });
		expect(preview).toEqual({
			kind: 'pending',
			pending: {
				name: 'Recipes',
				requested: 9,
				size: 16,
				colour: 'teal',
				reason: 'needs 16 pages in one aligned block, and only 4 Free Pages are left'
			}
		});
		expect(addSection(notebook, { name: 'Recipes', pages: 9 }).outcome).toEqual(preview);
	});

	it('changes nothing', () => {
		const notebook = spring();
		const snapshot = structuredClone(notebook);
		previewAddSection(notebook, { name: 'Travel', pages: 3 });
		expect(notebook).toEqual(snapshot);
	});

	it('rejects invalid input', () => {
		expect(() => previewAddSection(spring(), { name: 'X', pages: -1 })).toThrow(
			'Pages wanted must be a whole number of at least 1'
		);
	});
});
