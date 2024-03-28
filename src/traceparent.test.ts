import { test, expect } from 'bun:test';

import * as lib from './traceparent';

function is_valid_id(id: string) {
	expect(id).toMatch(
		/^((?![f]{2})[a-f0-9]{2})-((?![0]{32})[a-f0-9]{32})-((?![0]{16})[a-f0-9]{16})-([a-f0-9]{2})$/
	);
}

test('exports', () => {
	expect(lib.make).toBeTypeOf('function');
	expect(lib.parse).toBeTypeOf('function');
	expect(lib.sample).toBeTypeOf('function');
	expect(lib.unsample).toBeTypeOf('function');
	expect(lib.is_sampled).toBeTypeOf('function');
	expect(lib.is_randomed).toBeTypeOf('function');
});

test('allows getters on parts', () => {
	const t = lib.make();
	expect(t.version).toBeTypeOf('string');
	expect(t.trace_id).toBeTypeOf('string');
	expect(t.parent_id).toBeTypeOf('string');
	expect(t.flags).toBeTypeOf('number');
});

test('valid id', () => {
	is_valid_id(String(lib.make()));
});

test('make id default flags', () => {
	expect(lib.make().flags).toBe(0b0000011);
});

test('parse string', () => {
	const id = '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01';
	is_valid_id(id);

	const t = lib.parse(id)!;
	expect(t.version).toEqual('00');
	expect(t.trace_id).toEqual('4bf92f3577b34da6a3ce929d0e0e4736');
	expect(t.parent_id).toEqual('00f067aa0ba902b7');
	expect(t.flags).toEqual(0b00000001);
});

test('handle\'s extra characters', () => {
    const parsed = lib.parse( '00-12345678901234567890123456789012.-1234567890123456-01')!;
    expect(parsed).not.toBeNil();
    expect(parsed.version).toEqual('00');
	expect(parsed.trace_id).not.toEqual('12345678901234567890123456789012');
	expect(parsed.parent_id).toEqual('1234567890123456');
});

test('handle future version', () => {
    const parsed = lib.parse( 'cc-12345678901234567890123456789012-1234567890123456-01')!;
    expect(parsed).not.toBeNil();
    expect(parsed.version).toEqual('00');
});

test('handle maximum invalid version', () => {
    const parsed = lib.parse('ff-12345678901234567890123456789012-1234567890123456-01');
    expect(parsed).toBeNil();
});

test('reject all-zero trace-id', () => {
    const parsed = lib.parse('00-00000000000000000000000000000000-1234567890123456-01')!;
    expect(parsed.trace_id).not.toBe('00000000000000000000000000000000');
	expect(parsed.parent_id).toBe('1234567890123456');
});

test('reject all-zero parent-id', () => {
    const parsed = lib.parse('00-12345678901234567890123456789012-0000000000000000-01')!;
	expect(parsed.trace_id).not.toBeNil();
    expect(parsed.trace_id).not.toBe('12345678901234567890123456789012');
	expect(parsed.parent_id).not.toBe('0000000000000000');
});

test('handle parent-id starting with zeros, but valid', () => {
    const parsed = lib.parse('00-12345678901234567890123456789012-0000000000a902b7-01')!;
    expect(parsed.trace_id).toBe('12345678901234567890123456789012');
	expect(parsed.parent_id).toBe('0000000000a902b7');
});

test('correctly interpret sampled flag', () => {
    const parsed = lib.parse('00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01')!;
    expect(lib.is_sampled(parsed)).toBeTrue();
});

test('reject illegal trace-flags', () => {
    const parsed = lib.parse('00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-g1');
    expect(parsed).toBeNil();
});

test('reject extra dashes in traceparent', () => {
    const parsed = lib.parse('00-123456-78901234567890123456789012-1234567890123456-01');
    expect(parsed).toBeNil();
});

test('handle OWS in traceparent', () => {
    const parsed = lib.parse(' 00-12345678901234567890123456789012-1234567890123456-01 ')!;
	expect(parsed).not.toBeNil();
	expect(parsed.version).toEqual('00');
    expect(parsed.trace_id).toEqual('12345678901234567890123456789012');
	expect(parsed.parent_id).toEqual('1234567890123456');
	expect(parsed.flags).toEqual(0b00000001);
});

test('child :: create', () => {
	const parent = lib.make();
	const child = parent.child();
	is_valid_id(String(parent));
	is_valid_id(String(child));

	expect(String(parent)).not.toEqual(String(child));
});

test('child :: sampled by deafult, so should be on children', () => {
	const parent = lib.make();

	const child = parent.child();
	is_valid_id(String(child));
	is_valid_id(String(parent));

	expect(lib.is_sampled(parent)).toBeTrue();
	expect(lib.is_sampled(child)).toBeTrue();
});

test('child :: random is rippled into children (false case)', () => {
	const id = '00-12345678912345678912345678912345-00f067aa0ba902b7-01';
	is_valid_id(id);

	const parent = lib.parse(id)!;
	expect(lib.is_randomed(parent)).toBeFalse();

	const child = parent.child();
	expect(lib.is_randomed(child)).toBeFalse();
});

test('child :: random is rippled into children (true case)', () => {
	const id = '00-12345678912345678912345678912345-00f067aa0ba902b7-03';
	is_valid_id(id);

	const parent = lib.parse(id)!;
	expect(lib.is_randomed(parent)).toBeTrue();

	const child = parent.child();
	expect(lib.is_randomed(child)).toBeTrue();
});

test('child :: flag behaviour on children', () => {
	const parent = lib.make();

	expect(lib.is_sampled(parent)).toBeTrue();
	expect(lib.is_randomed(parent)).toBeTrue();

	const child = parent.child();
	expect(lib.is_randomed(child)).toBeTrue();
	expect(lib.is_sampled(child)).toBeTrue();

	const child2 = child.child();
	lib.unsample(child2);
	expect(lib.is_sampled(child2)).toBeFalse();
	expect(lib.is_sampled(child)).toBeTrue();
	expect(lib.is_sampled(parent)).toBeTrue();

	const child3 = child2.child();
	expect(lib.is_sampled(child3)).toBeTrue();
	expect(lib.is_sampled(child2)).toBeFalse();

	const parent2 = lib.parse(
		'00-12345678912345678912345678912345-1111111111111111-00'
	)!;
	expect(lib.is_sampled(parent2)).toBeFalse();
	expect(lib.is_randomed(parent2)).toBeFalse();

	const child4 = parent2.child();
	expect(lib.is_sampled(child4)).toBeTrue();
	expect(lib.is_randomed(child4)).toBeFalse();
});

test('util :: is_sampled', () => {
	const id = lib.make();
	id.flags = lib.FLAG_SAMPLE;
	expect(lib.is_sampled(id)).toBeTrue();

	id.flags = 0b00000000;
	expect(lib.is_sampled(id)).toBeFalse();
});

test('util :: is_random', () => {
	const id = lib.make();
	id.flags = lib.FLAG_RANDOM | lib.FLAG_SAMPLE;
	expect(lib.is_randomed(id)).toBeTrue();

	id.flags = 0b00000000;
	expect(lib.is_randomed(id)).toBeFalse();
});
