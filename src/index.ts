import { random as r } from "@lukeed/csprng";
import type { Traceparent } from "tctx";

let IDX = 256,
	HEX: string[] = [];
for (; IDX--; ) HEX[IDX] = (IDX + 256).toString(16).substring(1);

function to_hex(arr: Uint8Array) {
	let i = 0,
		output = "";
	// @ts-ignore
	for (; i < arr.length; i++) output += HEX[arr[i]];
	return output;
}

function random(size: number) {
	return /*#__INLINE__*/ to_hex(r(size));
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

const W3C_TRACEPARENT_VERSION = "00";

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
			let flags = this.flags.toString(16).padStart(2, "0");
			return `${this.version}-${this.trace_id}-${this.parent_id}-${flags}`;
		},
	};
}

export function make() {
	let id = random(24);
	return traceparent(W3C_TRACEPARENT_VERSION, id.slice(0, 32), id.slice(32), FLAG_SAMPLE | FLAG_RANDOM);
}

export function parse(value: string) {
	if (value.length > 55) return null;
	let segs = value.split("-");
	return traceparent(segs[0], segs[1], segs[2], parseInt(segs[3], 16));
}

// ~> Utils

export function sample(id: Traceparent) {
	id.flags |= FLAG_SAMPLE;
}

export function unsample(id: Traceparent) {
	id.flags &= ~FLAG_SAMPLE;
}

export function is_sampled(id: Traceparent) {
	return (id.flags & FLAG_SAMPLE) == FLAG_SAMPLE;
}

export function is_randomed(id: Traceparent) {
	return (id.flags & FLAG_RANDOM) == FLAG_RANDOM;
}
