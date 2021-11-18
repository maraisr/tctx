declare module '#hex' {
	export const toHEX: (buf: Uint8Array) => string;
	export const asHEX: (value: string) => Uint8Array;
}
