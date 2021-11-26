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
const id = parent.child();

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
✔ TraceParent

Benchmark :: make
  tctx                   x 245,865 ops/sec ±0.95% (85 runs sampled)
  TraceParent            x  57,354 ops/sec ±2.90% (79 runs sampled)

Validation :: parse
✔ tctx
✔ TraceParent

Benchmark :: parse
  tctx                   x 3,056,239 ops/sec ±0.67% (95 runs sampled)
  TraceParent            x   138,542 ops/sec ±2.02% (85 runs sampled)

Validation :: child
✔ tctx
✔ TraceParent

Benchmark :: child
  tctx                   x 138,712 ops/sec ±2.50% (75 runs sampled)
  TraceParent            x  43,052 ops/sec ±1.82% (84 runs sampled)
```

## License

MIT © [Marais Rossouw](https://marais.io)
