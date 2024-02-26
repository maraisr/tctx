import { random } from '@lukeed/csprng';
import type { Traceparent } from 'tctx';

let IDX = 256,
	HEX: string[] = [];
for (; IDX--; ) HEX[IDX] = (IDX + 256).toString(16).substring(1);

/*#__INLINE__*/
const to_hex = (arr: Uint8Array): string => {
	let i = 0,
		output = '';
	// @ts-ignore
	for (; i < arr.length; i++) output += HEX[arr[i]];
	return output;
};

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

const trace_id_size = 16;
const parent_id_size = 8;

const W3C_TRACEPARENT_VERSION = '00';

export const SAMPLED_FLAG = 0b00000001;

const traceparent = (
	version: string,
	trace_id: string,
	parent_id: string,
	flags: number,
): Traceparent => ({
	version,
	trace_id,
	parent_id,
	flags,

	child(sampled) {
		return traceparent(
			this.version,
			this.trace_id,
			to_hex(random(parent_id_size)),
			sampled === undefined
				? this.flags
				: sampled
				? this.flags | SAMPLED_FLAG
				: this.flags & ~SAMPLED_FLAG,
		);
	},

	toString() {
		const flags = this.flags.toString(16).padStart(2, '0');
		return `${this.version}-${this.trace_id}-${this.parent_id}-${flags}`;
	},
});

export function make(sampled: boolean = true) {
	const total_size = trace_id_size + parent_id_size;
	const id = random(total_size);

	return traceparent(
		W3C_TRACEPARENT_VERSION,
		to_hex(id.slice(0, trace_id_size)),
		to_hex(id.slice(trace_id_size, total_size)),
		sampled ? SAMPLED_FLAG : 0b00000000,
	);
}

export function parse(value: string) {
	if (value.length > 55) return null;
	const segs = value.split('-');
	return traceparent(segs[0], segs[1], segs[2], parseInt(segs[3], 16));
}

// ~> Utils

export function is_sampled(id: Traceparent) {
	return !!(id.flags & SAMPLED_FLAG);
}
