import { readFileSync } from 'node:fs';
import postcss, { type AtRule, type Rule } from 'postcss';
import { describe, expect, it } from 'vitest';
import tokens from './tokens.json';

type Theme = 'light' | 'dark';
type ThemedValue = string | Partial<Record<Theme, string>>;

const css = postcss.parse(readFileSync(new URL('./tokens.css', import.meta.url), 'utf8'));

function rootDeclarations(container: { each: Rule['each'] }) {
	const declarations = new Map<string, string>();
	container.each((node) => {
		if (node.type !== 'rule' || node.selector !== ':root') return;
		node.walkDecls((decl) => {
			declarations.set(decl.prop, decl.value);
		});
	});
	return declarations;
}

const light = rootDeclarations(css);
const darkMedia = css.nodes.find(
	(node): node is AtRule =>
		node.type === 'atrule' &&
		node.name === 'media' &&
		node.params.includes('prefers-color-scheme: dark')
);
const dark = new Map([...light, ...(darkMedia ? rootDeclarations(darkMedia) : [])]);
const declared: Record<Theme, Map<string, string>> = { light, dark };

const normalize = (value: string) =>
	value
		.toLowerCase()
		.replaceAll('"', "'")
		.replace(/\s*,\s*/g, ',')
		.replace(/\s+/g, ' ')
		.trim();

/** A tokens.json value as CSS: `{other}` aliases become `var(--other)`; a missing theme falls back to light. */
function expected(value: ThemedValue | number, theme: Theme) {
	const raw = typeof value === 'object' ? (value[theme] ?? value.light!) : String(value);
	return raw.replace(/^\{(.+)\}$/, 'var(--$1)');
}

const valueTokens = [
	...tokens.color.tokens,
	...tokens.spacing.tokens,
	...tokens.radius.tokens,
	...tokens.shadow.tokens
].map((token) => ({ variable: `--${token.name}`, value: token.value as ThemedValue }));

const typeTokens = tokens.type.groups.flatMap((group) =>
	group.styles.flatMap((style) => {
		const name = `--text-${style.name}`;
		return [
			{ variable: name, value: style.fontSize },
			{ variable: `${name}--line-height`, value: style.lineHeight },
			{ variable: `${name}--font-weight`, value: String(style.fontWeight) },
			...(style.letterSpacing
				? [{ variable: `${name}--letter-spacing`, value: style.letterSpacing }]
				: [])
		];
	})
);

const familyTokens = Object.entries(tokens.type.families).map(([name, value]) => ({
	variable: `--font-${name}`,
	value
}));

describe.each<Theme>(['light', 'dark'])('tokens.css in the %s theme', (theme) => {
	it.each([...valueTokens, ...typeTokens, ...familyTokens])(
		'declares $variable with its tokens.json value',
		({ variable, value }) => {
			const actual = declared[theme].get(variable);
			expect(actual, `${variable} is missing from tokens.css`).toBeDefined();
			expect(normalize(actual!)).toBe(normalize(expected(value, theme)));
		}
	);
});

describe('tokens.css', () => {
	it('keeps the paper cream at night, only slightly dimmed', () => {
		const lightness = (hex: string) => {
			const channels = hex
				.slice(1)
				.match(/../g)!
				.map((pair) => parseInt(pair, 16) / 255);
			return (Math.max(...channels) + Math.min(...channels)) / 2;
		};
		const day = lightness(light.get('--paper')!);
		const night = lightness(dark.get('--paper')!);
		expect(night).toBeLessThan(day);
		expect(night).toBeGreaterThan(0.85);
	});

	it('leaves out the base chart and sidebar slots', () => {
		const names = [...light.keys(), ...dark.keys()];
		expect(names.filter((name) => /^--(chart|sidebar)/.test(name))).toEqual([]);
	});
});
