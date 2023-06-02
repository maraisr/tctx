import * as lib from '.';

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
	assert.type(lib.is_sampled, 'function');
});

test('allows getters on parts', () => {
	const t = lib.make();
	assert.type(t.version, 'string');
	assert.type(t.trace_id, 'string');
	assert.type(t.parent_id, 'string');
	assert.type(t.flags, 'number');
});

test('valid id', () => {
	is_valid_id(String(lib.make()));
});

test('make id sampled tests', () => {
	assert.is(lib.make().flags, 0b00000001);
	assert.is(lib.make(true).flags, 0b00000001);
	assert.is(lib.make(false).flags, 0b00000000);
});

test('parse string', () => {
	const id = '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01';
	is_valid_id(id);

	const t = lib.parse(id)!;
	assert.equal(t.version, '00');
	assert.equal(t.trace_id, '4bf92f3577b34da6a3ce929d0e0e4736');
	assert.equal(t.parent_id, '00f067aa0ba902b7');
	assert.equal(t.flags, 0b00000001);
});

test('child :: create', () => {
	const parent = lib.make();
	const child = parent.child();
	is_valid_id(String(parent));
	is_valid_id(String(child));

	assert.not.equal(String(parent), String(child));
});

test('child :: sampled ripple into children', () => {
	const parent = lib.make(true);
	const child = parent.child();
	is_valid_id(String(child));
	is_valid_id(String(parent));

	assert.is(lib.is_sampled(parent), true);
	assert.is(lib.is_sampled(child), true);
});

test('child :: sampling doent affect parent', () => {
	const parent = lib.make(true);
	assert.is(lib.is_sampled(parent), true, 'parent should be sampled');
	const child = parent.child();
	assert.is(lib.is_sampled(child), true, 'child should inherit sampling');
	const child2 = child.child(false);
	assert.is(lib.is_sampled(child2), false, 'child2 shouldnt be sampled');
	assert.is(lib.is_sampled(child), true, 'child should still be sampled');
	assert.is(lib.is_sampled(parent), true, 'parent should still be sampled');
	const child3 = child2.child(true);
	assert.is(lib.is_sampled(child3), true, 'child3 should be sampled');
	assert.is(lib.is_sampled(child2), false, 'child2 should still be sampled');
});

test('util :: is_sampled', () => {
	const id = lib.make();
	assert.is(lib.is_sampled(id), true);

	id.flags = 0b00000000;
	assert.is(lib.is_sampled(id), false);
});

test('use-case :: graph completes', () => {
	let graph: any = null;

	const emit = (letter: string, parent: string, me: string) => {
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
