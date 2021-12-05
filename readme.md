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

> via the [`/bench`](/bench) directory with Node v16.12.0

```
Validation :: make
✔ tctx
✔ traceparent
✔ trace-context

Benchmark :: make
  tctx                   x 237,520 ops/sec ±1.88% (81 runs sampled)
  traceparent            x  58,993 ops/sec ±2.42% (84 runs sampled)
  trace-context          x 102,664 ops/sec ±1.79% (78 runs sampled)

Validation :: parse
✔ tctx
✔ traceparent
✔ trace-context

Benchmark :: parse
  tctx                   x 3,017,798 ops/sec ±0.66% (93 runs sampled)
  traceparent            x   139,283 ops/sec ±2.22% (87 runs sampled)
  trace-context          x 1,762,715 ops/sec ±0.62% (95 runs sampled)

Validation :: child
✔ tctx
✔ traceparent
✔ trace-context

Benchmark :: child
  tctx                   x 134,337 ops/sec ±1.43% (90 runs sampled)
  traceparent            x  42,678 ops/sec ±1.88% (83 runs sampled)
  trace-context          x  69,281 ops/sec ±1.03% (78 runs sampled)
```

## License

MIT © [Marais Rossouw](https://marais.io)
