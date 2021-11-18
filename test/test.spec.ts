import { webcrypto } from 'node:crypto';

// @ts-ignore
globalThis.crypto = webcrypto;

import * as lib from '../src';

import { test } from 'uvu';
import * as assert from 'uvu/assert';

const is_valid_id = (id: string) =>
	assert.match(
		id,
		/^((?![f]{2})[a-f0-9]{2})-((?![0]{32})[a-f0-9]{32})-((?![0]{16})[a-f0-9]{16})-([a-f0-9]{2})$/,
		'id required to match valid regex',
	);

test('exports', () => {
	assert.type(lib.make, 'function');
	assert.type(lib.parse, 'function');
});

test('allows getters on parts', () => {
	const t = lib.make();
	assert.type(t.version, 'string');
	assert.type(t.trace_id, 'string');
	assert.type(t.parent_id, 'string');
	//assert.type(t.flags, 'number');
});

test('valid id', () => {
	is_valid_id(String(lib.make()));
});

test('parse string', () => {
	const id = '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01';
	is_valid_id(id);

	const t = lib.parse(id);
	assert.equal(t.version, '00');
	assert.equal(t.trace_id, '4bf92f3577b34da6a3ce929d0e0e4736');
	assert.equal(t.parent_id, '00f067aa0ba902b7');
	//assert.equal(t.flags, 0b00000000);
});

test('can create child', () => {
	const parent = lib.make();
	const child = parent.child();
	is_valid_id(String(parent));
	is_valid_id(String(child));

	assert.not.equal(String(parent), String(child));
});

test('use-case :: graph completes', () => {
	let result = false;

	let graph = null;

	const emit = (letter, parent, me) => {
		if (graph === null) graph = { root: parent };
		graph[letter] = { parent, me };
	};

	const fn = (l: string, fns?: any) => (id?: any) => {
		if (!id) id = lib.make();
		emit(l, id.toString(), (id = id.child()).toString());
		if (fns) for (const fn of fns) fn(id);
	};

	// A -> [B -> [C, D], E]
	fn('a', [fn('b', [fn('c'), fn('d')]), fn('e')])();

	assert.equal(Object.keys(graph), ['root', 'a', 'b', 'c', 'd', 'e']);

	for (const letter of Object.keys(graph)) {
		if (letter === 'root') continue;
		const parent = graph[letter].parent;
		const me = graph[letter].me;

		switch (letter) {
			case 'a':
				assert.equal(parent, graph.root);
				break;
			case 'b':
				assert.equal(parent, graph.a.me);
				break;
			case 'c':
				assert.equal(parent, graph.b.me);
				break;
			case 'd':
				assert.equal(parent, graph.b.me);
				break;
			case 'e':
				assert.equal(parent, graph.a.me);
				break;
		}
	}
});

test.run();
