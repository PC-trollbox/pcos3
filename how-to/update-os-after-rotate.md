# How to update the OS after a key rotation

**This how-to is outdated due to modularization.** The fingerprint below is valid for every key, it is the sha256 of `[object Object]`.
1. Log into the OS as admin.
2. Open "Terminal".
3. Type in `su <username>`. Replace `<username>` with your actual username.
4. Log into the terminal.
5. Run `diffupdate --fingerprint=b28c94b2195c8ed259f0b415aaee3f39b0b2920a4537611499fa044956917a21`