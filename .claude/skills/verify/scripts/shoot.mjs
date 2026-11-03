#!/usr/bin/env node
// Drives headless Chrome over the DevTools protocol: load a page at a viewport and colour
// scheme, optionally evaluate JS, optionally save a screenshot. No npm dependencies.
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { tmpdir, homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { parseArgs } from 'node:util';

const { values: args } = parseArgs({
	options: {
		url: { type: 'string' },
		width: { type: 'string', default: '1280' },
		height: { type: 'string', default: '900' },
		scheme: { type: 'string', default: 'light' },
		out: { type: 'string' },
		full: { type: 'boolean', default: false },
		'eval-file': { type: 'string', multiple: true, default: [] },
		eval: { type: 'string' }
	}
});

if (!args.url || !['light', 'dark'].includes(args.scheme)) {
	console.error(
		'usage: shoot.mjs --url <url> [--width 375] [--height 812] [--scheme light|dark]\n' +
			'                 [--out file.png] [--full] [--eval-file snippet.js]... [--eval "<expr>"]'
	);
	process.exit(2);
}

function findChrome() {
	const candidates = [
		process.env.CHROME,
		'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
		'/Applications/Chromium.app/Contents/MacOS/Chromium'
	];
	const pw = join(homedir(), 'Library/Caches/ms-playwright');
	if (existsSync(pw)) {
		for (const dir of readdirSync(pw).filter((d) => d.startsWith('chromium-'))) {
			candidates.push(
				join(pw, dir, 'chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'),
				join(pw, dir, 'chrome-mac/Chromium.app/Contents/MacOS/Chromium')
			);
		}
	}
	const found = candidates.find((c) => c && existsSync(c));
	if (!found) throw new Error('no Chrome found; set CHROME=/path/to/chrome');
	return found;
}

const profile = mkdtempSync(join(tmpdir(), 'subnote-shoot-'));
const chrome = spawn(
	findChrome(),
	[
		'--headless=new',
		'--remote-debugging-port=0',
		`--user-data-dir=${profile}`,
		'--no-first-run',
		'--no-default-browser-check',
		'--hide-scrollbars',
		'about:blank'
	],
	{ stdio: 'ignore' }
);

let ws;
try {
	const portFile = join(profile, 'DevToolsActivePort');
	for (let i = 0; i < 100 && !existsSync(portFile); i++) await new Promise((r) => setTimeout(r, 100));
	const [port, path] = readFileSync(portFile, 'utf8').trim().split('\n');
	ws = new WebSocket(`ws://127.0.0.1:${port}${path}`);
	await new Promise((resolve, reject) => {
		ws.onopen = resolve;
		ws.onerror = reject;
	});

	let nextId = 1;
	const pending = new Map();
	const waiters = [];
	ws.onmessage = ({ data }) => {
		const msg = JSON.parse(data);
		if (msg.id && pending.has(msg.id)) {
			const { resolve, reject } = pending.get(msg.id);
			pending.delete(msg.id);
			if (msg.error) reject(new Error(msg.error.message));
			else resolve(msg.result);
		} else if (msg.method) {
			for (const w of waiters.filter((w) => w.method === msg.method)) {
				waiters.splice(waiters.indexOf(w), 1);
				w.resolve(msg.params);
			}
		}
	};
	const send = (method, params = {}, sessionId) =>
		new Promise((resolve, reject) => {
			const id = nextId++;
			pending.set(id, { resolve, reject });
			ws.send(JSON.stringify({ id, method, params, sessionId }));
		});
	const once = (method) => new Promise((resolve) => waiters.push({ method, resolve }));

	const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
	const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
	const page = (method, params) => send(method, params, sessionId);

	const width = Number(args.width);
	const height = Number(args.height);
	await page('Page.enable');
	await page('Emulation.setDeviceMetricsOverride', {
		width,
		height,
		deviceScaleFactor: 1,
		mobile: width < 768
	});
	await page('Emulation.setEmulatedMedia', {
		features: [{ name: 'prefers-color-scheme', value: args.scheme }]
	});
	const loaded = once('Page.loadEventFired');
	await page('Page.navigate', { url: args.url });
	await loaded;

	const evaluate = async (expression) => {
		const { result, exceptionDetails } = await page('Runtime.evaluate', {
			expression,
			awaitPromise: true,
			returnByValue: true
		});
		if (exceptionDetails) {
			throw new Error(exceptionDetails.exception?.description ?? exceptionDetails.text);
		}
		return result.value;
	};
	await evaluate(
		'document.fonts.ready.then(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))))'
	);
	for (const file of args['eval-file']) await evaluate(readFileSync(file, 'utf8'));
	if (args.eval) console.log(JSON.stringify(await evaluate(args.eval), null, 2));

	if (args.out) {
		const shot = { format: args.out.endsWith('.jpg') ? 'jpeg' : 'png' };
		if (args.full) {
			const { cssContentSize } = await page('Page.getLayoutMetrics');
			shot.captureBeyondViewport = true;
			shot.clip = { x: 0, y: 0, width, height: Math.ceil(cssContentSize.height), scale: 1 };
		}
		const { data } = await page('Page.captureScreenshot', shot);
		mkdirSync(dirname(args.out), { recursive: true });
		writeFileSync(args.out, Buffer.from(data, 'base64'));
		console.error(`saved ${args.out}`);
	}
} catch (error) {
	console.error(`shoot.mjs: ${error.message}`);
	process.exitCode = 1;
} finally {
	ws?.close();
	chrome.kill();
	await new Promise((r) => chrome.once('exit', r));
	rmSync(profile, { recursive: true, force: true });
}
