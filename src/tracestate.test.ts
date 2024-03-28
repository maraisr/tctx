import { test, expect } from 'bun:test';

import * as lib from './tracestate';

test('exports', () => {
	expect(lib.make).toBeTypeOf('function');
	expect(lib.parse).toBeTypeOf('function');
});

test('should drop oldest key when > 32, during init', () => {
	const ts = 'bar01=01,bar02=02,bar03=03,bar04=04,bar05=05,bar06=06,bar07=07,bar08=08,bar09=09,bar10=10,bar11=11,bar12=12,bar13=13,bar14=14,bar15=15,bar16=16,bar17=17,bar18=18,bar19=19,bar20=20,bar21=21,bar22=22,bar23=23,bar24=24,bar25=25,bar26=26,bar27=27,bar28=28,bar29=29,bar30=30,bar31=31,bar32=32,bar33=33';
	const state = lib.parse(ts);
	expect(state.size).toBe(32);
	expect(state.get('bar33')).toBeNil();
	expect(state.get('bar22')).toBe('22');
	expect(String(state)).toBe('bar01=01,bar02=02,bar03=03,bar04=04,bar05=05,bar06=06,bar07=07,bar08=08,bar09=09,bar10=10,bar11=11,bar12=12,bar13=13,bar14=14,bar15=15,bar16=16,bar17=17,bar18=18,bar19=19,bar20=20,bar21=21,bar22=22,bar23=23,bar24=24,bar25=25,bar26=26,bar27=27,bar28=28,bar29=29,bar30=30,bar31=31,bar32=32');

	state.set('bar00', 0);
	expect(state.get('bar00')).toBe(0);
	expect(String(state)).toBe('bar00=0,bar01=01,bar02=02,bar03=03,bar04=04,bar05=05,bar06=06,bar07=07,bar08=08,bar09=09,bar10=10,bar11=11,bar12=12,bar13=13,bar14=14,bar15=15,bar16=16,bar17=17,bar18=18,bar19=19,bar20=20,bar21=21,bar22=22,bar23=23,bar24=24,bar25=25,bar26=26,bar27=27,bar28=28,bar29=29,bar30=30,bar31=31');
});

test('should drop oldest key when > 32, with set', () => {
	const state = lib.make();
	while (state.size < 32) state.set(`bar${state.size+1}`, state.size+1);
	expect(state.size).toBe(32);
	state.set('bar33', 33);
	expect(state.size).toBe(32);
	expect(state.get('bar33')).toBe(33);
	expect(state.get('bar1')).toBeNil();
});

test('should drop oldest key when > 32, during set', () => {
	const state = lib.make();
	while (state.size < 32) state.set(`bar${state.size+1}`, state.size+1);
	state.set('bar33', 33);
	expect(state.size).toBe(32);
	expect(String(state)).toMatch(/bar33=33/);
	expect(String(state)).not.toMatch(/bar1=1/);
});

test('throw for invalid key, with set', () => {
	const state = lib.make();
	expect(() => state.set('_123', 1)).toThrow(/invalid key/i);
	expect(state.size).toBe(0);
});

test('skip invalid key during parsing', () => {
	const state = lib.parse('bar01=01,bar02=02,_123=03,bar04=04');
	expect(state.size).toBe(3);
	expect(state.get('bar01')).toBe('01');
	expect(state.get('bar02')).toBe('02');
	expect(state.get('bar04')).toBe('04');
});

test('should correctly parse header with case-insensitive name', () => {
	const tsLowerCase = 'vendorname1=value1,vendorname2=value2';
	const tsMixedCase = 'VeNdOrNaMe1=value1,vEnDoRnAmE2=value2';
	const stateLowerCase = lib.parse(tsLowerCase);
	const stateMixedCase = lib.parse(tsMixedCase);
	expect(stateLowerCase.get('vendorname1')).toBe('value1');
	expect(stateMixedCase.get('vendorname1')).toBe('value1');
	expect(stateLowerCase.toString()).toBe(stateMixedCase.toString());
});

test('should handle multiple header fields correctly', () => {
	const multipleHeaders = 'vendor1=value1,vendor2=value2,vendor3=value3\nvendor4=value4';
	const state = lib.parse(multipleHeaders.replace('\n', ','));
	expect(state.size).toBe(4);
	expect(state.get('vendor4')).toBe('value4');
});

test('should accept valid value and reject invalid ones', () => {
	const state = lib.make();
	expect(() => state.set('key', 'value')).not.toThrow();
	expect(() => state.set('key', 'value,')).toThrow(/Invalid key or value/); // Contains comma
	expect(() => state.set('key', 'a'.repeat(257))).toThrow(/Invalid key or value/); // Exceeds length
});

test('updating a key moves it to the beginning and preserves order of others', () => {
	const state = lib.make();
	state.set('vendor1', 'value1');
	state.set('vendor2', 'value2');
	expect(String(state)).toBe('vendor2=value2,vendor1=value1');
	state.set('vendor1', 'newValue');
	expect(String(state)).toBe('vendor1=newValue,vendor2=value2');
});

test('should truncate entries correctly when exceeding limits', () => {
	const state = lib.make();
	for (let i = 1; i <= 35; i++) state.set(`key${i}`, 'a');
	expect(state.size).toBeLessThanOrEqual(32);
});
