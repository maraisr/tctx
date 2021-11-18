import { toHEX, asHEX } from '#hex';
import { fill_random } from '#crypto';

export interface Traceparent {
	version: string;
	trace_id: string;
	parent_id: string;
	flags: string;

	child(): Traceparent;

	toString(): string;
}

/*
 00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01
 ^  ^                                ^                ^ 
 |  |                                |                |
 |  |                                |                flags (2 hex)
 |  |                                parent-id (16 hex)
 |  trace-id (32 hex)
 version (2 hex)
*/

const v_size = 1,
	t_size = 16,
	p_size = 8;

const v_offset = 0,
	t_offset = v_size,
	p_offset = t_offset + t_size,
	f_offset = p_offset + p_size;

/*#__INLINE__*/
const slice = (buf: Uint8Array, offset: number, end?: number): string =>
	toHEX(buf.slice(offset, end));

const traceparent = (buf: Uint8Array) => ({
	version: slice(buf, v_offset, t_offset),
	trace_id: slice(buf, t_offset, p_offset),
	parent_id: slice(buf, p_offset, f_offset),
	// TODO: flags should be binary 0b00000000
	flags: slice(buf, f_offset),

	child() {
		const new_buf = new Uint8Array(buf);
		fill_random(new_buf, p_offset, p_size);
		return traceparent(new_buf);
	},

	toString() {
		return `${this.version}-${this.trace_id}-${this.parent_id}-${this.flags}`;
	},
});

export const make = (): Traceparent => {
	const buf = new Uint8Array(26);
	buf[v_offset] = 0; // version
	buf[f_offset] = 0; // flags
	fill_random(buf, t_offset, t_size); // trace-id
	fill_random(buf, p_offset, p_size); // parent-id

	return traceparent(buf);
};

export const parse = (value: string) => {
	if (value.length > 55) return null;
	const buf = new Uint8Array(26);

	const segs = value.split('-');
	buf.set(asHEX(segs[0]), v_offset); // version
	buf.set(asHEX(segs[1]), t_offset); // trace-id
	buf.set(asHEX(segs[2]), p_offset); // parent-id
	buf.set(asHEX(segs[3]), f_offset); // flags

	return traceparent(buf);
};
