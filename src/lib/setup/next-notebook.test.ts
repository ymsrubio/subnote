import { describe, expect, it } from 'vitest';
import { newestConfirmed, waitingSections } from '../notebook-list';
import { setupNotebook } from '../placement';
import { parseSavedNotebook, type SavedNotebook } from '../storage';
import { createLocalNotebookStore } from '../storage/local-notebook-store';
import { carriedMark, nextSavedNotebook, prefillFrom, prefillNote } from './next-notebook';
import { confirmStoredSetup, saveSetupEdit } from './save-setup';
import { requestsOf } from './setup-sections';

const spring: SavedNotebook = {
	id: 'spring',
	name: 'Spring notebook',
	setupConfirmed: true,
	notebook: setupNotebook(120, [
		{ name: 'Journal', pages: 64 },
		{ name: 'Habit tracker', pages: 20 },
		{ name: 'Idea capture', pages: 10 },
		{ name: 'Calendar', pages: 4 },
		{ name: 'Reading log', pages: 12 }
	])
};

const placement = (saved: SavedNotebook) =>
	saved.notebook.sections.map((s) => [s.name, s.size, s.first]);

function fakeStorage() {
	const items = new Map<string, string>();
	return {
		getItem: (key: string) => items.get(key) ?? null,
		setItem: (key: string, value: string) => void items.set(key, value)
	};
}

describe('prefillFrom', () => {
	it('puts the Pending Section first, then the placed ones, with the pages first asked for', () => {
		expect(prefillFrom(spring, 160)).toEqual({
			requests: [
				{ name: 'Reading log', pages: 12 },
				{ name: 'Journal', pages: 64 },
				{ name: 'Habit tracker', pages: 20 },
				{ name: 'Idea capture', pages: 10 },
				{ name: 'Calendar', pages: 4 }
			],
			carried: {
				from: 'Spring notebook',
				sections: [
					{ name: 'Reading log', origin: 'pending' },
					{ name: 'Journal', origin: 'placed' },
					{ name: 'Habit tracker', origin: 'placed' },
					{ name: 'Idea capture', origin: 'placed' },
					{ name: 'Calendar', origin: 'placed' }
				],
				tooBig: []
			}
		});
	});

	it('leaves out a Section that asks for more pages than the new Notebook has', () => {
		const { requests, carried } = prefillFrom(spring, 32);
		expect(requests.map((r) => r.name)).toEqual([
			'Reading log',
			'Habit tracker',
			'Idea capture',
			'Calendar'
		]);
		expect(carried.tooBig).toEqual(['Journal']);
	});
});

describe('nextSavedNotebook', () => {
	it('places the canvas Summer notebook: Journal 64 at 1, Habit tracker 32 at 65, Reading log 16 at 97', () => {
		const summer = nextSavedNotebook('summer', 'Summer notebook', 160, spring);
		expect(summer.setupConfirmed).toBe(false);
		expect(summer.notebook.pageCount).toBe(160);
		expect(placement(summer)).toEqual([
			['Journal', 64, 1],
			['Habit tracker', 32, 65],
			['Reading log', 16, 97],
			['Idea capture', 16, 113],
			['Calendar', 4, 129]
		]);
		expect(summer.notebook.pending).toEqual([]);
	});

	it('keeps a Section Pending when it still does not fit', () => {
		const small = nextSavedNotebook('s', 'Small', 64, spring);
		expect(small.notebook.sections.map((s) => s.name)).toEqual(['Journal']);
		expect(small.notebook.pending.map((p) => p.name)).toEqual([
			'Reading log',
			'Habit tracker',
			'Idea capture',
			'Calendar'
		]);
	});
});

describe('carriedMark', () => {
	const summer = nextSavedNotebook('summer', 'Summer notebook', 160, spring);

	it('says where each prefilled row came from', () => {
		expect(carriedMark(summer, 'Journal')).toBe('from Spring notebook');
		expect(carriedMark(summer, 'Reading log')).toBe('was Pending');
	});

	it('marks nothing that was added by hand, or in a Notebook not started from another', () => {
		expect(carriedMark(summer, 'Recipes')).toBeUndefined();
		expect(carriedMark(spring, 'Journal')).toBeUndefined();
	});
});

