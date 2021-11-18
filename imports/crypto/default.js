export const fill_random = /*#__PURE__*/ (buf, offset, size) =>
	crypto.getRandomValues(buf.subarray(offset, offset + size));
