<div align="left">

<samp>

# trace context [![licenses](https://licenses.dev/b/npm/tctx?style=dark)](https://licenses.dev/npm/tctx)

</samp>

**W3C [Trace Context](https://w3c.github.io/trace-context/)'s made simple**

<sup>

This is free to use software, but if you do like it, consider supporting me ❤️

[![sponsor me](https://badgen.net/badge/icon/sponsor?icon=github&label&color=gray)](https://github.com/sponsors/maraisr)
[![buy me a coffee](https://badgen.net/badge/icon/buymeacoffee?icon=buymeacoffee&label&color=gray)](https://www.buymeacoffee.com/marais)

</sup>

</div>

## ⚙️ Install

> Avaliable on [jsr](https://jsr.io/@mr/tracecontext), [NPM](https://npmjs.com/package/tctx) and
> [deno.land](https://deno.land/x/tracecontext)

`npm add tctx`

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

const parent_key = traceparent.parse(request.headers.traceparent);
const parent_state = tracestate.parse(request.headers.tracestate);
parent_state.set('vendor', 'value');

fetch('/downstream', {
	headers: {
		traceparent: parent.child(),
		tracestate: parent_state,
	},
});
```

## 💨 Benchmark

> via the [`/bench`](/bench) directory with deno 1.41.3

```
#  make
✔  tctx          ~ 1,666,269 ops/sec ± 0.04%
✔  traceparent   ~   156,468 ops/sec ± 0.07%
✔  trace-context ~   691,817 ops/sec ± 0.02%

#  parse
✔  tctx          ~ 3,429,690 ops/sec ± 0.05%
✔  traceparent   ~   186,418 ops/sec ± 0.07%
✔  trace-context ~ 3,327,424 ops/sec ± 0.10%

#  child
✔  tctx          ~ 2,627,467 ops/sec ± 0.04%
✔  traceparent   ~   256,958 ops/sec ± 0.10%
✔  trace-context ~ 1,252,370 ops/sec ± 0.04%
```

## License

MIT © [Marais Rossouw](https://marais.io)
