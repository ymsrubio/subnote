#!/usr/bin/env node
// Asserts the Page component's layout rules in a real browser: node check-page.mjs <port>
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const port = process.argv[2];
if (!port) {
	console.error('usage: check-page.mjs <port>');
	process.exit(2);
}
const here = dirname(fileURLToPath(import.meta.url));

const probe = `(() => {
	const rgb = (el, prop) => getComputedStyle(el)[prop];
	const pages = [...document.querySelectorAll('#page .sn-page')];
	const info = (el) => {
		const q = (s) => el.querySelector(s);
		const name = q('.sn-page__name');
		const number = q('.sn-page__number');
		const band = q('.sn-page__band');
		return {
			width: el.offsetWidth,
			left: el.classList.contains('sn-page--left'),
			name: name && { size: parseFloat(rgb(name, 'fontSize')), color: rgb(name, 'color'), inkColor: (() => { const probe = document.createElement('span'); probe.style.color = getComputedStyle(el).getPropertyValue('--section-ink'); el.append(probe); const c = rgb(probe, 'color'); probe.remove(); return c; })(), text: name.textContent.trim(), ink: getComputedStyle(el).getPropertyValue('--section-ink').trim() },
			numberSize: parseFloat(rgb(number, 'fontSize')),
			numberTabular: rgb(number, 'fontVariantNumeric').includes('tabular-nums'),
			numberBox: (() => { const p = el.getBoundingClientRect(), n = number.getBoundingClientRect(); return { fromLeft: n.left - p.left, fromRight: p.right - n.right }; })(),
			bandWidth: band && parseFloat(rgb(band, 'width')),
			bandSide: band && (band.getBoundingClientRect().left - el.getBoundingClientRect().left < 1 ? 'left' : 'right'),
			free: !!q('.sn-page__free')
		};
	};
	const all = pages.map(info);
	const clip = document.querySelector('#page-clip');
	const clipped = clip.querySelector('.sn-page');
	const before = clipped.getBoundingClientRect().width;
	const nameBox = clipped.querySelector('.sn-page__name').getBoundingClientRect();
	const ref = document.querySelector('#page-ref .sn-page');
	return { all, clip: { container: clip.offsetWidth, pageWidth: before, nameLeft: nameBox.left - clipped.getBoundingClientRect().left, nameSize: parseFloat(rgb(clipped.querySelector('.sn-page__name'), 'fontSize')), refNameLeft: ref.querySelector('.sn-page__name').getBoundingClientRect().left - ref.getBoundingClientRect().left } };
})()`;

const failures = [];
const check = (ok, message) => ok || failures.push(message);

for (const scheme of ['light', 'dark']) {
	const out = execFileSync(
		join(here, 'shoot.mjs'),
		['--url', `http://localhost:${port}/showcase#page`, '--scheme', scheme, '--eval', probe],
		{ encoding: 'utf8' }
	);
	const data = JSON.parse(out.slice(out.indexOf('{')));
	const t158 = data.all.find((p) => p.width === 158 && p.name && !p.left);
	const t340 = data.all.find((p) => p.width === 340 && p.name);
	const ratio = 340 / 158;
	check(t158 && t340, `${scheme}: need a 158px and a 340px Title Page`);
	if (!t158 || !t340) continue;
	check(Math.abs(t340.name.size / t158.name.size - ratio) < 0.01, `${scheme}: name size scales ${t340.name.size}/${t158.name.size}`);
	check(Math.abs(t340.numberSize / t158.numberSize - ratio) < 0.01, `${scheme}: numeral size scales`);
	check(t340.numberTabular, `${scheme}: numeral uses tabular figures`);
	check(t158.name.text.length > 0, `${scheme}: Section name is text`);
	check(data.all.filter((p) => p.name).every((p) => p.name.color === p.name.inkColor), `${scheme}: every Title Page name is in its Section ink`);
	const inSection = data.all.find((p) => p.bandWidth && !p.left);
	check(inSection && Math.abs(inSection.bandWidth / inSection.width - 0.024) < 0.001, `${scheme}: band is 2.4% of width`);
	check(inSection?.bandSide === 'right', `${scheme}: right page band on the right`);
	const leftBand = data.all.find((p) => p.bandWidth && p.left);
	check(leftBand?.bandSide === 'left', `${scheme}: left page band on the left`);
	check(leftBand && leftBand.numberBox.fromLeft < leftBand.numberBox.fromRight, `${scheme}: left page number in the left corner`);
	check(inSection && inSection.numberBox.fromRight < inSection.numberBox.fromLeft, `${scheme}: right page number in the right corner`);
	const free = data.all.find((p) => p.free);
	check(free && free.bandWidth === null && !free.name, `${scheme}: Free Page has no band and no name`);
	check(data.clip.pageWidth === 158 && data.clip.container === 60, `${scheme}: clipped page keeps 158px in a 60px container`);
	check(Math.abs(data.clip.nameLeft - data.clip.refNameLeft) < 0.5 && data.clip.nameSize === t158.name.size, `${scheme}: clipped page keeps its layout`);
}

if (failures.length) {
	console.error(failures.map((f) => `FAIL ${f}`).join('\n'));
	process.exit(1);
}
console.log('page checks passed');
