import { describe, expect, it } from 'vitest';
import { createLocalNotebookStore, storageKey } from './local-notebook-store';
import { newSavedNotebook, parseSavedNotebook } from './saved-notebook';

function fakeStorage(initial: Record<string, string> = {}) {
	const items = new Map(Object.entries(initial));
	return {
		items,
		getItem: (key: string) => items.get(key) ?? null,
		setItem: (key: string, value: string) => void items.set(key, value)
	};
}

describe('newSavedNotebook', () => {
	it('starts with every Page free and Setup unconfirmed', () => {
		expect(newSavedNotebook('a', 'Spring notebook', 120)).toEqual({
			id: 'a',
			name: 'Spring notebook',
			setupConfirmed: false,
			notebook: { pageCount: 120, sections: [], pending: [] }
		});
	});
});

describe('local notebook store', () => {
	it('returns nothing before anything is saved', async () => {
		const store = createLocalNotebookStore(() => fakeStorage());
		expect(await store.list()).toEqual([]);
		expect(await store.get('a')).toBeUndefined();
	});

	it('gives back a saved Notebook through a fresh store on the same storage, as after a reload', async () => {
		const storage = fakeStorage();
		await createLocalNotebookStore(() => storage).save(
			newSavedNotebook('a', 'Spring notebook', 120)
		);
		const reloaded = createLocalNotebookStore(() => storage);
		expect(await reloaded.get('a')).toEqual(newSavedNotebook('a', 'Spring notebook', 120));
		expect(await reloaded.list()).toHaveLength(1);
	});

	it('replaces the Notebook with the same id and keeps the others in order', async () => {
		const storage = fakeStorage();
		const store = createLocalNotebookStore(() => storage);
		await store.save(newSavedNotebook('a', 'First', 40));
		await store.save(newSavedNotebook('b', 'Second', 80));
		await store.save({ ...newSavedNotebook('a', 'First', 40), setupConfirmed: true });
		const names = (await store.list()).map((saved) => [saved.name, saved.setupConfirmed]);
		expect(names).toEqual([
			['First', true],
			['Second', false]
		]);
	});

	it('treats text that is not JSON as nothing saved', async () => {
		const store = createLocalNotebookStore(() => fakeStorage({ [storageKey]: '{oops' }));
		expect(await store.list()).toEqual([]);
	});

	it('keeps the unreadable text under a backup key before saving over it', async () => {
		const storage = fakeStorage({ [storageKey]: '{oops' });
		const saved = newSavedNotebook('a', 'Spring notebook', 120);
		await createLocalNotebookStore(() => storage).save(saved);
		const backups = [...storage.items].filter(([key]) => key.startsWith(`${storageKey}:corrupt-`));
		expect(backups.map(([, value]) => value)).toEqual(['{oops']);
		expect(JSON.parse(storage.items.get(storageKey) ?? '')).toEqual([saved]);
	});

	it('keeps valid JSON that is not a list the same way', async () => {
		const storage = fakeStorage({ [storageKey]: '{"notebooks":[1]}' });
		await createLocalNotebookStore(() => storage).save(newSavedNotebook('a', 'Spring', 10));
		const backups = [...storage.items].filter(([key]) => key.startsWith(`${storageKey}:corrupt-`));
		expect(backups.map(([, value]) => value)).toEqual(['{"notebooks":[1]}']);
	});

	it('hides entries that are not whole Notebooks but keeps them in storage across a save', async () => {
		const good = newSavedNotebook('a', 'Spring notebook', 120);
		const broken = { ...good, id: 'b', notebook: { ...good.notebook, pageCount: 'many' } };
		const storage = fakeStorage({ [storageKey]: JSON.stringify([broken, good, 7, null]) });
		const store = createLocalNotebookStore(() => storage);
		expect(await store.list()).toEqual([good]);
		const added = newSavedNotebook('c', 'Autumn', 30);
		await store.save(added);
		expect(JSON.parse(storage.items.get(storageKey) ?? '')).toEqual([good, added, broken, 7, null]);
	});
});

describe('parseSavedNotebook', () => {
	const good = newSavedNotebook('a', 'Spring notebook', 120);
	const placed = {
		name: 'Journal',
		requested: 60,
		size: 64,
		first: 1,
		last: 64,
		titlePage: 1,
		colour: 'sage'
	};

	it('accepts a Notebook with placed and Pending Sections', () => {
		const pending = { name: 'Recipes', requested: 6, size: 8, reason: 'no room', colour: 'clay' };
		const withSections = {
			...good,
			notebook: { ...good.notebook, sections: [placed], pending: [pending] }
		};
		expect(parseSavedNotebook(withSections)).toEqual({ ok: true, value: withSections });
	});

	it('accepts a page count above the form limit', () => {
		const big = { ...good, notebook: { ...good.notebook, pageCount: 5000 } };
		expect(parseSavedNotebook(big)).toEqual({ ok: true, value: big });
	});

	it.each([
		['not an object', 'text'],
		['no id', { ...good, id: '' }],
		['a blank name', { ...good, name: '  ' }],
		['setupConfirmed as text', { ...good, setupConfirmed: 'no' }],
		['a page count of 0', { ...good, notebook: { ...good.notebook, pageCount: 0 } }],
		['a fractional page count', { ...good, notebook: { ...good.notebook, pageCount: 1.5 } }],
		['sections that are not a list', { ...good, notebook: { ...good.notebook, sections: {} } }],
		[
			'a Section with an unknown colour',
			{ ...good, notebook: { ...good.notebook, sections: [{ ...placed, colour: 'pink' }] } }
		]
	])('rejects %s', (_, value) => {
		expect(parseSavedNotebook(value)).toEqual({ ok: false });
	});
});
