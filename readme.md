<div align="left">

<samp>

# trace context

</samp>

**W3C [Trace Context](https://w3c.github.io/trace-context/)'s made simple**

<a href="https://npm-stat.com/charts.html?package=tctx">
  <img src="https://badgen.net/npm/dm/tctx?labelColor=black&color=black&label=npm downloads" alt="js downloads"/>
</a>
<a href="https://licenses.dev/npm/tctx">
  <img src="https://licenses.dev/b/npm/tctx?style=dark" alt="licenses" />
</a>
<a href="https://bundlephobia.com/result?p=tctx">
  <img src="https://badgen.net/bundlephobia/minzip/tctx?labelColor=black&color=black" alt="size"/>
</a>

<br><br>

<sup>

This is free to use software, but if you do like it, consisder supporting me ❤️

[![sponsor me](https://badgen.net/badge/icon/sponsor?icon=github&label&color=gray)](https://github.com/sponsors/maraisr)
[![buy me a coffee](https://badgen.net/badge/icon/buymeacoffee?icon=buymeacoffee&label&color=gray)](https://www.buymeacoffee.com/marais)

</sup>

</div>

## ⚙️ Install

`npm add tctx`

## 🚀 Usage

```ts
// producer

import * as traceparent from 'tctx';
import * as tracestate from 'tctx/tracestate';

fetch('/api', {
  headers: {
    traceparent: traceparent.make(),
    tracestate: tracestate.make({ key: 'value' }),
  },
});

// consumer

import * as traceparent from 'tctx';
import * as tracestate from 'tctx/tracestate';

const parent_key = traceparent.parse(request.headers.traceparent);
const parent_state = tracestate.parse(request.headers.tracestate);
parent_state.set("vendor", "value");

fetch('/downstream', {
  headers: {
    traceparent: parent.child(),
    tracestate: parent_state,
  },
});
```

## 💨 Benchmark

> via the [`/bench`](/bench) directory with Node v21.7.1

```
#  make
✔  tctx          ~ 532,641 ops/sec ± 0.17%
✔  traceparent   ~ 119,325 ops/sec ± 0.16%
✔  trace-context ~ 231,614 ops/sec ± 0.34%

#  parse
✔  tctx          ~ 8,284,422 ops/sec ± 0.71%
✔  traceparent   ~   244,167 ops/sec ± 0.12%
✔  trace-context ~ 4,040,319 ops/sec ± 0.07%

#  child
✔  tctx          ~ 611,854 ops/sec ± 0.62%
✔  traceparent   ~ 264,412 ops/sec ± 0.15%
✔  trace-context ~ 498,430 ops/sec ± 0.37%
```

## License

MIT © [Marais Rossouw](https://marais.io)
