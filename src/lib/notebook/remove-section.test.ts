import { describe, expect, it } from 'vitest';
import { addSection, removeSection, setupNotebook, type Notebook } from '../placement';
import { newSavedNotebook } from '../storage';
import { createLocalNotebookStore } from '../storage/local-notebook-store';
import { saveRemoveSection } from './remove-section';

function fakeStorage() {
	const items = new Map<string, string>();
	return {
		getItem: (key: string) => items.get(key) ?? null,
		setItem: (key: string, value: string) => void items.set(key, value)
	};
}

type Store = ReturnType<typeof createLocalNotebookStore>;

const spring = () =>
	setupNotebook(120, [
		{ name: 'Journal', pages: 64 },
		{ name: 'Habit tracker', pages: 20 },
		{ name: 'Idea capture', pages: 10 },
		{ name: 'Calendar', pages: 4 },
		{ name: 'Reading log', pages: 12 }
	]);

async function seeded(notebook: Notebook = spring(), confirmed = true) {
	const storage = fakeStorage();
	const store = createLocalNotebookStore(() => storage);
	await store.save({
		...newSavedNotebook('a', 'Spring', notebook.pageCount),
		setupConfirmed: confirmed,
		notebook
	});
	return store;
}

const ideaCapture = { name: 'Idea capture', first: 97, last: 112 };
const names = async (store: Store) => (await store.get('a'))?.notebook.sections.map((s) => s.name);

/** What another tab does between the Dialog opening and the click. */
async function otherTab(store: Store, change: (notebook: Notebook) => Notebook) {
	const stored = (await store.get('a'))!;
	await store.save({ ...stored, notebook: change(stored.notebook) });
}

describe('saveRemoveSection', () => {
	it('frees the Section the Dialog named and keeps it removed', async () => {
		const store = await seeded();
		const result = await saveRemoveSection(store, 'a', ideaCapture);
		expect(result).toMatchObject({
			status: 'saved',
			removed: { name: 'Idea capture', first: 97, last: 112, size: 16 },
			recoloured: []
		});
		const stored = (await store.get('a'))?.notebook;
		expect(stored?.sections.map((s) => [s.name, s.first, s.last])).toEqual([
			['Journal', 1, 64],
			['Habit tracker', 65, 96],
			['Calendar', 113, 116]
		]);
		expect(stored?.pending.map((p) => p.name)).toEqual(['Reading log']);
	});

	it('lets a later Section claim the freed pages', async () => {
		const store = await seeded();
		await saveRemoveSection(store, 'a', ideaCapture);
		const { outcome } = addSection((await store.get('a'))!.notebook, {
			name: 'Recipes',
			pages: 16
		});
		expect(outcome).toMatchObject({ kind: 'placed', section: { first: 97, last: 112 } });
	});

	it('names a neighbour that had to change colour', async () => {
		const seven = setupNotebook(
			64,
			[...'ABCDEFG'].map((name) => ({ name, pages: 8 }))
		);
		const store = await seeded([...'BCDE'].reduce(removeSection, seven));
		const result = await saveRemoveSection(store, 'a', { name: 'F', first: 41, last: 48 });
		expect(result).toMatchObject({
			status: 'saved',
			recoloured: [{ name: 'G', from: 'sage', to: 'clay' }]
		});
		const colours = (await store.get('a'))?.notebook.sections.map((s) => [s.name, s.colour]);
		expect(colours).toEqual([
			['A', 'sage'],
			['G', 'clay']
		]);
	});

	it('writes nothing when another tab already removed it', async () => {
		const store = await seeded();
		await otherTab(store, (nb) => removeSection(nb, 'Idea capture'));
		const result = await saveRemoveSection(store, 'a', ideaCapture);
		expect(result).toMatchObject({ status: 'gone' });
		expect(await names(store)).toEqual(['Journal', 'Habit tracker', 'Calendar']);
	});

	it('does not undo a Section another tab added in the freed pages', async () => {
		const store = await seeded();
		await otherTab(store, (nb) => removeSection(nb, 'Idea capture'));
		await otherTab(store, (nb) => addSection(nb, { name: 'Travel', pages: 16 }).notebook);
		const result = await saveRemoveSection(store, 'a', ideaCapture);
		expect(result.status).toBe('gone');
		expect(await names(store)).toEqual(['Journal', 'Habit tracker', 'Calendar', 'Travel']);
	});

	it('refuses a Section whose pages changed under the same name', async () => {
		const store = await seeded();
		await otherTab(
			store,
			(nb) => addSection(removeSection(nb, 'Idea capture'), { name: 'x', pages: 1 }).notebook
		);
		await otherTab(
			store,
			(nb) => addSection(removeSection(nb, 'x'), { name: 'Idea capture', pages: 4 }).notebook
		);
		const result = await saveRemoveSection(store, 'a', ideaCapture);
		expect(result.status).toBe('changed');
		const kept = (await store.get('a'))?.notebook.sections.find((s) => s.name === 'Idea capture');
		expect(kept).toMatchObject({ first: 97, last: 100 });
	});

	it('keeps the other tab changes when it does remove', async () => {
		const store = await seeded();
		await otherTab(store, (nb) => removeSection(nb, 'Calendar'));
		const result = await saveRemoveSection(store, 'a', ideaCapture);
		expect(result.status).toBe('saved');
		expect(await names(store)).toEqual(['Journal', 'Habit tracker']);
	});

	it('leaves a Notebook whose Setup is not confirmed alone', async () => {
		const store = await seeded(spring(), false);
		expect(await saveRemoveSection(store, 'a', ideaCapture)).toEqual({ status: 'unconfirmed' });
		expect(await names(store)).toHaveLength(4);
	});

	it('reports a Notebook that is gone', async () => {
		const store = await seeded();
		expect(await saveRemoveSection(store, 'gone', ideaCapture)).toEqual({ status: 'missing' });
	});
});
