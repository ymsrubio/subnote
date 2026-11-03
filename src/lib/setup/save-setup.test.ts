import { describe, expect, it } from 'vitest';
import { setupNotebook, type Notebook } from '../placement';
import { newSavedNotebook } from '../storage';
import { createLocalNotebookStore } from '../storage/local-notebook-store';
import { confirmStoredSetup, saveSetupEdit } from './save-setup';
import { requestsOf } from './setup-sections';

function fakeStorage() {
	const items = new Map<string, string>();
	return {
		getItem: (key: string) => items.get(key) ?? null,
		setItem: (key: string, value: string) => void items.set(key, value)
	};
}

const add = (name: string, pages: number) => (notebook: Notebook) =>
	setupNotebook(notebook.pageCount, [...requestsOf(notebook), { name, pages }]);

const without = (name: string) => (notebook: Notebook) =>
	setupNotebook(
		notebook.pageCount,
		requestsOf(notebook).filter((request) => request.name !== name)
	);

async function seeded() {
	const storage = fakeStorage();
	const store = createLocalNotebookStore(() => storage);
	await store.save(newSavedNotebook('a', 'Spring', 120));
	return store;
}

describe('saveSetupEdit', () => {
	it('adds to the stored Notebook', async () => {
		const store = await seeded();
		const result = await saveSetupEdit(store, 'a', add('Journal', 64));
		expect(result.status).toBe('saved');
		const stored = await store.get('a');
		expect(stored?.setupConfirmed).toBe(false);
		expect(stored?.notebook.sections.map((s) => [s.name, s.first, s.last])).toEqual([
			['Journal', 1, 64]
		]);
	});

	it('does not undo a confirmation made in another tab', async () => {
		const store = await seeded();
		await saveSetupEdit(store, 'a', add('Journal', 64));
		await confirmStoredSetup(store, 'a');
		const result = await saveSetupEdit(store, 'a', add('Habit tracker', 20));
		expect(result).toEqual({ status: 'locked' });
		const stored = await store.get('a');
		expect(stored?.setupConfirmed).toBe(true);
		expect(stored?.notebook.sections.map((s) => s.name)).toEqual(['Journal']);
	});

	it('builds each edit from the stored Notebook, so two removes both stick', async () => {
		const store = await seeded();
		await saveSetupEdit(store, 'a', add('Journal', 64));
		await saveSetupEdit(store, 'a', add('Habit tracker', 20));
		await saveSetupEdit(store, 'a', add('Calendar', 4));
		await saveSetupEdit(store, 'a', without('Habit tracker'));
		await saveSetupEdit(store, 'a', without('Calendar'));
		expect((await store.get('a'))?.notebook.sections.map((s) => s.name)).toEqual(['Journal']);
	});

	it('keeps an edit made elsewhere since this tab last read', async () => {
		const store = await seeded();
		await saveSetupEdit(store, 'a', add('Journal', 64));
		await saveSetupEdit(store, 'a', add('Calendar', 4));
		await saveSetupEdit(store, 'a', add('Habit tracker', 20));
		expect((await store.get('a'))?.notebook.sections.map((s) => s.name)).toEqual([
			'Journal',
			'Habit tracker',
			'Calendar'
		]);
	});

	it('reports a Notebook that is not stored', async () => {
		const store = await seeded();
		expect(await saveSetupEdit(store, 'nope', add('Journal', 64))).toEqual({ status: 'missing' });
	});
});

describe('confirmStoredSetup', () => {
	it('confirms once and reports locked after', async () => {
		const store = await seeded();
		await saveSetupEdit(store, 'a', add('Journal', 64));
		expect((await confirmStoredSetup(store, 'a')).status).toBe('saved');
		expect((await store.get('a'))?.setupConfirmed).toBe(true);
		expect(await confirmStoredSetup(store, 'a')).toEqual({ status: 'locked' });
	});
});
