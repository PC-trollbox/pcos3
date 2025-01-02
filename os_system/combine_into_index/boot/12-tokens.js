function setupTokens() {
	// @pcos-app-mode native
	modules.tokens = {
		generate: async function() {
			let rng = crypto.getRandomValues(new Uint8Array(64));
			let token = Array.from(rng).map(x => x.toString(16).padStart(2, "0")).join("");
			this._tokens[token] = { privileges: [], user: "nobody", groups: [] };
			return token;
		},
		revoke: async function(token) {
			delete this._tokens[token];
		},
		setPrivileges: async function(token, privileges) {
			this._tokens[token].privileges = privileges;
		},
		addPrivilege: async function(token, privilege) {
			this._tokens[token].privileges.push(privilege);
		},
		addPrivileges: async function(token, privileges) {
			this._tokens[token].privileges.push(...privileges);
		},
		removePrivilege: async function(token, privilege) {
			this._tokens[token].privileges = this._tokens[token].privileges.filter(x => x != privilege);
		},
		removePrivileges: async function(token, privileges) {
			this._tokens[token].privileges = this._tokens[token].privileges.filter(x => !privileges.includes(x));
		},
		userInitialize: async function(token, user) {
			this._tokens[token].user = user;
			this._tokens[token].groups = (await modules.users.getUserInfo(user, token)).groups || [];
			this._tokens[token].privileges = ["FS_READ", "FS_WRITE", "FS_REMOVE", "FS_CHANGE_PERMISSION", "FS_LIST_PARTITIONS", "IPC_CREATE_PIPE", "IPC_LISTEN_PIPE", "IPC_SEND_PIPE", "IPC_CHANGE_PERMISSION", "ELEVATE_PRIVILEGES", "GET_USER_INFO", "SET_SECURITY_CHECKS", "START_TASK", "LIST_TASKS", "SIGNAL_TASK", "FETCH_SEND", "CSP_OPERATIONS", "IDENTIFY_SYSTEM", "WEBSOCKETS_OPEN", "WEBSOCKETS_LISTEN", "WEBSOCKETS_SEND", "WEBSOCKET_SET_PERMISSIONS", "MANAGE_TOKENS", "WEBSOCKET_INFO", "GRAB_ATTENTION", "CLI_MODIFICATIONS", "GET_THEME", "GET_LOCALE", "GET_FILESYSTEMS", "GET_BUILD", "GET_SERVER_URL", "START_BACKGROUND_TASK", "GET_BOOT_MODE", "GET_SCREEN_INFO", "PCOS_NETWORK_PING", "LOGOUT", "LULL_SYSTEM", "CONNLESS_LISTEN", "CONNLESS_SEND", "GET_NETWORK_ADDRESS", "CONNFUL_LISTEN", "CONNFUL_CONNECT", "CONNFUL_DISCONNECT", "CONNFUL_WRITE", "CONNFUL_READ", "CONNFUL_ADDRESS_GET", "SYSTEM_UPTIME", "GET_HOSTNAME", "RESOLVE_NAME"];
			if (user == "root") this._tokens[token].privileges.push("FS_UNMOUNT", "SYSTEM_SHUTDOWN", "SWITCH_USERS_AUTOMATICALLY", "USER_INFO_OTHERS", "SET_USER_INFO", "FS_BYPASS_PERMISSIONS", "IPC_BYPASS_PERMISSIONS", "TASK_BYPASS_PERMISSIONS", "SENSITIVE_USER_INFO_OTHERS", "SYSTEM_STABILITY", "RUN_KLVL_CODE", "IDENTIFY_SYSTEM_SENSITIVE", "WEBSOCKET_BYPASS_PERMISSIONS", "LLDISK_READ", "LLDISK_WRITE", "LLDISK_LIST_PARTITIONS", "LLDISK_REMOVE", "LLDISK_IDB_READ", "LLDISK_IDB_WRITE", "LLDISK_IDB_REMOVE", "LLDISK_IDB_LIST", "LLDISK_IDB_SYNC", "FS_MOUNT", "SET_DEFAULT_SYSTEM", "GET_SYSTEM_RESOURCES", "LLDISK_INIT_PARTITIONS", "LOGOUT_OTHERS", "LULL_SYSTEM_FORCE", "CONNLESS_LISTEN_GLOBAL", "GET_USER_LIST", "CONNFUL_LISTEN_GLOBAL", "NETWORK_RAW_WRITE", "NETWORK_RAW_READ");
			if ((await modules.users.getUserInfo(user, token)).blankPrivileges) this._tokens[token].privileges = [];
			this._tokens[token].privileges.push(...((await modules.users.getUserInfo(user, token)).additionalPrivilegeSet || []));
			this._tokens[token].privileges = Array.from(new Set(this._tokens[token].privileges));
		},
		halfInitialize: async function(token, user) {
			this._tokens[token].user = user;
			this._tokens[token].groups = (await modules.users.getUserInfo(user, token)).groups || [];
		},
		info: async function(token) {
			return this._tokens[token];
		},
		validate: async function(token, criteria) {
			if (!this._tokens.hasOwnProperty(token)) return false;
			if (criteria.user && this._tokens[token].user != criteria.user) return false;
			if (criteria.group && !this._tokens[token].groups.includes(criteria.group)) return false;
			if (criteria.privilege && !this._tokens[token].privileges.includes(criteria.privilege)) return false;
			return true;
		},
		fork: async function(token) {
			let rng = crypto.getRandomValues(new Uint8Array(64));
			let newToken = Array.from(rng).map(x => x.toString(16).padStart(2, "0")).join("");
			this._tokens[newToken] = JSON.parse(JSON.stringify(this._tokens[token]));
			return newToken;  
		},
		_tokens: {}
	}
}
setupTokens();