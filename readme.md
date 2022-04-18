<div align="center">
    <h1>tctx</h1>
	<p><code>npm add tctx</code> makes <a href="https://www.w3.org/TR/trace-context/">Trace Contexts</a> simple</p>
	<hr />
	<div>
		<a href="https://github.com/maraisr/tctx/actions/workflows/ci.yml">
			<img src="https://github.com/maraisr/tctx/actions/workflows/ci.yml/badge.svg"/>
		</a>
		<a href="https://npm-stat.com/charts.html?package=tctx">
			<img src="https://badgen.net/npm/dm/tctx?labelColor=black&color=black" alt="downloads"/>
		</a>
		<a href="https://packagephobia.com/result?p=tctx">
			<img src="https://badgen.net/packagephobia/install/tctx?labelColor=black&color=black" alt="size"/>
		</a>
		<a href="https://bundlephobia.com/result?p=tctx">
			<img src="https://badgen.net/bundlephobia/minzip/tctx?labelColor=black&color=black" alt="size"/>
		</a>
	</div>
</div>

## ⚡ Features

- **Lightweight** — [see](https://npm.anvaka.com/#/view/2d/tctx).

- **Efficient** — Effective reuse of memory between children see [benchmarks](#-benchmark).

- **Producer Friendly** — Are you a browser? `make()` and go home.

## ⚙️ Install

```sh
npm add tctx
```

## 🚀 Usage

```ts
// producer

import { make } from 'tctx';

fetch('/api', {
  headers: {
    traceparent: make(),
  },
});

// consumer

import { parse } from 'tctx';

const parent = parse(request.headers.traceparent);
// Passing true will mark the traceparent as sampled — ends with 01.
const id = parent.child(true);

fetch('/downstream', {
  headers: {
    traceparent: id,
  },
});
```

## 💨 Benchmark

> via the [`/bench`](/bench) directory with Node v17.9.0

```

Validation :: make
✔ tctx
✔ traceparent
✔ trace-context

Benchmark :: make
  tctx                   x 640,126 ops/sec ±0.21% (99 runs sampled)
  traceparent            x 161,062 ops/sec ±0.55% (94 runs sampled)
  trace-context          x 293,268 ops/sec ±0.35% (98 runs sampled)

Validation :: parse
✔ tctx
✔ traceparent
✔ trace-context

Benchmark :: parse
  tctx                   x 5,561,913 ops/sec ±0.14% (100 runs sampled)
  traceparent            x   303,543 ops/sec ±0.42% (91 runs sampled)
  trace-context          x 3,169,835 ops/sec ±0.05% (99 runs sampled)

Validation :: child
✔ tctx
✔ traceparent
✔ trace-context

Benchmark :: child
  tctx                   x 346,827 ops/sec ±0.40% (97 runs sampled)
  traceparent            x 109,942 ops/sec ±0.61% (93 runs sampled)
  trace-context          x 195,381 ops/sec ±0.35% (93 runs sampled)

```

## License

MIT © [Marais Rossouw](https://marais.io)
