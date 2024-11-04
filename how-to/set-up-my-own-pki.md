# How to set up my own PKI
(Public Key Infrastructure)

**THIS COULD RUIN THE SECURITY OF THE SYSTEM!!** It could be useful for developers that want to develop their apps while working with appHarden or for admins that do not trust the original PKI.

1. Log into the OS as administrator.
2. Open Cryptographic Tools.
3. Select Key generation.
4. Choose algorithm "ECDSA".    
5. Choose key usages "sign" and "verify".
6. Generate the key.
7. Save the private and public keys to somewhere. These will be your KSK (Key Signing Key) keys.
8. Generate another key.
9. Save the private and public keys to somewhere. These will be your ASK (Application Signing Key) keys.
10. Exit Key generation and go to Signing.
11. Open the ASK public key as the plaintext.
12. Wrap your key in this format:
```json
{"usages":["appTrust"],"key":_THE_ACTUAL_PUBLIC_KEY_HERE_}
```
For example, if your key is `{"crv":"P-256","x":4,"y":2}`, then the new format is `{"usages":["appTrust"],"key":{"crv":"P-256","x":4,"y":2}}`

13. Load the KSK private key as the key.
14. Choose algorithm "ECDSA".
15. Sign.
16. Save the signature. This will be your ASK signature.
17. Open the automaticSigner key as the plaintext, `{systemMount}/etc/keys/automaticSigner`. The system mount is usually "storage", in that case load `storage/etc/keys/automaticSigner`.
18. Leave only the object inside keyInfo. For example, if your automatic signer is `{"signature":"123","keyInfo":{"key":{"x":"456","y":"789"},"usages":["appTrust"]}}`, make it just `{"key":{"x":"456","y":"789"},"usages":["appTrust"]}`
19. Sign.
20. Save the signature. This will be your compatibility signature. (If you have any other keys, do the same thing with them)
21. Close Cryptographic Tools.
22. Open text editor.
23. Load the KSK public key, copy it to clipboard.
24. Load `{systemMount}/boot/06-ksk.js`.
25. Replace the object past `let ksk = ` with the ASK public key.
For example, if there was `let ksk = {"crv":"P-256","x":1,"y":3};` and your KSK is `{"crv":"P-256","x":3,"y":7}`, the new line should be `let ksk = {"crv":"P-256","x":3,"y":7};`
26. Save as `{systemMount}/boot/06-ksk.js`.
27. Open another text editor.
28. Load the ASK in one text editor, and its signature in another.
29. In the text editor with the ASK, wrap the ASK in this format:
```json
{"signature":_THE_SIGNATURE_OF_ASK_,"keyInfo":{"usages":["appTrust"],"key":_THE_ACTUAL_PUBLIC_KEY_HERE_}}
```
30. Save as `{systemMount}/etc/keys/{whatever_your_ask_name_will_be}`
31. Load the automaticSigner key in one text editor, and its new signature in another.
32. Replace the signature field with the new signature. For example, you have the original key `{"signature":"123","keyInfo":{"key":{"x":"456","y":"789"},"usages":["appTrust"]}}` and a new signature of `515`, the new key would be `{"signature":"515","keyInfo":{"key":{"x":"456","y":"789"},"usages":["appTrust"]}}`.
33. Save the automaticSigner key. (If you have any other keys, do the same thing with them)
34. Restart the system.