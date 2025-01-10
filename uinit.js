// automatically generated file, do not edit; edit the corresponding files instead
function createREE(direction) {
	let ownIframeID = undefined;
	try {
		ownIframeID = iframeId;
	} catch {}
	return new Promise(function(resolve) {
		let iframe = document.createElement("iframe");
		let iframeId = crypto.getRandomValues(new Uint8Array(64)).reduce((a, b) => a + b.toString(16).padStart(2, "0"), "");
		let prefix = ownIframeID ? (ownIframeID + "_") : "";
		iframeId = prefix + iframeId;
		iframe.src = "data:text/html;base64," + btoa("<!DOCTYPE HTML>\n<script>const iframeId = " + JSON.stringify(iframeId) + ";\n" + reed.toString() + "\nreed();</script>");
		iframe.style.border = "none";
		iframe.setAttribute("credentialless", "true");
		iframe.sandbox = "allow-scripts";
		direction.appendChild(iframe);
		let prezhn = [];
		let prerm = [];
		iframe.addEventListener("load", function s() {
			iframe.removeEventListener("load", s);
			return resolve({
				iframe,
				exportAPI: function(id, fn) {
					iframe.contentWindow.postMessage({type: "export_api", id: id, iframeId}, "*");
					async function prezhn_it(e) {
						if (e.data.iframeId != iframeId) return;
						if (e.data.id != id) return;
						if (e.data.type != "call_api") return;
						try {
							e.source.postMessage({
								result: await fn({
									caller: iframeId,
									arg: e.data.arg
								}),
								type: "api_response",
								responseToken: e.data.responseToken,
								iframeId
							}, "*");
						} catch (er) {
							e.source.postMessage({
								result: {
									name: er.name,
									message: er.message
								},
								type: "api_error",
								responseToken: e.data.responseToken,
								iframeId
							}, "*");
						}
					}
					window.addEventListener("message", prezhn_it);
					prezhn.push(prezhn_it);
				},
				eval: function(code) {
					let responseToken = crypto.getRandomValues(new Uint8Array(64)).reduce((a, b) => a + b.toString(16).padStart(2, "0"), "");
					return new Promise(function(resolve, reject) {
						iframe.contentWindow.postMessage({type: "run", code, responseToken, iframeId}, "*");
						function sel(e) {
							if (e.data.iframeId != iframeId) return;
							if (e.data.responseToken != responseToken) return;
							prezhn = prezhn.filter(x => x != sel);
							window.removeEventListener("message", sel);
							if (e.data.type == "ran_response")
								resolve(e.data.result);
							else if (e.data.type == "ran_error")
								reject(e.data.result);
						};
						window.addEventListener("message", sel);
						prezhn.push(sel);
					});
				},
				closeDown: async function() {
					for (let i of prerm) await i(this);
					prerm = [];
					for (let i in prezhn) window.removeEventListener("message", prezhn[i]);
					iframe.remove();
					iframe = null;
				},
				beforeCloseDown: function(fn) {
					prerm.push(fn);
				},
				iframeId
			});
		});
	});
}

