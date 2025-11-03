module.exports = {
	// Protocols
	CONTROL: Buffer.from("00", "hex"),
	PING: Buffer.from("01", "hex"),
	CONNLESS: Buffer.from("02", "hex"),

	// Control protocol constants
	CONNECTED: Buffer.from("00", "hex"),
	AUTH_FAILED: Buffer.from("01", "hex"),
	SIGN_REQUEST: Buffer.from("02", "hex"),
	PUBKEY_SEND: Buffer.from("03", "hex"),
	SIGNATURE_SEND: Buffer.from("04", "hex"),
	INVALID_SOURCE: Buffer.from("05", "hex"),
	ADDRESS_CONFLICT: Buffer.from("06", "hex"),
	ADDRESS_UNREACHABLE: Buffer.from("07", "hex"),
	CANNOT_SPOOF: Buffer.from("00", "hex"),
	CAN_SPOOF: Buffer.from("ff", "hex"),

	// Auth methods
	NO_AUTH: Buffer.from("00", "hex"),
	PUBKEY_AUTH: Buffer.from("01", "hex"),

	// Ping constants
	IS_PING: Buffer.from("00", "hex"),
	IS_PONG: Buffer.from("ff", "hex")
}