describe('prefillNote', () => {
	it('counts the Sections and the Pending Sections', () => {
		const summer = nextSavedNotebook('summer', 'Summer notebook', 160, spring);
		expect(prefillNote(summer)).toBe(
			"Prefilled from Spring notebook: its 4 Sections, plus the 1 Pending Section that waited for this Notebook. Remove any you don't need."
		);
	});

	it('names what was left out for being too big', () => {
		const note = prefillNote(nextSavedNotebook('s', 'Small', 32, spring));
		expect(note).toBe(
			"Prefilled from Spring notebook: its 3 Sections, plus the 1 Pending Section that waited for this Notebook. Remove any you don't need. Journal asks for more pages than this Notebook has, so it was left out."
		);
	});

	it('is absent for a Notebook that was not started from another', () => {
		expect(prefillNote(spring)).toBeUndefined();
	});
});

describe('the prefilled draft in storage', () => {
	it('keeps its markers through a reload, and loses a removed row marker', async () => {
		const storage = fakeStorage();
		const store = createLocalNotebookStore(() => storage);
		await store.save(spring);
		await store.save(nextSavedNotebook('summer', 'Summer notebook', 160, spring));

		await saveSetupEdit(store, 'summer', (notebook) =>
			setupNotebook(
				notebook.pageCount,
				requestsOf(notebook).filter((r) => r.name !== 'Calendar')
			)
		);

		const reloaded = await createLocalNotebookStore(() => storage).get('summer');
		expect(reloaded?.carried).toEqual({
			from: 'Spring notebook',
			sections: [
				{ name: 'Reading log', origin: 'pending' },
				{ name: 'Journal', origin: 'placed' },
				{ name: 'Habit tracker', origin: 'placed' },
				{ name: 'Idea capture', origin: 'placed' }
			],
			tooBig: []
		});

		await saveSetupEdit(store, 'summer', (notebook) =>
			setupNotebook(notebook.pageCount, [...requestsOf(notebook), { name: 'Calendar', pages: 8 }])
		);
		const readded = await store.get('summer');
		expect(readded && carriedMark(readded, 'Calendar')).toBeUndefined();
	});

	it('moves the waiting Sections to the new Notebook once it is confirmed', async () => {
		const storage = fakeStorage();
		const store = createLocalNotebookStore(() => storage);
		await store.save(spring);
		await store.save(nextSavedNotebook('summer', 'Summer notebook', 64, spring));

		expect(waitingSections(await store.list())?.from).toBe('Spring notebook');
		expect(waitingSections(await store.list())?.sections.map((s) => s.name)).toEqual([
			'Reading log'
		]);

		await confirmStoredSetup(store, 'summer');
		const list = await store.list();
		expect(list.map((s) => s.id)).toEqual(['spring', 'summer']);
		expect(newestConfirmed(list)?.id).toBe('summer');
		const waiting = waitingSections(list);
		expect(waiting?.from).toBe('Summer notebook');
		expect(waiting?.sections.map((s) => s.name)).toEqual([
			'Reading log',
			'Habit tracker',
			'Idea capture',
			'Calendar'
		]);
	});
});

describe('parseSavedNotebook with carried', () => {
	const summer = nextSavedNotebook('summer', 'Summer notebook', 160, spring);

	it('round-trips the carried record', () => {
		expect(parseSavedNotebook(JSON.parse(JSON.stringify(summer)))).toEqual({
			ok: true,
			value: summer
		});
	});

	it('still reads a Notebook saved before the field existed, without inventing one', () => {
		const old = JSON.parse(JSON.stringify(spring));
		const parsed = parseSavedNotebook(old);
		expect(parsed.ok && parsed.value.carried).toBeUndefined();
		expect(parsed.ok && 'carried' in parsed.value).toBe(false);
	});

	it('rejects a carried record that is not whole', () => {
		const withCarried = (carried: unknown) =>
			parseSavedNotebook({ ...JSON.parse(JSON.stringify(summer)), carried });
		expect(
			withCarried({ from: 'A', sections: [{ name: 'X', origin: 'maybe' }], tooBig: [] })
		).toEqual({ ok: false });
		expect(withCarried({ from: 'A', sections: [] })).toEqual({ ok: false });
		expect(withCarried('Spring')).toEqual({ ok: false });
	});
});
