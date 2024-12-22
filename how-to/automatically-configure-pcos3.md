# How to automatically configure PCOS 3

1. Clone the PCOS 3 repository.
2. Go to `combine_into_init/04-boot.js` for Runtime configuration.
3. Set `automatic_configuration`:
   - `guard_passwords`: PBKDF2 encrypted passwords for the Runtime. The first password is required to enter the Preference Manager. Each array item is in the following format: `{ "hash": "pbkdf2-hash", "salt": "pbkdf2-salt" }`. (see How to secure the system, steps 10-11)
   - `disallow_bad_ree`: Don't allow to override the Restricted Execution Environment test. (see How to secure the system, step 7)
   - `ignore_preference_key`: Don't allow to access the Preference Manager.
   - `require_password_for_boot`: Require any of the `guard_passwords` to boot. (see How to secure the system, step 8)
   - `never_boot_from_network`: Don't boot over the HTTP(S) default path automatically. (see How to secure the system, step 9)
   - `registerOffline`: Allow the system to boot offline. (see How to install the system offline)
   - `system_id`: Specify an existing System ID or create a new one: (see How to create the System ID)
     - value `register-new`: Create a new System ID.
     - value of a jwk keypair object: Specify an existing System ID
     - no value: Don't create a System ID automatically.
4. Run `./combine`.
5. Go to `os_system/combine_into_index/apps/installer.js` for installer configuration.
6. Uncomment the example of `automatic_configuration`.
7. Set `automatic_configuration`:
   - `startInstall`: Automatically start the installation.
   - `acceptEULA`: Accept the license automatically.
   - `partitioning`: Set partitioning:
     - `data`: Set the data partition.
     - `boot`: Set the boot partition.
     - `format`: Format the disk unconditionally.
     - `autoInitNewInstalls`: Automatically initiate the disk for new installations.
   - `autoRestart`: Automatically restart the system after installation.
8. Go to `os_system/combine_into_index/apps/secondstage.js` for setup configuration.
9. Uncomment the partial example of `automatic_configuration`.
10. Set `automatic_configuration`:
   - `startSetup`: Automatically start the setup process.
   - `createAccount`: Set user account details:
     - `password`: Set the user password.
     - `darkMode`: Set dark mode preference.
     - `create`: Create the new user automatically.
     - `username`: Set the username.
     - `onlyOnNewInstall`: Only create a new user on a new installation.
   - `updateOSLink`: Place an "Update OS" link on the desktop.
   - `appHarden`: The appHarden file (see How to secure the system, step 3)
   - `network`: The network.json file
     - `url`: Set the WebSocket proxy URL.
     - `ucBits`: Set the user-customizable part of the network address.
   - `autoClose`: Automatically close the installer to log in.
   - `restartOnClose`: Restart after closing the installer (with `autoClose`)
10. Run `os_system/keypair.js` to generate the OS PKI.
11. Run `os_system/combine_into_index/combine.js -b<YOUR_BRANCH_NAME_HERE>`.
12. Perform self-hosting steps to see the changes. (see readme.md)