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
});

Deno.test('valid id', () => {
	is_valid_id(String(lib.make()));
});

Deno.test('make id default flags', () => {
	assertEquals(lib.make().flags, 0b0000011);
});

Deno.test('parse string', () => {
	const id = '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01';
	is_valid_id(id);

	const t = lib.parse(id)!;
	assertEquals(t.version, '00');
	assertEquals(t.trace_id, '4bf92f3577b34da6a3ce929d0e0e4736');
	assertEquals(t.parent_id, '00f067aa0ba902b7');
	assertEquals(t.flags, 0b00000001);
});

Deno.test("handle's extra characters", () => {
	const parsed = lib.parse(
		'00-12345678901234567890123456789012.-1234567890123456-01',
	)!;
	assert(parsed);
	assertEquals(parsed.version, '00');
	assertNotEquals(parsed.trace_id, '12345678901234567890123456789012');
	assertEquals(parsed.parent_id, '1234567890123456');
});

Deno.test('handle future version', () => {
	const parsed = lib.parse(
		'cc-12345678901234567890123456789012-1234567890123456-01',
	)!;
	assert(parsed);
	assertEquals(parsed.version, '00');
});

Deno.test('handle maximum invalid version', () => {
	const parsed = lib.parse(
		'ff-12345678901234567890123456789012-1234567890123456-01',
	);
	assert(parsed == null);
});

Deno.test('reject all-zero trace-id', () => {
	const parsed = lib.parse(
		'00-00000000000000000000000000000000-1234567890123456-01',
	)!;
	assertNotEquals(parsed.trace_id, '00000000000000000000000000000000');
	assertEquals(parsed.parent_id, '1234567890123456');
});

Deno.test('reject all-zero parent-id', () => {
	const parsed = lib.parse(
		'00-12345678901234567890123456789012-0000000000000000-01',
	)!;
	assert(parsed.trace_id);
	assertNotEquals(parsed.trace_id, '12345678901234567890123456789012');
	assertNotEquals(parsed.parent_id, '0000000000000000');
});

Deno.test('handle parent-id starting with zeros, but valid', () => {
	const parsed = lib.parse(
		'00-12345678901234567890123456789012-0000000000a902b7-01',
	)!;
	assertEquals(parsed.trace_id, '12345678901234567890123456789012');
	assertEquals(parsed.parent_id, '0000000000a902b7');
});

Deno.test('correctly interpret sampled flag', () => {
	const parsed = lib.parse(
		'00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01',
	)!;
	assert(lib.is_sampled(parsed));
});

Deno.test('reject illegal trace-flags', () => {
	const parsed = lib.parse(
		'00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-g1',
	);
	assert(parsed == null);
});

Deno.test('reject extra dashes in traceparent', () => {
	const parsed = lib.parse(
		'00-123456-78901234567890123456789012-1234567890123456-01',
	);
	assert(parsed == null);
});

Deno.test('handle OWS in traceparent', () => {
	const parsed = lib.parse(
		' 00-12345678901234567890123456789012-1234567890123456-01 ',
	)!;
	assert(parsed);
	assertEquals(parsed.version, '00');
	assertEquals(parsed.trace_id, '12345678901234567890123456789012');
	assertEquals(parsed.parent_id, '1234567890123456');
	assertEquals(parsed.flags, 0b00000001);
});

Deno.test('child :: create', () => {
	const parent = lib.make();
	const child = parent.child();
	is_valid_id(String(parent));
	is_valid_id(String(child));

	assertNotEquals(String(parent), String(child));
});

Deno.test('child :: sampled by deafult, so should be on children', () => {
	const parent = lib.make();

	const child = parent.child();
	is_valid_id(String(child));
	is_valid_id(String(parent));

	assert(lib.is_sampled(parent));
	assert(lib.is_sampled(child));
});

Deno.test('child :: random is rippled into children (false case)', () => {
	const id = '00-12345678912345678912345678912345-00f067aa0ba902b7-01';
	is_valid_id(id);

	const parent = lib.parse(id)!;
	assert(lib.is_randomed(parent) === false);

	const child = parent.child();
	assert(lib.is_randomed(child) === false);
});

Deno.test('child :: random is rippled into children (true case)', () => {
	const id = '00-12345678912345678912345678912345-00f067aa0ba902b7-03';
	is_valid_id(id);

	const parent = lib.parse(id)!;
	assert(lib.is_randomed(parent));

	const child = parent.child();
	assert(lib.is_randomed(child));
});

Deno.test('child :: flag behaviour on children', () => {
	const parent = lib.make();

	assert(lib.is_sampled(parent));
	assert(lib.is_randomed(parent));

	const child = parent.child();
	assert(lib.is_sampled(child));
	assert(lib.is_randomed(child));

	const child2 = child.child();
	lib.unsample(child2);
	assert(lib.is_sampled(child2) === false);
	assert(lib.is_sampled(child));
	assert(lib.is_sampled(parent));

	const child3 = child2.child();
	assert(lib.is_sampled(child3) === false);
	assert(lib.is_sampled(child2) === false);

	const parent2 = lib.parse(
		'00-12345678912345678912345678912345-1111111111111111-00',
	)!;
	assert(lib.is_sampled(parent2) === false);
	assert(lib.is_randomed(parent2) === false);

	const child4 = parent2.child();
	assert(lib.is_sampled(child4) === false); // it should be inherited
	assert(lib.is_randomed(child4) === false);

	const parent3 = lib.parse(
		'00-12345678912345678912345678912345-1111111111111111-01',
	)!;

	const child5 = parent3.child();
	assert(lib.is_sampled(child5)); // it should be inherited
});

Deno.test('util :: is_sampled', () => {
	const id = lib.make();
	id.flags = lib.FLAG_SAMPLE;
	assert(lib.is_sampled(id));

	id.flags = 0b00000000;
	assert(lib.is_sampled(id) === false);
});

Deno.test('util :: is_random', () => {
	const id = lib.make();
	id.flags = lib.FLAG_RANDOM | lib.FLAG_SAMPLE;
	assert(lib.is_randomed(id));

	id.flags = 0b00000000;
	assert(lib.is_randomed(id) === false);
});
