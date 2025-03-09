# How to understand PCOS Network addresses

The PCOS Network address is 128 bits long and stylized as IPv6. It can be split into 4 parts by how it is generated.
aaaa:aaaa:bbbb:bbbb:cccc:cccc:dddd:dddd

 - The first part (aaaa:aaaa) is the IP address hashed with SHA-256 and truncated (the first 32 bits or 4 bytes).
 - The next part (bbbb:bbbb) is the System ID x coordinate (check your public key), it's converted from base64 using a method (see /os_system/network/b64dec.js) and then the raw data is hashed with SHA-256 and truncated.
 - The next part (cccc:cccc) is the System ID y coordinate, the generation is similar to the previous part.
 - The last part (dddd:dddd) is an user-customizable part. It's just a number you can specify in the PCOS Network configurator.

To test the hostname or user-customizable part change, run `renetworkd` in the terminal.