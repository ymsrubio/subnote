import { describe, expect, it } from 'vitest';
import { validateNewNotebook } from './new-notebook';

describe('validateNewNotebook', () => {
	it('accepts a name and a page count, trimming the name', () => {
		expect(validateNewNotebook({ name: '  Spring notebook ', pages: '120' })).toEqual({
			ok: true,
			name: 'Spring notebook',
			pageCount: 120
		});
	});

	it('asks for a name when it is missing or blank', () => {
		for (const name of ['', '   ']) {
			expect(validateNewNotebook({ name, pages: '120' })).toEqual({
				ok: false,
				errors: { name: 'Give the Notebook a name' }
			});
		}
	});

	it('asks for a page count when it is empty', () => {
		expect(validateNewNotebook({ name: 'Spring', pages: ' ' })).toEqual({
			ok: false,
			errors: { pages: 'Enter how many pages it has' }
		});
	});

	it.each(['0', '-5'])('rejects a page count below 1 (%s)', (pages) => {
		expect(validateNewNotebook({ name: 'Spring', pages })).toEqual({
			ok: false,
			errors: { pages: 'A Notebook needs at least 1 page' }
		});
	});

	it.each(['12.5', 'abc', '1e1x', 'Infinity'])(
		'rejects a page count that is not a whole number (%s)',
		(pages) => {
			expect(validateNewNotebook({ name: 'Spring', pages })).toEqual({
				ok: false,
				errors: { pages: 'Pages must be a whole number' }
			});
		}
	);

	it('rejects a page count past 1000 and accepts 1000', () => {
		expect(validateNewNotebook({ name: 'Spring', pages: '1001' })).toEqual({
			ok: false,
			errors: { pages: 'Subnote handles up to 1000 pages' }
		});
		expect(validateNewNotebook({ name: 'Spring', pages: '1000' })).toMatchObject({ ok: true });
	});

	it('reports both fields at once', () => {
		expect(validateNewNotebook({ name: '', pages: '0' })).toEqual({
			ok: false,
			errors: { name: 'Give the Notebook a name', pages: 'A Notebook needs at least 1 page' }
		});
	});
});
