import { random as r } from '@lukeed/csprng';
import type { Traceparent } from 'tctx/traceparent';

/*
Anatomy of a Traceparent

00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01
^  ^                                ^                ^
|  |                                |                |
|  |                                |                flags (2 hex)
|  |                                parent-id (16 hex)
|  trace-id (32 hex)
version (2 hex)
*/

const W3C_TRACEPARENT_VERSION = '00';

export const FLAG_SAMPLE = 0b00000001;
export const FLAG_RANDOM = 0b00000010;

function traceparent(version: string, trace_id: string, parent_id: string, flags: number): Traceparent {
	return {
		version,
		trace_id,
		parent_id,
		flags,

		child() {
			return traceparent(this.version, this.trace_id, random(8), this.flags | FLAG_SAMPLE);
		},

		toString() {
			let flags = this.flags.toString(16).padStart(2, '0');
			return `${this.version}-${this.trace_id}-${this.parent_id}-${flags}`;
		},
	};
}

export function make() {
	let id = random(24);
	return traceparent(W3C_TRACEPARENT_VERSION, id.slice(0, 32), id.slice(32), FLAG_SAMPLE | FLAG_RANDOM);
}

export function parse(value: string): Traceparent | null {
	value = value.trim();
	if (value.length < 55) return null;
	if (~value.indexOf('_')) return null; // regex, \W is [0-9a-fA-F_] — with underscore as well, which we dont want

	let segs = value.split('-');

	if (/\D/.test(segs[3])) return null;

	let v: string = segs[0], t: string|null = segs[1], p: string|null = segs[2], f:string|number = segs[3];
	
	if (v.length > 2 || /\W/.test(v)) return null;
	if (v === W3C_TRACEPARENT_VERSION && segs.length > 4) return null; // we know we are on version 00, so we should only have 4 segments

	if (v === 'ff') return null;
	else v = W3C_TRACEPARENT_VERSION; // we'll etiher parse as V0, or make it V0

	if (t.length !== 32 || /\W/.test(t) || !/[^0]/.test(t)) t = null;
	if (p.length !== 16 || /\W/.test(p) || !/[^0]/.test(p)) t = p = null;

	if (f.length !== 2) return null;
	else f = parseInt(segs[3], 16);

	if (t == null || p == null) {
		let id = random(24);
		t ||= id.slice(0, 32);
		p ||= id.slice(32);
	}

	return traceparent(v, t, p, f);
}

// -- Utils

export function sample(id: Traceparent) { id.flags |= FLAG_SAMPLE; }
export function unsample(id: Traceparent) { id.flags &= ~FLAG_SAMPLE; }
export function is_sampled(id: Traceparent) { return (id.flags & FLAG_SAMPLE) == FLAG_SAMPLE; }
export function is_randomed(id: Traceparent) { return (id.flags & FLAG_RANDOM) == FLAG_RANDOM; }

let IDX = 256, HEX: string[] = [];
for (; IDX--; ) HEX[IDX] = (IDX + 256).toString(16).substring(1);

function random(size: number) {
	let a = r(size), i = 0, o = '';
	for (; i < a.length; i++) o += HEX[a[i]];
	return o;
}