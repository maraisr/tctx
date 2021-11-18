import { toHEX } from '#hex';
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


const trace_id_size = 16,
	parent_id_size = 8;
const default_version = "00";
const sampled_flag = "00";


const traceparent = (version:string, trace_id:string, parent_id: string, flags:string): Traceparent => ({
	version,
	trace_id,
	parent_id,
	flags,

	child() {
		const new_buf = new Uint8Array(parent_id_size);
		fill_random(new_buf, 0, parent_id_size);
		return traceparent(this.version, this.trace_id, toHEX(new_buf), this.flags);
	},

	toString() {
		return `${this.version}-${this.trace_id}-${this.parent_id}-${this.flags}`;
	},
})

export const make = (): Traceparent => {
	const total_size = trace_id_size + parent_id_size
	const buf = new Uint8Array(total_size);
	fill_random(buf, 0, total_size);
	return traceparent(
		default_version,
		toHEX(buf.slice(0, trace_id_size)),
		toHEX(buf.slice(trace_id_size, total_size)),
		sampled_flag);
};

export const parse = (value: string) => {
	if (value.length > 55) return null;
	const segs = value.split('-');
	return traceparent(segs[0],segs[1],segs[2],segs[3]);
};