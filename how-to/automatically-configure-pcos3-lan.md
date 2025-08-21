# How to automatically configure PCOS 3 over the LAN

1. Start an HTTP/HTTPS server that is reachable from port 80/443.
2. On `/runtime`, make it return a JSON that may have these parameters:
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
3. On `/installer`, make it return a JSON that may have these parameters:
   - `startInstall`: Automatically start the installation.
   - `acceptEULA`: Accept the license automatically.
   - `partitioning`: Set partitioning:
     - `data`: Set the data partition.
     - `boot`: Set the boot partition.
     - `format`: Format the disk unconditionally.
     - `autoInitNewInstalls`: Automatically initiate the disk for new installations.
   - `autoRestart`: Automatically restart the system after installation. Set to `"kexec"` to use faster reboots.
   - `defaultLocale`: Set the locale automatically to the following value.
   - `extraModules`: Extra modules to download and install.
   - `secondstage`: Setup-like control post-modularization.
    - `noReconfiguring`: Skip reconfiguration of existing installations.
    - `createAccount`: Set user account details:
      - `password`: Set the user password.
      - `darkMode`: Set dark mode preference.
      - `create`: Create the new user automatically.
      - `username`: Set the username.
      - `lockUsername`: Prevent the user from changing the username.
      - `onlyOnNewInstall`: Only create a new user on a new installation.
    - `appHarden`: The appHarden file (see How to secure the system, step 3)
    - `network`: The network.json file
      - `url`: Set the WebSocket proxy URL.
      - `ucBits`: Set the user-customizable part of the network address.
      - `hostname`: Set the automatic hostname.
      - `updates`: Set the update server. This will be the place missing modules are loaded from!
    - `reconnectToNetwork`: Reconnect to the Network or not. Use when the default host is not the one configured.
4. Make your HTTP/HTTPS server reachable on `pcos-autoconf.internal`.