# PCOS 3 GitHub upload
Welcome to PCOS 3! This is my web OS. It has sandboxing and modularity. It runs on its own "Runtime", and supports offline access.

## PCOS 3 features by module
Not all modules are shown in the list below, to avoid redundancy.
 - arcadeBreakout: Playing the Breakout game (copied from MDN), which isn't part of PCOS 3 by default
 - blogBrowser: Browsing the internal network of PCOS 3: the PCOS Network
 - calculator: Calculations with fraction support
 - core: The basics: authentication, file exploring, file picking, the start menu and the text editor
 - crypto-tools: Perform basic cryptographic tasks
 - diff: Find the difference between files (not human-readable)
 - installer: Fast installation and set up
 - keys: Ensures cryptographic integrity of PCOS 3
 - locale-ru: PCOS speaks Russian (PCOS говорит по-русски)
 - multimedia: Playing audio and video links, viewing picture links
 - sysadmin: Managing connections to the PCOS Network, users and system tasks

## Self-host
**Node.JS required**
1. Make sure `os.js` is a symlink to `os_system/index.js`.
2. Make at least one OS build to ensure *your* keys are running.
3. Go to `os_system/network` in a command line, run `npm i`.
4. Run `node index`. Your new PCOS Network and web OS server will be available on http://localhost:3945.
5. Optional: tunnel or proxy with HTTPS for non-localhost access.

## Build the OS
**Node.JS required as well**
1. If you haven't generated a key yet, go to `os_system` in a command line and run `node keypair.js`.
2. Go to `os_system/module_combine` in a command line, run `node combine`. To use a branch, use the `-b` parameter, for example `-bmy-cool-feature` (the build will have the branch as a suffix, like `1234my-cool-feature`). To prevent incrementation of the build number, use the `-i` parameter.
3. Run a self-host server to test your changes.

## Officially recognized servers
The following servers are officially recognized. If you would like to have your instance listed here, contact me.
**PCOS 3 official server** - https://pcos3.pcprojects.tk