declare module '#hex' {
	export const toHEX: (buf: Uint8Array) => string;
	export const asHEX: (value: string) => Uint8Array;
}

declare module '#crypto' {
	export const fill_random: (
		buf: Uint8Array,
		start: number,
		size: number,
	) => Uint8Array;
}
