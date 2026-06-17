import { assert, assertEquals, assertInstanceOf, assertMatch, assertNotEquals } from '@std/assert';

import * as lib from '../lib/traceparent.ts';

function is_valid_id(id: string) {
	assertMatch(
		id,
		/^((?![f]{2})[a-f0-9]{2})-((?![0]{32})[a-f0-9]{32})-((?![0]{16})[a-f0-9]{16})-([a-f0-9]{2})$/,
	);
}

Deno.test('exports', () => {
	assertInstanceOf(lib.make, Function);
	assertInstanceOf(lib.parse, Function);
	assertInstanceOf(lib.sample, Function);
	assertInstanceOf(lib.unsample, Function);
	assertInstanceOf(lib.is_sampled, Function);
	assertInstanceOf(lib.is_randomed, Function);
	assertEquals(typeof lib.FLAG_SAMPLE, 'number');
	assertEquals(typeof lib.FLAG_RANDOM, 'number');
});

Deno.test('make :: builds a valid id, sampled + random by default', () => {
	const id = lib.make();
	is_valid_id(String(id));
	assertEquals(id.flags, lib.FLAG_SAMPLE | lib.FLAG_RANDOM);
});

Deno.test('parse :: parses a well-formed traceparent', () => {
	const id = '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01';
	is_valid_id(id);

	const t = lib.parse(id)!;
	assertEquals(t.version, '00');
	assertEquals(t.trace_id, '4bf92f3577b34da6a3ce929d0e0e4736');
	assertEquals(t.parent_id, '00f067aa0ba902b7');
	assertEquals(t.flags, 0b00000001);
});

Deno.test('parse :: regenerates the trace-id when it contains junk', () => {
	const parsed = lib.parse(
		'00-12345678901234567890123456789012.-1234567890123456-01',
	)!;
	assert(parsed);
	assertEquals(parsed.version, '00');
	assertNotEquals(parsed.trace_id, '12345678901234567890123456789012');
	assertEquals(parsed.parent_id, '1234567890123456');
});

Deno.test('parse :: normalizes a future version to 00', () => {
	const parsed = lib.parse(
		'cc-12345678901234567890123456789012-1234567890123456-01',
	)!;
	assert(parsed);
	assertEquals(parsed.version, '00');
});

Deno.test('parse :: rejects the ff version', () => {
	const parsed = lib.parse(
		'ff-12345678901234567890123456789012-1234567890123456-01',
	);
	assert(parsed == null);
});

Deno.test('parse :: regenerates an all-zero trace-id', () => {
	const parsed = lib.parse(
		'00-00000000000000000000000000000000-1234567890123456-01',
	)!;
	assertNotEquals(parsed.trace_id, '00000000000000000000000000000000');
	assertEquals(parsed.parent_id, '1234567890123456');
});

Deno.test('parse :: regenerates an all-zero parent-id (and its trace-id)', () => {
	const parsed = lib.parse(
		'00-12345678901234567890123456789012-0000000000000000-01',
	)!;
	assert(parsed.trace_id);
	assertNotEquals(parsed.trace_id, '12345678901234567890123456789012');
	assertNotEquals(parsed.parent_id, '0000000000000000');
});

Deno.test('parse :: keeps a valid parent-id with leading zeros', () => {
	const parsed = lib.parse(
		'00-12345678901234567890123456789012-0000000000a902b7-01',
	)!;
	assertEquals(parsed.trace_id, '12345678901234567890123456789012');
	assertEquals(parsed.parent_id, '0000000000a902b7');
});

Deno.test('parse :: rejects non-hex trace-flags', () => {
	const parsed = lib.parse(
		'00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-g1',
	);
	assert(parsed == null);
});

Deno.test('parse :: rejects a value shorter than 55 characters', () => {
	assert(lib.parse('00-too-short-01') == null);
});

Deno.test('parse :: rejects a value containing an underscore', () => {
	const parsed = lib.parse(
		'00-1234567890123456789012345678901_-1234567890123456-01',
	);
	assert(parsed == null);
});

Deno.test('parse :: rejects a version longer than 2 characters', () => {
	const parsed = lib.parse(
		'000-12345678901234567890123456789012-1234567890123456-01',
	);
	assert(parsed == null);
});

Deno.test('parse :: rejects trace-flags that are not exactly 2 characters', () => {
	const parsed = lib.parse(
		'00-12345678901234567890123456789012-1234567890123456-001',
	);
	assert(parsed == null);
});

Deno.test('parse :: rejects extra dashes', () => {
	const parsed = lib.parse(
		'00-123456-78901234567890123456789012-1234567890123456-01',
	);
	assert(parsed == null);
});

Deno.test('parse :: trims surrounding whitespace', () => {
	const parsed = lib.parse(
		' 00-12345678901234567890123456789012-1234567890123456-01 ',
	)!;
	assert(parsed);
	assertEquals(parsed.version, '00');
	assertEquals(parsed.trace_id, '12345678901234567890123456789012');
	assertEquals(parsed.parent_id, '1234567890123456');
	assertEquals(parsed.flags, 0b00000001);
});

Deno.test('child :: shares the trace-id, but gets a fresh parent-id', () => {
	const parent = lib.make();
	const child = parent.child();
	is_valid_id(String(child));

	assertEquals(child.version, parent.version);
	assertEquals(child.trace_id, parent.trace_id);
	assertNotEquals(child.parent_id, parent.parent_id);
});

Deno.test('child :: inherits flags from its parent', () => {
	const sampled = lib.make();
	assert(lib.is_sampled(sampled.child()));
	assert(lib.is_randomed(sampled.child()));

	const flat = lib.parse(
		'00-12345678912345678912345678912345-1111111111111111-00',
	)!;
	assert(lib.is_sampled(flat.child()) === false);
	assert(lib.is_randomed(flat.child()) === false);
});

Deno.test("child :: flag changes don't ripple back to the parent", () => {
	const parent = lib.make();
	const child = parent.child();

	lib.unsample(child);
	assert(lib.is_sampled(child) === false);
	assert(lib.is_sampled(parent)); // parent is left untouched

	// but a child created after the change inherits the new state
	assert(lib.is_sampled(child.child()) === false);
});

Deno.test('is_sampled :: reflects the sample flag bit', () => {
	const id = lib.make();
	id.flags = lib.FLAG_SAMPLE;
	assert(lib.is_sampled(id));

	id.flags = 0b00000000;
	assert(lib.is_sampled(id) === false);
});

Deno.test('sample :: sets the sample flag', () => {
	const id = lib.parse(
		'00-12345678901234567890123456789012-1234567890123456-00',
	)!;
	assert(lib.is_sampled(id) === false);
	lib.sample(id);
	assert(lib.is_sampled(id));
});

Deno.test('unsample :: clears the sample flag', () => {
	const id = lib.parse(
		'00-12345678901234567890123456789012-1234567890123456-01',
	)!;
	assert(lib.is_sampled(id));
	lib.unsample(id);
	assert(lib.is_sampled(id) === false);
});

Deno.test('is_randomed :: reflects the random flag bit', () => {
	const id = lib.make();
	id.flags = lib.FLAG_RANDOM | lib.FLAG_SAMPLE;
	assert(lib.is_randomed(id));

	id.flags = 0b00000000;
	assert(lib.is_randomed(id) === false);
});
