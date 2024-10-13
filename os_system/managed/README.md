# Experimental managed users

Client setup:
1. Copy `12-managed-tokens.js` to `12-tokens.js` in the OS instance
2. Copy `12-managed-users.js` to `12-users.js` in the OS instance
3. Copy `13-managed-authui.js` to `13-authui.js` in the OS instance
4. Copy `13-managed-consentui.js` to `13-consentui.js` in the OS instance
5. Reboot

Server setup:
1. Copy `managedDB_blank.json` to `managedDB.json`
2. Install npm packages (`npm i`)
3. Run the server: `managedUsersServer.js`

Some OS operations may slow down