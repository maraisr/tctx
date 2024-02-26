import * as lib from '.';

import { test, expect } from 'bun:test';

function is_valid_id(id: string) {
	expect(id).toMatch(/^((?![f]{2})[a-f0-9]{2})-((?![0]{32})[a-f0-9]{32})-((?![0]{16})[a-f0-9]{16})-([a-f0-9]{2})$/);
}

test('exports', () => {
	expect(lib.make).toBeTypeOf('function');
	expect(lib.parse).toBeTypeOf('function');
	expect(lib.is_sampled).toBeTypeOf('function');
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

test('make id sampled tests', () => {
	expect(lib.make().flags).toBe(0b00000000);
	expect(lib.make(true).flags).toBe(0b00000001);
	expect(lib.make(false).flags).toBe(0b00000000);
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

test('child :: create', () => {
	const parent = lib.make();
	const child = parent.child();
	is_valid_id(String(parent));
	is_valid_id(String(child));

	expect(String(parent)).not.toEqual(String(child));
});

test('child :: sampled ripple into children', () => {
	const parent = lib.make(true);
	const child = parent.child();
	is_valid_id(String(child));
	is_valid_id(String(parent));

	expect(lib.is_sampled(parent)).toBeTrue();
	expect(lib.is_sampled(child)).toBeTrue();
});

test('child :: sampling doent affect parent', () => {
	const parent = lib.make(true);
	expect(lib.is_sampled(parent)).toBeTrue(); // parent should be sampled
	const child = parent.child();
	expect(lib.is_sampled(child)).toBeTrue(); // child should inherit sampling
	const child2 = child.child(false);
	expect(lib.is_sampled(child2)).toBeFalse(); // child2 shouldnt be sampled
	expect(lib.is_sampled(child)).toBeTrue(); // child should still be sampled
	expect(lib.is_sampled(parent)).toBeTrue(); // parent should still be sampled
	const child3 = child2.child(true);
	expect(lib.is_sampled(child3)).toBeTrue(); // child3 should be sampled
	expect(lib.is_sampled(child2)).toBeFalse(); // child2 should still be sampled
});

test('util :: is_sampled', () => {
	const id = lib.make(true);
	expect(lib.is_sampled(id)).toBeTrue();

	id.flags = 0b00000000;
	expect(lib.is_sampled(id)).toBeFalse();
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

	expect(Object.keys(graph)).toEqual(['root', 'a', 'b', 'c', 'd', 'e']);

	for (const letter of Object.keys(graph)) {
		if (letter === 'root') continue;
		const parent = graph[letter].parent;

		switch (letter) {
			case 'a':
				expect(parent).toEqual(graph.root);
				break;
			case 'b':
				expect(parent).toEqual(graph.a.me);
				break;
			case 'c':
				expect(parent).toEqual(graph.b.me);
				break;
			case 'd':
				expect(parent).toEqual(graph.b.me);
				break;
			case 'e':
				expect(parent).toEqual(graph.a.me);
				break;
		}
	}
});
