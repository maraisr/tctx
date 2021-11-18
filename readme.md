<div align="center">
    <h1>trcprnt</h1>
	<p><code>npm add trcprnt</code> makes <a href="https://www.w3.org/TR/trace-context/#traceparent-header">traceparent</a>'s simple</p>
	<hr />
	<div>
		<a href="https://github.com/maraisr/trcprnt/actions/workflows/ci.yml">
			<img src="https://github.com/maraisr/trcprnt/actions/workflows/ci.yml/badge.svg"/>
		</a>
		<a href="https://npm-stat.com/charts.html?package=trcprnt">
			<img src="https://badgen.net/npm/dm/trcprnt?labelColor=black&color=black" alt="downloads"/>
		</a>
		<a href="https://packagephobia.com/result?p=trcprnt">
			<img src="https://badgen.net/packagephobia/install/trcprnt?labelColor=black&color=black" alt="size"/>
		</a>
		<a href="https://bundlephobia.com/result?p=trcprnt">
			<img src="https://badgen.net/bundlephobia/minzip/trcprnt?labelColor=black&color=black" alt="size"/>
		</a>
	</div>
</div>

## ⚡ Features

- **Lightweight** — _Browser_ runtime has a single dep, otherwise slim [see](https://npm.anvaka.com/#/view/2d/trcprnt).

- **Efficient** — Effective reuse of memory, and lazy.

- **Producer Friendly** — Are you a browser? `make()` and go home.

- **Quick** — Get an id super [performant](#-benchmark).

## ⚙️ Install

```sh
npm add trcprnt
```

## 🚀 Usage

```ts
// producer

import { make } from 'trcprnt';

fetch('/api', {
  headers: {
    traceparent: make(),
  },
});

// consumer

import { parse } from 'trcprnt';

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
✔ trcprnt
✔ TraceParent

Benchmark :: make
  trcprnt                x 184,080 ops/sec ±1.89% (84 runs sampled)
  TraceParent            x 50,235 ops/sec ±4.09% (79 runs sampled)

Validation :: parse
✔ trcprnt
✔ TraceParent

Benchmark :: parse
  trcprnt                x 3,935,779 ops/sec ±0.50% (92 runs sampled)
  TraceParent            x 117,942 ops/sec ±4.11% (78 runs sampled)

Validation :: child
✔ trcprnt
✔ TraceParent

Benchmark :: child
  trcprnt                x 101,445 ops/sec ±1.79% (68 runs sampled)
  TraceParent            x 38,751 ops/sec ±2.62% (76 runs sampled)
```

## License

MIT © [Marais Rossouw](https://marais.io)
