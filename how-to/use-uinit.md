# How to use uinit

uinit is a mini version of the Runtime. It doesn't generate a System ID. The size of the Runtime is decreased 3.77 times, but PCOS still works.
It has a little bit weaker security, as it doesn't support requesting passwords on boot. But the Preference Manager is made unavailable, and the REE stays exactly the same.

1. Log into the OS.
2. Open "Terminal".
3. Reauthenticate as an administrator: `su root`
4. Download uinit and save it somewhere: `basiccurl /uinit.js ram/run/uinit.js`
5. Update to it as firmware: `updatefw ram/run/uinit.js`

You can revert this by running ordinary `updatefw` (no arguments) or by clicking "Update firmware" in the Sysadmin Tools app.