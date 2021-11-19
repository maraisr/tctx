import { random } from '@lukeed/csprng';

let IDX = 256,
	HEX: string[] = [];
for (;IDX--;) HEX[IDX] = (IDX + 256).toString(16).substring(1);

/*#__INLINE__*/
const to_hex = (arr: ArrayBuffer): string => {
	let i = 0, output = '';
	// @ts-ignore
	for (; i < arr.length; i++) output += HEX[arr[i]];
	return output;
};

export interface Traceparent {
	version: string;
	trace_id: string;
	parent_id: string;
	flags: string;

	child(): Traceparent;

	toString(): string;
}

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
const sampled_flag = '00';

const traceparent = (
	version: string,
	trace_id: string,
	parent_id: string,
	flags: string,
): Traceparent => ({
	version,
	trace_id,
	parent_id,
	flags,

	child() {
		return traceparent(
			this.version,
			this.trace_id,
			to_hex(random(parent_id_size)),
			this.flags,
		);
	},

	toString() {
		return `${this.version}-${this.trace_id}-${this.parent_id}-${this.flags}`;
	},
});

export const make = (): Traceparent => {
	const total_size = trace_id_size + parent_id_size;
	const id = random(total_size);
	return traceparent(
		W3C_TRACEPARENT_VERSION,
		to_hex(id.slice(0, trace_id_size)),
		to_hex(id.slice(trace_id_size, total_size)),
		sampled_flag,
	);
};

export const parse = (value: string) => {
	if (value.length > 55) return null;
	const segs = value.split('-');
	return traceparent(segs[0], segs[1], segs[2], segs[3]);
};
