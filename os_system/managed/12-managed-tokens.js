function setupTokens() {
    const server = "http://localhost:3946/managedUsers/";
    // @pcos-app-mode native
    modules.tokens = {
        revoke: async function(token) {
            await fetch(server + "tokenRevoke", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ token })
            });
        },
        removePrivilege: async function(token, privilege) {
            await fetch(server + "tokenRevokePrivilege", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ token, privilege })
            });
        },
        removePrivileges: async function(token, privileges) {
            await fetch(server + "tokenRevokePrivileges", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ token, privileges })
            });
        },
        userInitialize: async function(token, user) {
            await fetch(server + "tokenUserInitialize", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ token, user })
            });
        },
        halfInitialize: async function(token, user) {
            await fetch(server + "tokenHalfInitialize", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ token, user })
            });
        },
        info: async function(token) {
            return (await fetch(server + "tokenInfo", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ token })
            })).json();
        },
        validate: async function(token, criteria) {
            return (await fetch(server + "tokenValidate", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ token, criteria })
            })).json();
        },
        fork: async function(token) {
            return (await fetch(server + "tokenFork", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ token })
            })).json();
        },
        _tokens: {}
    }
}
setupTokens();