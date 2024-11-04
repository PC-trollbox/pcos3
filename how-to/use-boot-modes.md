# How to use boot modes

1. Start or restart the system.
2. Immediately start pressing Enter multiple times until the Preference Manager appears. (If asked, enter the superpassword.)
3. Select "Set boot mode".
4. Type in the boot mode you would like to use:
 - `normal` - Boot like normal.
 - `safe` - Safe mode. Should disable some automatically starting apps.
 - `disable-harden` - Disable security hardening. May disable the enforcement of the principle of least privilege and signature verification.
 - `readonly` - Disable saving data.
 - `logboot` - Log boot modules.
5. Select the boot medium you want to boot: booting from hard drive, from a network resource, from a custom network resource or exit to follow the regular boot flow.