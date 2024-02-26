export interface Traceparent {
	version: string;
	trace_id: string;
	parent_id: string;
	flags: number;

	child(): Traceparent;

	toString(): string;
}

/**
 * Makes a new Traceparent which one can then `toString()` to get the value.
 *
 * @example
 *
 * ```js
 * const id = make();
 * String(id); // 00-aa3ee2e08eb134a292fb799969f2de62-62994ea4677bc463-00
 * const child = id.child();
 * String(child); // 00-aa3ee2e08eb134a292fb799969f2de62-5402ac6f6874d505-00
 * ```
 */
export function make(): Traceparent;

/**
 * Allows you to parse an incoming value into the areas, easy for a server to continue the trace chain.
 *
 * @example
 *
 * ```js
 * const parent = parse(req.headers.traceparent); // 00-aa3ee2e08eb134a292fb799969f2de62-62994ea4677bc463-00
 * const child = parent.child();
 * String(child); // 00-aa3ee2e08eb134a292fb799969f2de62-5402ac6f6874d505-00
 * ```
 */
export function parse(value: string): Traceparent;

export function sample(id: Traceparent): Traceparent;

export const FLAG_SAMPLE: number;
export function is_sampled(id: Traceparent): boolean;

export const FLAG_RANDOM: number;
export function is_randomed(id: Traceparent): boolean;
