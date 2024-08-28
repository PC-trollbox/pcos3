function loadUserFriendly() {
    // @pcos-app-mode native
    modules.userfriendliness = {
        inconsiderateTime: function(ms, majorUnitsOnly, displayMs) {
            let string = "";
            let days = Math.floor(ms / 86400000);
            let hours = Math.floor(ms / 3600000) % 24;
            let minutes = Math.floor(ms / 60000) % 60;
            let seconds = Math.floor(ms / 1000) % 60;
            if (days) string = string + modules.locales.get("SHORT_DAYS").replace("%s", days) + " ";
            if (days && majorUnitsOnly) return string;
            if (hours) string = string + modules.locales.get("SHORT_HOURS").replace("%s", hours) + " ";
            if (hours && majorUnitsOnly) return string;
            if (minutes) string = string + modules.locales.get("SHORT_MINUTES").replace("%s", minutes) + " ";
            if (minutes && majorUnitsOnly) return string;
            if (seconds) string = string + modules.locales.get("SHORT_SECONDS").replace("%s", seconds) + " ";
            if (displayMs && (ms % 1000)) {
                if (seconds && majorUnitsOnly) return string;
                string = string + modules.locales.get("SHORT_MILLISECONDS").replace("%s", (ms % 1000)) + " ";
            }
            return string;
        },
        informationUnits: function(bytes, majorUnitsOnly) {
            let string = "";
            let tb = Math.floor(bytes / (1024 * 1024 * 1024 * 1024));
            let gb = Math.floor(bytes / (1024 * 1024 * 1024)) % 1024;
            let mb = Math.floor(bytes / (1024 * 1024)) % 1024;
            let kb = Math.floor(bytes / 1024) % 1024;
            let b = bytes % 1024;
            if (tb) string = string + modules.locales.get("SHORT_TERABYTES").replace("%s", tb) + " ";
            if (tb && majorUnitsOnly) return string;
            if (gb) string = string + modules.locales.get("SHORT_GIGABYTES").replace("%s", gb) + " ";
            if (gb && majorUnitsOnly) return string;
            if (mb) string = string + modules.locales.get("SHORT_MEGABYTES").replace("%s", mb) + " ";
            if (mb && majorUnitsOnly) return string;
            if (kb) string = string + modules.locales.get("SHORT_KILOBYTES").replace("%s", kb) + " ";
            if (kb && majorUnitsOnly) return string;
            if (b) string = string + modules.locales.get("SHORT_BYTES").replace("%s", b);
            if (b && majorUnitsOnly) return string;
            return string;
        },
        considerateTime: function(ms, majorUnitsOnly, displayMs) {
            let dateObject = new Date(ms + (new Date(0).getTimezoneOffset() * 60000));
            let string = "";
            let years = dateObject.getFullYear() - 1970;
            let months = dateObject.getMonth();
            let days = dateObject.getDate() - 1;
            let hours = dateObject.getHours();
            let minutes = dateObject.getMinutes();
            let seconds = dateObject.getSeconds();
            let millisec = dateObject.getMilliseconds();
            if (years) string = string + modules.locales.get("SHORT_YEARS").replace("%s", years) + " ";
            if (years && majorUnitsOnly) return string;
            if (months) string = string + modules.locales.get("SHORT_MONTHS").replace("%s", months) + " ";
            if (months && majorUnitsOnly) return string;
            if (days) string = string + modules.locales.get("SHORT_DAYS").replace("%s", days) + " ";
            if (days && majorUnitsOnly) return string;
            if (hours) string = string + modules.locales.get("SHORT_HOURS").replace("%s", hours) + " ";
            if (hours && majorUnitsOnly) return string;
            if (minutes) string = string + modules.locales.get("SHORT_MINUTES").replace("%s", minutes) + " ";
            if (minutes && majorUnitsOnly) return string;
            if (seconds) string = string + modules.locales.get("SHORT_SECONDS").replace("%s", seconds) + " ";
            if (displayMs && millisec) {
                if (seconds && majorUnitsOnly) return string;
                string = string + modules.locales.get("SHORT_MILLISECONDS").replace("%s", (millisec % 1000)) + " ";
            }
            return string;
        }
    }
}
loadUserFriendly();