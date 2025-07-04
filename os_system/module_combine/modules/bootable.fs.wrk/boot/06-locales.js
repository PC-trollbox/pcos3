function localization() {
	// @pcos-app-mode native
	let locales = {
		get: function(key, lang) {
			lang = lang || locales.defaultLocale || navigator.languages[0].split("-")[0].toLowerCase();
			let locale = locales[lang];
			if (!locale) locale = locales[locales.defaultLocale || "en"];
			if (!locale) locale = {};
			if (!locale.hasOwnProperty(key)) locale = locales[locales.defaultLocale || "en"] || {};
			return locale.hasOwnProperty(key) ? locale[key] : key;
		}
	}
	modules.locales = locales;
}
localization();