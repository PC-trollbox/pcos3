# How to update the OS after a key rotation

**This how-to is outdated due to modularization**
1. Get the new server key fingerprint. Here is a way to do that:
    1. Log into the OS (you should do this on an updated system)
    2. Open "Terminal".
    3. Type in `su <username>`. Replace `<username>` with your actual username.
    4. Log into the terminal.
    5. Run `diffupdate --view-fingerprint`

    I will also try to update the fingerprint in this file. The current value is `--fingerprint=b28c94b2195c8ed259f0b415aaee3f39b0b2920a4537611499fa044956917a21`.
2. Log into the OS as admin.
3. Open "Terminal".
4. Type in `su <username>`. Replace `<username>` with your actual username.
5. Log into the terminal.
6. Run `diffupdate <trusted-source-fingerprint>`. Replace `<trusted-source-fingerprint>` with the fingerprint value (starts with `--fingerprint=`)