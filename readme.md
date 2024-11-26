<div align="left">

<samp>

# trace context [![licenses](https://licenses.dev/b/npm/tctx?style=dark)](https://licenses.dev/npm/tctx) [![w3c spec compliant](https://badgen.net/static/w3c%20spec%20compliant/✓?color=black)](https://w3c.github.io/trace-context/)

</samp>

**W3C [Trace Context](https://w3c.github.io/trace-context/)'s made simple**

<br>
<br>

<sup>

This is free to use software, but if you do like it, consider supporting me ❤️

[![sponsor me](https://badgen.net/badge/icon/sponsor?icon=github&label&color=gray)](https://github.com/sponsors/maraisr)
[![buy me a coffee](https://badgen.net/badge/icon/buymeacoffee?icon=buymeacoffee&label&color=gray)](https://www.buymeacoffee.com/marais)

</sup>

</div>

## ⚙️ Install

- **npm** — available as [`tctx`](https://www.npmjs.com/package/tctx)
- **JSR** — available as [`@mr/tracecontext`](https://jsr.io/@mr/tracecontext)

## 🚀 Usage

```ts
// producer

import * as traceparent from 'tctx/traceparent';
import * as tracestate from 'tctx/tracestate';

fetch('/api', {
	headers: {
		traceparent: traceparent.make(),
		tracestate: tracestate.make({ key: 'value' }),
	},
});

// consumer

import * as traceparent from 'tctx/traceparent';
import * as tracestate from 'tctx/tracestate';

const parent = traceparent.parse(request.headers.traceparent);
const state = tracestate.parse(request.headers.tracestate);
state.set('vendor', 'value');

fetch('/downstream', {
	headers: {
		traceparent: parent.child(),
		tracestate: state,
	},
});
```

## 💨 Benchmark

```
benchmark          time (avg)        iter/s             (min … max)       p75       p99      p995
------------------------------------------------------------------- -----------------------------

group make
tctx              488.04 ns/iter   2,049,021.8  (477.8 ns … 540.92 ns) 490.45 ns 527.86 ns 540.92 ns
traceparent         6.08 µs/iter     164,346.2     (5.88 µs … 6.46 µs) 6.17 µs 6.46 µs 6.46 µs
trace-context       1.35 µs/iter     743,381.3     (1.33 µs … 1.46 µs) 1.35 µs 1.46 µs 1.46 µs

summary
  tctx
   2.76x faster than trace-context
   12.47x faster than traceparent

group parse
tctx              265.57 ns/iter   3,765,435.2 (260.82 ns … 285.88 ns) 269.13 ns 273.34 ns 285.88 ns
traceparent         5.09 µs/iter     196,302.6     (4.88 µs … 5.36 µs) 5.18 µs 5.36 µs 5.36 µs
trace-context     240.18 ns/iter   4,163,540.7 (237.21 ns … 300.23 ns) 238.89 ns 276.17 ns 297.94 ns

summary
  trace-context
   1.11x faster than tctx
   21.21x faster than traceparent

group child
tctx              724.74 ns/iter   1,379,804.8 (709.77 ns … 752.56 ns) 733.47 ns 752.56 ns 752.56 ns
traceparent         8.18 µs/iter     122,254.2     (7.99 µs … 8.77 µs) 8.24 µs 8.77 µs 8.77 µs
trace-context       1.99 µs/iter     502,728.4     (1.96 µs … 2.05 µs) 1.99 µs 2.05 µs 2.05 µs

summary
  tctx
   2.74x faster than trace-context
   11.29x faster than traceparent
```

## License

MIT © [Marais Rossouw](https://marais.io)
