import {
	assert,
	assertEquals,
	assertInstanceOf,
	assertLessOrEqual,
	assertMatch,
	assertNotMatch,
	assertThrows,
} from '@std/assert';

import * as lib from './tracestate.ts';

Deno.test('exports', () => {
	assertInstanceOf(lib.make, Function);
	assertInstanceOf(lib.parse, Function);
});

Deno.test('should keep exactly 32 members when parsing, preserving order', () => {
	const ts =
		'bar01=01,bar02=02,bar03=03,bar04=04,bar05=05,bar06=06,bar07=07,bar08=08,bar09=09,bar10=10,bar11=11,bar12=12,bar13=13,bar14=14,bar15=15,bar16=16,bar17=17,bar18=18,bar19=19,bar20=20,bar21=21,bar22=22,bar23=23,bar24=24,bar25=25,bar26=26,bar27=27,bar28=28,bar29=29,bar30=30,bar31=31,bar32=32';
	const state = lib.parse(ts);
	assertEquals(state.size, 32);
	assertEquals(state.get('bar01'), '01');
	assertEquals(state.get('bar32'), '32');
	assertEquals(String(state), ts);

	// Adding a member to a full list drops the oldest (right-most) entry.
	state.set('bar00', 0);
	assertEquals(state.get('bar00'), 0);
	assertEquals(
		String(state),
		'bar00=0,bar01=01,bar02=02,bar03=03,bar04=04,bar05=05,bar06=06,bar07=07,bar08=08,bar09=09,bar10=10,bar11=11,bar12=12,bar13=13,bar14=14,bar15=15,bar16=16,bar17=17,bar18=18,bar19=19,bar20=20,bar21=21,bar22=22,bar23=23,bar24=24,bar25=25,bar26=26,bar27=27,bar28=28,bar29=29,bar30=30,bar31=31',
	);
});

Deno.test('should discard the entire tracestate when parsing more than 32 members', () => {
	const ts =
		'bar01=01,bar02=02,bar03=03,bar04=04,bar05=05,bar06=06,bar07=07,bar08=08,bar09=09,bar10=10,bar11=11,bar12=12,bar13=13,bar14=14,bar15=15,bar16=16,bar17=17,bar18=18,bar19=19,bar20=20,bar21=21,bar22=22,bar23=23,bar24=24,bar25=25,bar26=26,bar27=27,bar28=28,bar29=29,bar30=30,bar31=31,bar32=32,bar33=33';
	const state = lib.parse(ts);
	assertEquals(state.size, 0);
});

Deno.test('should drop oldest key when > 32, with set', () => {
	const state = lib.make();
	while (state.size < 32) state.set(`bar${state.size + 1}`, state.size + 1);
	assertEquals(state.size, 32);
	state.set('bar33', 33);
	assertEquals(state.size, 32);
	assertEquals(state.get('bar33'), 33);
	assert(state.get('bar1') == null);
});

Deno.test('should drop oldest key when > 32, during set', () => {
	const state = lib.make();
	while (state.size < 32) state.set(`bar${state.size + 1}`, state.size + 1);
	state.set('bar33', 33);
	assertEquals(state.size, 32);
	assertMatch(String(state), /bar33=33/);
	assertNotMatch(String(state), /bar1=1/);
});

Deno.test('throw for invalid key, with set', () => {
	const state = lib.make();
	assertThrows(() => state.set('_123', 1));
	assertEquals(state.size, 0);
});

Deno.test('discard entire tracestate on invalid key during parsing', () => {
	const state = lib.parse('bar01=01,bar02=02,_123=03,bar04=04');
	assertEquals(state.size, 0);
});

Deno.test('should correctly parse header with case-insensitive name', () => {
	const tsLowerCase = 'vendorname1=value1,vendorname2=value2';
	const tsMixedCase = 'VeNdOrNaMe1=value1,vEnDoRnAmE2=value2';
	const stateLowerCase = lib.parse(tsLowerCase);
	const stateMixedCase = lib.parse(tsMixedCase);
	assertEquals(stateLowerCase.get('vendorname1'), 'value1');
	assertEquals(stateMixedCase.get('vendorname1'), 'value1');
	assertEquals(stateLowerCase.toString(), stateMixedCase.toString());
});

Deno.test('should handle multiple header fields correctly', () => {
	const multipleHeaders = 'vendor1=value1,vendor2=value2,vendor3=value3\nvendor4=value4';
	const state = lib.parse(multipleHeaders.replace('\n', ','));
	assertEquals(state.size, 4);
	assertEquals(state.get('vendor4'), 'value4');
});

Deno.test('should accept valid value and reject invalid ones', () => {
	const state = lib.make();
	assert(state.set('key', 'value'));
	assertThrows(() => state.set('key', 'value,')); // Contains comma
	assertThrows(() => state.set('key', 'a'.repeat(257))); // Exceeds length
});

Deno.test('updating a key moves it to the beginning and preserves order of others', () => {
	const state = lib.make();
	state.set('vendor1', 'value1');
	state.set('vendor2', 'value2');
	assertEquals(String(state), 'vendor2=value2,vendor1=value1');
	state.set('vendor1', 'newValue');
	assertEquals(String(state), 'vendor1=newValue,vendor2=value2');
});

Deno.test('should truncate entries correctly when exceeding limits', () => {
	const state = lib.make();
	for (let i = 1; i <= 35; i++) state.set(`key${i}`, 'a');
	assertLessOrEqual(state.size, 32);
});

Deno.test('discard tracestate with illegal vendor key format', () => {
	for (
		let header of [
			'foo@=1,bar=2',
			'@foo=1,bar=2',
			'foo@@bar=1,bar=2',
			'foo@bar@baz=1,bar=2',
		]
	) {
		assertEquals(lib.parse(header).size, 0, header);
	}
});

Deno.test('discard tracestate with illegal value', () => {
	assertEquals(lib.parse('foo=bar=baz').size, 0); // value contains '='
	assertEquals(lib.parse('foo=,bar=3').size, 0); // empty value
});

Deno.test('discard tracestate with key over length limit', () => {
	assertEquals(lib.parse('z'.repeat(256) + '=1').size, 1); // 256 is the max
	assertEquals(lib.parse('z'.repeat(257) + '=1').size, 0); // 257 is too long
});

Deno.test('enforce tenant/vendor key length limits', () => {
	assertEquals(lib.parse('t'.repeat(241) + '@' + 'v'.repeat(14) + '=1').size, 1);
	assertEquals(lib.parse('t'.repeat(242) + '@v=1').size, 0); // tenant too long
	assertEquals(lib.parse('t@' + 'v'.repeat(15) + '=1').size, 0); // vendor too long
});

Deno.test('allow empty and whitespace-only list members', () => {
	const state = lib.parse('foo=1,,bar=2, \t ,baz=3');
	assertEquals(state.size, 3);
	assertEquals(state.get('foo'), '1');
	assertEquals(state.get('bar'), '2');
	assertEquals(state.get('baz'), '3');
});

Deno.test('ignore optional whitespace surrounding list members', () => {
	const state = lib.parse('foo=1 \t , \t bar=2, \t baz=3');
	assertEquals(state.size, 3);
	assertEquals(state.get('foo'), '1');
	assertEquals(state.get('bar'), '2');
	assertEquals(state.get('baz'), '3');
});

Deno.test('duplicated keys are inherited and de-duplicated', () => {
	assertEquals(String(lib.parse('foo=1,foo=1')), 'foo=1');
	const last = lib.parse('foo=1,foo=2');
	assert(String(last) === 'foo=1' || String(last) === 'foo=2');
});
