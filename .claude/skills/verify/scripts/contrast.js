// Browser snippet. Defines snContrast(selector, prop = 'color') on the page: the WCAG contrast
// ratio between an element's colour property and the first opaque background behind it.
// Load it with shoot.mjs --eval-file, or paste it into the browser pane's javascript_tool.
// Background images (the linen texture) are not counted, only background colours.
(() => {
	const canvas = document.createElement('canvas');
	canvas.width = canvas.height = 1;
	const ctx = canvas.getContext('2d', { willReadFrequently: true });

	const rgba = (css) => {
		ctx.clearRect(0, 0, 1, 1);
		ctx.fillStyle = '#000';
		ctx.fillStyle = css;
		ctx.fillRect(0, 0, 1, 1);
		const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
		return [r, g, b, a / 255];
	};
	const over = ([r, g, b, a], [R, G, B]) => [
		r * a + R * (1 - a),
		g * a + G * (1 - a),
		b * a + B * (1 - a),
		1
	];
	const luminance = (rgb) => {
		const [r, g, b] = rgb.slice(0, 3).map((v) => {
			v /= 255;
			return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
		});
		return 0.2126 * r + 0.7152 * g + 0.0722 * b;
	};
	const backdrop = (el) => {
		const layers = [];
		for (let node = el; node instanceof Element; node = node.parentElement) {
			layers.push(rgba(getComputedStyle(node).backgroundColor));
		}
		return layers.reverse().reduce((below, layer) => over(layer, below), [255, 255, 255, 1]);
	};

	globalThis.snContrast = (selector, prop = 'color') => {
		const el = typeof selector === 'string' ? document.querySelector(selector) : selector;
		if (!el) throw new Error(`no element for ${selector}`);
		const bg = backdrop(prop === 'color' ? el : el.parentElement);
		const fg = over(rgba(getComputedStyle(el).getPropertyValue(prop)), bg);
		const [hi, lo] = [luminance(fg), luminance(bg)].sort((a, b) => b - a);
		const hex = (c) => '#' + c.slice(0, 3).map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
		return { fg: hex(fg), bg: hex(bg), ratio: Math.round(((hi + 0.05) / (lo + 0.05)) * 100) / 100 };
	};
})();
