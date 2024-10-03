function loadFs() {
    // @pcos-app-mode native
    let fs = {
        read: async function(file, sessionToken) {
            let mount = file.split("/")[0];
            if (!this.mounts.hasOwnProperty(mount)) throw new Error("NO_SUCH_DEVICE");
            return await this.mounts[mount].read(file.split("/").slice(1).join("/"), sessionToken);
        },
        write: async function(file, data, sessionToken) {
            let filePath = file.split("/").slice(1);
            if (filePath.includes("")) throw new Error("PATH_INCLUDES_EMPTY");
            let mount = file.split("/")[0];
            if (!this.mounts.hasOwnProperty(mount)) throw new Error("NO_SUCH_DEVICE");
            if (modules.core.bootMode == "readonly") throw new Error("READ_ONLY_BMGR");
            if (this.mounts[mount].read_only) throw new Error("READ_ONLY_DEV");
            return await this.mounts[mount].write(file.split("/").slice(1).join("/"), data, sessionToken);
        },
        rm: async function(file, sessionToken) {
            let mount = file.split("/")[0];
            if (!this.mounts.hasOwnProperty(mount)) throw new Error("NO_SUCH_DEVICE");
            if (modules.core.bootMode == "readonly") throw new Error("READ_ONLY_BMGR");
            if (this.mounts[mount].read_only) throw new Error("READ_ONLY_DEV");
            return await this.mounts[mount].rm(file.split("/").slice(1).join("/"), sessionToken);
        },
        mkdir: async function(folder, sessionToken) {
            let filePath = folder.split("/").slice(1);
            if (filePath.includes("")) throw new Error("PATH_INCLUDES_EMPTY");
            let mount = folder.split("/")[0];
            if (!this.mounts.hasOwnProperty(mount)) throw new Error("NO_SUCH_DEVICE");
            if (modules.core.bootMode == "readonly") throw new Error("READ_ONLY_BMGR");
            if (this.mounts[mount].read_only) throw new Error("READ_ONLY_DEV");
            if (!this.mounts[mount].directory_supported) throw new Error("NO_DIRECTORY_SUPPORT");
            return await this.mounts[mount].mkdir(folder.split("/").slice(1).join("/"), sessionToken);
        },
        permissions: async function(folder, sessionToken) {
            let mount = folder.split("/")[0];
            if (!this.mounts.hasOwnProperty(mount)) throw new Error("NO_SUCH_DEVICE");
            if (!this.mounts[mount].permissions_supported) return { owner: "nobody", group: "nogroup", world: "rwx" };
            return await this.mounts[mount].permissions(folder.split("/").slice(1).join("/"), sessionToken);
        },
        lsmounts: function() {
            return Object.keys(this.mounts);
        },
        unmount: async function(mount, sessionToken, force) {
            if (!this.mounts.hasOwnProperty(mount)) throw new Error("NO_SUCH_DEVICE");
            try {
                if (!this.mounts[mount].read_only && !force) await this.sync(mount, sessionToken);
            } catch {}
            try {
                if (!force) await this.mounts[mount].unmount(sessionToken);
            } catch {}
            delete this.mounts[mount];
        },
        chown: async function(file, owner, sessionToken) {
            let filePath = file.split("/").slice(1);
            if (filePath.includes("")) throw new Error("PATH_INCLUDES_EMPTY");
            let mount = file.split("/")[0];
            if (!this.mounts.hasOwnProperty(mount)) throw new Error("NO_SUCH_DEVICE");
            if (modules.core.bootMode == "readonly") throw new Error("READ_ONLY_BMGR");
            if (this.mounts[mount].read_only) throw new Error("READ_ONLY_DEV");
            if (!this.mounts[mount].permissions_supported) throw new Error("NO_PERMIS_SUPPORT");
            return await this.mounts[mount].chown(file.split("/").slice(1).join("/"), owner, sessionToken);
        },
        chgrp: async function(file, group, sessionToken) {
            let filePath = file.split("/").slice(1);
            if (filePath.includes("")) throw new Error("PATH_INCLUDES_EMPTY");
            let mount = file.split("/")[0];
            if (!this.mounts.hasOwnProperty(mount)) throw new Error("NO_SUCH_DEVICE");
            if (modules.core.bootMode == "readonly") throw new Error("READ_ONLY_BMGR");
            if (this.mounts[mount].read_only) throw new Error("READ_ONLY_DEV");
            if (!this.mounts[mount].permissions_supported) throw new Error("NO_PERMIS_SUPPORT");
            return await this.mounts[mount].chgrp(file.split("/").slice(1).join("/"), group, sessionToken);
        },
        chmod: async function(file, permissions, sessionToken) {
            let filePath = file.split("/").slice(1);
            if (filePath.includes("")) throw new Error("PATH_INCLUDES_EMPTY");
            let mount = file.split("/")[0];
            if (!this.mounts.hasOwnProperty(mount)) throw new Error("NO_SUCH_DEVICE");
            if (modules.core.bootMode == "readonly") throw new Error("READ_ONLY_BMGR");
            if (this.mounts[mount].read_only) throw new Error("READ_ONLY_DEV");
            if (!this.mounts[mount].permissions_supported) throw new Error("NO_PERMIS_SUPPORT");
            return await this.mounts[mount].chmod(file.split("/").slice(1).join("/"), permissions, sessionToken);
        },
        ls: async function(folder, sessionToken) {
            let mount = folder.split("/")[0];
            if (!this.mounts.hasOwnProperty(mount)) throw new Error("NO_SUCH_DEVICE");
            return await this.mounts[mount].ls(folder.split("/").slice(1).join("/"), sessionToken);
        },
        isDirectory: async function(path, sessionToken) {
            let mount = path.split("/")[0];
            if (!this.mounts.hasOwnProperty(mount)) throw new Error("NO_SUCH_DEVICE");
            if (!this.mounts[mount].directory_supported) throw new Error("NO_DIRECTORY_SUPPORT");
            if (!path.split("/").slice(1).join("/")) return true;
            return await this.mounts[mount].isDirectory(path.split("/").slice(1).join("/"), sessionToken);
        },
        mountInfo: async function(mount) {
            return {
                read_only: this.mounts[mount].read_only || false,
                permissions_supported: this.mounts[mount].permissions_supported || false,
                directory_supported: this.mounts[mount].directory_supported || false,
                filesystem: this.mounts[mount].filesystem || "unknown"
            }
        },
        sync: async function(mount, sessionToken) {
            if (!this.mounts.hasOwnProperty(mount)) throw new Error("NO_SUCH_DEVICE");
            try {
                if (!this.mounts[mount].read_only || modules.core.bootMode == "readonly") return await this.mounts[mount].sync(sessionToken);
            } catch {}
        },
        mounts: {}
    }
    
    async function PCFSiDBMount(options) {
        let partition;
        try {
            partition = modules.core.disk.partition(options.partition);
            partition = partition.getData();
        } catch (e) {
            throw new Error("PARTITION_FAILED: " + e.toString() + "\n---begin stack---\n" + e.stack + "\n---end stack---");
        }
        if (!Object.keys(partition).includes("files") || !Object.keys(partition).includes("permissions") || !Object.keys(partition).includes("id")) throw new Error("PARTITION_NOT_PCFS");
        let partitionId = partition.id;
        partition = null;
        return {
            read: async function(key) {
                let pathParts = key.split("/");
                if (pathParts[0] == "") pathParts = pathParts.slice(1);
                let files = this.backend.files;
                for (let part of pathParts) {
                    files = files[part];
                    if (!files) throw new Error("NO_SUCH_FILE");
                }
                if (typeof files === "object") throw new Error("IS_A_DIR");
                return String(await modules.core.idb.readPart(partitionId + "-" + files));
            },
            write: async function(key, value) {
                key = String(key);
                value = String(value);
                let existenceChecks = key.split("/").slice(0, -1);
                if (existenceChecks[0] == "") existenceChecks = existenceChecks.slice(1);
                if (existenceChecks[existenceChecks.length - 1] == "") existenceChecks = existenceChecks.slice(0, -1);
                let basename = key.split("/").slice(-1)[0];
                let files = this.backend.files;
                for (let part of existenceChecks) {
                    files = files[part];
                    if (!files) throw new Error("NO_SUCH_DIR");
                }
                if (typeof files[basename] === "object") throw new Error("IS_A_DIR");
                let id = files[basename] || crypto.getRandomValues(new Uint8Array(64)).reduce((a, b) => a + b.toString(16).padStart(2, "0"), "");
                await modules.core.idb.writePart(partitionId + "-" + id, value);
                if (!files.hasOwnProperty(basename)) {
                    let HACKID = Math.floor(Math.random() * 1000000);
                    globalThis["HACK" + HACKID] = this.backend;
                    let HACK = "";
                    for (let a of key.split("/")) HACK = HACK + "[" + JSON.stringify(a) + "]";
                    eval("globalThis[" + JSON.stringify("HACK" + HACKID) + "].files" + HACK + " = " + JSON.stringify(id) + ";");
                    this.backend = globalThis["HACK" + HACKID];
                    delete globalThis["HACK" + HACKID];
                }
            },
            rm: async function(key) {
                key = String(key);
                let pathParts = key.split("/");
                if (pathParts[0] == "") pathParts = pathParts.slice(1);
                if (pathParts[pathParts.length - 1] == "") pathParts = pathParts.slice(0, -1);
                let files = this.backend.files;
                for (let part of pathParts) {
                    files = files[part];
                    if (!files) throw new Error("NO_SUCH_FILE_DIR");
                }
                if (typeof files === "object" && Object.keys(files).length > 0) throw new Error("NON_EMPTY_DIR");
                if (typeof files === "string") await modules.core.idb.removePart(partitionId + "-" + files);
                let HACKID = Math.floor(Math.random() * 1000000);
                globalThis["HACK" + HACKID] = this.backend;
                let HACK = "";
                for (let a of key.split("/")) HACK = HACK + "[" + JSON.stringify(a) + "]";
                eval("delete globalThis[" + JSON.stringify("HACK" + HACKID) + "].files" + HACK + ";");
                eval("delete globalThis[" + JSON.stringify("HACK" + HACKID) + "].permissions[" + JSON.stringify(key) + "];");
                this.backend = globalThis["HACK" + HACKID];
                delete globalThis["HACK" + HACKID];
            },
            ls: async function(directory) {
                directory = String(directory);
                let pathParts = directory.split("/");
                if (pathParts[0] == "") pathParts = pathParts.slice(1);
                if (pathParts[pathParts.length - 1] == "") pathParts = pathParts.slice(0, -1);
                let files = this.backend.files;
                for (let part of pathParts) {
                    files = files[part];
                    if (!files) throw new Error("NO_SUCH_DIR");
                }
                if (typeof files !== "object") throw new Error("IS_A_FILE");
                return Object.keys(files);
            },
            mkdir: async function(directory) {
                directory = String(directory);
                let existenceChecks = directory.split("/").slice(0, -1);
                if (existenceChecks[0] == "") existenceChecks = existenceChecks.slice(1);
                if (existenceChecks[existenceChecks.length - 1] == "") existenceChecks = existenceChecks.slice(0, -1);
                let files = this.backend.files;
                for (let part of existenceChecks) {
                    files = files[part];
                    if (!files) throw new Error("NO_SUCH_DIR");
                }
                if (Object.keys(files).includes(directory.split("/").slice(-1)[0])) throw new Error("DIR_EXISTS");
                let HACKID = Math.floor(Math.random() * 1000000);
                globalThis["HACK" + HACKID] = this.backend;
                let HACK = "";
                for (let a of directory.split("/")) HACK = HACK + "[" + JSON.stringify(a) + "]";
                eval("globalThis[" + JSON.stringify("HACK" + HACKID) + "].files" + HACK + " = {};");
                this.backend = globalThis["HACK" + HACKID];
                delete globalThis["HACK" + HACKID];
            },
            permissions: async function(file) {
                file = String(file);
                let properFile = file.split("/")
                if (properFile[0] == "") properFile = properFile.slice(1);
                if (properFile[properFile.length - 1] == "") properFile = properFile.slice(0, -1);
                properFile = properFile.join("/");
                return this.backend.permissions[properFile] || {
                    owner: "root",
                    group: "root",
                    world: "",
                };
            },
            chown: async function(file, owner) {
                file = String(file);
                owner = String(owner);
                let properFile = file.split("/")
                if (properFile[0] == "") properFile = properFile.slice(1);
                if (properFile[properFile.length - 1] == "") properFile = properFile.slice(0, -1);
                properFile = properFile.join("/");
                let backend = this.backend;
                let filePermissions = backend.permissions[properFile] || {
                    owner: "root",
                    group: "root",
                    world: "",
                };
                filePermissions.owner = owner;
                backend.permissions[properFile] = filePermissions;
                this.backend = backend;
            },
            chgrp: async function(file, group) {
                file = String(file);
                group = String(group);
                let properFile = file.split("/")
                if (properFile[0] == "") properFile = properFile.slice(1);
                if (properFile[properFile.length - 1] == "") properFile = properFile.slice(0, -1);
                properFile = properFile.join("/");
                let backend = this.backend;
                let filePermissions = backend.permissions[properFile] || {
                    owner: "root",
                    group: "root",
                    world: "",
                };
                filePermissions.group = group;
                backend.permissions[properFile] = filePermissions;
                this.backend = backend;
            },
            chmod: async function(file, permissions) {
                file = String(file);
                permissions = String(permissions);
                let properFile = file.split("/")
                if (properFile[0] == "") properFile = properFile.slice(1);
                if (properFile[properFile.length - 1] == "") properFile = properFile.slice(0, -1);
                properFile = properFile.join("/");
                let backend = this.backend;
                let filePermissions = backend.permissions[properFile] || {
                    owner: "root",
                    group: "root",
                    world: "",
                };
                filePermissions.world = permissions;
                backend.permissions[properFile] = filePermissions;
                this.backend = backend;
            },
            sync: async function() {
                await modules.core.disk.sync();
            },
            isDirectory: function(key) {
                key = String(key);
                let pathParts = key.split("/").slice(0, -1);
                if (pathParts[0] == "") pathParts = pathParts.slice(1);
                if (pathParts[pathParts.length - 1] == "") pathParts = pathParts.slice(0, -1);
                let basename = key.split("/").slice(-1)[0];
                let files = this.backend.files;
                for (let part of pathParts) {
                    files = files[part];
                    if (!files) throw new Error("NO_SUCH_DIR");
                }
                if (!files.hasOwnProperty(basename)) throw new Error("NO_SUCH_FILE_DIR");
                if (typeof files[basename] === "object") return true;
                return false;
            },
            unmount: () => true,
            directory_supported: true,
            read_only: !!options.read_only,
            filesystem: "PCFS",
            permissions_supported: true,
            partition: null,
            get backend() {
                if (!this.partition) this.partition = modules.core.disk.partition(options.partition);
                return this.partition.getData();
            },
            set backend(data) {
                if (!this.partition) this.partition = modules.core.disk.partition(options.partition);
                this.partition.setData(data);
            }
        };
    };

    async function PCFSiDBAESCryptMount(options) {
        let partition;
        try {
            partition = modules.core.disk.partition(options.partition);
            partition = partition.getData();
        } catch (e) {
            throw new Error("PARTITION_FAILED: " + e.toString() + "\n---begin stack---\n" + e.stack + "\n---end stack---");
        }
        if (!Object.keys(partition).includes("files") || !Object.keys(partition).includes("permissions") || !Object.keys(partition).includes("cryptodata") || !Object.keys(partition).includes("id")) throw new Error("PARTITION_NOT_PCFS_ENCRYPTED");
        if (options.interactivePassword) {
            let passwordInput = "";
            let tbi = modules.core.tty_bios_api;
            function outputPasswordAsking() {
                tbi.clear();
                tbi.println("|--------------------------------------------|")
                tbi.println("| Mounting encrypted partition               |");
                tbi.println("|--------------------------------------------|");
                tbi.println("| Enter your password. Typed " + passwordInput.length + " characters. " + " ".repeat(Math.max((3 - (passwordInput.length).toString().length), 0)) + "|");
                tbi.println("| Press Enter to mount.                      |");
                tbi.println("|--------------------------------------------|");
            }
            while (true) {
                outputPasswordAsking();
                let key = await tbi.inputKey();
                if (key.key == "Enter") break;
                if (key.key.length == 1) passwordInput += key.key;
                if (key.key == "Backspace") passwordInput = passwordInput.slice(0, -1);
            }
            options.password = passwordInput;
        }
        if (options.password) options.key = await modules.core.pbkdf2(options.password, partition.cryptodata.salt);
        if (!options.key) throw new Error("GETTING_KEY_FAILED");
        let importedKey = await crypto.subtle.importKey("raw", Uint8Array.from(options.key.match(/.{1,2}/g).map(a => parseInt(a, 16))), { name: "AES-GCM" }, false, [ "encrypt", "decrypt" ]);
        options.key = options.key.length + "L";
        options.password = options.password.length + "L";
        if (partition.cryptodata.passwordLockingInitial) {
            let baseData = crypto.getRandomValues(new Uint8Array(32));
            let iv = crypto.getRandomValues(new Uint8Array(16));
            let ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, importedKey, baseData));
            let passwordLocking = new Uint8Array(iv.length + ct.length);
            passwordLocking.set(iv);
            passwordLocking.set(ct, iv.length);
            partition.cryptodata.passwordLocking = passwordLocking.reduce((a, b) => a + b.toString(16).padStart(2, "0"), "");
            if (partition.encryptedFileTable) {
                let fileIV = crypto.getRandomValues(new Uint8Array(16));
                let fileCT = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv: fileIV }, importedKey, new TextEncoder().encode(JSON.stringify({
                    files: partition.files,
                    permissions: partition.permissions
                }))));
                partition.files = {};
                partition.permissions = {};
                let ept = new Uint8Array(fileIV.length + fileCT.length);
                ept.set(fileIV);
                ept.set(fileCT, fileIV.length);
                partition.encryptedFileTable = ept.reduce((a, b) => a + b.toString(16).padStart(2, "0"), "");
            }
            delete partition.cryptodata.passwordLockingInitial;
            modules.core.disk.partition(options.partition).setData(partition);
        }
        if (partition.cryptodata.passwordLocking) {
            let iv = new Uint8Array(partition.cryptodata.passwordLocking.slice(0, 32).match(/.{1,2}/g).map(a => parseInt(a, 16)));
            let ct = new Uint8Array(partition.cryptodata.passwordLocking.slice(32).match(/.{1,2}/g).map(a => parseInt(a, 16)));
            await crypto.subtle.decrypt({ name: "AES-GCM", iv }, importedKey, ct);
        }
        let partitionId = partition.id;
        partition = null;
        return {
            read: async function(key) {
                key = String(key);          
                let pathParts = key.split("/");
                if (pathParts[0] == "") pathParts = pathParts.slice(1);
                let files = (await this.getBackend()).files;
                for (let part of pathParts) {
                    files = files[part];
                    if (!files) throw new Error("NO_SUCH_FILE");
                }
                if (typeof files === "object") throw new Error("IS_A_DIR");
                let part = await modules.core.idb.readPart(partitionId + "-" + files);
                let iv = new Uint8Array(part.slice(0, 32).match(/.{1,2}/g).map(a => parseInt(a, 16)));
                let ct = new Uint8Array(part.slice(32).match(/.{1,2}/g).map(a => parseInt(a, 16)));
                return new TextDecoder().decode(new Uint8Array(await crypto.subtle.decrypt({ name: "AES-GCM", iv }, this.key, ct)));
            },
            write: async function(key, value) {
                key = String(key);
                value = String(value);
                let existenceChecks = key.split("/").slice(0, -1);
                if (existenceChecks[0] == "") existenceChecks = existenceChecks.slice(1);
                if (existenceChecks[existenceChecks.length - 1] == "") existenceChecks = existenceChecks.slice(0, -1);
                let basename = key.split("/").slice(-1)[0];
                let files = (await this.getBackend()).files;
                for (let part of existenceChecks) {
                    files = files[part];
                    if (!files) throw new Error("NO_SUCH_DIR");
                }
                if (typeof files[basename] === "object") throw new Error("IS_A_DIR");
                let id = files[basename] || crypto.getRandomValues(new Uint8Array(64)).reduce((a, b) => a + b.toString(16).padStart(2, "0"), "");
                let newIV = crypto.getRandomValues(new Uint8Array(16));
                let newCT = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv: newIV }, this.key, new TextEncoder().encode(value)));
                let newPart = new Uint8Array(newIV.length + newCT.length);
                newPart.set(newIV);
                newPart.set(newCT, newIV.length);
                newPart = newPart.reduce((a, b) => a + b.toString(16).padStart(2, "0"), "");
                await modules.core.idb.writePart(partitionId + "-" + id, newPart);
                if (!files.hasOwnProperty(basename)) {
                    let HACKID = Math.floor(Math.random() * 1000000);
                    globalThis["HACK" + HACKID] = await this.getBackend();
                    let HACK = "";
                    for (let a of key.split("/")) HACK = HACK + "[" + JSON.stringify(a) + "]";
                    eval("globalThis[" + JSON.stringify("HACK" + HACKID) + "].files" + HACK + " = " + JSON.stringify(id) + ";");
                    await this.setBackend(globalThis["HACK" + HACKID]);
                    delete globalThis["HACK" + HACKID];
                }
            },
            rm: async function(key) {
                key = String(key);
                let pathParts = key.split("/");
                if (pathParts[0] == "") pathParts = pathParts.slice(1);
                if (pathParts[pathParts.length - 1] == "") pathParts = pathParts.slice(0, -1);
                let files = (await this.getBackend()).files;
                for (let part of pathParts) {
                    files = files[part];
                    if (!files) throw new Error("NO_SUCH_FILE_DIR");
                }
                if (typeof files === "object" && Object.keys(files).length > 0) throw new Error("NON_EMPTY_DIR");
                if (typeof files === "string") await modules.core.idb.removePart(partitionId + "-" + files);
                let HACKID = Math.floor(Math.random() * 1000000);
                globalThis["HACK" + HACKID] = await this.getBackend();
                let HACK = "";
                for (let a of key.split("/")) HACK = HACK + "[" + JSON.stringify(a) + "]";
                eval("delete globalThis[" + JSON.stringify("HACK" + HACKID) + "].files" + HACK + ";");
                eval("delete globalThis[" + JSON.stringify("HACK" + HACKID) + "].permissions[" + JSON.stringify(key) + "];");
                await this.setBackend(globalThis["HACK" + HACKID]);
                delete globalThis["HACK" + HACKID];
            },
            ls: async function(directory) {
                directory = String(directory);
                let pathParts = directory.split("/");
                if (pathParts[0] == "") pathParts = pathParts.slice(1);
                if (pathParts[pathParts.length - 1] == "") pathParts = pathParts.slice(0, -1);
                let files = (await this.getBackend()).files;
                for (let part of pathParts) {
                    files = files[part];
                    if (!files) throw new Error("NO_SUCH_DIR");
                }
                if (typeof files !== "object") throw new Error("IS_A_FILE");
                return Object.keys(files);
            },
            mkdir: async function(directory) {
                directory = String(directory);
                let existenceChecks = directory.split("/").slice(0, -1);
                if (existenceChecks[0] == "") existenceChecks = existenceChecks.slice(1);
                if (existenceChecks[existenceChecks.length - 1] == "") existenceChecks = existenceChecks.slice(0, -1);
                let files = (await this.getBackend()).files;
                for (let part of existenceChecks) {
                    files = files[part];
                    if (!files) throw new Error("NO_SUCH_DIR");
                }
                if (Object.keys(files).includes(directory.split("/").slice(-1)[0])) throw new Error("DIR_EXISTS");
                let HACKID = Math.floor(Math.random() * 1000000);
                globalThis["HACK" + HACKID] = (await this.getBackend());
                let HACK = "";
                for (let a of directory.split("/")) HACK = HACK + "[" + JSON.stringify(a) + "]";
                eval("globalThis[" + JSON.stringify("HACK" + HACKID) + "].files" + HACK + " = {};");
                await this.setBackend(globalThis["HACK" + HACKID]);
                delete globalThis["HACK" + HACKID];
            },
            permissions: async function(file) {
                file = String(file);
                let properFile = file.split("/")
                if (properFile[0] == "") properFile = properFile.slice(1);
                if (properFile[properFile.length - 1] == "") properFile = properFile.slice(0, -1);
                properFile = properFile.join("/");
                return (await this.getBackend()).permissions[properFile] || {
                    owner: "root",
                    group: "root",
                    world: "",
                };
            },
            chown: async function(file, owner) {
                file = String(file);
                owner = String(owner);
                let properFile = file.split("/")
                if (properFile[0] == "") properFile = properFile.slice(1);
                if (properFile[properFile.length - 1] == "") properFile = properFile.slice(0, -1);
                properFile = properFile.join("/");
                let backend = await this.getBackend();
                let filePermissions = backend.permissions[properFile] || {
                    owner: "root",
                    group: "root",
                    world: "",
                };
                filePermissions.owner = owner;
                backend.permissions[properFile] = filePermissions;
                await this.setBackend(backend);
            },
            chgrp: async function(file, group) {
                file = String(file);
                group = String(group);
                let properFile = file.split("/")
                if (properFile[0] == "") properFile = properFile.slice(1);
                if (properFile[properFile.length - 1] == "") properFile = properFile.slice(0, -1);
                properFile = properFile.join("/");
                let backend = await this.getBackend();
                let filePermissions = backend.permissions[properFile] || {
                    owner: "root",
                    group: "root",
                    world: "",
                };
                filePermissions.group = group;
                backend.permissions[properFile] = filePermissions;
                await this.setBackend(backend);
            },
            chmod: async function(file, permissions) {
                file = String(file);
                permissions = String(permissions);
                let properFile = file.split("/")
                if (properFile[0] == "") properFile = properFile.slice(1);
                if (properFile[properFile.length - 1] == "") properFile = properFile.slice(0, -1);
                properFile = properFile.join("/");
                let backend = await this.getBackend();
                let filePermissions = backend.permissions[properFile] || {
                    owner: "root",
                    group: "root",
                    world: "",
                };
                filePermissions.world = permissions;
                backend.permissions[properFile] = filePermissions;
                this.setBackend(backend);
            },
            isDirectory: async function(key) {
                key = String(key);
                let pathParts = key.split("/").slice(0, -1);
                if (pathParts[0] == "") pathParts = pathParts.slice(1);
                if (pathParts[pathParts.length - 1] == "") pathParts = pathParts.slice(0, -1);
                let basename = key.split("/").slice(-1)[0];
                let files = (await this.getBackend()).files;
                for (let part of pathParts) {
                    files = files[part];
                    if (!files) throw new Error("NO_SUCH_DIR");
                }
                if (!files.hasOwnProperty(basename)) throw new Error("NO_SUCH_FILE_DIR");
                if (typeof files[basename] === "object") return true;
                return false;
            },
            sync: async function() {
                await modules.core.disk.sync();
            },
            unmount: () => true,
            directory_supported: true,
            filesystem: "PCFS-AES",
            read_only: !!options.read_only,
            permissions_supported: true,
            partition: null,
            getBackend: async function() {
                if (!this.partition) this.partition = modules.core.disk.partition(options.partition);
                let returnedData = this.partition.getData();
                if (returnedData.encryptedFileTable) {
                    let iv = new Uint8Array(returnedData.encryptedFileTable.slice(0, 32).match(/.{1,2}/g).map(a => parseInt(a, 16)));
                    let ct = new Uint8Array(returnedData.encryptedFileTable.slice(32).match(/.{1,2}/g).map(a => parseInt(a, 16)));
                    return JSON.parse(new TextDecoder().decode(new Uint8Array(await crypto.subtle.decrypt({ name: "AES-GCM", iv }, this.key, ct))));   
                }
                return returnedData;
            },
            setBackend: async function(data) {
                if (!this.partition) this.partition = modules.core.disk.partition(options.partition);
                let returnedData = this.partition.getData();
                if (returnedData.encryptedFileTable) {
                    let newIV = crypto.getRandomValues(new Uint8Array(16));
                    let newCT = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv: newIV }, this.key, new TextEncoder().encode(JSON.stringify(data))));
                    let newPart = new Uint8Array(newIV.length + newCT.length);
                    newPart.set(newIV);
                    newPart.set(newCT, newIV.length);
                    newPart = newPart.reduce((a, b) => a + b.toString(16).padStart(2, "0"), "");
                    return this.partition.setData({ ...returnedData, encryptedFileTable: newPart });
                }
                this.partition.setData(data);
            },
            key: importedKey
        };
    };
    
    function ramMount(options) {
        return {
            read: async function(key) {
                key = String(key);
                let pathParts = key.split("/");
                if (pathParts[0] == "") pathParts = pathParts.slice(1);
                let files = this.backend.files;
                for (let part of pathParts) {
                    files = files[part];
                    if (!files) throw new Error("NO_SUCH_FILE");
                }
                if (typeof files === "object") throw new Error("IS_A_DIR");
                return String(this.ramFiles.get(files));
            },
            write: async function(key, value) {
                key = String(key);
                value = String(value);
                let existenceChecks = key.split("/").slice(0, -1);
                if (existenceChecks[0] == "") existenceChecks = existenceChecks.slice(1);
                if (existenceChecks[existenceChecks.length - 1] == "") existenceChecks = existenceChecks.slice(0, -1);
                let basename = key.split("/").slice(-1)[0];
                let files = this.backend.files;
                for (let part of existenceChecks) {
                    files = files[part];
                    if (!files) throw new Error("NO_SUCH_DIR");
                }
                if (typeof files[basename] === "object") throw new Error("IS_A_DIR");
                let id = files[basename] || crypto.getRandomValues(new Uint8Array(64)).reduce((a, b) => a + b.toString(16).padStart(2, "0"), "");
                this.ramFiles.set(id, value);
                if (!files.hasOwnProperty(basename)) {
                    let HACKID = Math.floor(Math.random() * 1000000);
                    globalThis["HACK" + HACKID] = this.backend;
                    let HACK = "";
                    for (let a of key.split("/")) HACK = HACK + "[" + JSON.stringify(a) + "]";
                    eval("globalThis[" + JSON.stringify("HACK" + HACKID) + "].files" + HACK + " = " + JSON.stringify(id) + ";");
                    this.backend = globalThis["HACK" + HACKID];
                    delete globalThis["HACK" + HACKID];
                }
            },
            rm: async function(key) {
                key = String(key);
                let pathParts = key.split("/");
                if (pathParts[0] == "") pathParts = pathParts.slice(1);
                if (pathParts[pathParts.length - 1] == "") pathParts = pathParts.slice(0, -1);
                let files = this.backend.files;
                for (let part of pathParts) {
                    files = files[part];
                    if (!files) throw new Error("NO_SUCH_FILE_DIR");
                }
                if (typeof files === "object" && Object.keys(files).length > 0) throw new Error("NON_EMPTY_DIR");
                if (typeof files === "string") this.ramFiles.delete(files);
                let HACKID = Math.floor(Math.random() * 1000000);
                globalThis["HACK" + HACKID] = this.backend;
                let HACK = "";
                for (let a of key.split("/")) HACK = HACK + "[" + JSON.stringify(a) + "]";
                eval("delete globalThis[" + JSON.stringify("HACK" + HACKID) + "].files" + HACK + ";");
                eval("delete globalThis[" + JSON.stringify("HACK" + HACKID) + "].permissions[" + JSON.stringify(key) + "];");
                this.backend = globalThis["HACK" + HACKID];
                delete globalThis["HACK" + HACKID];
            },
            ls: async function(directory) {
                directory = String(directory);
                let pathParts = directory.split("/");
                if (pathParts[0] == "") pathParts = pathParts.slice(1);
                if (pathParts[pathParts.length - 1] == "") pathParts = pathParts.slice(0, -1);
                let files = this.backend.files;
                for (let part of pathParts) {
                    files = files[part];
                    if (!files) throw new Error("NO_SUCH_DIR");
                }
                if (typeof files !== "object") throw new Error("IS_A_FILE");
                return Object.keys(files);
            },
            mkdir: async function(directory) {
                directory = String(directory);
                let existenceChecks = directory.split("/").slice(0, -1);
                if (existenceChecks[0] == "") existenceChecks = existenceChecks.slice(1);
                if (existenceChecks[existenceChecks.length - 1] == "") existenceChecks = existenceChecks.slice(0, -1);
                let files = this.backend.files;
                for (let part of existenceChecks) {
                    files = files[part];
                    if (!files) throw new Error("NO_SUCH_DIR");
                }
                if (Object.keys(files).includes(directory.split("/").slice(-1)[0])) throw new Error("DIR_EXISTS");
                let HACKID = Math.floor(Math.random() * 1000000);
                globalThis["HACK" + HACKID] = this.backend;
                let HACK = "";
                for (let a of directory.split("/")) HACK = HACK + "[" + JSON.stringify(a) + "]";
                eval("globalThis[" + JSON.stringify("HACK" + HACKID) + "].files" + HACK + " = {};");
                this.backend = globalThis["HACK" + HACKID];
                delete globalThis["HACK" + HACKID];
            },
            permissions: async function(file) {
                file = String(file);
                let properFile = file.split("/")
                if (properFile[0] == "") properFile = properFile.slice(1);
                if (properFile[properFile.length - 1] == "") properFile = properFile.slice(0, -1);
                properFile = properFile.join("/");
                return this.backend.permissions[properFile] || {
                    owner: "root",
                    group: "root",
                    world: "",
                };
            },
            chown: async function(file, owner) {
                file = String(file);
                owner = String(owner);
                let properFile = file.split("/")
                if (properFile[0] == "") properFile = properFile.slice(1);
                if (properFile[properFile.length - 1] == "") properFile = properFile.slice(0, -1);
                properFile = properFile.join("/");
                let backend = this.backend;
                let filePermissions = backend.permissions[properFile] || {
                    owner: "root",
                    group: "root",
                    world: "",
                };
                filePermissions.owner = owner;
                backend.permissions[properFile] = filePermissions;
                this.backend = backend;
            },
            chgrp: async function(file, group) {
                file = String(file);
                group = String(group);
                let properFile = file.split("/")
                if (properFile[0] == "") properFile = properFile.slice(1);
                if (properFile[properFile.length - 1] == "") properFile = properFile.slice(0, -1);
                properFile = properFile.join("/");
                let backend = this.backend;
                let filePermissions = backend.permissions[properFile] || {
                    owner: "root",
                    group: "root",
                    world: "",
                };
                filePermissions.group = group;
                backend.permissions[properFile] = filePermissions;
                this.backend = backend;
            },
            chmod: async function(file, permissions) {
                file = String(file);
                permissions = String(permissions);
                let properFile = file.split("/")
                if (properFile[0] == "") properFile = properFile.slice(1);
                if (properFile[properFile.length - 1] == "") properFile = properFile.slice(0, -1);
                properFile = properFile.join("/");
                let backend = this.backend;
                let filePermissions = backend.permissions[properFile] || {
                    owner: "root",
                    group: "root",
                    world: "",
                };
                filePermissions.world = permissions;
                backend.permissions[properFile] = filePermissions;
                this.backend = backend;
            },
            isDirectory: function(key) {
                key = String(key);
                let pathParts = key.split("/").slice(0, -1);
                if (pathParts[0] == "") pathParts = pathParts.slice(1);
                if (pathParts[pathParts.length - 1] == "") pathParts = pathParts.slice(0, -1);
                let basename = key.split("/").slice(-1)[0];
                let files = this.backend.files;
                for (let part of pathParts) {
                    files = files[part];
                    if (!files) throw new Error("NO_SUCH_DIR");
                }
                if (!files.hasOwnProperty(basename)) throw new Error("NO_SUCH_FILE_DIR");
                if (typeof files[basename] === "object") return true;
                return false;
            },
            sync: () => true,
            unmount: () => true,
            directory_supported: true,
            read_only: !!options.read_only,
            filesystem: "extramfs",
            permissions_supported: true,
            backend: options.type == "run" ? { files: { run: {} }, permissions: {
                "": {
                    owner: "root",
                    group: "root",
                    world: "rx"
                },
                run: {
                    owner: "root",
                    group: "root",
                    world: "rwx"
                }
            }} : { files: {}, permissions: {
                "": {
                    owner: "root",
                    group: "root",
                    world: "rx"
                }
            } },
            ramFiles: new Map()
        };
    }

    async function SFSPMount(options) {
        let session, serverData;
        try {
            session = await fetch(options.url + "/session");
            session = await session.json();
            serverData = await fetch(options.url + "/properties", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    ...options,
                    sessionToken: session
                })
            });
            serverData = await serverData.json();
        } catch (e) {
            throw new Error("Could not connect to server");
        }
        return {
            read: async function(...a) {
                let req = await fetch(options.url + "/file_operation", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        sessionToken: session,
                        operation: "read",
                        parameters: a
                    })
                });
                if (!req.ok) throw (await req.json());
                return await req.json();
            },
            write: async function(...a) {
                let req = await fetch(options.url + "/file_operation", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        sessionToken: session,
                        operation: "write",
                        parameters: a
                    })
                });
                if (!req.ok) throw (await req.json());
                return await req.json();
            },
            rm: async function(...a) {
                let req = await fetch(options.url + "/file_operation", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        sessionToken: session,
                        operation: "rm",
                        parameters: a
                    })
                });
                if (!req.ok) throw (await req.json());
                return await req.json();
            },
            ls: async function(...a) {
                let req = await fetch(options.url + "/file_operation", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        sessionToken: session,
                        operation: "ls",
                        parameters: a
                    })
                });
                if (!req.ok) throw (await req.json());
                return await req.json();
            },
            mkdir: async function(...a) {
                let req = await fetch(options.url + "/file_operation", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        sessionToken: session,
                        operation: "mkdir",
                        parameters: a
                    })
                });
                if (!req.ok) throw (await req.json());
                return await req.json();
            },
            permissions: async function(...a) {
                let req = await fetch(options.url + "/file_operation", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        sessionToken: session,
                        operation: "permissions",
                        parameters: a
                    })
                });
                if (!req.ok) throw (await req.json());
                return await req.json();
            },
            chown: async function(...a) {
                let req = await fetch(options.url + "/file_operation", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        sessionToken: session,
                        operation: "chown",
                        parameters: a
                    })
                });
                if (!req.ok) throw (await req.json());
                return await req.json();
            },
            chgrp: async function(...a) {
                let req = await fetch(options.url + "/file_operation", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        sessionToken: session,
                        operation: "chgrp",
                        parameters: a
                    })
                });
                if (!req.ok) throw (await req.json());
                return await req.json();
            },
            chmod: async function(...a) {
                let req = await fetch(options.url + "/file_operation", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        sessionToken: session,
                        operation: "chmod",
                        parameters: a
                    })
                });
                if (!req.ok) throw (await req.json());
                return await req.json();
            },
            sync: async function(...a) {
                let req = await fetch(options.url + "/file_operation", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        sessionToken: session,
                        operation: "sync",
                        parameters: a
                    })
                });
                if (!req.ok) throw (await req.json());
                return await req.json();
            },
            isDirectory: async function(...a) {
                let req = await fetch(options.url + "/file_operation", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        sessionToken: session,
                        operation: "isDirectory",
                        parameters: a
                    })
                });
                if (!req.ok) throw (await req.json());
                return await req.json();
            },
            unmount: async function(...a) {
                let req = await fetch(options.url + "/file_operation", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        sessionToken: session,
                        operation: "unmount",
                        parameters: a
                    })
                });
                if (!req.ok) throw (await req.json());
                return await req.json();
            },
            ...serverData
        };
    };

    async function IPCMount(options) { // ChatGPT code below
        if (!options.inputPipeId || !options.outputPipeId) throw new Error("PIPE_IDS_REQUIRED");
    
        const inputPipeId = options.inputPipeId;
        const outputPipeId = options.outputPipeId;
        let lock = false;
    
        async function acquireLock() {
            return new Promise((resolve) => {
                const tryLock = () => {
                    if (!lock) {
                        lock = true;
                        resolve();
                    } else {
                        setTimeout(tryLock, 10); // retry after 10ms
                    }
                };
                setTimeout(tryLock, 10);
            });
        }
    
        async function releaseLock() {
            lock = false;
        }
    
        // Function to send request and receive response
        async function ipcRequest(action, payload = {}) {
            await acquireLock();
            return new Promise((resolve, reject) => {
                modules.ipc.listenFor(outputPipeId).then((response) => {
                    releaseLock();
                    if (response.error) return reject(new Error(response.error));
                    return resolve(response.data);
                });
                modules.ipc.send(inputPipeId, { action, ...payload });
            });
        }
    
        // Initial request to get filesystem properties
        const filesystemData = await ipcRequest("properties", { data: options });
    
        return {
            read: async function(key) {
                return ipcRequest("read", { key: String(key) });
            },
            write: async function(key, value) {
                return ipcRequest("write", { key: String(key), value: String(value) });
            },
            rm: async function(key) {
                return ipcRequest("rm", { key: String(key) });
            },
            ls: async function(directory) {
                return ipcRequest("ls", { directory: String(directory) });
            },
            mkdir: async function(directory) {
                return ipcRequest("mkdir", { directory: String(directory) });
            },
            permissions: async function(file) {
                return ipcRequest("permissions", { file: String(file) });
            },
            chown: async function(file, owner) {
                return ipcRequest("chown", { file: String(file), owner: String(owner) });
            },
            chgrp: async function(file, group) {
                return ipcRequest("chgrp", { file: String(file), group: String(group) });
            },
            chmod: async function(file, permissions) {
                return ipcRequest("chmod", { file: String(file), permissions: String(permissions) });
            },
            isDirectory: async function(key) {
                return ipcRequest("isDirectory", { key: String(key) });
            },
            sync: async function() {
                return ipcRequest("sync");
            },
            unmount: async function() {
                return ipcRequest("unmount");
            },
            ...filesystemData
        };
    } // ChatGPT code ends here
    
    fs.mounts["ram"] = ramMount({
        type: "run"
    });
    modules.mounts = {
        PCFSiDBMount,
        PCFSiDBAESCryptMount,
        ramMount,
        SFSPMount,
        IPCMount
    };
    modules.fs = fs;
    modules.defaultSystem = "ram";
}

function sampleFormatToEncryptedPCFS(partition, monokey = true) {
    let salt = crypto.getRandomValues(new Uint8Array(32));
    let diskPart = modules.core.disk.partition(partition);
    let partId;
    try {
        partId = (diskPart.getData()).id;
    } catch {}
    if (!partId) partId = crypto.getRandomValues(new Uint8Array(64)).reduce((a, b) => a + b.toString(16).padStart(2, "0"), "");
    diskPart.setData({
        files: {},
        permissions: {},
        cryptodata: {
            salt: Array.from(salt).map(a => a.toString(16).padStart(2, "0")).join(""),
            passwordLockingInitial: monokey
        },
        id: partId
    });
}

loadFs();