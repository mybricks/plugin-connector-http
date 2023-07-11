function cloneDeep(obj: any, cache = []) {
	if (obj === null || typeof obj !== 'object') {
		return obj;
	}

	const hit = cache.filter((i) => i.original === obj)[0];

	if (hit) {
		return hit.copy;
	}

	const copy = Array.isArray(obj) ? [] : {};

	cache.push({
		original: obj,
		copy,
	});

	Object.keys(obj).forEach((key) => {
		copy[key] = cloneDeep(obj[key], cache);
	});

	return copy;
}

export { cloneDeep };
