import TraceParent from 'npm:traceparent';
import * as TraceContext from 'npm:trace-context';

import * as tctx from './traceparent.ts';

import { randomBytes } from 'node:crypto';
import { Buffer } from 'node:buffer';

Deno.bench({
	name: 'tctx',
	group: 'make',
	fn() {
		let _ = String(tctx.make());
	},
});

Deno.bench({
	name: 'traceparent',
	group: 'make',
	fn() {
		const version = Buffer.alloc(1).toString('hex');
		const traceId = randomBytes(16).toString('hex');
		const id = randomBytes(8).toString('hex');

		let _ = String(TraceParent.fromString(`${version}-${traceId}-${id}-01`));
	},
});

Deno.bench({
	name: 'trace-context',
	group: 'make',
	fn() {
		let _ = TraceContext.http.serializeTraceParent(
			TraceContext.TraceParent.random(),
		);
	},
});

Deno.bench({
	name: 'tctx',
	group: 'parse',
	fn() {
		let _ = String(
			tctx.parse('00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01'),
		);
	},
});

Deno.bench({
	name: 'traceparent',
	group: 'parse',
	fn() {
		let _ = String(
			TraceParent.fromString(
				'00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01',
			),
		);
	},
});

Deno.bench({
	name: 'trace-context',
	group: 'parse',
	fn() {
		let _ = TraceContext.http.serializeTraceParent(
			TraceContext.http.parseTraceParent(
				'00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01',
			),
		);
	},
});

Deno.bench({
	name: 'tctx',
	group: 'child',
	fn() {
		let parent = tctx.make();

		let _ = String(parent.child());
	},
});

Deno.bench({
	name: 'traceparent',
	group: 'child',
	fn() {
		const version = Buffer.alloc(1).toString('hex');
		const traceId = randomBytes(16).toString('hex');
		const id = randomBytes(8).toString('hex');

		let parent = TraceParent.fromString(`${version}-${traceId}-${id}-01`);

		let _ = String(parent.child());
	},
});

Deno.bench({
	name: 'trace-context',
	group: 'child',
	fn() {
		let parent = TraceContext.TraceParent.random();

		let child = parent.clone();
		child.spanId = TraceContext.randomSpanId();
		let _ = TraceContext.http.serializeTraceParent(parent);
	},
});
