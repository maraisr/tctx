import * as traceparent from '../lib/traceparent.ts';
import * as tracestate from '../lib/tracestate.ts';

Deno.serve({
	port: 8000,
}, (req) => {
	let u = new URL(req.url, 'http://localhost');
	let m = req.method;
	if (m === 'POST' && u.pathname === '/test') return test(req);
	return new Response('Not Found', { status: 404 });
});

type Payload = {
	url: string;
	arguments: Payload[];
};

async function test(req: Request) {
	try {
		var payload = await req.json() as Payload[];
	} catch (_e: unknown) {
		return new Response('Bad Request', { status: 400 });
	}

	let traceparent_v, tracestate_v, tmp;
	tmp = req.headers.get('traceparent');
	if (tmp) traceparent_v = traceparent.parse(tmp);

	tmp = req.headers.get('tracestate');
	if (traceparent_v && tmp) tracestate_v = tracestate.parse(tmp);
	traceparent_v ||= traceparent.make();

	const headers = new Headers();
	if (tracestate_v) headers.set('tracestate', String(tracestate_v));

	// Intentionally not batching requests
	for (let p of payload) {
		headers.set('traceparent', String(traceparent_v.child()));
		await fetch(p.url, {
			method: 'POST',
			headers,
			body: JSON.stringify(p.arguments),
		});
	}

	return new Response('OK');
}
