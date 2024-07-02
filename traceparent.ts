import { random as r } from 'npm:@lukeed/csprng@^1';

/**
 * A simple implementation of the {@link https://www.w3.org/TR/trace-context-2/|W3C Trace Context specification level 2}.
 *
 * This module provides a simple API for creating, parsing, and manipulating traceparent headers.
 *
 * The anatomy of a traceparent:
 *
 * ```
 * 00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01
 * ^  ^                                ^                ^
 * |  |                                |                |
 * |  |                                |                flags (2 hex)
 * |  |                                parent-id (16 hex)
 * |  trace-id (32 hex)
 * version (2 hex)
 * ```
 *
 * @example
 * ```ts
 * let traceparent = parse(req.headers.get('traceparent')) || make();
 *
 * fetch('/downstream', {
 *   headers: { traceparent: traceparent.child() }
 * })
 * ```
 *
 * @module
 */

/**
 * The Traceparent type represents a W3C Trace Context traceparent header.
 */
export interface Traceparent {
	version: string;
	trace_id: string;
	parent_id: string;
	flags: number;
	/**
	 * Branches the traceparent into a new child, creating a new {@link parent_id}.
	 * Note; All existing flags are copied over.
	 */
	child(): Traceparent;
	toString(): string;
}

const W3C_TRACEPARENT_VERSION = '00';

/** The bitmask represenging a sampled traceparent */
export const FLAG_SAMPLE = 0b00000001;
/** The bitmask representing a random traceparent */
export const FLAG_RANDOM = 0b00000010;

function traceparent(
	version: string,
	trace_id: string,
	parent_id: string,
	flags: number,
): Traceparent {
	return {
		version,
		trace_id,
		parent_id,
		flags,

		child() {
			return traceparent(this.version, this.trace_id, random(8), this.flags);
		},

		toString() {
			let flags = this.flags.toString(16).padStart(2, '0');
			return `${this.version}-${this.trace_id}-${this.parent_id}-${flags}`;
		},
	};
}

/**
 * Makes a new Traceparent which one can then `toString()` to get the value.
 *
 * By default the flags are both {@link FLAG_SAMPLE|sampled} and {@link FLAG_RANDOM|randomed}.
 *
 * @example
 *
 * ```js
 * const id = make();
 * String(id); // 00-aa3ee2e08eb134a292fb799969f2de62-62994ea4677bc463-01
 * const child = id.child();
 * String(child); // 00-aa3ee2e08eb134a292fb799969f2de62-5402ac6f6874d505-01
 * ```
 */
export function make(): Traceparent {
	let id = random(24);
	return traceparent(
		W3C_TRACEPARENT_VERSION,
		id.slice(0, 32),
		id.slice(32),
		FLAG_SAMPLE | FLAG_RANDOM,
	);
}

/**
 * Allows you to parse an incoming value into the areas, easy for a server to continue the trace chain.
 *
 * @example
 * ```js
 * const parent = parse(req.headers.traceparent); // 00-aa3ee2e08eb134a292fb799969f2de62-62994ea4677bc463-00
 * const child = parent.child();
 * String(child); // 00-aa3ee2e08eb134a292fb799969f2de62-5402ac6f6874d505-01
 * ```
 */
export function parse(value: string): Traceparent | null {
	value = value.trim();
	if (value.length < 55) return null;
	if (~value.indexOf('_')) return null; // regex, \W is [0-9a-fA-F_] — with underscore as well, which we dont want

	let segs = value.split('-');

	if (/\D/.test(segs[3])) return null;

	let v: string = segs[0],
		t: string | null = segs[1],
		p: string | null = segs[2],
		f: string | number = segs[3];

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

/**
 * Modifies the flags of a Traceparent to sample the traceparent flag bit.
 *
 * > [!NOTE]
 * > You may wish to `.child()` before you sample, as is required by the {@link https://www.w3.org/TR/trace-context-2/#sampled-flag|spec}
 */
export function sample(id: Traceparent): void {
	id.flags |= FLAG_SAMPLE;
}

/**
 * Modifies the flags of a Traceparent to unsample the traceparent flag bit.
 *
 * > [!NOTE]
 * > You may wish to `.child()` before you unsample, as is required by the {@link https://www.w3.org/TR/trace-context-2/#sampled-flag|spec}
 */
export function unsample(id: Traceparent): void {
	id.flags &= ~FLAG_SAMPLE;
}

/** Returns if the traceparent is currently being sampled. */
export function is_sampled(id: Traceparent): boolean {
	return (id.flags & FLAG_SAMPLE) == FLAG_SAMPLE;
}

/** Returns if the traceparent is currently random. */
export function is_randomed(id: Traceparent): boolean {
	return (id.flags & FLAG_RANDOM) == FLAG_RANDOM;
}

let IDX = 256, HEX: string[] = [];
for (; IDX--;) HEX[IDX] = (IDX + 256).toString(16).substring(1);

function random(size: number) {
	let a = r(size), i = 0, o = '';
	for (; i < a.length; i++) o += HEX[a[i]];
	return o;
}
