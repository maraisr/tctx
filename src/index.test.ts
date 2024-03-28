import { test, expect } from 'bun:test';

import * as lib from '.';

function is_valid_id(id: string) {
	expect(id).toMatch(/^((?![f]{2})[a-f0-9]{2})-((?![0]{32})[a-f0-9]{32})-((?![0]{16})[a-f0-9]{16})-([a-f0-9]{2})$/);
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

	const parent2 = lib.parse('00-12345678912345678912345678912345-1111111111111111-00')!;
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
