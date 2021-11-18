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
  trcprnt                x 85,168 ops/sec ±7.90% (81 runs sampled)
  TraceParent            x 48,374 ops/sec ±4.58% (78 runs sampled)

Validation :: parse
✔ trcprnt
✔ TraceParent

Benchmark :: parse
  trcprnt                x 160,489 ops/sec ±2.22% (88 runs sampled)
  TraceParent            x 112,949 ops/sec ±4.17% (78 runs sampled)

Validation :: child
✔ trcprnt
✔ TraceParent

Benchmark :: child
  trcprnt                x 55,909 ops/sec ±7.07% (80 runs sampled)
  TraceParent            x 35,970 ops/sec ±3.12% (80 runs sampled)
```

## License

MIT © [Marais Rossouw](https://marais.io)
