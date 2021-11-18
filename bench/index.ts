import { Suite } from 'benchmark';
import * as assert from 'uvu/assert';

import * as tctx from '../src';
import TraceParent from 'traceparent';

import { randomBytes } from 'node:crypto';

function runner(
	name: string,
	candidates: Record<string, Function>,
	valid: (s: string) => boolean,
) {
	console.log('\nValidation :: %s', name);
	Object.keys(candidates).forEach((name) => {
		const result = candidates[name]();
		try {
			assert.ok(valid(result), `${result} is not ok`);
			console.log(`✔`, name);
		} catch (err) {
			console.log('✘', name, `(FAILED @ "${err.message}")`);
		}
	});

	console.log('\nBenchmark :: %s', name);
	const bench = new Suite().on('cycle', (e) => console.log('  ' + e.target));
	Object.keys(candidates).forEach((name) => {
		bench.add(name + ' '.repeat(22 - name.length), () =>
			candidates[name](),
		);
	});

	bench.run();
}

const valid_id = (o: string) =>
	/^((?![f]{2})[a-f0-9]{2})-((?![0]{32})[a-f0-9]{32})-((?![0]{16})[a-f0-9]{16})-([a-f0-9]{2})$/.test(
		o,
	);

runner(
	'make',
	{
		tctx: () => String(tctx.make()),
		TraceParent: () => {
			const version = Buffer.alloc(1).toString('hex');
			const traceId = randomBytes(16).toString('hex');
			const id = randomBytes(8).toString('hex');
			const flags = '01';

			return String(
				TraceParent.fromString(`${version}-${traceId}-${id}-${flags}`),
			);
		},
	},
	valid_id,
);

runner(
	'parse',
	{
		tctx: () =>
			String(
				tctx.parse(
					'00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01',
				),
			),
		TraceParent: () => {
			return String(
				TraceParent.fromString(
					'00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01',
				),
			);
		},
	},
	(o: string) =>
		'00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01' === o,
);

runner(
	'child',
	{
		tctx: () => {
			const parent = tctx.make();
			return String(parent.child());
		},
		TraceParent: () => {
			const version = Buffer.alloc(1).toString('hex');
			const traceId = randomBytes(16).toString('hex');
			const id = randomBytes(8).toString('hex');
			const flags = '01';

			const parent = TraceParent.fromString(
				`${version}-${traceId}-${id}-${flags}`,
			);

			return String(parent.child());
		},
	},
	valid_id,
);
