/**
 * A simple implementation of the {@link https://www.w3.org/TR/trace-context-2/|W3C Trace Context specification level 2}.
 *
 * This module provides a simple API for creating, parsing, and manipulating tracestate headers. You will probably also
 * be relying on the {@link {import('./traceparent.ts')}} module to create and parse traceparent headers.
 *
 * Tracestates are effectivly a ring buffer of 32 key-value pairs, where the key is a string of up to 256 characters and
 * the value is a string of up to 256 characters. The key must be unique within the tracestate.
 *
 * Updateing the tracestate is done by calling the {@link {Tracestate.set}} method, which will update the value of the
 * key if it exists (and move it to the front), or prepend a new key-value pair to the front of the tracestate. If the
 * tracestate is full, the oldest key-value pair will be removed.
 *
 * @example
 * ```ts
 * import * as tp from './traceparent.ts';
 * import * as ts = from './tracestate.ts';
 *
 * let traceparent, tracestate, tmp;
 * tmp = req.headers.get('traceparent');
 * if (tmp) traceparent = ts.parse(tmp);

 * tmp = req.headers.get('tracestate');
 * // only parse the tracestate, if we have a valid parsed traceparent, as per spec
 * if (traceparent && tmp) tracestate = ts.parse(tmp);
 * traceparent ||= tp.make();
 *
 * let headers = new Headers();
 * if (tracestate) headers.set('tracestate', String(tracestate));
 *
 * tracestate.set('vendor', 'value');
 *
 * fetch('/downstream', {
 *   headers: { traceparent: traceparent.child(), tracestate }
 * })
 * ```
 *
 * @module
 */

/**
 * The Tracestate type represents a W3C Trace Context tracestate header, implemented as a ring buffer using a javascript {@link Map}.
 */
class Tracestate extends Map {
	override set(key: string, value: unknown): this {
		if (!valid_key(key) || !valid_value(value)) throw new TypeError('Invalid key or value');
		key = key.trim();

		if (this.has(key)) this.delete(key);
		// TODO: not a fan of this key's spread, can we play golf?
		else if (this.size >= 32) this.delete([...this.keys()][0]); // drop the oldest key
		return super.set(key, value);
	}

	override toString(): string {
		let o = '', c = 0;
		let els = [...this].reverse();
		while (c < Math.min(32, els.length) && (o += `${els[c][0]}=${els[c++][1]},`));
		return o.slice(0, -1);
	}
}

/**
 * Create a new tracestate instance.
 *
 * @example
 * ```ts
 * let tracestate = make({ key: 'value' });
 * tracestate.set('key2', 'value2');
 *
 * console.log(String(tracestate)); // 'key2=value2,key=value'
 * ```
 */
export function make(initial?: Iterable<[string, unknown]> | undefined): Tracestate {
	// @ts-expect-error go home ts, youre drunk
	return new Tracestate(initial);
}

/**
 * Parse a tracestate header string into a tracestate instance.
 *
 * @example
 * ```ts
 * let tracestate = parse('key=value,key2=value2');
 *
 * console.log(tracestate.get('key')); // 'value'
 * console.log(tracestate.get('key2')); // 'value2'
 *
 * tracestate.set('key', 'new-value');
 *
 * console.log(String(tracestate)); // 'key=new-value,key2=value2'
 * ```
 */
export function parse(value: string): Tracestate {
	let i = 0, c = 0, v: [string, unknown][] = [];
	let pair: string, pairs = value.split(',');

	// we are in a ring buffer, if the size > 32, we need to break
	while (i < pairs.length) {
		pair = pairs[i++];

		let idx = pair.indexOf('=');
		if (!~idx) continue; // something like: k,v or k=v,,k2=v2

		let key = pair.slice(0, idx).toLowerCase().trim();
		let value = pair.slice(idx + 1).trimRight();

		if (valid_key(key) && valid_value(value)) {
			v.unshift([key, value]);
			++c;
		}
	}

	return make(v);
}

function valid_value(value: unknown) {
	let v = String(value);
	return /^[ -~]{0,255}[!-~]$/.test(v) && !(~v.indexOf(',') || ~v.indexOf('='));
}

function valid_key(key: string) {
	return /^[a-z0-9][_0-9a-z-*/]{0,255}$/.test(key) ||
		/^[a-z0-9][_0-9a-z-*/]{0,240}@[a-z][_0-9a-z-*/]{0,13}$/.test(key);
}