// reed() is for in-iframe use only
function reed() {
	window.availableAPIs = {};
	window.addEventListener("message", function(e) {
		if (e.data.iframeId != iframeId && !e.data.iframeId.startsWith(iframeId + "_")) {
			e.stopImmediatePropagation();
			e.stopPropagation();
			e.preventDefault();
			return false;
		}
		if (e.data.iframeId.startsWith(iframeId + "_")) return true;
		if (e.data.type == "export_api") {
			window.availableAPIs[e.data.id] = function(arg) {
				return new Promise(function(resolve, reject) {
					let responseToken = crypto.getRandomValues(new Uint8Array(64)).reduce((a, b) => a + b.toString(16).padStart(2, "0"), "");
					e.source.postMessage({
						type: "call_api",
						id: e.data.id,
						arg,
						responseToken: responseToken,
						iframeId
					}, "*");
					addEventListener("message", function selv(e) {
						if (e.data.iframeId != iframeId) return;
						if (e.data.responseToken != responseToken) return;
						window.removeEventListener("message", selv);
						if (e.data.type == "api_response")
							resolve(e.data.result);
						else if (e.data.type == "api_error")
							reject(e.data.result);
					});
				})
			}
		} else if (e.data.type == "unexport_api") {
			delete window.availableAPIs[e.data.id];
		} else if (e.data.type == "run") {
			try {
				e.source.postMessage({
					type: "ran_response",
					result: eval(e.data.code),
					responseToken: e.data.responseToken,
					iframeId
				}, "*");
			} catch (e2) {
				e.source.postMessage({
					type: "ran_error",
					result: {
						name: e2.name,
						message: e2.message,
						stack: e2.stack
					},
					responseToken: e.data.responseToken,
					iframeId
				}, "*");
			}
		}
	});
}let dcn=["onerror","onabort","oncomplete","getRandomValues",Uint8Array,"toString","padStart",crypto,Promise,"disk","readonly","readwrite","objectStore","onsuccess"];
let idb={opendb:function(){if(this._)return this._;let t=this;return new(dcn[8])(function(rs,rj){let r=indexedDB.open(dcn[9],1);
r.onupgradeneeded=_=>r.result.createObjectStore(dcn[9]);r[dcn[13]]=_=>{t._=r.result;rs(t._);};r[dcn[0]]=rj;});},writePart:async function(p,v){
if(!this._)await this.opendb();let t=this;let tx=this._.transaction(dcn[9],dcn[11]);tx[dcn[12]](dcn[9]).put(v,p);
let pi=(dcn[7])[dcn[3]](new(dcn[4])(64)).reduce((a,b)=>a+b[dcn[5]](16)[dcn[6]](2,"0"),"");let pr=new(dcn[8])(function(rs,rj){tx[dcn[2]]=(...ar)=>{
delete t._t[pi];return rs(...ar);};let er=(...ar)=>{delete t._t[pi];return rj(...ar);};[tx[dcn[0]],tx[dcn[1]]]=[er,er];});t._t[pi]=pr;return pr;},
readPart:async function(p){if(!this._)await this.opendb();let tx=this._.transaction(dcn[9],dcn[10]);let s=tx[dcn[12]](dcn[9]).get(p);
return new(dcn[8])(function(rs,rj){s[dcn[13]]=e=>rs(e.target.result);[s[dcn[0]],s[dcn[1]]]=[rj,rj];})},removePart:async function(p){
if(!this._)await this.opendb();let t=this;let tx=this._.transaction(dcn[9],dcn[11]);tx[dcn[12]](dcn[9]).delete(p);
let pi=(dcn[7])[dcn[3]](new(dcn[4])(64)).reduce((a,b)=>a+b[dcn[5]](16)[dcn[6]](2,"0"),"");let pr=new(dcn[8])(function(rs,rj){tx[dcn[2]]=(...ar)=>{
delete t._t[pi];return rs(...ar);};let er=(...ar)=>{delete t._t[pi];return rj(...ar);};[tx[dcn[0]],tx[dcn[1]]]=[er,er];});t._t[pi]=pr;return pr;},
listParts:async function(){if(!this._)await this.opendb();let tx=this._.transaction(dcn[9],dcn[10]);let ak=tx[dcn[12]](dcn[9]).getAllKeys();
return new(dcn[8])(function(rs,rj){ak[dcn[13]]=e=>rs(e.target.result);[ak[dcn[0]],ak[dcn[1]]]=[rj,rj];});},write:v=>idb.writePart(dcn[9],v),read:_=>
idb.readPart(dcn[9]),sync:_=>(dcn[8]).all(Object.values(idb._t)),closeDB:_=>idb._.close(),_:null,_t:{}};let disk={partitions:_=>
Object.keys(JSON.parse(disk._)),partition:function(n){let t=this;let c=JSON.parse(this._)[n];return{setData:function(v){let co=JSON.parse(t._);
[co[n],c]=[v,v];t.r=JSON.stringify(co);},getData:_=>c,remove:function(){let co=JSON.parse(t._);delete co[n];c=undefined;t.r=JSON.stringify(co);}}},
insertPartitionTable:_=>disk.r="{}",set r(val){this._=val;idb.write(val);},_:null,sync:()=>idb.sync()};let tty_bios_api={
	print:function(print,html) {
		let outputEl=document.createElement("span");
		outputEl["inner" + (html ? "HTML" : "Text")]=print||"";
		document.getElementById("tty_bios").appendChild(outputEl);
		outputEl.scrollIntoView(); return true;
	},
	println:(print,html)=>tty_bios_api.print((print||"")+"\n",html),
	clear:_=>document.getElementById("tty_bios").innerText="",
	inputKey:_=>new dcn[8], inputLine:_=>new dcn[8]
};
const AsyncFunction=(async _=>0).constructor;
let sysHaltedHook=_=>{tty_bios_api.println("System halted.");idb.closeDB();disk._=null;idb._=null;};(async function(){if(!isSecureContext){
location.protocol="https:";return};try{if(!(await navigator.serviceWorker.getRegistrations()).length){try{
await navigator.serviceWorker.register("offline.js");}catch(e){}}}catch(e){console.error(e);};try{disk._=(await idb.read())||"null";}catch(e){};
tty_bios_api.println("Boot0");let s=false;try{await new AsyncFunction(disk.partition("boot").getData())();s=true;}catch(e){console.error(e);}if(!s){
tty_bios_api.print("Boot1");if(!prefs.read("never_boot_from_network")){try{await new AsyncFunction(await((await fetch("os.js")).text()))();}catch(e){
console.error(e);}}};sysHaltedHook();})();let prefs={read:k=>prefs.b[k],write:(k,v)=>{let lb=prefs.b;lb[k]=v;prefs.b=lb;},rm:k=>{let lb=prefs.b;delete b[k];prefs.b=lb;},
ls:_=>Object.keys(prefs.b),bc:JSON.parse(localStorage.runtime_prefs||"{}"),get b(){return this.bc;},set b(v){this.bc=v;
localStorage.runtime_prefs=JSON.stringify(v);}};let hexToU8A=hex=>(dcn[4]).from(hex.match(/.{1,2}/g).map(a=>parseInt(a,16)));
let u8aToHex=u8a=>Array.from(u8a).map(a=>a.toString(16).padStart(2,"0")).join("");async function pbkdf2(pass,salt){
return u8aToHex(new(dcn[4])(await(dcn[7]).subtle.deriveBits({name:"PBKDF2",salt:hexToU8A(salt),iterations:100000,hash:"SHA-256"},
await crypto.subtle.importKey("raw",new TextEncoder().encode(pass),{name:"PBKDF2"},false,["deriveBits","deriveKey"]),256)));}let coreExports = {
	disk,
	tty_bios_api,
	prefs,
	createREE,
	pbkdf2,
	idb,
	bootMode: "normal",
	bootSection: undefined,
	setFW: new_flash => localStorage.setItem("runtime_flash", new_flash)
};
globalThis.coreExports = coreExports;