function localization() {
    // @pcos-app-mode native
    let locales = {
        en: {
            "UNTITLED_APP": "Untitled program",
            "PERMISSION_DENIED": "Permission denied",
            "MORE_PERMISSION_DENIED": "There are not enough permissions to run this program.",
            "COMPATIBILITY_ISSUE_TITLE": "Compatibility issue",
            "COMPATIBILITY_ISSUE": "This program cannot run on this computer as a task. Check the application modes to include \"isolatable\".",
            "APP_STARTUP_CRASH_TITLE": "Something went wrong",
            "APP_STARTUP_CRASH": "The system failed to execute this program.",
            "JS_TERMINAL": "JavaScript Terminal",
            "TERMINAL_INVITATION": "PCOS 3, build %s",
            "PCOS_RESTARTING": "PCOS is restarting. %s",
            "PLEASE_WAIT": "Please wait.",
            "POLITE_CLOSE_SIGNAL": "Sending polite close.",
            "ABRUPT_CLOSE_SIGNAL": "Sending abrupt close.",
            "UNMOUNTING_MOUNTS": "Unmounting mounts.",
            "SAFE_TO_CLOSE": "It is now safe to close this tab.",
            "RESTART_BUTTON": "Reboot",
            "RESTARTING": "Restarting.",
            "INSTALL_PCOS": "Install PCOS",
            "INSTALLER_TITLE": "PCOS 3 Installer",
            "CLOSE_INSTALLER_CONFIRMATION": "Are you sure you want to stop the installation process? This computer will restart.",
            "YES": "Yes",
            "NO": "No",
            "INSTALLER_INVITATION": "You are installing PCOS 3 build %s on this computer.",
            "INSTALL_BUTTON": "Install",
            "CLI_BUTTON": "Open terminal",
            "INSTALLER_PARTITIONING": "Select the boot and data partitions you would like to use.",
            "PARTITIONING_USE": "Use partitions",
            "PARTITION_DATA": "Data partition",
            "PARTITION_BOOT": "Boot partition",
            "FORMAT_DATA": "Format to PCFS",
            "DATA_INPUT_ALERT": "Please enter a data partition name.",
            "PROMPT_PARTITION_TABLE": "This disk does not seem to contain a valid partition table. Do you want to insert a partition table?",
            "CONFIRM_PARTITION_ERASE": "All data on that partition will be erased. Continue?",
            "BOOT_INPUT_ALERT": "Please enter a boot partition name.",
            "CANNOT_FIND_PARTITION": "Can't find a disk partition. Please try formatting the data partition to PCFS.",
            "PCFS_DETECTION_ERROR": "The data partition doesn't seem to contain PCFS. Do you still want to use it?",
            "INSTALLING_PCOS": "Installing PCOS: %s",
            "CREATING_BOOT_PARTITION": "Creating boot partition",
            "MOUNTING_DATA_PARTITION": "Mounting data partition as 'target'",
            "CHANGING_ROOT_PERMISSIONS": "Changing / permissions",
            "COPYING_FOLDERS": "Copying folders",
            "PREPARING_FOR_COPY": "Preparing for copying",
            "CHANGING_BOOT_PERMISSIONS": "Changing /boot permissions",
            "PATCHING_FS": "Patching for data mount",
            "INSTALLATION_SUCCESSFUL": "Successful installation. Close window to reboot.",
            "INSTALLATION_FAILED": "Installation of PCOS failed. Please try again. Close window to reboot.",
            "CREATING_DIR": "Creating %s",
            "COPYING_FILE": "Copying %s",
            "COMPLETE_COPY": "Complete copying %s",
            "REMOVING_OBJECT": "Removing %s",
            "COMPLETE_REMOVE": "Complete removing %s",
            "SHORT_DAYS": "%sd",
            "SHORT_HOURS": "%sh",
            "SHORT_MINUTES": "%smin",
            "SHORT_SECONDS": "%ss",
            "SHORT_MILLISECONDS": "%sms",
            "SHORT_TERABYTES": "%sTB",
            "SHORT_GIGABYTES": "%sGB",
            "SHORT_MEGABYTES": "%sMB",
            "SHORT_KILOBYTES": "%sKB",
            "SHORT_BYTES": "%sB",
            "AUTH_FAILED_NEW": "Authentication failed, please use a new instance!",
            "AUTH_SUCCESS": "Authentication successful.",
            "AUTH_FAILED": "Authentication failed.",
            "PLEASE_WAIT_TIME": "Please wait %s",
            "REPORTING_LOGON": "Reporting logon to server...",
            "TOTP_PC_PROMPT": "Enter TOTP-PC code",
            "TOTP_PROMPT": "Enter TOTP code",
            "ACCESS_NOT_SETUP": "Access to this user is not set up",
            "PASSWORD_PROMPT": "Enter password",
            "ENTER_BUTTON": "Enter",
            "USERNAME_PROMPT": "Enter an username.",
            "USERNAME": "Username",
            "ACCESS_FN_FAIL": "No such user.",
            "PROMPT_GET_FAIL": "Something went wrong while getting the authentication prompt.",
            "LET_TRY_AGAIN": "Let's try again.",
            "RESPONSE_PLACEHOLDER": "Response...",
            "START_MENU_BTN": "Start",
            "START_MENU": "Start menu",
            "LOG_IN_INVITATION": "Log in",
            "LOG_OUT_BUTTON": "Log out (%s)",
            "LOCK_BUTTON": "Lock",
            "TERMINAL_BUTTON": "Terminal",
            "TURN_OFF_BUTTON": "Turn off",
            "PASSWORD": "Password",
            "SET_UP_PCOS": "Set up PCOS",
            "LET_SETUP_SYSTEM": "Let's set up the system now.",
            "SET_UP": "Set up",
            "LET_CREATE_ACCOUNT": "Let's create your own user account.",
            "CREATE": "Create",
            "PASSWORD_INPUT_ALERT": "Please enter a password!",
            "SETUP_SUCCESSFUL": "Successful setup. Close window to log in.",
            "CREATING_USER_STRUCTURE": "Creating user structure",
            "CREATING_USER": "Creating user",
            "INSTALLING_WPS": "Installing wallpapers",
            "INSTALLING_APPS": "Installing programs",
            "INSTALLING_WP2U": "Installing wallpaper to user",
            "REMOVING_2STAGE": "Removing second-stage installer",
            "PATCHING_LOGON": "Patching for logon requirement",
            "CONFIRM": "Confirm",
            "RIGHT_REVIEW": "Let's review your rights.",
            "RIGHT_REVIEW_BTN": "Accept license",
            "DARK_MODE": "Dark mode",
            "INSTALLING_DARKMODE": "Installing dark mode preference",
            "CREATING_USER_HOME": "Creating user home directory",
            "PROVISIONED_PREFERENCE": "This setting is managed by the system administrator.",
            "USERNAME_EXISTS": "This user already exists in the system.",
            "VIDEO_PLAYER": "Video player",
            "INACCESSIBLE_FILE": "%s is inaccessible. Ensure you have permissions to access it, and that the object exists.",
            "FILE_NOT_SPECIFIED": "No file specified.",
            "PICTURE_VIEWER": "Picture viewer",
            "API_TEST_TERM": "API Developer's Terminal",
            "HELP_TERMINAL_APITEST": "help - Display help menu\r\nclear - Clear terminal\r\njs_ree - Execute JavaScript code\r\n--- REE API EXPORTS ---\r\n",
            "TERM_COMMAND_NOT_FOUND": "%s: command not found",
            "FILE_EXPLORER": "File explorer",
            "GRANT_FEXP_PERM": "Please grant permissions to read file structures and list partitions.",
            "GRANT_PERM": "Grant permissions",
            "GRANT_FEXP_PERM_ADM": "Please consult the administrator to grant privileges to this program to read file structures and list partitions. (FS_READ, FS_LIST_PARTITIONS)",
            "GRANT_FEXP_PERM_USR": "Please grant permissions to read file structures and list partitions using a different user.",
            "BROWSE_FEXP": "Browse",
            "SPACE_SHOWER": "Space in \"%s\": %s used of %s (%s%)",
            "FILE_STRUCT_BROWSE_FAIL": "Could not browse to this structure:\n%s",
            "UNKNOWN_FS_STRUCT": "Unknown filesystem structure \"%s\"",
            "UNKNOWN_FILE_TYPE": "This is an unknown file type.",
            "TMGR_PERMISSION": "Task manager was not permitted to run under this condition. Please contact the system administrator.\nRequired privileges: %s",
            "TASK_MANAGER": "Task manager",
            "BASENAME_TASK": "Basename",
            "USER_TASK": "User",
            "TERMINATE_TASK": "Terminate",
            "FULL_PATH_TASK": "Full path",
            "ARGUMENTS_TASK": "Arguments",
            "REMOVING_SETUP_STATE": "Removing setup status",
            "LOGGING_OUT": "Logging out...",
            "PANIC_LINE1": "A critical problem has been detected while using the operating system. Its stability is at risk now.",
            "PANIC_LINE2": "Problem code: %s",
            "PANIC_UNSPECIFIED_ERROR": "UNSPECIFIED_ERROR",
            "PROBLEMATIC_COMPONENT": "Problematic component: %s",
            "PROBLEMATIC_PARAMS": "Problematic parameters: %s",
            "PROBLEMATIC_JS": "Problematic JavaScript: %s: %s",
            "PANIC_LINE3": "If you have seen this error message the first time, attempt rebooting.",
            "PANIC_LINE4": "If you see this error message once more, there is something wrong with the system.",
            "PANIC_LINE5": "You can try repairing the filesystem by placing a .fsck file on the system root mountpoint, with the value \"recover\" in it.",
            "PANIC_LINE6": "Proper shutdown procedure follows now:",
            "PANIC_TASK_KILLED": "task:%s: killed",
            "PANIC_MOUNT_UNMOUNTED": "mount:%s: unmounted",
            "PANIC_MOUNT_FAILED": "mount:%s: %s: %s",
            "SHORT_YEARS": "%sy",
            "SHORT_MONTHS": "%smo",
            "SYSADMIN_TOOLS_TITLE": "Sysadmin Tools",
            "SYSADMIN_TOOLS_PRIVFAIL": "You are not a system administrator.",
            "REINSTALL_BUTTON": "Reinstall OS",
            "FSCK_BUTTON": "Recover lost files",
            "SWIPE_BUTTON": "Wipe system securely",
            "REINSTALL_DOWNLOADING": "Downloading local os.js...",
            "REINSTALL_DOWNLOAD_FAILED": "Failed to download local os.js.",
            "REINSTALL_DECODING": "Parsing os.js as text",
            "REINSTALL_SETTING": "Setting os.js as bootloader",
            "REMOVING_INSTALLERS": "Removing installers...",
            "SETTING_FSCK_FLAG": "Creating .fsck file",
            "SETTING_FSCK_FLAG_FAILED": "Failed to create .fsck file.",
            "WIPING_SYSTEM": "Securely wiping system...",
            "WIPING_SYSTEM_FAILED": "Failed to securely wipe system.",
            "WORKING_HOURS_UNMET": "You attempted to log in outside of your working hours. Try again later.",
            "NETCONFIG_TITLE": "PCOS Network configurator",
            "NETCONFIG_DENY": "There are not enough permissions to configure PCOS Network.",
            "NETCONFIG_URLF": "Proxy URL: ",
            "NETCONFIG_AUTO": "Start on OS startup",
            "NETCONFIG_UC": "User-customizable part",
            "NETCONFIG_SAVE": "Save config",
            "NETCONFIG_PREDICT": "Predict address",
            "EMPTY_STATUSBAR": "Status",
            "NETCONFIG_SAVE_OK": "Configuration saved successfully",
            "NETCONFIG_SAVE_FAIL": "Failed to save config",
            "PCOS_STARTING": "PCOS is starting...",
            "FILE_PICKER": "File picker",
            "TEXT_EDITOR": "Text editor",
            "LOAD_BTN": "Load",
            "SAVE_BTN": "Save",
            "NETCONFIG_SYSIDM": "No System ID available",
            "NO_SAVE_IN_MTN": "You can't save in the mountpoint directory.",
            "INSTALLING_WP2L": "Installing wallpaper to lock screen",
            "OPTIONAL_COMPONENTS_TITLE": "Optional components",
            "NO_COMPONENTS_FILE": "The components file is missing, downloading from OS image.",
            "FAILED_COMPONENTS_DOWNLOAD": "Failed to download a components file.",
            "PARSING_COMPONENTS": "Parsing available components",
            "EXIT": "Exit",
            "DESCRIPTION_FIELD": "Description: %s",
            "LICENSE_FIELD": "License: %s",
            "REMOVE_BTN": "Remove",
            "MODIFYING_STATUS": "Modifying component...",
            "MODIFYING_SUCCESS": "Modification successful!",
            "MODIFYING_FAILED": "Modification failed.",
            "UNMOUNT_BTN": "Unmount",
            "BREAKOUT_DESCRIPTION": "The Breakout game example as coded by MDN",
            "INSTALLING_DARKMODE2L": "Installing dark mode preference to lock screen",
            "MESSAGE_ENTER": "Enter a message to display",
            "TIMEOUT_FIELD": "Timeout (ms)",
            "SECRET_FIELD_TXT": "Secret (text)",
            "SECRET_FIELD_HEX": "Secret (hex)",
            "REGENERATE": "Regenerate",
            "START_TIME_FIELD": "Start time",
            "END_TIME_FIELD": "End time",
            "PBKDF2_OPTION": "PBKDF2 (Password)",
            "INFORMATIVE_MESSAGE_OPTION": "Informative message",
            "INFORMATIVE_MESSAGE_DENY_OPTION": "Informative message (deny)",
            "TIMEOUT_OPTION": "Timeout",
            "TIMEOUT_DENY_OPTION": "Timeout (deny)",
            "SERVER_REPORT_OPTION": "Server reporting",
            "PCTOTP_OPTION": "PC's TOTP interpretation",
            "RFCTOTP_OPTION": "RFC TOTP",
            "WORKING_HOURS_OPTION": "Working hours",
            "PERSONAL_SECURITY_TITLE": "Personal Security",
            "PERSONAL_SECURITY_DENY": "Not enough privileges were granted for Personal Security.",
            "ADD_BTN": "Add",
            "OS_LOCALE": "en",
            "SYSTEM_SECURITY_TITLE": "System Security",
            "SYSTEM_SECURITY_DENY": "Not enough privileges were granted for System Security.",
            "EDIT": "Edit",
            "USER_GROUPS": "Groups",
            "USER_HOMEDIR": "Home directory",
            "REMOVE_USER_WITH_HD": "Remove user with home directory",
            "CREATE_HD": "Create home directory",
            "CREATING_HD_OK": "The home directory was created successfully.",
            "CREATING_HD_FAIL": "Failed to create the home directory.",
            "SIGNATURE_VERIFICATION_FAILED": "This program claims it is trusted by %s, but the system failed to verify that claim.",
            "UNKNOWN_PLACEHOLDER": "<Unknown>",
            "NO_APP_ALLOWLIST": "The system administrator requires programs to have an allowlist of permissions, but this program didn't have that list.",
            "DISCARD_BUTTON": "Discard lost files",
            "MOUNTPOINT": "Mountpoint",
            "GENERATE_PROMPT": "Generate?",
            "MOUNT_BUTTON": "Mount",
            "NEW_DIR_NAME": "New directory name",
            "MKDIR_BUTTON": "Create directory",
            "CHOWN_BUTTON": "Change owner",
            "CHGRP_BUTTON": "Change group",
            "CHMOD_BUTTON": "Change permissions",
            "CLIPBOARD_COPY": "Copy",
            "CLIPBOARD_CUT": "Cut",
            "CLIPBOARD_PASTE": "Paste",
            "CLIPBOARD_SOURCE_GONE": "The source no longer exists or is no longer a file.",
            "CLIPBOARD_CONFLICT": "The destination folder already has a file or directory with the same name.",
            "SAFE_MODE_MSG": "Safe mode",
            "INSTALLING_SFX": "Installing sound effects",
            "APP_OR_KEY_SIGNATURE_VERIFICATION_FAILED": "Signature verification for the program or the key signing the program failed.",
            "NO_SUCH_DEVICE": "No such device",
            "READ_ONLY_BMGR": "Writes restricted by boot manager.",
            "READ_ONLY_DEV": "Device is read-only",
            "NO_DIRECTORY_SUPPORT": "Device does not support directories",
            "NO_PERMIS_SUPPORT": "Device does not support permissions",
            "IS_A_DIR": "Is a directory",
            "NO_SUCH_FILE": "No such file",
            "NO_SUCH_DIR": "No such directory",
            "NO_SUCH_FILE_DIR": "No such file or directory",
            "NON_EMPTY_DIR": "Non-empty directory",
            "IS_A_FILE": "Is a file",
            "DIR_EXISTS": "Directory already exists",
            "FS_ACTION_FAILED": "Failed to perform this file system action.",
            "UNAUTHORIZED_ACTION": "The program does not have permissions to perform this action.",
            "CREATION_CHECK_FAILED": "Failed to check if this object is being created.",
            "PERMISSION_CHANGE_FAILED": "Failed to change permissions for this object.",
            "UPDATE_EXTRA_FAIL": "Failed to update apps, wallpapers, sounds.",
            "UPDATE_BOOT_FAIL": "Failed to update boot files.",
            "UPDATE_BUTTON": "Update OS",
            "TOGGLE_HIDDEN_FILES": "Hide/unhide files",
            "AUTORUN_NECESSITIES_FAILED": "Failed to run one of your autorun files. The system will not log you in.",
            "HOLDING_NETCONFIG": "Holding network configuration file...",
            "CONFIG_HELD": "This configuration file was held to prevent modification.",
            "CRYPTO_TOOLS_TITLE": "Cryptographic Tools",
            "CRYPTO_TOOLS_NOPERM": "Not enough privileges were given to use Cryptographic Tools.",
            "CRYPTO_RNG": "Random generation",
            "CRYPTO_HASH": "Hashing",
            "CRYPTO_KEYGEN": "Key generation",
            "CRYPTO_ENCRYPT": "Encryption",
            "CRYPTO_DECRYPT": "Decryption",
            "CRYPTO_SIGN": "Signing",
            "CRYPTO_VERIFY": "Verification",
            "CRYPTO_DERIVEBITS": "Bit derivation",
            "GENERATE": "Generate",
            "RAW_HEX_DATA": "Raw data (hex)",
            "CRYPTO_HASH_FIELD": "Hash algorithm: ",
            "CRYPTO_PLAINTEXT_FIELD": "Plaintext: ",
            "ALGORITHM_FIELD": "Algorithm: ",
            "LENGTH_FIELD": "Length: ",
            "CRYPTO_NC_FIELD": "Named curve: ",
            "IMPORT_AS_FIELD": "Import as: ",
            "CRYPTO_KEY_FIELD": "Key: ",
            "CRYPTO_CIPHERTEXT_FIELD": "Ciphertext (hex): ",
            "CRYPTO_SIGNATURE_FIELD": "Signature (hex): ",
            "CRYPTO_KEYGEN_MSG": "Generating key(s)...",
            "CRYPTO_KEYGEN_SYMM": "Is a symmetric key type",
            "CRYPTO_KEYGEN_EXPFAIL": "Export failed, check export settings",
            "CRYPTO_RNGOUT_FIELD": "Random numbers (hex): ",
            "CRYPTO_KEYGEN_ACTION": "Generate key(s)",
            "CRYPTO_HASH_ACTION": "Hash",
            "CRYPTO_ENCRYPT_ACTION": "Encrypt",
            "CRYPTO_DECRYPT_ACTION": "Decrypt",
            "CRYPTO_SIGN_ACTION": "Sign",
            "CRYPTO_VERIFY_ACTION": "Verify",
            "CRYPTO_DERIVEBITS_ACTION": "Derive bits",
            "CRYPTO_PUBKEY_FIELD": "Public key: ",
            "CRYPTO_PRIVKEY_FIELD": "Private key: ",
            "CRYPTO_BASEKEY_FIELD": "Base key: ",
            "CRYPTO_HASHOUT_FIELD": "Hash value (hex): ",
            "CRYPTO_MODLEN_FIELD": "Modulus length: ",
            "CRYPTO_PUBEXP_FIELD": "Public exponent (hex): ",
            "EXPORT_AS_FIELD": "Export as: ",
            "CRYPTO_KEYUSE_FIELD": "Key usages:",
            "CRYPTO_PLAINTEXTAS_FIELD": "Process plaintext as: ",
            "CRYPTO_IV_FIELD": "IV (hex): ",
            "CRYPTO_CTR_FIELD": "Counter (hex): ",
            "CRYPTO_VERIFIED_CHECKBOX": "Verified successfully",
            "CRYPTO_SALT_FIELD": "Salt (hex): ",
            "CRYPTO_DERIVEOUT_FIELD": "Derived bits (hex): ",
            "CRYPTO_ITERATIONS_FIELD": "Iterations: "
        },
        ru: {
            "UNTITLED_APP": "Безымянная программа",
            "PERMISSION_DENIED": "Отказано в доступе",
            "MORE_PERMISSION_DENIED": "Недостаточно прав для запуска этой программы.",
            "COMPATIBILITY_ISSUE_TITLE": "Проблема с совместимостью",
            "COMPATIBILITY_ISSUE": "Эта программа не может запускаться на этом компьютере как задача. Проверьте, есть ли у приложения режим \"isolatable\".",
            "APP_STARTUP_CRASH_TITLE": "Что-то пошло не так",
            "APP_STARTUP_CRASH": "Системе не удалось запустить эту программу.",
            "JS_TERMINAL": "Терминал JavaScript",
            "TERMINAL_INVITATION": "PCOS 3, сборка %s",
            "PCOS_RESTARTING": "PCOS перезагружается. %s",
            "PLEASE_WAIT": "Пожалуйста, подождите.",
            "POLITE_CLOSE_SIGNAL": "Отправка сигнала закрытия.",
            "ABRUPT_CLOSE_SIGNAL": "Отправка аварийного закрытия.",
            "UNMOUNTING_MOUNTS": "Размонтирование точек монтирования.",
            "SAFE_TO_CLOSE": "Теперь эту вкладку можно закрыть.",
            "RESTART_BUTTON": "Перезапустить",
            "RESTARTING": "Выполняется перезагрузка.",
            "INSTALL_PCOS": "Установить PCOS",
            "INSTALLER_TITLE": "Установщик PCOS 3",
            "CLOSE_INSTALLER_CONFIRMATION": "Вы уверены, что хотите остановить установку? Этот компьютер перезапустится.",
            "YES": "Да",
            "NO": "Нет",
            "INSTALLER_INVITATION": "Вы устанавливаете PCOS 3 сборки %s на этом компьютере.",
            "INSTALL_BUTTON": "Установить",
            "CLI_BUTTON": "Открыть терминал",
            "INSTALLER_PARTITIONING": "Выберите разделы загрузки и данных, которые вы хотите использовать.",
            "PARTITIONING_USE": "Использовать разделы",
            "PARTITION_DATA": "Раздел данных",
            "PARTITION_BOOT": "Раздел загрузки",
            "FORMAT_DATA": "Форматировать в PCFS",
            "DATA_INPUT_ALERT": "Введите имя раздела данных.",
            "PROMPT_PARTITION_TABLE": "Этот диск, кажется, не содержит таблицу разделов. Вы хотите вставить таблицу разделов?",
            "CONFIRM_PARTITION_ERASE": "Все данные на этом разделе будут удалены. Продолжить?",
            "BOOT_INPUT_ALERT": "Введите имя раздела загрузки.",
            "CANNOT_FIND_PARTITION": "Не удаётся найти раздел диска. Попробуйте форматировать раздел данных в PCFS.",
            "PCFS_DETECTION_ERROR": "Раздел данных, кажется, не содержит PCFS. Вы хотите использовать его?",
            "INSTALLING_PCOS": "Установка PCOS: %s",
            "CREATING_BOOT_PARTITION": "Создание раздела загрузки",
            "MOUNTING_DATA_PARTITION": "Монтирование раздела данных как 'target'",
            "CHANGING_ROOT_PERMISSIONS": "Изменение разрешений /",
            "COPYING_FOLDERS": "Копирование папок",
            "PREPARING_FOR_COPY": "Подготовка к копированию",
            "CHANGING_BOOT_PERMISSIONS": "Изменение разрешений /boot",
            "PATCHING_FS": "Изменение для монтирования раздела данных",
            "INSTALLATION_SUCCESSFUL": "Установка успешна. Закройте окно для перезагрузки.",
            "INSTALLATION_FAILED": "Установка не удалась. Попробуйте ещё раз. Закройте окно для перезагрузки.",
            "CREATING_DIR": "Создание %s",
            "COPYING_FILE": "Копирование %s",
            "COMPLETE_COPY": "Копирование %s завершено",
            "REMOVING_OBJECT": "Удаление %s",
            "COMPLETE_REMOVE": "Удаление %s завершено",
            "SHORT_DAYS": "%sдн",
            "SHORT_HOURS": "%sч",
            "SHORT_MINUTES": "%sмин",
            "SHORT_SECONDS": "%sс",
            "SHORT_MILLISECONDS": "%sмс",
            "SHORT_TERABYTES": "%sТБ",
            "SHORT_GIGABYTES": "%sГБ",
            "SHORT_MEGABYTES": "%sМБ",
            "SHORT_KILOBYTES": "%sКБ",
            "SHORT_BYTES": "%sБ",
            "AUTH_FAILED_NEW": "Аутентификация не удалась, пожалуйста, используйте новую сессию!",
            "AUTH_SUCCESS": "Аутентификация успешна!",
            "AUTH_FAILED": "Аутентификация не удалась.",
            "PLEASE_WAIT_TIME": "Пожалуйста, подождите %s",
            "REPORTING_LOGON": "Сообщаю о входе в систему серверу...",
            "TOTP_PC_PROMPT": "Введите код TOTP-PC",
            "TOTP_PROMPT": "Введите код TOTP",
            "ACCESS_NOT_SETUP": "Доступ к данному пользователю не настроен",
            "PASSWORD_PROMPT": "Введите пароль",
            "ENTER_BUTTON": "Ввод",
            "USERNAME_PROMPT": "Введите имя пользователя",
            "USERNAME": "Имя пользователя",
            "ACCESS_FN_FAIL": "Нет такого пользователя.",
            "PROMPT_GET_FAIL": "Что-то пошло не так при получении вопроса аутентификации.",
            "LET_TRY_AGAIN": "Давайте попробуем ещё раз.",
            "RESPONSE_PLACEHOLDER": "Ответ...",
            "START_MENU_BTN": "Пуск",
            "START_MENU": "Меню \"Пуск\"",
            "LOG_IN_INVITATION": "Войти в систему",
            "LOG_OUT_BUTTON": "Выйти (%s)",
            "LOCK_BUTTON": "Заблокировать",
            "TERMINAL_BUTTON": "Терминал",
            "TURN_OFF_BUTTON": "Выключить",
            "PASSWORD": "Пароль",
            "SET_UP_PCOS": "Настройка PCOS",
            "LET_SETUP_SYSTEM": "Давайте теперь настроим систему.",
            "SET_UP": "Настроить",
            "LET_CREATE_ACCOUNT": "Давайте создадим вашу учётную запись.",
            "CREATE": "Создать",
            "PASSWORD_INPUT_ALERT": "Введите пароль.",
            "SETUP_SUCCESSFUL": "Настройка успешна. Закройте окно для входа в систему.",
            "CREATING_USER_STRUCTURE": "Создание структуры пользователей",
            "CREATING_USER": "Создание пользователя",
            "INSTALLING_WPS": "Установка фонов",
            "INSTALLING_APPS": "Установка программ",
            "INSTALLING_WP2U": "Установка фона на пользователя",
            "REMOVING_2STAGE": "Удаление установщика 2-го этапа",
            "PATCHING_LOGON": "Изменение для требования входа в систему",
            "CONFIRM": "Подтвердить",
            "RIGHT_REVIEW": "Давайте рассмотрим ваши права.",
            "RIGHT_REVIEW_BTN": "Принять лицензию",
            "DARK_MODE": "Тёмная тема",
            "INSTALLING_DARKMODE": "Установка предпочтения тёмной темы",
            "CREATING_USER_HOME": "Создание домашнего каталога пользователя",
            "PROVISIONED_PREFERENCE": "Эта настройка управляется системным администратором.",
            "USERNAME_EXISTS": "Этот пользователь уже существует в системе.",
            "VIDEO_PLAYER": "Видеопроигрыватель",
            "INACCESSIBLE_FILE": "%s недоступен. Убедитесь, что у вас есть разрешения на доступ к нему, и что объект существует.",
            "FILE_NOT_SPECIFIED": "Файл не указан.",
            "PICTURE_VIEWER": "Просмотр изображений",
            "API_TEST_TERM": "Терминал API-разработчика",
            "HELP_TERMINAL_APITEST": "help - Показать справочное меню\r\nclear - Очистить терминал\r\njs_ree - Запустить код JavaScript\r\n--- ЭКСПОРТИРОВАННЫЕ ИПП СОВ ---\r\n",
            "TERM_COMMAND_NOT_FOUND": "%s: команда не найдена",
            "FILE_EXPLORER": "Проводник",
            "GRANT_FEXP_PERM": "Пожалуйста, предоставьте разрешения на чтение файловых структур и просмотр списка разделов.",
            "GRANT_PERM": "Предоставить разрешения",
            "GRANT_FEXP_PERM_ADM": "Свяжитесь с администратором, чтобы предоставить разрешения на чтение файловых структур и просмотр списка разделов. (FS_READ, FS_LIST_PARTITIONS)",
            "GRANT_FEXP_PERM_USR": "Пожалуйста, предоставьте разрешения на чтение файловых структур и просмотр списка разделов используя иную учётную запись.",
            "BROWSE_FEXP": "Просмотр",
            "SPACE_SHOWER": "Хранение в \"%s\": использовано %s из %s (%s%)",
            "FILE_STRUCT_BROWSE_FAIL": "Невозможно просмотреть структуру:\n%s",
            "UNKNOWN_FS_STRUCT": "Неизвестная файловая структура \"%s\"",
            "UNKNOWN_FILE_TYPE": "Это неизвестный тип файла.",
            "TMGR_PERMISSION": "Диспетчеру задач не разрешено запускаться при этих условиях. Свяжитесь с системным администратором\nТребуемые разрешения: %s",
            "TASK_MANAGER": "Диспетчер задач",
            "BASENAME_TASK": "Имя",
            "USER_TASK": "Пользователь",
            "TERMINATE_TASK": "Завершить",
            "FULL_PATH_TASK": "Полный путь",
            "ARGUMENTS_TASK": "Параметры",
            "REMOVING_SETUP_STATE": "Удаление статуса установки",
            "LOGGING_OUT": "Выход из системы...",
            "PANIC_LINE1": "При использовании операционной системы была обнаружена критическая ошибка. Стабильность системы под угрозой.",
            "PANIC_LINE2": "Код ошибки: %s",
            "PANIC_UNSPECIFIED_ERROR": "НЕУКАЗАННАЯ_ОШИБКА",
            "PROBLEMATIC_COMPONENT": "Проблемный компонент: %s",
            "PROBLEMATIC_PARAMS": "Проблемные параметры: %s",
            "PROBLEMATIC_JS": "Проблемный JavaScript: %s: %s",
            "PANIC_LINE3": "Если вы видите эту ошибку в первый раз, попробуйте перезагрузить систему.",
            "PANIC_LINE4": "Если вы видите эту ошибку ещё раз, это значит, что что-то не так с системой.",
            "PANIC_LINE5": "Вы можете попытаться восстановить файловую систему, расположив файл .fsck в корневой точке монтирования системы, со значением \"recover\" в нём.",
            "PANIC_LINE6": "Далее выполняется процедура завершения работы:",
            "PANIC_TASK_KILLED": "задача:%s: убита",
            "PANIC_MOUNT_UNMOUNTED": "точка:%s: размонтирована",
            "PANIC_MOUNT_FAILED": "точка:%s: %s: %s",
            "SHORT_YEARS": "%sг",
            "SHORT_MONTHS": "%sмес",
            "SYSADMIN_TOOLS_TITLE": "Утилиты для сисадминов",
            "SYSADMIN_TOOLS_PRIVFAIL": "Вы не являетесь системным администратором.",
            "REINSTALL_BUTTON": "Переустановить ОС",
            "FSCK_BUTTON": "Восстановить потерянные файлы",
            "SWIPE_BUTTON": "Безопасно удалить систему",
            "REINSTALL_DOWNLOADING": "Скачивание местного os.js...",
            "REINSTALL_DOWNLOAD_FAILED": "Не удалось скачать местный os.js.",
            "REINSTALL_DECODING": "Обработка os.js как текст",
            "REINSTALL_SETTING": "Задание os.js как загрузчика",
            "REMOVING_INSTALLERS": "Удаление установщиков...",
            "SETTING_FSCK_FLAG": "Создание файла .fsck...",
            "SETTING_FSCK_FLAG_FAILED": "Не удалось создать файл .fsck.",
            "WIPING_SYSTEM": "Безопасное удаление системы...",
            "WIPING_SYSTEM_FAILED": "Не удалось безопасно удалить систему.",
            "WORKING_HOURS_UNMET": "Вы попытались войти в систему вне рабочего времени. Повторите попытку позже.",
            "NETCONFIG_TITLE": "Конфигурация PCOS Network",
            "NETCONFIG_DENY": "Недостаточно разрешений для конфигурации PCOS Network.",
            "NETCONFIG_URLF": "URL прокси: ",
            "NETCONFIG_AUTO": "Запускать при загрузке ОС",
            "NETCONFIG_UC": "Изменяемое пользователем",
            "NETCONFIG_SAVE": "Сохранить конфиг.",
            "NETCONFIG_PREDICT": "Предсказать адрес",
            "EMPTY_STATUSBAR": "Статус",
            "NETCONFIG_SAVE_OK": "Конфигурация успешно сохранена",
            "NETCONFIG_SAVE_FAIL": "Конфигурация НЕ сохранена!",
            "PCOS_STARTING": "PCOS приступает к работе...",
            "FILE_PICKER": "Выбор файла",
            "TEXT_EDITOR": "Текстовый редактор",
            "LOAD_BTN": "Загрузить",
            "SAVE_BTN": "Сохранить",
            "NETCONFIG_SYSIDM": "System ID недоступен",
            "NO_SAVE_IN_MTN": "Нельзя выполнять сохранение в папке монтирований.",
            "INSTALLING_WP2L": "Установка фона на экран блокировки",
            "OPTIONAL_COMPONENTS_TITLE": "Дополнительные компоненты",
            "NO_COMPONENTS_FILE": "Файл компонентов отсутствует, скачиваю с образа ОС",
            "FAILED_COMPONENTS_DOWNLOAD": "Не удалось скачать файл компонентов.",
            "PARSING_COMPONENTS": "Анализ доступных компонентов...",
            "EXIT": "Выйти",
            "DESCRIPTION_FIELD": "Описание: %s",
            "LICENSE_FIELD": "Лицензия: %s",
            "REMOVE_BTN": "Удалить",
            "MODIFYING_STATUS": "Модификация компонента...",
            "MODIFYING_SUCCESS": "Модификация успешна!",
            "MODIFYING_FAILED": "Модификация не удалась.",
            "UNMOUNT_BTN": "Размонтировать",
            "BREAKOUT_DESCRIPTION": "Игра-пример Breakout, как программировано в MDN",
            "INSTALLING_DARKMODE2L": "Установка предпочтения тёмной темы на экран блокировки",
            "MESSAGE_ENTER": "Введите сообщение для отображения",
            "TIMEOUT_FIELD": "Ожидание (мс)",
            "SECRET_FIELD_TXT": "Секретное значение (текст)",
            "SECRET_FIELD_HEX": "Секретное значение (шестнадцатиричное)",
            "REGENERATE": "Регенерировать",
            "START_TIME_FIELD": "Время начала",
            "END_TIME_FIELD": "Время конца",
            "PBKDF2_OPTION": "PBKDF2 (Пароль)",
            "INFORMATIVE_MESSAGE_OPTION": "Информативное сообщение",
            "INFORMATIVE_MESSAGE_DENY_OPTION": "Информативное сообщение (отказ)",
            "TIMEOUT_OPTION": "Ожидание",
            "TIMEOUT_DENY_OPTION": "Ожидание (отказ)",
            "SERVER_REPORT_OPTION": "Сообщение серверу",
            "PCTOTP_OPTION": "Интерпретация TOTP от PC",
            "RFCTOTP_OPTION": "TOTP по RFC",
            "WORKING_HOURS_OPTION": "График работы",
            "PERSONAL_SECURITY_TITLE": "Личная безопасность",
            "PERSONAL_SECURITY_DENY": "Было предоставлено недостаточно привилегий для запуска Личной безопасности.",
            "ADD_BTN": "Добавить",
            "OS_LOCALE": "ru",
            "SYSTEM_SECURITY_TITLE": "Безопасность системы",
            "SYSTEM_SECURITY_DENY": "Было предоставлено недостаточно привилегий для запуска Безопасности системы.",
            "EDIT": "Редактировать",
            "USER_GROUPS": "Группы",
            "USER_HOMEDIR": "Домашний каталог",
            "REMOVE_USER_WITH_HD": "Удалить с домашним каталогом",
            "CREATE_HD": "Создать домашний каталог",
            "CREATING_HD_OK": "Домашний каталог успешно создан.",
            "CREATING_HD_FAIL": "Не удалось создать домашний каталог.",
            "SIGNATURE_VERIFICATION_FAILED": "Эта программа утверждает, что ему доверяет %s, но системе не удалось проверить это утверждение.",
            "UNKNOWN_PLACEHOLDER": "<Неизвестно>",
            "NO_APP_ALLOWLIST": "Системный администратор требует, чтобы у программ был белый список разрешений, но у этого программы нет этого списка.",
            "DISCARD_BUTTON": "Удалить потерянные файлы",
            "MOUNTPOINT": "Точка монтирования",
            "GENERATE_PROMPT": "Сгенерировать?",
            "MOUNT_BUTTON": "Монтировать",
            "NEW_DIR_NAME": "Имя нового каталога",
            "MKDIR_BUTTON": "Создать каталог",
            "CHOWN_BUTTON": "Сменить владельца",
            "CHGRP_BUTTON": "Сменить группу",
            "CHMOD_BUTTON": "Сменить разрешения",
            "CLIPBOARD_COPY": "Копировать",
            "CLIPBOARD_CUT": "Вырезать",
            "CLIPBOARD_PASTE": "Вставить",
            "CLIPBOARD_SOURCE_GONE": "Источник больше не существует или не файл.",
            "CLIPBOARD_CONFLICT": "В папке назначения уже есть файл или каталог с таким именем.",
            "SAFE_MODE_MSG": "Безопасный режим",
            "INSTALLING_SFX": "Установка звуковых эффектов",
            "APP_OR_KEY_SIGNATURE_VERIFICATION_FAILED": "Проверка подписи программы или ключа, который подписал программу не удалась.",
            "NO_SUCH_DEVICE": "Нет такого устройства",
            "READ_ONLY_BMGR": "Записи ограничены загрузчиком ОС.",
            "READ_ONLY_DEV": "Устройство только для чтения",
            "NO_DIRECTORY_SUPPORT": "Устройство не поддерживает каталоги",
            "NO_PERMIS_SUPPORT": "Устройство не поддерживает разрешения",
            "IS_A_DIR": "Является каталогом",
            "NO_SUCH_FILE": "Нет такого файла",
            "NO_SUCH_DIR": "Нет такого каталога",
            "NO_SUCH_FILE_DIR": "Нет такого файла или каталога",
            "NON_EMPTY_DIR": "Непустой каталог",
            "IS_A_FILE": "Является файлом",
            "DIR_EXISTS": "Каталог уже существует",
            "FS_ACTION_FAILED": "Не удалось выполнить это действие с файловой системой.",
            "UNAUTHORIZED_ACTION": "У программы нет прав на это действие.",
            "CREATION_CHECK_FAILED": "Не удалось проверить, создаётся ли этот объект.",
            "PERMISSION_CHANGE_FAILED": "Не удалось изменить разрешения для этого объекта.",
            "UPDATE_EXTRA_FAIL": "Не удалось обновить приложения, фоны, звуки.",
            "UPDATE_BOOT_FAIL": "Не удалось обновить файлы загрузки.",
            "UPDATE_BUTTON": "Обновить ОС",
            "TOGGLE_HIDDEN_FILES": "Скрыть/показать файлы",
            "AUTORUN_NECESSITIES_FAILED": "Не удалось запустить один из ваших файлов автозапуска. Система не позволит выполнить вход.",
            "CONFIG_HELD": "Файл конфигурации удержан для предотвращения изменений.\nThis configuration file was held to prevent modification.",
            "CRYPTO_TOOLS_TITLE": "Утилиты для криптографии",
            "CRYPTO_TOOLS_NOPERM": "Недостаточно прав для использования утилит для криптографии.",
            "CRYPTO_RNG": "Случайная генерация",
            "CRYPTO_HASH": "Хэширование",
            "CRYPTO_KEYGEN": "Генерация ключей",
            "CRYPTO_ENCRYPT": "Шифрование",
            "CRYPTO_DECRYPT": "Расшифровка",
            "CRYPTO_SIGN": "Подписывание",
            "CRYPTO_VERIFY": "Проверка подписи",
            "CRYPTO_DERIVEBITS": "Преобразование",
            "GENERATE": "Генерировать",
            "RAW_HEX_DATA": "Прямые данные (шестнадцатиричные)",
            "CRYPTO_HASH_FIELD": "Алгоритм хэширования: ",
            "CRYPTO_PLAINTEXT_FIELD": "Простой текст: ",
            "ALGORITHM_FIELD": "Алгоритм: ",
            "LENGTH_FIELD": "Длина: ",
            "CRYPTO_NC_FIELD": "Имя кривой: ",
            "IMPORT_AS_FIELD": "Импортировать как: ",
            "CRYPTO_KEY_FIELD": "Ключ: ",
            "CRYPTO_CIPHERTEXT_FIELD": "Шифр (шестнадцатиричный): ",
            "CRYPTO_SIGNATURE_FIELD": "Подпись (шестнадцатиричная): ",
            "CRYPTO_KEYGEN_MSG": "Генерация ключа (ключей)...",
            "CRYPTO_KEYGEN_SYMM": "Является симметричным типом ключа",
            "CRYPTO_KEYGEN_EXPFAIL": "Не удалось экспортировать, проверьте настройки экспорта",
            "CRYPTO_RNGOUT_FIELD": "Случайные числа (шестнадцатиричные): ",
            "CRYPTO_KEYGEN_ACTION": "Сгенерировать ключ(и)",
            "CRYPTO_HASH_ACTION": "Хэшировать",
            "CRYPTO_ENCRYPT_ACTION": "Зашифровать",
            "CRYPTO_DECRYPT_ACTION": "Расшифровать",
            "CRYPTO_SIGN_ACTION": "Подписать",
            "CRYPTO_VERIFY_ACTION": "Проверить подпись",
            "CRYPTO_DERIVEBITS_ACTION": "Преобразовать",
            "CRYPTO_PUBKEY_FIELD": "Открытый ключ: ",
            "CRYPTO_PRIVKEY_FIELD": "Закрытый ключ: ",
            "CRYPTO_BASEKEY_FIELD": "Базовый ключ: ",
            "CRYPTO_HASHOUT_FIELD": "Значение хэша (шестнадцатиричное): ",
            "CRYPTO_MODLEN_FIELD": "Длина модуля: ",
            "CRYPTO_PUBEXP_FIELD": "Открытая экспонента (шестнадцатиричная): ",
            "EXPORT_AS_FIELD": "Экспортировать как: ",
            "CRYPTO_KEYUSE_FIELD": "Использования ключа:",
            "CRYPTO_PLAINTEXTAS_FIELD": "Обработать простой текст как: ",
            "CRYPTO_IV_FIELD": "Вектор инициализации (шестнадцатиричный): ",
            "CRYPTO_CTR_FIELD": "Счётчик (шестнадцатиричный): ",
            "CRYPTO_VERIFIED_CHECKBOX": "Проверено успешно",
            "CRYPTO_SALT_FIELD": "Соль (шестнадцатиричная): ",
            "CRYPTO_DERIVEOUT_FIELD": "Преобразование (шестнадцатиричное): ",
            "CRYPTO_ITERATIONS_FIELD": "Итераций: "
        },
        defaultLocale: "en",
        get: function(key, lang) {
            lang = lang || navigator.languages[0].split("-")[0].toLowerCase();
            let locale = locales[lang];
            if (!locale) locale = locales[locales.defaultLocale];
            if (!locale) locale = {};
            if (!locale.hasOwnProperty(key)) locale = locales[locales.defaultLocale];
            return locale.hasOwnProperty(key) ? locale[key] : key;
        }
    }
    modules.locales = locales;
    modules.startupWindow.content.innerText = locales.get("PCOS_STARTING");
}
localization();