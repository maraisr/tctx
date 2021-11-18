import { randomFillSync } from 'node:crypto';

export const fill_random = /*#__PURE__*/ (buf, offset, size) =>
	randomFillSync(buf, offset, size);
