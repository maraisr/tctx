import { build, emptyDir } from '@deno/dnt';

await emptyDir('./npm');

await build({
	entryPoints: [
		'./mod.ts',
		{
			name: './traceparent',
			path: './traceparent.ts'
		},
		{
			name: './tracestate',
			path: './tracestate.ts'
		},
	],
	outDir: './npm',
	shims: {
		deno: 'dev',
	},

	declaration: 'separate',
	declarationMap: false,
	scriptModule: 'cjs',
	typeCheck: 'both',
	test: false,

	importMap: 'deno.json',

	package: {
		name: 'tctx',
		version: Deno.args[0],
		description: 'W3C Trace Contexts made simple',
		repository: 'maraisr/tctx',
		license: 'MIT',
		author: {
			name: 'Marais Rososuw',
			email: 'me@marais.dev',
			url: 'https://marais.io',
		},
		keywords: [
			'tracecontext',
			'traceparent',
			'distributed',
			'tracing',
			'w3c',
		],
	},

	compilerOptions: {
		target: 'ES2022',
		lib: ['ES2022', 'WebWorker'],
	},

	filterDiagnostic(diag) {
		let txt = diag.messageText.toString();
		return !txt.includes(
			// ignore type error for missing Deno built-in information
			`Type 'ReadableStream<string>' must have a '[Symbol.asyncIterator]()' method that returns an async iterator`,
		);
	},

	async postBuild() {
		await Deno.copyFile('license', 'npm/license');
		await Deno.copyFile('readme.md', 'npm/readme.md');
	},
});
