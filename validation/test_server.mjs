import * as traceparent from '../traceparent.mjs';
import * as tracestate from '../tracestate.mjs';

import { createServer } from 'node:http';

createServer((req, res) => {
	let u = new URL(req.url, 'http://localhost');
	let m = req.method;
	if (m === 'POST' && u.pathname === '/test') return void test(req, res);
	send(res, '', 404);
}).listen(8000);

async function test(req, res) {
	try {
		var payload = await json(req);
	} catch (e) {
		return send(res, String(e), 400);
	}

	let traceparent_v, tracestate_v, tmp;
	tmp = req.headers.traceparent;
	if (tmp) traceparent_v = traceparent.parse(tmp);

	tmp = req.headers.tracestate;
	if (traceparent_v && tmp) tracestate_v = tracestate.parse(tmp);
	traceparent_v ||= traceparent.make();

	const headers = new Headers();
	if (tracestate_v) headers.set('tracestate', String(tracestate_v));

	// Intentionally not batching requests
	for (let p of payload) {
		headers.set('traceparent', traceparent_v.child());
		await fetch(p.url, {
			method: 'POST',
			headers,
			body: JSON.stringify(p.arguments),
		});
	}

	return send(res, 'Ok', 200);
}

// --
function send(res, body, status) {
	res.writeHead(status);
	res.end(body);
}

function json(req) {
	let v = '',
		resolve;
	let p = new Promise((rs) => {
		resolve = rs;
	});
	req.on('data', (c) => (v += c));
	req.on('end', () => resolve(JSON.parse(v)));
	return p;
}
