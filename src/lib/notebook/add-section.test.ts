import { describe, expect, it } from 'vitest';
import { addSection, previewAddSection, setupNotebook } from '../placement';
import { newSavedNotebook } from '../storage';
import { createLocalNotebookStore } from '../storage/local-notebook-store';
import { saveAddSection } from './add-section';

function fakeStorage() {
	const items = new Map<string, string>();
	return {
		getItem: (key: string) => items.get(key) ?? null,
		setItem: (key: string, value: string) => void items.set(key, value)
	};
}

type Store = ReturnType<typeof createLocalNotebookStore>;

async function seeded(confirmed = true) {
	const storage = fakeStorage();
	const store = createLocalNotebookStore(() => storage);
	const base = newSavedNotebook('a', 'Spring', 120);
	const notebook = setupNotebook(120, [
		{ name: 'Journal', pages: 64 },
		{ name: 'Habit tracker', pages: 20 },
		{ name: 'Idea capture', pages: 10 },
		{ name: 'Calendar', pages: 4 },
		{ name: 'Reading log', pages: 12 }
	]);
	await store.save({ ...base, setupConfirmed: confirmed, notebook });
	return store;
}

const shown = async (store: Store, name: string, pages: number) =>
	previewAddSection((await store.get('a'))!.notebook, { name, pages });

/** What another tab does between the preview and the click. */
async function otherTabAdds(store: Store, name: string, pages: number) {
	const stored = (await store.get('a'))!;
	const { notebook } = addSection(stored.notebook, { name, pages });
	await store.save({ ...stored, notebook });
}

describe('saveAddSection', () => {
	it('places the Section where the preview said and keeps it', async () => {
		const store = await seeded();
		const result = await saveAddSection(
			store,
			'a',
			{ name: 'Travel', pages: 3 },
			await shown(store, 'Travel', 3)
		);
		expect(result.status).toBe('saved');
		const section = (await store.get('a'))?.notebook.sections.find((s) => s.name === 'Travel');
		expect(section).toMatchObject({ first: 117, last: 120, titlePage: 117, colour: 'teal' });
	});

	it('stores a Section with no room as Pending', async () => {
		const store = await seeded();
		const result = await saveAddSection(
			store,
			'a',
			{ name: 'Recipes', pages: 6 },
			await shown(store, 'Recipes', 6)
		);
		expect(result.status).toBe('saved');
		const stored = await store.get('a');
		expect(stored?.notebook.pending.map((p) => p.name)).toEqual(['Reading log', 'Recipes']);
		expect(stored?.notebook.sections).toHaveLength(4);
	});

	it('does not write when another tab used the Free Pages after the preview', async () => {
		const store = await seeded();
		const preview = await shown(store, 'Travel', 3);
		await otherTabAdds(store, 'Garden', 4);
		const result = await saveAddSection(store, 'a', { name: 'Travel', pages: 3 }, preview);
		expect(result.status).toBe('changed');
		const after = await store.get('a');
		expect(after?.notebook.sections.map((s) => s.name)).toEqual([
			'Journal',
			'Habit tracker',
			'Idea capture',
			'Calendar',
			'Garden'
		]);
		expect(after?.notebook.pending.map((p) => p.name)).toEqual(['Reading log']);
	});

	it('does not write when another tab changes the colour the preview showed', async () => {
		const store = await seeded();
		const preview = await shown(store, 'Travel', 3);
		expect(preview).toMatchObject({ kind: 'placed', section: { first: 117, colour: 'teal' } });
		await otherTabAdds(store, 'Garden', 16);
		const result = await saveAddSection(store, 'a', { name: 'Travel', pages: 3 }, preview);
		expect(result.status).toBe('changed');
		const after = await store.get('a');
		expect(after?.notebook.sections.map((s) => s.name)).toEqual([
			'Journal',
			'Habit tracker',
			'Idea capture',
			'Calendar'
		]);
		expect(after?.notebook.pending.map((p) => p.name)).toEqual(['Reading log', 'Garden']);
	});

	it('keeps a Section another tab added, and refuses a Pending add whose colour moved on', async () => {
		const store = await seeded();
		const preview = await shown(store, 'Recipes', 6);
		await otherTabAdds(store, 'Garden', 16);
		const result = await saveAddSection(store, 'a', { name: 'Recipes', pages: 6 }, preview);
		expect(result.status).toBe('changed');
		const after = await store.get('a');
		expect(after?.notebook.pending.map((p) => p.name)).toEqual(['Reading log', 'Garden']);
	});

	it('rejects a name another tab took, writing nothing', async () => {
		const store = await seeded();
		const preview = await shown(store, 'Travel', 3);
		await otherTabAdds(store, 'travel', 1);
		const result = await saveAddSection(store, 'a', { name: 'Travel', pages: 3 }, preview);
		expect(result).toMatchObject({
			status: 'invalid',
			message: 'There is already a Section called Travel'
		});
		const names = (await store.get('a'))?.notebook.sections.map((s) => s.name);
		expect(names).toEqual(['Journal', 'Habit tracker', 'Idea capture', 'Calendar', 'travel']);
	});

	it('leaves a Notebook whose Setup is not confirmed alone', async () => {
		const store = await seeded(false);
		const result = await saveAddSection(
			store,
			'a',
			{ name: 'Travel', pages: 3 },
			await shown(store, 'Travel', 3)
		);
		expect(result).toEqual({ status: 'unconfirmed' });
		expect((await store.get('a'))?.notebook.sections).toHaveLength(4);
	});

	it('reports a Notebook that is gone', async () => {
		const store = await seeded();
		const preview = await shown(store, 'Travel', 3);
		const result = await saveAddSection(store, 'gone', { name: 'Travel', pages: 3 }, preview);
		expect(result).toEqual({ status: 'missing' });
	});
});
