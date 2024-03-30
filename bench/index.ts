import { suite } from 'npm:@marais/bench';
import TraceParent from 'npm:traceparent';
import * as TraceContext from 'npm:trace-context';

import * as tctx from '../traceparent.ts';

import { randomBytes } from 'node:crypto';
import { Buffer } from 'node:buffer';

const valid_id = (o: string) =>
	/^((?![f]{2})[a-f0-9]{2})-((?![0]{32})[a-f0-9]{32})-((?![0]{16})[a-f0-9]{16})-([a-f0-9]{2})$/
		.test(
			o,
		);

await suite(
	{
		tctx: () => () => String(tctx.make()),
		traceparent: () => () => {
			const version = Buffer.alloc(1).toString('hex');
			const traceId = randomBytes(16).toString('hex');
			const id = randomBytes(8).toString('hex');
			const flags = '01';

			return String(
				TraceParent.fromString(`${version}-${traceId}-${id}-${flags}`),
			);
		},
		['trace-context']: () => () => {
			return TraceContext.http.serializeTraceParent(
				TraceContext.TraceParent.random(),
			);
		},
	},
	(run) => {
		run('make', undefined, valid_id);
	},
);

await suite<string>(
	{
		tctx: () => (input) => String(tctx.parse(input)),
		traceparent: () => (input) => {
			return String(TraceParent.fromString(input));
		},
		'trace-context': () => (input) => {
			return TraceContext.http.serializeTraceParent(
				TraceContext.http.parseTraceParent(input),
			);
		},
	},
	(run) => {
		run(
			'parse',
			() => '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01',
			(o: string) => '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01' === o,
		);
	},
);

await suite(
	{
		tctx: () => {
			const parent = tctx.make();

			return () => {
				return String(parent.child());
			};
		},
		traceparent: () => {
			const version = Buffer.alloc(1).toString('hex');
			const traceId = randomBytes(16).toString('hex');
			const id = randomBytes(8).toString('hex');
			const flags = '01';

			const parent = TraceParent.fromString(
				`${version}-${traceId}-${id}-${flags}`,
			);

			return () => {
				return String(parent.child());
			};
		},
		'trace-context': () => {
			const parent = TraceContext.TraceParent.random();

			return () => {
				const child = parent.clone();
				child.spanId = TraceContext.randomSpanId();
				return TraceContext.http.serializeTraceParent(parent);
			};
		},
	},
	(run) => {
		run('child', undefined, valid_id);
	},
);
