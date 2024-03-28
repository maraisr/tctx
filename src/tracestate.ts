class Tracestate extends Map {
	set(key: string, value: any) {
		if (!valid_key(key) || !valid_value(value)) throw new TypeError('Invalid key or value');
		key = key.trim();

		if (this.has(key)) this.delete(key);
		// TODO: not a fan of this key's spread, can we play golf?
		else if (this.size >= 32) this.delete([...this.keys()][0]); // drop the oldest key
		return super.set(key, value);
	}

	toString() {
		let o = '', c = 0;
		let els = [...this].reverse();
		while (c < Math.min(32, els.length) && (o += `${els[c][0]}=${els[c++][1]},`));
		return o.slice(0, -1);
	}
}

export function make(initial?: Record<string, any> | undefined) {
	// @ts-expect-error go home ts, youre drunk
	return new Tracestate(initial);
}

export function parse(value: string) {
	let i = 0, c = 0, v: [string, any][] = [];
	let pair: string, pairs = value.split(',');

	// we are in a ring buffer, if the size > 32, we need to break
	while(i < pairs.length) {
		pair = pairs[i++];

		let idx = pair.indexOf('=');
		if (!~idx) continue; // something like: k,v or k=v,,k2=v2

		let key = pair.slice(0, idx).toLowerCase().trim();
		let value = pair.slice(idx + 1).trimRight();

		if (valid_key(key) && valid_value(value)) {
			v.unshift([key, value]); ++c;
		}
	}

	return make(v);
}

function valid_value(value: any) {
	let v = String(value);
	return /^[ -~]{0,255}[!-~]$/.test(v) && !(~v.indexOf(',') || ~v.indexOf('='));
}

function valid_key(key: string) {
	return /^[a-z0-9][_0-9a-z-*/]{0,255}$/.test(key) || /^[a-z0-9][_0-9a-z-*/]{0,240}@[a-z][_0-9a-z-*/]{0,13}$/.test(key);
}
