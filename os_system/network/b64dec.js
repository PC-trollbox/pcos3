let base64Charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
let hexCharset = "0123456789abcdef";
function findInputNumberString(output, chars) {
	let inputNum = 0n;
	for (let i = 0n; i < output.length; i++) {
		const charIndex = chars.indexOf(output[i]);
		if (charIndex === -1) throw new Error(`Invalid character '${output[i]}' in output string`);
		inputNum = inputNum * BigInt(chars.length) + BigInt(charIndex);
	}
	return inputNum;
}
function generateString(num, chars) {
	let base = BigInt(chars.length), result = '';
	while (num > 0n) result = chars[Number(num % base)] + result, num /= base;
	return result;
}

module.exports = function decode(b64) {
    let decodeResult = generateString(findInputNumberString(b64, base64Charset), hexCharset);
    return Buffer.from(Uint8Array.from(decodeResult.match(/.{1,2}/g).map(a => parseInt(a, 16)))).toString("hex");
}