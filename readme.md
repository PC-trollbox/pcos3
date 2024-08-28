# PCOS 3 GitHub upload

Welcome to PCOS 3's GitHub repository! This is the official PCOS 3 repository.

This repository may be more up-to-date than the src_link_list.txt.

## Self-host

**Node.JS required**

1. Make sure `os.js` is a symlink to `os_system/index.js`.
2. Go to `os_system/network` in a command line, run `npm i`.
3. Run `node index`. It will be available on http://localhost:3945.
4. Optional: tunnel or proxy with HTTPS for non-localhost access.

## Build the OS

**Node.JS required as well**

1. If you haven't generated a key yet, go to `os_system` in a command line and run `node keypair.js`.
2. Go to `os_system/combine_into_index` in a command line, run `node combine`.
3. Run a self-host server (or a static server if you don't care about PCOS Network) to check out your changes.

## Officially recognized servers

These servers are officially recognized. If you would like to have your instance listed here, contact me.

**PCOS 3 official server** - https://pcos3.pcprojects.tk