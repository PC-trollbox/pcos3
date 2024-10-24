# How to reset the root password
(knowing the superpassword)

**Authorized users only**, do not try to get unauthorized access to systems.

1. Start or restart the system.
2. Immediately start pressing Enter multiple times until the Preference Manager appears. (If asked, enter the superpassword.)
3. Select "Boot from custom network".
4. Type in `/os_system/prt.js`. This tool temporarily disables passwords and other security factors. *This won't work if you use managed users and not local users.*
5. Select the PCOS 3 boot partition. Usually, it is `boot`.
6. Wait for the logon screen to appear.
7. Press Enter again, in the background.
8. Log into the OS as administrator.
9. Change your password.
10. Restart the system.