export const toHEX = (buf) => Buffer.from(buf).toString('hex');
export const asHEX = (input) => new Uint8Array(Buffer.from(input, 'hex'));