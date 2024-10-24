# How to secure the system.

1. Log into the OS as administrator.
2. Open the text editor.
3. Type in the following:
```json
{"requireSignature":true,"requireAllowlist":true}
```
This is an `appHarden` configuration which requires all apps to have a signature and requires the enforcement of the POLP. For possible additional security, disable the ASCK feature (app self-contained key):
```json
{"requireSignature":true,"requireAllowlist":true,"disableASCK":true}
```

4. Save in `{systemMount}/etc/appHarden`. The system mount is usually "storage", in that case save to `storage/etc/appHarden`.
5. Restart the system.
6. Immediately start pressing Enter multiple times until the Preference Manager appears.
7. Make sure "Insecure REE fallback" is disabled. If it isn't, select the option.
8. Make sure "Password on boot" is required.
9. Make sure "Boot from network" is disallowed.
10. Create the first password. Select "Add password". You will create a superpassword needed to access the Preference Manager.
11. Create passwords for users. Select "Add password". You will create a regular password. It won't be able to access the Preference Manager, but it can be used to boot.
12. Select "Restart system".